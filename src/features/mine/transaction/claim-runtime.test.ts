import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  encodeFunctionResult,
  encodeFunctionData,
  type Address,
  type Hash,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { Config } from "wagmi";
import { getBalance, writeContract } from "wagmi/actions";
import { getBalanceQueryOptions, readContractQueryOptions } from "wagmi/query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import {
  claimCall,
  createClaimDependencies,
  verifyClaim,
} from "./claim-runtime";
import type { ClaimKind } from "./claim-model";
import { ClaimFault } from "./claim-model";
import type { ClaimOperation } from "./claim-transaction";
import { createMineRewardsQuery } from "../read/mine-rewards-query";
import type { ManualReceipt } from "./manual-transaction";
const wallet = vi.hoisted(() => ({
  status: "connected",
  chainId: 97,
  address: "0x0000000000000000000000000000000000000001",
}));
vi.mock("wagmi/actions", () => ({
  getConnection: () => wallet,
  writeContract: vi.fn(async () => `0x${"1".repeat(64)}`),
  getBalance: vi.fn(async () => ({ value: BigInt(123) })),
}));
const contracts = getContractsForChain(97),
  p = contracts.oreProtocol,
  a = wallet.address as Address,
  b = "0x0000000000000000000000000000000000000002" as Address,
  hash = `0x${"1".repeat(64)}` as Hash;
