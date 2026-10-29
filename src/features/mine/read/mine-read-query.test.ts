import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
} from "viem";
import { bscTestnet } from "viem/chains";
import { describe, expect, it, vi } from "vitest";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createMineBoardQuery, mineReadKeys } from "./mine-read-query";
import { mineAmount, mineBoardDisplay, mineCount } from "./mine-display";

const context = { targetChainId: 97, wrongChain: false };
const contracts = getContractsForChain(97);
function squareValues(value: bigint) {
  return [
    BigInt(0),
    BigInt(0),
    BigInt(0),
    value,
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
  ] as const;
}
function harness() {
  const state = {
    chain: "0x61",
    roundId: BigInt("9007199254740993"),
    mismatch: false,
    fulfilled: false,
    winningSquare: 23,
    end: BigInt(120),
    count: BigInt("9007199254740993123"),
    fail: false,
    malformed: false,
    wait: Promise.resolve(),
  };
  const calls: {
    method: string;
    block?: unknown;
    functionName?: string;
    roundId?: bigint;
  }[] = [];
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          if (method === "eth_chainId") {
            calls.push({ method });
            return state.chain;
          }
          if (method === "eth_getBlockByNumber") {
            calls.push({ method });
            return {
              number: "0x64",
              timestamp: "0x64",
              transactions: [],
              gasLimit: "0x0",
              gasUsed: "0x0",
              size: "0x0",
              difficulty: "0x0",
            };
          }
          if (method !== "eth_call") throw new Error("Non-read RPC forbidden");
          const [call, block] = params as [
            { to: string; data: `0x${string}` },
            string,
          ];
          const protocol =
            call.to.toLowerCase() ===
            contracts.oreProtocol.address.toLowerCase();
          if (protocol) {
            const decoded = decodeFunctionData({
              abi: contracts.oreProtocol.abi,
              data: call.data,
            });
            calls.push({ method, block, functionName: decoded.functionName });
            expect(decoded.functionName).toBe("board");
            return encodeFunctionResult({
              abi: contracts.oreProtocol.abi,
              functionName: "board",
              result: [state.roundId, 134, 20, 100, 1000, 100, true],
            });
          }
          expect(call.to.toLowerCase()).toBe(
            contracts.oreProtocolView.address.toLowerCase(),
          );
          const decoded = decodeFunctionData({
            abi: contracts.oreProtocolView.abi,
            data: call.data,
          });
          calls.push({
            method,
            block,
            functionName: decoded.functionName,
            roundId:
              decoded.functionName === "getRoundData"
                ? decoded.args[0]
                : undefined,
          });
          if (decoded.functionName === "getCurrentRoundInfo")
            return encodeFunctionResult({
              abi: contracts.oreProtocolView.abi,
              functionName: "getCurrentRoundInfo",
              result: [
                state.roundId,
                BigInt(80),
                state.end,
                BigInt("1000000000000000"),
                true,
                false,
                false,
              ],
            });
          expect(decoded.functionName).toBe("getRoundData");
          await state.wait;
          if (state.fail) throw new Error("Controlled RPC error");
          if (state.malformed) return "0x";
          return encodeFunctionResult({
            abi: contracts.oreProtocolView.abi,
            functionName: "getRoundData",
            result: {
              id: state.mismatch ? state.roundId + BigInt(1) : state.roundId,
              startBlock: BigInt(80),
              endBlock: state.end,
              intermissionEndBlock: BigInt(140),
              totalDeployed: BigInt("1000000000000000"),
              winningsPool: BigInt(0),
              vaultShare: BigInt(0),
              winningSquare: state.winningSquare,
              topMiner: "0x0000000000000000000000000000000000000000",
              oreReward: BigInt(0),
              topMinerReward: BigInt(0),
              topMinerSample: BigInt(0),
              motherlodePayout: BigInt(0),
              randomnessRequested: false,
              randomnessFulfilled: state.fulfilled,
              splitReward: false,
              motherlode: false,
              topMinerClaimed: false,
              claimedRewards: BigInt(0),
              deployedPerSquare: squareValues(BigInt("1000000000000000")),
              minersPerSquare: squareValues(state.count),
            },
          });
        },
      },
      { retryCount: 0 },
    ),
  });
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const options = () => ({
    ...createMineBoardQuery(client, context),
    retry: false,
  });
  return { client, state, calls, cache, options };
}

