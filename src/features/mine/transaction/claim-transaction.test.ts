import { describe, expect, it, vi } from "vitest";
import type { Address, Hash } from "viem";
import {
  ClaimTransaction,
  claimBusy,
  type ClaimDependencies,
} from "./claim-transaction";
import { ClaimFault } from "./claim-model";
import type { ManualContext, ManualReceipt } from "./manual-transaction";
const a: Address = "0x0000000000000000000000000000000000000001",
  b: Address = "0x0000000000000000000000000000000000000002",
  hash = `0x${"1".repeat(64)}` as Hash;
function harness() {
  let ctx: ManualContext = {
    address: a,
    targetChainId: 97,
    ready: true,
    wrongChain: false,
  };
  const receipt: ManualReceipt = {
    hash,
    status: "success",
    blockNumber: BigInt(99),
    logs: [],
  };
  const deps: ClaimDependencies = {
    protocol: a,
    context: () => ctx,
    prepare: vi.fn(async () => {}),
    send: vi.fn(async () => hash),
    wait: vi.fn(async () => receipt),
    verify: vi.fn(() => {}),
    refresh: vi.fn(async () => {}),
  };
  const owner = new ClaimTransaction(deps);
  return {
    owner,
    deps,
    receipt,
    change: (x: Partial<ManualContext>) => {
      ctx = { ...ctx, ...x };
    },
  };
}
describe("Mine Claim frozen-account lifecycle", () => {
  it.each(["claimAll", "claimEth"] as const)(
    "%s requires receipt + verification + relevant fresh reads",
    async (kind) => {
      const h = harness(),
        phases: string[] = [];
      h.owner.subscribe(() => phases.push(h.owner.getSnapshot().phase));
      await h.owner.start(kind);
      expect(
        phases.filter((phase, index) => phase !== phases[index - 1]),
      ).toEqual([
        "preparing",
        "awaiting-signature",
        "submitted",
        "confirming",
        "confirmed",
        "refreshing",
        "success",
      ]);
      expect(h.deps.refresh).toHaveBeenCalledWith(
        expect.objectContaining({ kind, account: a, chainId: 97 }),
        BigInt(99),
      );
      expect(h.owner.getSnapshot().chainConfirmed).toBe(true);
    },
  );
  it.each(["claimAll", "claimEth"] as const)(
    "%s simulation fails without requesting a send",
    async (kind) => {
      const h = harness();
      vi.mocked(h.deps.prepare).mockRejectedValue(
        new ClaimFault("simulation-reverted"),
      );
      await h.owner.start(kind);
      expect(h.deps.send).not.toHaveBeenCalled();
      expect(h.owner.getSnapshot().phase).toBe("failed");
    },
  );
  it("reject is recoverable without retaining a fake hash", async () => {
    const h = harness();
    vi.mocked(h.deps.send).mockRejectedValueOnce({ code: 4001 });
    await h.owner.start("claimEth");
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "rejected",
      chainConfirmed: false,
    });
    expect(h.owner.getSnapshot().hash).toBeUndefined();
    await h.owner.start("claimEth");
    expect(h.owner.getSnapshot().phase).toBe("success");
  });
  it("receipt revert is not success and never refreshes", async () => {
    const h = harness();
    h.receipt.status = "reverted";
    await h.owner.start("claimAll");
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "failed",
      error: "receipt-reverted",
      chainConfirmed: false,
    });
    expect(h.deps.refresh).not.toHaveBeenCalled();
  });
  it("confirmed refresh failure permits reads retry, never another send", async () => {
    const h = harness();
    vi.mocked(h.deps.refresh).mockRejectedValueOnce(Error("read failed"));
    await h.owner.start("claimAll");
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "refresh-failed",
      chainConfirmed: true,
    });
    await h.owner.start("claimEth");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    await h.owner.retry();
    expect(h.owner.getSnapshot().phase).toBe("success");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
  it("event mismatch stays confirmed but verification-failed", async () => {
    const h = harness();
    vi.mocked(h.deps.verify).mockImplementationOnce(() => {
      throw Error("mismatch");
    });
    await h.owner.start("claimEth");
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "verification-failed",
      chainConfirmed: true,
    });
    expect(h.deps.refresh).not.toHaveBeenCalled();
    await h.owner.retry();
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    expect(h.owner.getSnapshot().phase).toBe("success");
  });
  it.each([
    { address: b },
    { wrongChain: true },
    { ready: false },
    { targetChainId: 56 },
  ])("stops before signing when context changes %j", async (next) => {
    const h = harness();
    vi.mocked(h.deps.prepare).mockImplementation(async () => {
      h.change(next);
    });
    await h.owner.start("claimAll");
    expect(h.deps.send).not.toHaveBeenCalled();
  });
  it("tracks original tx and refreshes original account after hash even when wallet switches", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockImplementation(async () => {
      h.change({ address: b, wrongChain: true });
      return h.receipt;
    });
    await h.owner.start("claimEth");
    expect(h.deps.refresh).toHaveBeenCalledWith(
      expect.objectContaining({ account: a }),
      BigInt(99),
    );
    expect(h.owner.getSnapshot().operation?.account).toBe(a);
  });
  it("unknown confirmation blocks all sends and can only recheck the original hash", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockRejectedValueOnce(Error("timeout"));
    await h.owner.start("claimEth");
    expect(h.owner.getSnapshot().confirmationUnknown).toBe(true);
    expect(claimBusy(h.owner.getSnapshot())).toBe(true);
    await h.owner.start("claimAll");
    await h.owner.retry();
    expect(h.deps.wait).toHaveBeenCalledTimes(2);
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    expect(h.owner.getSnapshot().phase).toBe("success");
  });
  it("blocks concurrent submissions while preparation is pending", async () => {
    const h = harness();
    let done!: () => void;
    vi.mocked(h.deps.prepare).mockImplementation(
      () =>
        new Promise<void>((r) => {
          done = r;
        }),
    );
    const first = h.owner.start("claimEth");
    await h.owner.start("claimAll");
    done();
    await first;
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
});
