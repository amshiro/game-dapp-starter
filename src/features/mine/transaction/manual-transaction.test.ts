import { describe, it, expect, vi } from "vitest";
import type { Address, Hash } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import {
  ManualTransaction,
  manualBusy,
  type ManualContext,
  type ManualDependencies,
  type ManualReceipt,
} from "./manual-transaction";
import { ManualFault, manualError } from "./manual-errors";
import {
  cellMask,
  manualAmount,
  manualValue,
  manualParticipation,
  toggleCell,
} from "./manual-model";
const a: Address = "0x0000000000000000000000000000000000000001";
const b: Address = "0x0000000000000000000000000000000000000002";
const hash = `0x${"1".repeat(64)}` as Hash;
function harness() {
  let context: ManualContext = {
    address: a,
    targetChainId: 97,
    ready: true,
    wrongChain: false,
  };
  const c = getContractsForChain(97);
  const receipt: ManualReceipt = {
    hash,
    status: "success",
    blockNumber: BigInt("500"),
    logs: [],
  };
  const deps: ManualDependencies = {
    contracts: {
      protocol: c.oreProtocol.address,
      view: c.oreProtocolView.address,
    },
    context: () => context,
    prepare: vi.fn(async () => {}),
    send: vi.fn(async () => hash),
    wait: vi.fn(async () => receipt),
    verify: vi.fn(() => BigInt("1655")),
    refresh: vi.fn(async () => {}),
    refreshBoard: vi.fn(async () => {}),
  };
  const owner = new ManualTransaction(deps);
  return {
    owner,
    deps,
    receipt,
    change: (next: Partial<ManualContext>) => {
      context = { ...context, ...next };
    },
  };
}
describe("Manual selection and exact per-cell amount", () => {
  it("selects, deselects and multi-selects without a public deployed-cell restriction", () => {
    let s: readonly number[] = [];
    s = toggleCell(s, 0);
    s = toggleCell(s, 24);
    expect(cellMask(s)).toBe(BigInt("1") | (BigInt("1") << BigInt("24")));
    s = toggleCell(s, 0);
    expect(s).toEqual([24]);
    expect(() => toggleCell(s, 25)).toThrow("invalid-mask");
  });
  it("uses per-cell input and full bigint precision", () => {
    expect(manualAmount("1.")).toBe(manualAmount("1"));
    expect(manualValue(cellMask([0, 2, 7, 24]), manualAmount("0.02"))).toBe(
      BigInt("80000000000000000"),
    );
    expect(manualAmount("9007199254740993.000000000000000001")).toBe(
      BigInt("9007199254740993000000000000000001"),
    );
    for (const s of ["0", "-1", "1e3", "0.0000000000000000001", "NaN"])
      expect(() => manualAmount(s)).toThrow("invalid-amount");
  });
  it("fails closed on unknown account reads, while fulfilled old-round locks do not carry forward", () => {
    const info = { hasParticipation: true, totalDeployed: BigInt("10") },
      squares = { mask: BigInt("1") };
    expect(manualParticipation(false, info, squares)).toBe(true);
    expect(manualParticipation(true, info, squares)).toBe(false);
    expect(manualParticipation(true, undefined, squares)).toBeUndefined();
    expect(manualParticipation(false, undefined, undefined)).toBeUndefined();
    expect(manualParticipation(undefined, info, squares)).toBeUndefined();
  });
});
describe("Manual transaction lifecycle", () => {
  it("requires receipt, matching operation round and original-account refresh before success", async () => {
    const h = harness(),
      phases: string[] = [];
    h.owner.subscribe(() => phases.push(h.owner.getSnapshot().phase));
    await h.owner.start(cellMask([0, 24]), "0.02");
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
    expect(phases.indexOf("confirmed")).toBeGreaterThan(
      phases.indexOf("submitted"),
    );
    expect(phases.indexOf("success")).toBeGreaterThan(
      phases.indexOf("refreshing"),
    );
    expect(h.owner.getSnapshot()).toMatchObject({
      chainConfirmed: true,
      operationRound: BigInt("1655"),
    });
    expect(h.deps.refresh).toHaveBeenCalledWith(
      expect.objectContaining({
        account: a,
        mask: BigInt("1") | (BigInt("1") << BigInt("24")),
        value: BigInt("40000000000000000"),
      }),
      BigInt("1655"),
      BigInt("500"),
    );
  });
  it("does not send after simulation failure", async () => {
    const h = harness();
    vi.mocked(h.deps.prepare).mockRejectedValueOnce(
      new ManualFault("simulation-reverted"),
    );
    await h.owner.start(BigInt("1"), "0.02");
    expect(h.deps.send).not.toHaveBeenCalled();
    expect(h.owner.getSnapshot().error).toBe("simulation-reverted");
  });
  it("rejects second-deploy preflight even for a different mask", async () => {
    const h = harness();
    vi.mocked(h.deps.prepare).mockRejectedValueOnce(
      new Error("already-deployed-round"),
    );
    await h.owner.start(BigInt("1") << BigInt("24"), "0.02");
    expect(h.deps.send).not.toHaveBeenCalled();
    expect(h.owner.getSnapshot().error).toBe("already-deployed-round");
  });
  it("handles rejection and permits a fresh explicit user attempt", async () => {
    const h = harness();
    vi.mocked(h.deps.send).mockRejectedValueOnce({ code: 4001 });
    await h.owner.start(BigInt("1"), "0.02");
    expect(h.owner.getSnapshot().phase).toBe("rejected");
    await h.owner.start(BigInt("1"), "0.02");
    expect(h.owner.getSnapshot().phase).toBe("success");
  });
  it("receipt revert never verifies or refreshes as success", async () => {
    const h = harness();
    h.receipt.status = "reverted";
    await h.owner.start(BigInt("1"), "0.02");
    expect(h.owner.getSnapshot()).toMatchObject({
      error: "receipt-reverted",
      chainConfirmed: false,
    });
    expect(h.deps.verify).not.toHaveBeenCalled();
    expect(h.deps.refresh).not.toHaveBeenCalled();
  });
  it.each(["refresh", "verify"] as const)(
    "confirmed %s failure cannot resend, retry completes reads/verification only",
    async (step) => {
      const h = harness();
      if (step === "refresh")
        vi.mocked(h.deps.refresh).mockRejectedValueOnce(Error("network"));
      else
        vi.mocked(h.deps.verify).mockImplementationOnce(() => {
          throw Error("mismatch");
        });
      await h.owner.start(BigInt("1"), "0.02");
      expect(h.owner.getSnapshot().chainConfirmed).toBe(true);
      expect(manualBusy(h.owner.getSnapshot())).toBe(true);
      await h.owner.start(BigInt("2"), "0.02");
      expect(h.deps.send).toHaveBeenCalledTimes(1);
      await h.owner.retryReads();
      expect(h.owner.getSnapshot().phase).toBe("success");
      expect(h.deps.send).toHaveBeenCalledTimes(1);
      expect(h.deps.wait).toHaveBeenCalledTimes(1);
    },
  );
  it.each([{ address: b }, { wrongChain: true }, { ready: false }])(
    "blocks account/chain/disconnection changes during preparation",
    async (change) => {
      const h = harness();
      vi.mocked(h.deps.prepare).mockImplementation(async () =>
        h.change(change),
      );
      await h.owner.start(BigInt("1"), "0.02");
      expect(h.deps.send).not.toHaveBeenCalled();
    },
  );
  it("after hash, refresh stays scoped to original account despite wallet change", async () => {
    const h = harness();
    vi.mocked(h.deps.send).mockImplementation(async () => {
      h.change({ address: b });
      return hash;
    });
    await h.owner.start(BigInt("1"), "0.02");
    expect(h.deps.refresh).toHaveBeenCalledWith(
      expect.objectContaining({ account: a }),
      BigInt("1655"),
      BigInt("500"),
    );
  });
  it("unknown confirmation allows only checking the existing hash", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockRejectedValueOnce(Error("timeout"));
    await h.owner.start(BigInt("1"), "0.02");
    expect(h.owner.getSnapshot()).toMatchObject({
      confirmationUnknown: true,
      hash,
    });
    await h.owner.start(BigInt("2"), "0.02");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    await h.owner.retryConfirmation();
    expect(h.owner.getSnapshot().phase).toBe("success");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
  it("blocks duplicate clicks while preparation is pending", async () => {
    const h = harness();
    let release!: () => void;
    vi.mocked(h.deps.prepare).mockImplementation(
      () =>
        new Promise<void>((r) => {
          release = r;
        }),
    );
    const first = h.owner.start(BigInt("1"), "0.02");
    await h.owner.start(BigInt("2"), "0.02");
    release();
    await first;
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
  it("normalizes nested SDK errors without exposing raw messages", () => {
    expect(
      manualError({
        cause: { data: { errorName: "MustCheckpointPreviousRound" } },
      }),
    ).toBe("checkpoint-required");
    expect(manualError(Error("private provider payload"))).toBe("rpc-error");
  });
});
