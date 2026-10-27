import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  type Address,
} from "viem";
import { bscTestnet } from "viem/chains";
import { describe, expect, it, vi } from "vitest";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createStakeReadQueries, stakeReadKeys } from "./stake-read-queries";
import { principalDisplay } from "./stake-read-display";
import type { StakeReadContext } from "./stake-read-context";

const alice: Address = "0x0000000000000000000000000000000000000001";
const bob: Address = "0x0000000000000000000000000000000000000002";
const connected = (address = alice): StakeReadContext => ({
  targetChainId: 97,
  account: { status: "connected", address, chainId: 97 },
});
const contracts = getContractsForChain(97);
function harness() {
  const calls: string[] = [];
  const state = {
    chain: "0x61",
    balance: BigInt("6527156351833573905102"),
    failBalance: false,
    wait: Promise.resolve(),
  };
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          calls.push(method);
          if (method === "eth_chainId") return state.chain;
          if (method !== "eth_call") throw new Error("Unexpected non-read RPC");
          const [call] = params as [{ to: string; data: `0x${string}` }];
          await state.wait;
          if (
            call.to.toLowerCase() === contracts.oriToken.address.toLowerCase()
          ) {
            const decoded = decodeFunctionData({
              abi: contracts.oriToken.abi,
              data: call.data,
            });
            expect(decoded.functionName).toBe("balanceOf");
            if (state.failBalance)
              throw new Error("Controlled provider failure");
            return encodeFunctionResult({
              abi: contracts.oriToken.abi,
              functionName: "balanceOf",
              result: decoded.args?.[0] === bob ? BigInt("2") : state.balance,
            });
          }
          expect(call.to.toLowerCase()).toBe(
            contracts.oreProtocolView.address.toLowerCase(),
          );
          const decoded = decodeFunctionData({
            abi: contracts.oreProtocolView.abi,
            data: call.data,
          });
          if (decoded.functionName === "getStakeInfo")
            return encodeFunctionResult({
              abi: contracts.oreProtocolView.abi,
              functionName: "getStakeInfo",
              result: [BigInt("3"), BigInt("999"), BigInt("888"), 0],
            });
          expect(decoded.functionName).toBe("getTreasuryState");
          return encodeFunctionResult({
            abi: contracts.oreProtocolView.abi,
            functionName: "getTreasuryState",
            result: [
              BigInt("1000999800000000000000"),
              BigInt("99"),
              BigInt("88"),
              BigInt("77"),
              BigInt("66"),
              BigInt("55"),
            ],
          });
        },
      },
      { retryCount: 0 },
    ),
  });
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return { client, cache, calls, state };
}

