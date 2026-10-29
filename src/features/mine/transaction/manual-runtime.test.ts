import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  encodeEventTopics,
  encodeAbiParameters,
  type Address,
  type Hash,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { Config } from "wagmi";
import { writeContract } from "wagmi/actions";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createManualDependencies, verifyDeploy } from "./manual-runtime";
import type { ManualOperation, ManualReceipt } from "./manual-transaction";
const wallet = vi.hoisted(() => ({
  status: "connected",
  address: "0x0000000000000000000000000000000000000001",
  chainId: 97,
}));
vi.mock("wagmi/actions", () => ({
  getConnection: vi.fn(() => wallet),
  writeContract: vi.fn(async () => `0x${"1".repeat(64)}`),
  getBalance: vi.fn(async () => ({ value: BigInt("100") })),
}));
const a = wallet.address as Address,
  c = getContractsForChain(97);
const operation: ManualOperation = {
  account: a,
  chainId: 97,
  protocol: c.oreProtocol.address,
  view: c.oreProtocolView.address,
  mask: BigInt("1"),
  amountPerSquare: BigInt("1"),
  value: BigInt("1"),
};
const zeroes = [
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
  BigInt("0"),
] as const;
function harness() {
  const raw = {
    fulfilled: false,
    participated: false,
    failAccount: false,
    failSimulation: false,
    automationActive: false,
    balance: BigInt("100000"),
    round: BigInt("1654"),
  };
  const reads: { name: string; round?: bigint; account?: Address }[] = [];
  let simulated = 0;
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          if (method === "eth_chainId") return "0x61";
          if (method === "eth_getBlockByNumber")
            return {
              number: "0x64",
              timestamp: "0x64",
              transactions: [],
              gasLimit: "0x1000000",
              gasUsed: "0x0",
              size: "0x0",
              difficulty: "0x0",
            };
          if (method === "eth_getBalance")
            return `0x${raw.balance.toString(16)}`;
          if (method === "eth_blockNumber") return "0x64";
          if (method === "eth_gasPrice") return "0x1";
          if (method === "eth_estimateGas") return "0x5208";
          if (method !== "eth_call")
            throw Error("Unexpected/non-read RPC in test");
          const [call] = params as [{ to: string; data: `0x${string}` }];
          const protocol =
            call.to.toLowerCase() === c.oreProtocol.address.toLowerCase();
          if (protocol) {
            const d = decodeFunctionData({
              abi: c.oreProtocol.abi,
              data: call.data,
            });
            reads.push({ name: d.functionName });
            if (d.functionName === "deployManual") {
              simulated++;
              if (raw.failSimulation)
                throw Error("controlled simulation failure");
              return "0x";
            }
            if (d.functionName === "getAutomation")
              return encodeFunctionResult({
                abi: c.oreProtocol.abi,
                functionName: "getAutomation",
                result: {
                  owner: a,
                  balance: BigInt(0),
                  mask: BigInt(0),
                  amountPerSquare: BigInt(0),
                  randomizeMask: false,
                  active: raw.automationActive,
                  botFee: BigInt(0),
                },
              });
            if (d.functionName === "board")
              return encodeFunctionResult({
                abi: c.oreProtocol.abi,
                functionName: "board",
                result: [raw.round, 134, 20, 100, 1000, 100, true],
              });
            throw Error("Unexpected protocol method");
          }
          const d = decodeFunctionData({
            abi: c.oreProtocolView.abi,
            data: call.data,
          });
          reads.push({
            name: d.functionName,
            round: "args" in d ? (d.args?.[0] as bigint) : undefined,
            account: "args" in d ? (d.args?.[1] as Address) : undefined,
          });
          if (d.functionName === "getCurrentRoundInfo")
            return encodeFunctionResult({
              abi: c.oreProtocolView.abi,
              functionName: d.functionName,
              result: [
                raw.round,
                BigInt("80"),
                BigInt("120"),
                BigInt("0"),
                true,
                false,
                false,
              ],
            });
          if (d.functionName === "getRoundData")
            return encodeFunctionResult({
              abi: c.oreProtocolView.abi,
              functionName: d.functionName,
              result: {
                id: raw.round,
                startBlock: BigInt("80"),
                endBlock: BigInt("120"),
                intermissionEndBlock: BigInt("140"),
                totalDeployed: BigInt("0"),
                winningsPool: BigInt("0"),
                vaultShare: BigInt("0"),
                winningSquare: 0,
                oreReward: BigInt("0"),
                topMinerReward: BigInt("0"),
                topMinerSample: BigInt("0"),
                motherlodePayout: BigInt("0"),
                topMiner: a,
                randomnessRequested: false,
                randomnessFulfilled: raw.fulfilled,
                splitReward: false,
                motherlode: false,
                topMinerClaimed: false,
                claimedRewards: BigInt("0"),
                deployedPerSquare: zeroes,
                minersPerSquare: zeroes,
              },
            });
          if (raw.failAccount) throw Error("controlled account read failure");
          if (d.functionName === "getMinerRoundInfo")
            return encodeFunctionResult({
              abi: c.oreProtocolView.abi,
              functionName: d.functionName,
              result: [
                false,
                raw.participated,
                raw.participated ? BigInt("1") : BigInt("0"),
                BigInt("0"),
                BigInt("0"),
                BigInt("0"),
              ],
            });
          if (d.functionName === "getMinerSquares")
            return encodeFunctionResult({
              abi: c.oreProtocolView.abi,
              functionName: d.functionName,
              result: raw.participated
                ? [BigInt("1"), [0], [BigInt("1")]]
                : [BigInt("0"), [], []],
            });
          throw Error("Unexpected view method");
        },
      },
      { retryCount: 0 },
    ),
  });
  const deps = createManualDependencies({
    client: () => client,
    context: () => ({
      targetChainId: 97,
      ready: true,
      wrongChain: false,
      address: a,
    }),
    config: {} as Config,
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
  });
  return { raw, reads, deps, simulated: () => simulated };
}
beforeEach(() => {
  vi.clearAllMocks();
  wallet.chainId = 97;
  wallet.address = a;
  wallet.status = "connected";
});
describe("Manual pre-submit RPC boundary", () => {
  it("rejects a stale Manual draft once chain automation is active", async () => {
    const h = harness();
    h.raw.automationActive = true;
    await expect(h.deps.prepare(operation)).rejects.toThrow(
      "round-unavailable",
    );
    expect(h.simulated()).toBe(0);
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("freshly reads participation and simulates before one exact-value wallet request", async () => {
    const h = harness();
    await h.deps.prepare(operation);
    expect(h.simulated()).toBe(2);
    expect(writeContract).not.toHaveBeenCalled();
    await h.deps.send(operation);
    expect(writeContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        functionName: "deployManual",
        args: [BigInt("1"), BigInt("1")],
        value: BigInt("1"),
        chainId: 97,
        account: a,
      }),
    );
    expect(
      h.reads
        .filter((x) => x.name === "getMinerRoundInfo")
        .every(
          (x) =>
            x.round === BigInt("1654") &&
            x.account?.toLowerCase() === a.toLowerCase(),
        ),
    ).toBe(true);
  });
  it("blocks all second same-round deployments including another mask", async () => {
    const h = harness();
    h.raw.participated = true;
    await expect(
      h.deps.prepare({ ...operation, mask: BigInt("1") << BigInt("24") }),
    ).rejects.toThrow("already-deployed-round");
    expect(h.simulated()).toBe(0);
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("does not use old fulfilled-round participation to lock a new contract-selected round", async () => {
    const h = harness();
    h.raw.fulfilled = true;
    h.raw.participated = true;
    await h.deps.prepare(operation);
    expect(h.simulated()).toBe(2);
    expect(
      h.reads
        .filter((x) => x.round !== undefined)
        .every((x) => x.round === BigInt("1654")),
    ).toBe(true);
  });
  it("fulfilled stored round still fails closed on account read error", async () => {
    const h = harness();
    h.raw.fulfilled = true;
    h.raw.failAccount = true;
    await expect(h.deps.prepare(operation)).rejects.toThrow();
    expect(h.simulated()).toBe(0);
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("simulation failure cannot produce a prepared wallet request", async () => {
    const h = harness();
    h.raw.failSimulation = true;
    await expect(h.deps.prepare(operation)).rejects.toThrow();
    await expect(h.deps.send(operation)).rejects.toThrow("simulation-reverted");
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("refreshes original operation round/account keys even after account switch", async () => {
    const h = harness();
    wallet.address = "0x0000000000000000000000000000000000000002";
    await h.deps.refresh(operation, BigInt(1655), BigInt(100));
    const personal = h.reads.filter(
      (x) => x.name === "getMinerRoundInfo" || x.name === "getMinerSquares",
    );
    expect(personal).toHaveLength(2);
    expect(
      personal.every(
        (x) =>
          x.round === BigInt(1655) &&
          x.account?.toLowerCase() === a.toLowerCase(),
      ),
    ).toBe(true);
  });
  it("rejects an RPC head older than the confirmed receipt", async () => {
    const h = harness();
    await expect(
      h.deps.refresh(operation, BigInt(1655), BigInt(101)),
    ).rejects.toThrow("refresh-failed");
  });
  it("requires balance for principal plus estimated gas", async () => {
    const h = harness();
    h.raw.balance = BigInt("2");
    await expect(h.deps.prepare(operation)).rejects.toThrow(
      "insufficient-native",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("rechecks actual provider chain/account before wallet submission", async () => {
    const h = harness();
    await h.deps.prepare(operation);
    wallet.chainId = 56;
    await expect(h.deps.send(operation)).rejects.toThrow("wrong-chain");
    expect(writeContract).not.toHaveBeenCalled();
  });
});
function receipt(
  overrides: Partial<{
    round: bigint;
    miner: Address;
    mask: bigint;
    amount: bigint;
    total: bigint;
    automation: boolean;
    emitter: Address;
  }> = {},
): ManualReceipt {
  const v = {
    round: BigInt("1655"),
    miner: a,
    mask: BigInt("1"),
    amount: BigInt("1"),
    total: BigInt("1"),
    automation: false,
    emitter: c.oreProtocol.address,
    ...overrides,
  };
  return {
    hash: `0x${"1".repeat(64)}` as Hash,
    status: "success",
    blockNumber: BigInt("100"),
    logs: [
      {
        address: v.emitter,
        topics: encodeEventTopics({
          abi: c.oreProtocol.abi,
          eventName: "DeployEvent",
          args: { roundId: v.round, miner: v.miner },
        }) as [Hash, ...Hash[]],
        data: encodeAbiParameters(
          [
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "bool" },
            { type: "uint64" },
          ],
          [v.mask, v.amount, v.total, v.automation, BigInt(100)],
        ),
      },
    ],
  };
}
describe("Manual matching receipt event", () => {
  it("gets operation round exclusively from DeployEvent", () =>
    expect(verifyDeploy(operation, receipt())).toBe(BigInt("1655")));
  it.each([
    { mask: BigInt("2") },
    { amount: BigInt("2") },
    { total: BigInt("2") },
    { automation: true },
    { miner: "0x0000000000000000000000000000000000000002" as Address },
    { emitter: c.oriToken.address },
  ])("rejects mismatched intent/emitter", (override) =>
    expect(() => verifyDeploy(operation, receipt(override))).toThrow(
      "verification-failed",
    ),
  );
  it("rejects duplicate matching events", () => {
    const r = receipt();
    r.logs = [...r.logs, ...r.logs];
    expect(() => verifyDeploy(operation, r)).toThrow("verification-failed");
  });
});

describe("Manual buffered native budget", () => {
  it.each([44100, 44101])(
    "checks principal plus two separately rounded margins at %s",
    async (balance) => {
      const h = harness();
      h.raw.balance = BigInt(balance);
      if (balance === 44100)
        await expect(h.deps.prepare(operation)).rejects.toThrow(
          "insufficient-native",
        );
      else {
        await h.deps.prepare(operation);
        await h.deps.send(operation);
        expect(writeContract).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            value: BigInt(1),
            gas: BigInt(22050),
            gasPrice: BigInt(2),
          }),
        );
      }
    },
  );
  it("stops if native balance falls after preparation", async () => {
    const h = harness();
    await h.deps.prepare(operation);
    h.raw.balance = BigInt(44100);
    await expect(h.deps.send(operation)).rejects.toThrow("insufficient-native");
    expect(writeContract).not.toHaveBeenCalled();
  });
});
