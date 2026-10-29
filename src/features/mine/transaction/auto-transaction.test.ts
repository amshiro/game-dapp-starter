import { describe, expect, it, vi } from "vitest";
import type { Address, Hash } from "viem";
import {
  AutoTransaction,
  autoBusy,
  type AutoDependencies,
} from "./auto-transaction";
import type { ManualContext, ManualReceipt } from "./manual-transaction";
import { AutoFault, autoIntent } from "./auto-model";
const a: Address = "0x0000000000000000000000000000000000000001",
  b: Address = "0x0000000000000000000000000000000000000002",
  hash = `0x${"1".repeat(64)}` as Hash;
function harness() {
  let context: ManualContext = {
    address: a,
    ready: true,
    wrongChain: false,
    targetChainId: 97,
  };
  const receipt: ManualReceipt = {
    hash,
    status: "success",
    blockNumber: BigInt(99),
    logs: [],
  };
  const deps: AutoDependencies = {
    protocol: a,
    context: () => context,
    prepare: vi.fn(async () => {}),
    send: vi.fn(async () => hash),
    wait: vi.fn(async () => receipt),
    verify: vi.fn(() => {}),
    refresh: vi.fn(async () => {}),
  };
  const owner = new AutoTransaction(deps),
    intent = autoIntent([0, 24], "2", "1", "0.000001", BigInt(1));
  return {
    owner,
    deps,
    intent,
    receipt,
    change: (c: Partial<ManualContext>) => {
      context = { ...context, ...c };
    },
  };
}
describe("Auto register/stop lifecycle", () => {
  it.each(["register", "stop"] as const)(
    "requires receipt, event and refresh for %s",
    async (kind) => {
      const h = harness(),
        phases: string[] = [];
      h.owner.subscribe(() => phases.push(h.owner.getSnapshot().phase));
      await h.owner.start(kind, kind === "register" ? h.intent : undefined);
      expect(phases).toEqual(
        expect.arrayContaining([
          "preparing",
          "awaiting-signature",
          "submitted",
          "confirming",
          "confirmed",
          "refreshing",
          "success",
        ]),
      );
      expect(h.deps.verify).toHaveBeenCalled();
      expect(h.deps.refresh).toHaveBeenCalledWith(
        expect.objectContaining({ account: a, kind }),
        BigInt(99),
      );
    },
  );
  it("never sends after simulation failure", async () => {
    const h = harness();
    vi.mocked(h.deps.prepare).mockRejectedValue(
      new AutoFault("simulation-reverted"),
    );
    await h.owner.start("register", h.intent);
    expect(h.deps.send).not.toHaveBeenCalled();
    expect(h.owner.getSnapshot().error).toBe("simulation-reverted");
  });
  it("rejects cancellation recoverably", async () => {
    const h = harness();
    vi.mocked(h.deps.send).mockRejectedValueOnce({ code: 4001 });
    await h.owner.start("register", h.intent);
    expect(h.owner.getSnapshot().phase).toBe("rejected");
    await h.owner.start("register", h.intent);
    expect(h.owner.getSnapshot().phase).toBe("success");
  });
  it.each([{ address: b }, { wrongChain: true }, { ready: false }])(
    "blocks context change before wallet request",
    async (next) => {
      const h = harness();
      vi.mocked(h.deps.prepare).mockImplementation(async () => {
        h.change(next);
      });
      await h.owner.start("register", h.intent);
      expect(h.deps.send).not.toHaveBeenCalled();
    },
  );
  it("refreshes the original account even when wallet changes after hash", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockImplementation(async () => {
      h.change({ address: b });
      return h.receipt;
    });
    await h.owner.start("register", h.intent);
    expect(h.deps.refresh).toHaveBeenCalledWith(
      expect.objectContaining({ account: a }),
      BigInt(99),
    );
  });
  it("does not mark a reverted receipt chain confirmed", async () => {
    const h = harness();
    h.receipt.status = "reverted";
    await h.owner.start("register", h.intent);
    expect(h.owner.getSnapshot()).toMatchObject({
      chainConfirmed: false,
      error: "receipt-reverted",
    });
    expect(h.deps.refresh).not.toHaveBeenCalled();
  });
  it.each(["verify", "refresh"] as const)(
    "%s failure retains confirmation and retries without resend",
    async (stage) => {
      const h = harness();
      if (stage === "verify")
        vi.mocked(h.deps.verify).mockImplementationOnce(() => {
          throw Error("mismatch");
        });
      else
        vi.mocked(h.deps.refresh).mockRejectedValueOnce(Error("backend down"));
      await h.owner.start("register", h.intent);
      expect(h.owner.getSnapshot().chainConfirmed).toBe(true);
      expect(autoBusy(h.owner.getSnapshot())).toBe(true);
      await h.owner.start("register", h.intent);
      expect(h.deps.send).toHaveBeenCalledTimes(1);
      await h.owner.retry();
      expect(h.owner.getSnapshot().phase).toBe("success");
      expect(h.deps.send).toHaveBeenCalledTimes(1);
    },
  );
  it("unknown confirmation can only recheck the same hash", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockRejectedValueOnce(Error("timeout"));
    await h.owner.start("stop");
    expect(h.owner.getSnapshot().confirmationUnknown).toBe(true);
    await h.owner.start("stop");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    await h.owner.retry();
    expect(h.owner.getSnapshot().phase).toBe("success");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
});