describe("Mine atomic public snapshot", () => {
  it("pins the Registry reads, preserves uint64 identity and uint256 counts, and never infers next round", async () => {
    const h = harness();
    const result = await h.cache.fetchQuery(h.options());
    expect(result.roundId).toBe(h.state.roundId);
    expect(result.blockNumber).toBe(BigInt(100));
    expect(result.initialized).toBe(true);
    expect(
      mineBoardDisplay(
        {
          data: { ...result, initialized: false },
          isPending: false,
          isError: false,
        },
        context,
        true,
      ),
    ).toEqual({ status: "unavailable" });
    expect(result.deployedPerSquare).toHaveLength(25);
    expect(result.minersPerSquare[3]).toBe(h.state.count);
    expect(result.deployedPerSquare[3]).toBe(BigInt("1000000000000000"));
    expect(
      h.calls
        .filter((c) => c.method === "eth_call")
        .every((c) => c.block === "0x64"),
    ).toBe(true);
    expect(
      h.calls.find((c) => c.functionName === "getRoundData")?.roundId,
    ).toBe(h.state.roundId);
    expect(new Set(h.calls.map((c) => c.method))).toEqual(
      new Set(["eth_chainId", "eth_getBlockByNumber", "eth_call"]),
    );
    h.cache.clear();
  });
  it.each(["fulfilled", "expired"])(
    "keeps an %s stored round in transition despite canDeploy=true",
    async (kind) => {
      const h = harness();
      if (kind === "fulfilled") h.state.fulfilled = true;
      else h.state.end = BigInt(90);
      const result = await h.cache.fetchQuery(h.options());
      expect(result.transition).toBe(true);
      expect(result.roundId).toBe(h.state.roundId);
      h.cache.clear();
    },
  );
  it("exposes a winner only after fulfillment and validates the 0–24 ABI index", async () => {
    const h = harness();
    const first = await h.cache.fetchQuery(h.options());
    expect(first.winningSquare).toBeUndefined();
    h.state.fulfilled = true;
    const done = await h.cache.fetchQuery({ ...h.options(), staleTime: 0 });
    expect(done.winningSquare).toBe(23);
    h.state.winningSquare = 25;
    await expect(
      h.cache.fetchQuery({ ...h.options(), staleTime: 0 }),
    ).rejects.toThrow("Invalid fulfilled Mine result");
    h.cache.clear();
  });
  it("rejects mismatched identity and malformed ABI instead of publishing partial data", async () => {
    const h = harness();
    h.state.mismatch = true;
    await expect(h.cache.fetchQuery(h.options())).rejects.toThrow(
      "Inconsistent Mine snapshot",
    );
    h.state.mismatch = false;
    h.state.malformed = true;
    await expect(h.cache.fetchQuery(h.options())).rejects.toThrow();
    expect(h.cache.getQueryData(h.options().queryKey)).toBeUndefined();
    h.cache.clear();
  });
  it.each([
    { targetChainId: 56, wrongChain: false },
    { targetChainId: 97, wrongChain: true },
  ])(
    "blocks incompatible contexts even when imperative fetch bypasses enabled: %j",
    async (ctx) => {
      const h = harness();
      const options = createMineBoardQuery(h.client, ctx);
      expect(options.enabled).toBe(false);
      await expect(
        h.cache.fetchQuery({ ...options, retry: false }),
      ).rejects.toThrow("context unavailable");
      expect(h.calls).toHaveLength(0);
      h.cache.clear();
    },
  );
  it("rejects transport chain mismatch before reading contracts", async () => {
    const h = harness();
    h.state.chain = "0x38";
    await expect(h.cache.fetchQuery(h.options())).rejects.toThrow(
      "RPC chain mismatch",
    );
    expect(h.calls.map((c) => c.method)).toEqual(["eth_chainId"]);
    h.cache.clear();
  });
  it("hides stale data after RPC failure or wrong chain, and recovers through invalidation", async () => {
    const h = harness();
    const old = await h.cache.fetchQuery(h.options());
    h.state.fail = true;
    await expect(
      h.cache.fetchQuery({ ...h.options(), staleTime: 0 }),
    ).rejects.toThrow();
    expect(
      mineBoardDisplay(
        { data: old, isPending: false, isError: true },
        context,
        true,
      ),
    ).toEqual({ status: "error" });
    expect(
      mineBoardDisplay(
        { data: old, isPending: false, isError: false },
        { ...context, wrongChain: true },
        true,
      ),
    ).toEqual({ status: "wrongChain" });
    h.state.fail = false;
    h.state.roundId += BigInt(1);
    await h.cache.invalidateQueries({ queryKey: mineReadKeys.all });
    const next = await h.cache.fetchQuery(h.options());
    expect(next.roundId).toBe(h.state.roundId);
    expect(next.roundId).not.toBe(old.roundId);
    expect(createMineBoardQuery(h.client, { ...context }).queryKey).toEqual(
      h.options().queryKey,
    );
    h.cache.clear();
  });
  it("cancels an unmounted in-flight snapshot instead of settling a late round", async () => {
    const h = harness();
    let release!: () => void;
    h.state.wait = new Promise((resolve) => {
      release = resolve;
    });
    const observer = new QueryObserver(h.cache, h.options());
    const stop = observer.subscribe(() => {});
    await vi.waitFor(() =>
      expect(h.calls.some((c) => c.functionName === "getRoundData")).toBe(true),
    );
    stop();
    release();
    await h.cache.cancelQueries({ queryKey: mineReadKeys.all });
    expect(h.cache.getQueryData(h.options().queryKey)).toBeUndefined();
    h.cache.clear();
  });
});

describe("Mine display safety", () => {
  it("does exact BNB conversion and truncates display only", () => {
    expect(mineAmount(BigInt(1))).toEqual({
      exact: "0.000000000000000001",
      text: "<0.0001",
    });
    expect(mineAmount(BigInt("900719925474099312345678901234567890"))).toEqual({
      exact: "900719925474099312.34567890123456789",
      text: "900,719,925,474,099,312.3456",
    });
    expect(mineAmount(BigInt(0))).toEqual({ exact: "0", text: "0" });
    expect(mineCount(BigInt("1200"))).toBe("1.2K");
    expect(mineCount(BigInt("9007199254740993123"))).toBe("9007199.2T");
  });
  it("distinguishes unavailable/loading/error from zero", () => {
    expect(
      mineBoardDisplay({ isPending: true, isError: false }, context, true),
    ).toEqual({ status: "loading" });
    expect(
      mineBoardDisplay({ isPending: false, isError: true }, context, true),
    ).toEqual({ status: "error" });
    expect(
      mineBoardDisplay(
        { isPending: false, isError: false },
        { ...context, targetChainId: 56 },
        true,
      ),
    ).toEqual({ status: "unavailable" });
    expect(
      mineBoardDisplay({ isPending: true, isError: false }, context, false),
    ).toEqual({ status: "unavailable" });
  });
});