describe("Stake principal read boundary", () => {
  it("decodes all three canonical reads with Registry ABIs and retains only bigint principal", async () => {
    const { client, cache, calls } = harness();
    const reads = createStakeReadQueries(client, connected());
    const result = await Promise.all([
      cache.fetchQuery(reads.available),
      cache.fetchQuery(reads.staked),
      cache.fetchQuery(reads.total),
    ]);
    expect(result).toEqual([
      BigInt("6527156351833573905102"),
      BigInt("3"),
      BigInt("1000999800000000000000"),
    ]);
    expect(new Set(calls)).toEqual(new Set(["eth_chainId", "eth_call"]));
    cache.clear();
  });
  it.each(["disconnected", "loading"] as const)(
    "%s disables personal reads but permits public total",
    async (status) => {
      const { client, cache, calls } = harness();
      const reads = createStakeReadQueries(client, {
        targetChainId: 97,
        account: { status },
      });
      expect(reads.available.enabled).toBe(false);
      expect(reads.staked.enabled).toBe(false);
      await expect(
        cache.fetchQuery({ ...reads.available, retry: false }),
      ).rejects.toThrow("context unavailable");
      expect(calls).toHaveLength(0);
      expect(await cache.fetchQuery(reads.total)).toBe(
        BigInt("1000999800000000000000"),
      );
      cache.clear();
    },
  );
  it.each([
    { targetChainId: 56, account: { status: "disconnected" } },
    { targetChainId: 97, account: { status: "wrong-chain" } },
    {
      targetChainId: 97,
      account: { status: "connected", address: alice, chainId: 56 },
    },
    { targetChainId: 97, account: { status: "unavailable" } },
  ] satisfies StakeReadContext[])(
    "guards unsupported/mismatched contexts even against imperative refetch: %j",
    async (context) => {
      const { client, cache, calls } = harness();
      const reads = createStakeReadQueries(client, context);
      expect(Object.values(reads).every((read) => read.enabled === false)).toBe(
        true,
      );
      await expect(
        cache.fetchQuery({ ...reads.available, retry: false }),
      ).rejects.toThrow("context unavailable");
      await expect(
        cache.fetchQuery({ ...reads.staked, retry: false }),
      ).rejects.toThrow("context unavailable");
      await expect(
        cache.fetchQuery({ ...reads.total, retry: false }),
      ).rejects.toThrow("context unavailable");
      expect(calls).toHaveLength(0);
      cache.clear();
    },
  );
  it("refuses a configured transport that actually returns the wrong chain", async () => {
    const { client, cache, state, calls } = harness();
    state.chain = "0x38";
    await expect(
      cache.fetchQuery({
        ...createStakeReadQueries(client, connected()).total,
        retry: false,
      }),
    ).rejects.toThrow("RPC chain mismatch");
    expect(calls).toEqual(["eth_chainId"]);
    cache.clear();
  });
  it("isolates accounts, keeps failures local, and supports invalidation/refetch recovery", async () => {
    const { client, cache, state } = harness();
    const first = createStakeReadQueries(client, connected());
    const second = createStakeReadQueries(client, connected(bob));
    expect(first.available.queryKey).not.toEqual(second.available.queryKey);
    expect(first.total.queryKey).toEqual(second.total.queryKey);
    await cache.fetchQuery(first.available);
    expect(cache.getQueryData(second.available.queryKey)).toBeUndefined();
    expect(await cache.fetchQuery(second.available)).toBe(BigInt("2"));
    state.failBalance = true;
    await expect(
      cache.fetchQuery({ ...first.available, staleTime: 0, retry: false }),
    ).rejects.toThrow();
    expect(await cache.fetchQuery(first.total)).toBe(
      BigInt("1000999800000000000000"),
    );
    const failed = cache.getQueryState(first.available.queryKey)!;
    expect(
      principalDisplay(
        {
          data: failed.data,
          isError: failed.status === "error",
          isPending: false,
        },
        connected(),
        true,
      ),
    ).toEqual({ status: "error" });
    state.failBalance = false;
    state.balance = BigInt("42");
    await cache.invalidateQueries({ queryKey: stakeReadKeys.all });
    expect(await cache.fetchQuery(first.available)).toBe(BigInt("42"));
    cache.clear();
  });
  it("cancels old in-flight account reads when their observer unmounts", async () => {
    const { client, cache, state, calls } = harness();
    let release!: () => void;
    state.wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const reads = createStakeReadQueries(client, connected());
    const observer = new QueryObserver(cache, reads.available);
    const unsubscribe = observer.subscribe(() => {});
    await vi.waitFor(() => expect(calls).toContain("eth_call"));
    unsubscribe();
    release();
    await cache.cancelQueries({ queryKey: reads.available.queryKey });
    expect(cache.getQueryData(reads.available.queryKey)).toBeUndefined();
    cache.clear();
  });
});

describe("Stake exact display and readiness", () => {
  const success = {
    data: BigInt("6527156351833573905102"),
    isPending: false,
    isError: false,
  };
  it("uses exact 18-decimal strings and bigint without floating point", () => {
    expect(principalDisplay(success, connected(), true)).toEqual({
      status: "populated",
      text: "6527.156351",
      exact: "6527.156351833573905102",
      raw: success.data,
    });
    expect(
      principalDisplay({ ...success, data: BigInt("0") }, connected(), true),
    ).toMatchObject({
      status: "populated",
      text: "0",
      exact: "0",
      raw: BigInt("0"),
    });
    expect(
      principalDisplay({ ...success, data: BigInt(1) }, connected(), true),
    ).toMatchObject({ text: "<0.000001", exact: "0.000000000000000001" });
    expect(
      principalDisplay(
        { ...success, data: BigInt("900719925474099312345123456789123456789") },
        connected(),
        true,
      ),
    ).toMatchObject({
      text: "900719925474099312345.123456",
      exact: "900719925474099312345.123456789123456789",
    });
  });
  it("hides cached values immediately on account loss or chain mismatch", () => {
    expect(
      principalDisplay(
        success,
        { targetChainId: 97, account: { status: "disconnected" } },
        true,
      ),
    ).toEqual({ status: "disconnected" });
    expect(
      principalDisplay(
        success,
        { targetChainId: 97, account: { status: "wrong-chain" } },
        false,
      ),
    ).toEqual({ status: "wrongChain" });
    expect(
      principalDisplay(
        success,
        { targetChainId: 56, account: { status: "disconnected" } },
        false,
      ),
    ).toEqual({ status: "unavailable" });
  });
  it("distinguishes initialization and errors from a real zero", () => {
    expect(
      principalDisplay({ ...success, isError: true }, connected(), true),
    ).toEqual({ status: "error" });
    expect(
      principalDisplay(
        { ...success, data: undefined, isPending: true },
        connected(),
        true,
      ),
    ).toEqual({ status: "loading" });
    expect(
      principalDisplay(
        success,
        { targetChainId: 97, account: { status: "loading" } },
        true,
      ),
    ).toEqual({ status: "loading" });
  });
});