const op = (kind: ClaimKind): ClaimOperation => ({
  kind,
  account: a,
  chainId: 97,
  protocol: p.address,
});
function harness() {
  const state = {
    rewards: [BigInt(4), BigInt(5), BigInt(6)] as readonly [
      bigint,
      bigint,
      bigint,
    ],
    failSimulation: false,
    failReads: false,
    failToken: false,
    head: BigInt(100),
    chain: "0x61",
    balance: BigInt(100000),
    simulations: 0,
  };
  const calls: string[] = [];
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          calls.push(method);
          if (method === "eth_chainId") return state.chain;
          if (method === "eth_blockNumber")
            return `0x${state.head.toString(16)}`;
          if (method === "eth_getBlockByNumber")
            return {
              number: `0x${state.head.toString(16)}`,
              timestamp: "0x64",
              transactions: [],
              gasLimit: "0x1000000",
              gasUsed: "0x0",
              difficulty: "0x0",
              size: "0x0",
            };
          if (method === "eth_getBalance")
            return `0x${state.balance.toString(16)}`;
          if (method === "eth_estimateGas") return "0x5208";
          if (method === "eth_gasPrice") return "0x1";
          if (method !== "eth_call")
            throw Error("Test transport prohibits any broadcast");
          const [call] = params as [{ to: string; data: Hash }];
          if (
            call.to.toLowerCase() === contracts.oriToken.address.toLowerCase()
          ) {
            if (state.failToken) throw Error("token read unavailable");
            return encodeFunctionResult({
              abi: contracts.oriToken.abi,
              functionName: "balanceOf",
              result: BigInt(11),
            });
          }
          const d = decodeFunctionData({ abi: p.abi, data: call.data });
          calls.push(d.functionName);
          if (d.functionName === "getUserRewards") {
            if (state.failReads) throw Error("reward read unavailable");
            return encodeFunctionResult({
              abi: p.abi,
              functionName: "getUserRewards",
              result: state.rewards,
            });
          }
          if (d.functionName === "claimAll" || d.functionName === "claimEth") {
            state.simulations++;
            if (state.failSimulation)
              throw new ClaimFault("simulation-reverted");
            return encodeFunctionResult({
              abi: p.abi,
              functionName: d.functionName,
              result:
                d.functionName === "claimAll"
                  ? [BigInt(4), BigInt(8)]
                  : BigInt(4),
            });
          }
          throw Error("Unexpected ABI method");
        },
      },
      { retryCount: 0 },
    ),
  });
  const config = {} as Config,
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const deps = createClaimDependencies({
    client: () => client,
    context: () => ({
      targetChainId: 97,
      address: wallet.address as Address,
      ready: true,
      wrongChain: false,
    }),
    config,
    queryClient: qc,
  });
  return { client, config, qc, deps, state, calls };
}
function ethLog(miner: Address = a, to: Address = a) {
  return {
    address: p.address,
    data: encodeAbiParameters(
      [{ type: "uint256" }, { type: "address" }, { type: "uint64" }],
      [BigInt(1), to, BigInt(9)],
    ),
    topics: encodeEventTopics({
      abi: p.abi,
      eventName: "ClaimEth",
      args: { miner, roundId: BigInt(3) },
    }) as [Hash, ...Hash[]],
  };
}
function oreLog(miner: Address = a) {
  return {
    address: p.address,
    data: encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint64" },
      ],
      [BigInt(4), BigInt(1), BigInt(1), BigInt(9)],
    ),
    topics: encodeEventTopics({
      abi: p.abi,
      eventName: "ClaimOre",
      args: { miner, roundId: BigInt(3) },
    }) as [Hash, ...Hash[]],
  };
}
const receipt = (logs: ManualReceipt["logs"]): ManualReceipt => ({
  hash,
  status: "success",
  blockNumber: BigInt(99),
  logs,
});
beforeEach(() => {
  wallet.address = a;
  wallet.chainId = 97;
  wallet.status = "connected";
  vi.clearAllMocks();
});
describe("Mine Claim runtime boundaries", () => {
  it("blocks send when reward reads fail, gas is insufficient, or another Mine operation is active", async () => {
    const h = harness(),
      o = op("claimEth");
    h.state.failReads = true;
    await expect(h.deps.prepare(o)).rejects.toThrow();
    h.state.failReads = false;
    h.state.balance = BigInt(1);
    await expect(h.deps.prepare(o)).rejects.toThrow("insufficient-native");
    const locked = createClaimDependencies({
      client: () => h.client,
      context: () => ({
        targetChainId: 97,
        ready: true,
        wrongChain: false,
        address: a,
      }),
      config: h.config,
      queryClient: h.qc,
      otherBusy: () => true,
    });
    await expect(locked.prepare(o)).rejects.toThrow();
    expect(writeContract).not.toHaveBeenCalled();
    h.qc.clear();
  });
  it("waits one confirmation and verifies original transaction input, sender, recipient and value", async () => {
    const h = harness(),
      o = op("claimEth"),
      input = encodeFunctionData(claimCall(o));
    const wait = vi
      .spyOn(h.client, "waitForTransactionReceipt")
      .mockResolvedValue({
        transactionHash: hash,
        status: "success",
        blockNumber: BigInt(99),
        logs: [],
        blockHash: hash,
        contractAddress: null,
        cumulativeGasUsed: BigInt(21000),
        effectiveGasPrice: BigInt(1),
        from: a,
        to: p.address,
        gasUsed: BigInt(21000),
        logsBloom: `0x${"0".repeat(512)}`,
        transactionIndex: 0,
        type: "legacy",
      });
    const tx = vi.spyOn(h.client, "getTransaction").mockResolvedValue({
      hash,
      from: a,
      to: p.address,
      input,
      value: BigInt(0),
    } as Awaited<ReturnType<typeof h.client.getTransaction>>);
    expect(await h.deps.wait(o, hash, () => {})).toMatchObject({
      hash,
      status: "success",
    });
    expect(wait).toHaveBeenCalledWith(
      expect.objectContaining({ confirmations: 1, hash }),
    );
    tx.mockResolvedValue({
      hash,
      from: b,
      to: p.address,
      input,
      value: BigInt(0),
    } as Awaited<ReturnType<typeof h.client.getTransaction>>);
    await expect(h.deps.wait(o, hash, () => {})).rejects.toThrow("replaced");
    h.qc.clear();
  });

  it.each(["claimAll", "claimEth"] as const)(
    "%s uses Registry + frozen recipient and no native value",
    async (kind) => {
      const h = harness(),
        o = op(kind);
      expect(claimCall(o)).toMatchObject({
        address: p.address,
        functionName: kind,
        args: [a],
        account: a,
      });
      expect(claimCall(o)).not.toHaveProperty("value");
      await h.deps.prepare(o);
      expect(writeContract).not.toHaveBeenCalled();
      await h.deps.send(o);
      expect(writeContract).toHaveBeenCalledWith(
        h.config,
        expect.objectContaining({
          functionName: kind,
          args: [a],
          account: a,
          chainId: 97,
        }),
      );
      expect(h.state.simulations).toBe(2);
      h.qc.clear();
    },
  );
  it.each(["claimAll", "claimEth"] as const)(
    "%s simulation failure never obtains send permission",
    async (kind) => {
      const h = harness(),
        o = op(kind);
      h.state.failSimulation = true;
      await expect(h.deps.prepare(o)).rejects.toThrow();
      await expect(h.deps.send(o)).rejects.toThrow();
      expect(writeContract).not.toHaveBeenCalled();
      h.qc.clear();
    },
  );
  it("fresh zero rewards fail closed even if UI was previously positive", async () => {
    const h = harness();
    h.state.rewards = [BigInt(1), BigInt(0), BigInt(0)];
    await expect(h.deps.prepare(op("claimAll"))).rejects.toThrow(
      "nothing-to-claim",
    );
    h.state.rewards = [BigInt(0), BigInt(1), BigInt(1)];
    await expect(h.deps.prepare(op("claimEth"))).rejects.toThrow(
      "nothing-to-claim",
    );
    expect(writeContract).not.toHaveBeenCalled();
    h.qc.clear();
  });
  it("stops account/chain changes after simulation before send", async () => {
    const h = harness(),
      o = op("claimAll");
    await h.deps.prepare(o);
    wallet.address = b;
    await expect(h.deps.send(o)).rejects.toThrow("account-changed");
    wallet.address = a;
    wallet.chainId = 56;
    await expect(h.deps.send(o)).rejects.toThrow("wrong-chain");
    expect(writeContract).not.toHaveBeenCalled();
    h.qc.clear();
  });
  it("rejects wrong deployment or chain even for direct call construction", () => {
    expect(() => claimCall({ ...op("claimEth"), protocol: b })).toThrow();
  });
  it("requires matching native event miner + recipient, or ORI event for claimAll", () => {
    expect(() =>
      verifyClaim(op("claimEth"), receipt([ethLog()])),
    ).not.toThrow();
    expect(() =>
      verifyClaim(op("claimAll"), receipt([oreLog()])),
    ).not.toThrow();
    for (const logs of [[], [ethLog(b)], [ethLog(a, b)], [oreLog()]])
      expect(() => verifyClaim(op("claimEth"), receipt(logs))).toThrow(
        "verification-failed",
      );
    expect(() => verifyClaim(op("claimAll"), receipt([ethLog()]))).toThrow();
  });
  it("refined-only ORI can use the canonical token transfer as payout evidence", () => {
    const log = {
      address: contracts.oriToken.address,
      data: encodeAbiParameters([{ type: "uint256" }], [BigInt(9)]),
      topics: encodeEventTopics({
        abi: contracts.oriToken.abi,
        eventName: "Transfer",
        args: { from: p.address, to: a },
      }) as [Hash, ...Hash[]],
    };
    expect(() => verifyClaim(op("claimAll"), receipt([log]))).not.toThrow();
    expect(() => verifyClaim(op("claimEth"), receipt([log]))).toThrow();
    expect(() =>
      verifyClaim(op("claimAll"), receipt([{ ...log, address: b }])),
    ).toThrow();
  });
  it("claimEth refetches BNB + rewards, preserves ORI from read, isolates switched account keys", async () => {
    const h = harness();
    const newAccount = createMineRewardsQuery(h.client, {
      targetChainId: 97,
      address: b,
      ready: true,
      wrongChain: false,
    });
    h.qc.setQueryData(newAccount.queryKey, {
      ethAmount: BigInt(77),
      oriDirect: BigInt(88),
      oriRefined: BigInt(99),
    });
    wallet.address = b;
    h.state.rewards = [BigInt(0), BigInt(5), BigInt(6)];
    await h.deps.refresh(op("claimEth"), BigInt(99));
    const old = createMineRewardsQuery(h.client, {
      targetChainId: 97,
      address: a,
      ready: true,
      wrongChain: false,
    });
    expect(h.qc.getQueryData(old.queryKey)).toEqual({
      ethAmount: BigInt(0),
      oriDirect: BigInt(5),
      oriRefined: BigInt(6),
    });
    expect(h.qc.getQueryData(newAccount.queryKey)).toMatchObject({
      ethAmount: BigInt(77),
    });
    expect(h.calls).not.toContain("balanceOf");
    expect(getBalance).toHaveBeenCalledWith(
      h.config,
      expect.objectContaining({
        address: a,
        chainId: 97,
        blockNumber: BigInt(100),
      }),
    );
    h.qc.clear();
  });
  it("claimAll refreshes ORI balance and fails if any relevant read fails", async () => {
    const h = harness(),
      o = op("claimAll");
    await h.deps.refresh(o, BigInt(99));
    const token = readContractQueryOptions(h.config, {
      ...contracts.oriToken,
      functionName: "balanceOf",
      args: [a],
      chainId: 97,
    });
    expect(h.qc.getQueryData(token.queryKey)).toBe(BigInt(11));
    const native = getBalanceQueryOptions(h.config, {
      address: a,
      chainId: 97,
    });
    expect(h.qc.getQueryData(native.queryKey)).toMatchObject({
      value: BigInt(123),
    });
    h.state.failToken = true;
    await expect(h.deps.refresh(o, BigInt(99))).rejects.toThrow();
    h.qc.clear();
  });
  it("refresh requires chain97 and post-receipt head, not cached pre-receipt reads", async () => {
    const h = harness();
    await expect(h.deps.refresh(op("claimEth"), BigInt(101))).rejects.toThrow(
      "refresh-failed",
    );
    h.state.chain = "0x38";
    await expect(h.deps.refresh(op("claimEth"), BigInt(99))).rejects.toThrow(
      "wrong-chain",
    );
    expect(writeContract).not.toHaveBeenCalled();
    h.qc.clear();
  });
});
