import { describe, it, expect, vi } from "vitest";
import type { Address, Hash } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { StakeReadContext } from "../read/stake-read-context";
import { parseStakeAmount, stakePercentage } from "./amount";
import {
  StakeTransaction,
  stakeTxBusy,
  type StakeTxDependencies,
} from "./stake-transaction";
import { StakeTxFault, stakeTxError } from "./errors";
const alice: Address = "0x0000000000000000000000000000000000000001",
  bob: Address = "0x0000000000000000000000000000000000000002";
const hash = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as Hash;
const input = "0.000000000000000001",
  c = getContractsForChain(97);
const connected = (address = alice): StakeReadContext => ({
  targetChainId: 97,
  account: { status: "connected", address, chainId: 97 },
});
function harness() {
  const data = {
    context: connected(),
    available: BigInt(100),
    staked: BigInt(10),
    allowance: BigInt(0),
    refreshFails: false,
    allowanceStaysLow: false,
  };
  const events: string[] = [];
  let count = 0;
  const deps: StakeTxDependencies = {
    contracts: {
      token: c.oriToken.address,
      protocol: c.oreProtocol.address,
      view: c.oreProtocolView.address,
    },
    context: () => data.context,
    read: vi.fn(async () => ({
      available: data.available,
      staked: data.staked,
      allowance: data.allowance,
    })),
    simulate: vi.fn(async (_, step) => {
      events.push("simulate:" + step);
    }),
    send: vi.fn(async (_, step) => {
      events.push("send:" + step);
      return hash(++count);
    }),
    wait: vi.fn<StakeTxDependencies["wait"]>(async (_, step, h) => {
      events.push("receipt:" + step);
      return { hash: h, status: "success", blockNumber: BigInt(20) };
    }),
    refresh: vi.fn(async (o, step) => {
      events.push("refresh:" + step);
      if (data.refreshFails) throw Error("read offline");
      if (step === "approve") {
        if (data.allowanceStaysLow)
          throw new StakeTxFault("insufficient-allowance");
        data.allowance = o.amount;
      }
    }),
  };
  const owner = new StakeTransaction(deps);
  return { data, deps, owner, events };
}
describe("Stake exact amounts", () => {
  it.each([
    "",
    "0x1",
    "1e-18",
    "-1",
    "+1",
    " 1 ",
    "1,000",
    ".5",
    "1.0000000000000000001",
    "NaN",
    "Infinity",
  ])("rejects %s", (value) => {
    expect(() => parseStakeAmount(value)).toThrow("invalid-amount");
  });
  it.each(["0", "0.000000000000000000"])("rejects zero %s", (value) =>
    expect(() => parseStakeAmount(value)).toThrow("zero-amount"),
  );
  it("accepts 18 decimals and large exact integers", () => {
    expect(parseStakeAmount("1.")).toBe(BigInt("1000000000000000000"));
    expect(parseStakeAmount(input)).toBe(BigInt(1));
    expect(parseStakeAmount("9007199254740993.123456789012345678")).toBe(
      BigInt("9007199254740993123456789012345678"),
    );
  });
  it("rejects uint256 overflow", () =>
    expect(() =>
      parseStakeAmount((BigInt(1) << BigInt(256)).toString()),
    ).toThrow("invalid-amount"));
  it.each([25, 50, 75, 100] as const)(
    "calculates %s percent and Max from bigint without gas deduction",
    (percent) => {
      const raw = BigInt("1000000000000000003");
      expect(parseStakeAmount(stakePercentage(raw, percent))).toBe(
        (raw * BigInt(percent)) / BigInt(100),
      );
    },
  );
});
describe("Stake approval and funds flow", () => {
  it("approves exact amount, confirms, re-reads allowance, then deposits", async () => {
    const h = harness();
    const phases: string[] = [];
    h.owner.subscribe(() => phases.push(h.owner.getSnapshot().phase));
    await h.owner.start("deposit", input);
    expect(h.events).toEqual([
      "simulate:approve",
      "send:approve",
      "receipt:approve",
      "refresh:approve",
      "simulate:deposit",
      "send:deposit",
      "receipt:deposit",
      "refresh:deposit",
    ]);
    expect(vi.mocked(h.deps.send).mock.calls[0][0].amount).toBe(BigInt(1));
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "success",
      step: "deposit",
      chainConfirmed: true,
    });
    expect(phases).toContain("submitted");
    expect(phases).toContain("confirming");
    expect(phases).toContain("refreshing");
  });
  it("skips approval when allowance is sufficient", async () => {
    const h = harness();
    h.data.allowance = BigInt(10);
    await h.owner.start("deposit", input);
    expect(h.events).not.toContain("send:approve");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
  it.each(["deposit", "withdraw"] as const)(
    "blocks %s above fresh principal balance",
    async (kind) => {
      const h = harness();
      await h.owner.start(kind, "1");
      expect(h.deps.send).not.toHaveBeenCalled();
      expect(h.owner.getSnapshot().error).toBe(
        kind === "deposit" ? "insufficient-ori" : "insufficient-staked",
      );
    },
  );
  it.each(["deposit", "withdraw"] as const)(
    "never sends %s after simulation failure",
    async (kind) => {
      const h = harness();
      h.data.allowance = BigInt(10);
      vi.mocked(h.deps.simulate).mockRejectedValue(
        new StakeTxFault("simulation-reverted"),
      );
      await h.owner.start(kind, input);
      expect(h.deps.send).not.toHaveBeenCalled();
      expect(h.owner.getSnapshot().error).toBe("simulation-reverted");
    },
  );
  it.each(["approve", "deposit", "withdraw"] as const)(
    "recovers from user rejection during %s",
    async (step) => {
      const h = harness();
      if (step !== "approve") h.data.allowance = BigInt(10);
      vi.mocked(h.deps.send).mockRejectedValueOnce({ code: 4001 });
      await h.owner.start(step === "withdraw" ? "withdraw" : "deposit", input);
      expect(h.owner.getSnapshot().phase).toBe("rejected");
      expect(h.deps.wait).not.toHaveBeenCalled();
      await h.owner.start(step === "withdraw" ? "withdraw" : "deposit", input);
      expect(h.owner.getSnapshot().phase).toBe("success");
    },
  );
  it.each(["approve", "deposit", "withdraw"] as const)(
    "does not call success after %s receipt reverts",
    async (step) => {
      const h = harness();
      if (step !== "approve") h.data.allowance = BigInt(10);
      vi.mocked(h.deps.wait).mockImplementationOnce(async (_, __, hash) => ({
        hash,
        status: "reverted",
        blockNumber: BigInt(20),
      }));
      await h.owner.start(step === "withdraw" ? "withdraw" : "deposit", input);
      expect(h.owner.getSnapshot()).toMatchObject({
        phase: "failed",
        error: "receipt-reverted",
        chainConfirmed: false,
      });
      expect(h.deps.refresh).not.toHaveBeenCalled();
      expect(h.deps.send).toHaveBeenCalledTimes(1);
    },
  );
  it("does not enter deposit if confirmed approval still has insufficient allowance", async () => {
    const h = harness();
    h.data.allowanceStaysLow = true;
    await h.owner.start("deposit", input);
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "refresh-failed",
      chainConfirmed: true,
      step: "approve",
    });
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    h.data.allowanceStaysLow = false;
    await h.owner.retryRefresh();
    expect(h.owner.getSnapshot()).toMatchObject({
      phase: "success",
      step: "approve",
    });
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
  it.each(["deposit", "withdraw"] as const)(
    "preserves confirmed %s and retries only reads",
    async (kind) => {
      const h = harness();
      h.data.allowance = BigInt(10);
      h.data.refreshFails = true;
      await h.owner.start(kind, input);
      expect(h.owner.getSnapshot()).toMatchObject({
        phase: "refresh-failed",
        chainConfirmed: true,
      });
      await h.owner.start(kind, input);
      expect(h.deps.send).toHaveBeenCalledTimes(1);
      h.data.refreshFails = false;
      await h.owner.retryRefresh();
      expect(h.owner.getSnapshot().phase).toBe("success");
      expect(h.deps.send).toHaveBeenCalledTimes(1);
    },
  );
});
describe("Stake context and pending tracking", () => {
  it("blocks wrong chain", async () => {
    const h = harness();
    h.data.context = { targetChainId: 97, account: { status: "wrong-chain" } };
    await h.owner.start("withdraw", input);
    expect(h.owner.getSnapshot().error).toBe("wrong-chain");
    expect(h.deps.simulate).not.toHaveBeenCalled();
  });
  it("stops account mutation during simulation before a wallet request", async () => {
    const h = harness();
    vi.mocked(h.deps.simulate).mockImplementation(async () => {
      h.data.context = connected(bob);
    });
    await h.owner.start("withdraw", input);
    expect(h.owner.getSnapshot().error).toBe("account-changed");
    expect(h.deps.send).not.toHaveBeenCalled();
  });
  it("checks context again at awaiting-signature", async () => {
    const h = harness();
    h.owner.subscribe(() => {
      if (h.owner.getSnapshot().phase === "awaiting-signature")
        h.data.context = connected(bob);
    });
    await h.owner.start("withdraw", input);
    expect(h.deps.send).not.toHaveBeenCalled();
  });
  it("continues receipt and refresh for original account after hash", async () => {
    const h = harness();
    vi.mocked(h.deps.send).mockImplementation(async () => {
      h.data.context = connected(bob);
      return hash(1);
    });
    await h.owner.start("withdraw", input);
    expect(h.owner.getSnapshot().phase).toBe("success");
    expect(vi.mocked(h.deps.wait).mock.calls[0][0].account).toBe(alice);
    expect(vi.mocked(h.deps.refresh).mock.calls[0][0].account).toBe(alice);
  });
  it("does not proceed from approval to deposit after account switch", async () => {
    const h = harness();
    const original = h.deps.refresh;
    h.deps.refresh = vi.fn(async (o, s, b) => {
      await original(o, s, b);
      h.data.context = connected(bob);
    });
    await h.owner.start("deposit", input);
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    expect(h.owner.getSnapshot().error).toBe("account-changed");
  });
  it("keeps unresolved hash locked and rechecks receipt without resending", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockRejectedValueOnce(Error("timeout"));
    await h.owner.start("withdraw", input);
    expect(h.owner.getSnapshot()).toMatchObject({
      confirmationUnknown: true,
      error: "confirmation-unknown",
    });
    expect(stakeTxBusy(h.owner.getSnapshot())).toBe(true);
    await h.owner.start("withdraw", input);
    expect(h.deps.send).toHaveBeenCalledTimes(1);
    await h.owner.retryConfirmation();
    expect(h.owner.getSnapshot().phase).toBe("success");
    expect(h.deps.send).toHaveBeenCalledTimes(1);
  });
  it("tracks replacement hash", async () => {
    const h = harness();
    vi.mocked(h.deps.wait).mockImplementation(async (_, __, old, onHash) => {
      onHash(hash(2));
      return { hash: hash(2), status: "success", blockNumber: BigInt(20) };
    });
    await h.owner.start("withdraw", input);
    expect(h.owner.getSnapshot().hash).toBe(hash(2));
  });
  it("does not classify a network error as a contract revert", () =>
    expect(stakeTxError({ name: "HttpRequestError" })).toBe("rpc-error"));
  it.each([
    [{ cause: { code: 4001 } }, "user-rejected"],
    [{ cause: { name: "InsufficientFundsError" } }, "insufficient-gas"],
    [{ name: "ChainMismatchError" }, "wrong-chain"],
    [{ name: "ConnectorAccountNotFoundError" }, "account-changed"],
    [
      { data: { errorName: "ERC20InsufficientAllowance" } },
      "insufficient-allowance",
    ],
    [{ data: { errorName: "ERC20InsufficientBalance" } }, "insufficient-ori"],
    [
      { cause: { name: "ContractFunctionRevertedError" } },
      "simulation-reverted",
    ],
  ])("maps nested SDK errors to safe classifications", (error, expected) => {
    expect(stakeTxError(error)).toBe(expected);
  });
});

describe("Stake operation exclusivity", () => {
  it("never starts a parallel operation at the approval/deposit boundary", async () => {
    const h = harness();
    h.owner.subscribe(() => {
      const s = h.owner.getSnapshot();
      if (s.phase === "success" && s.step === "approve")
        void h.owner.start("withdraw", input);
    });
    await h.owner.start("deposit", input);
    expect(h.deps.send).toHaveBeenCalledTimes(2);
    expect(vi.mocked(h.deps.send).mock.calls.map(([, step]) => step)).toEqual([
      "approve",
      "deposit",
    ]);
  });
  it("continues the original receipt after a chain change following submission", async () => {
    const h = harness();
    vi.mocked(h.deps.send).mockImplementation(async () => {
      h.data.context = {
        targetChainId: 97,
        account: { status: "wrong-chain" },
      };
      return hash(1);
    });
    await h.owner.start("withdraw", input);
    expect(h.owner.getSnapshot().phase).toBe("success");
    expect(vi.mocked(h.deps.wait).mock.calls[0][0].chainId).toBe(97);
  });
});
