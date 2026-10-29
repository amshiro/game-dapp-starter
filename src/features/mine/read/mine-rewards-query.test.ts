import { QueryClient } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  zeroAddress,
  type Address,
} from "viem";
import { bscTestnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createMineRewardsQuery } from "./mine-rewards-query";
import { mineRewardsDisplay } from "./use-mine-rewards";
import { presentMineRewards } from "../model/mine-rewards";
const c = getContractsForChain(97),
  a: Address = "0x0000000000000000000000000000000000000001",
  b: Address = "0x0000000000000000000000000000000000000002";
const context = {
  address: a,
  targetChainId: 97,
  ready: true,
  wrongChain: false,
};
function harness() {
  const state = {
    fail: false,
    chain: "0x61",
    values: [
      BigInt(1),
      BigInt("9007199254740993000000000000000001"),
      BigInt(0),
    ] as readonly bigint[],
  };
  const calls: {
    method: string;
    target?: string;
    account?: string;
    block?: unknown;
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
          if (method === "eth_getBlockByNumber")
            return {
              number: "0x64",
              timestamp: "0x64",
              transactions: [],
              gasLimit: "0x1000000",
              gasUsed: "0x0",
              difficulty: "0x0",
              size: "0x0",
            };
          if (method !== "eth_call") throw Error("Non-read RPC prohibited");
          const [call, block] = params as [
            { to: string; data: `0x${string}` },
            string,
          ];
          const decoded = decodeFunctionData({
            abi: c.oreProtocol.abi,
            data: call.data,
          });
          if (decoded.functionName !== "getUserRewards")
            throw Error("Unexpected ABI method");
          calls.push({
            method,
            target: call.to,
            account: decoded.args[0],
            block,
          });
          if (state.fail) throw Error("Controlled reward read failure");
          return encodeFunctionResult({
            abi: c.oreProtocol.abi,
            functionName: "getUserRewards",
            result: state.values as readonly [bigint, bigint, bigint],
          });
        },
      },
      { retryCount: 0 },
    ),
  });
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return { state, calls, client, cache };
}
describe("Mine rewards query boundary", () => {
  it("reads one account's Protocol tuple at one block, preserving full bigint precision", async () => {
    const h = harness(),
      q = createMineRewardsQuery(h.client, context),
      data = await h.cache.fetchQuery(q);
    expect(q.queryKey).toContain(c.oreProtocol.address.toLowerCase());
    expect(q.queryKey).toContain(c.oriToken.address.toLowerCase());
    expect(q.queryKey).toContain(a.toLowerCase());
    expect(q.refetchInterval).toBe(false);
    expect(data.ethAmount).toBe(BigInt(1));
    expect(data.oriDirect).toBe(h.state.values[1]);
    expect(h.calls.filter((x) => x.method === "eth_call")).toEqual([
      {
        method: "eth_call",
        target: c.oreProtocol.address,
        account: a,
        block: "0x64",
      },
    ]);
    const display = presentMineRewards(data);
    expect(display.status).toBe("populated");
    if (display.status === "populated")
      expect(display.rows.map((r) => r.exact)).toEqual([
        "0.000000000000000001",
        "9007199254740993.000000000000000001",
      ]);
    h.cache.clear();
  });
  it.each([
    { ...context, address: undefined },
    { ...context, ready: false },
    { ...context, wrongChain: true },
    { ...context, targetChainId: 56 },
  ])("does not fetch disallowed context %j", async (ctx) => {
    const h = harness(),
      q = createMineRewardsQuery(h.client, ctx);
    expect(q.enabled).toBe(false);
    await expect(h.cache.fetchQuery({ ...q, retry: false })).rejects.toThrow(
      "context unavailable",
    );
    expect(h.calls).toHaveLength(0);
    h.cache.clear();
  });
  it("isolates accounts and rejects RPC chain/head mismatch", async () => {
    const h = harness(),
      qa = createMineRewardsQuery(h.client, context),
      qb = createMineRewardsQuery(h.client, { ...context, address: b });
    expect(qa.queryKey).not.toEqual(qb.queryKey);
    await h.cache.fetchQuery(qa);
    expect(h.cache.getQueryData(qb.queryKey)).toBeUndefined();
    await expect(
      h.cache.fetchQuery({
        ...createMineRewardsQuery(
          h.client,
          { ...context, address: b },
          BigInt(101),
        ),
        retry: false,
      }),
    ).rejects.toThrow("head unavailable");
    h.state.chain = "0x38";
    await expect(h.cache.fetchQuery({ ...qb, retry: false })).rejects.toThrow(
      "RPC mismatch",
    );
    h.cache.clear();
  });
  it("a zero tuple is success/empty, while an error hides stale positive data and read-only retry recovers", async () => {
    const h = harness(),
      q = createMineRewardsQuery(h.client, context),
      data = await h.cache.fetchQuery(q);
    expect(
      mineRewardsDisplay(
        { data, isError: true, isPending: false },
        context,
        true,
      ),
    ).toEqual({ status: "error" });
    h.state.fail = true;
    await expect(
      h.cache.fetchQuery({ ...q, staleTime: 0, retry: false }),
    ).rejects.toThrow();
    expect(
      mineRewardsDisplay(
        { data, isError: false, isPending: false },
        { ...context, wrongChain: true },
        true,
      ),
    ).toEqual({ status: "wrong-chain" });
    h.state.fail = false;
    h.state.values = [BigInt(0), BigInt(0), BigInt(0)];
    await h.cache.invalidateQueries({
      queryKey: q.queryKey,
      refetchType: "none",
    });
    const zero = await h.cache.fetchQuery({ ...q, staleTime: 0 });
    expect(
      mineRewardsDisplay(
        { data: zero, isError: false, isPending: false },
        context,
        true,
      ),
    ).toEqual({ status: "empty" });
    h.cache.clear();
  });
  it("models disconnected, initialization, loading and missing client independently from zero rewards", () => {
    const q = { isError: false, isPending: true };
    expect(
      mineRewardsDisplay(q, { ...context, address: undefined }, true).status,
    ).toBe("disconnected");
    expect(mineRewardsDisplay(q, context, true).status).toBe("loading");
    expect(
      mineRewardsDisplay(q, { ...context, ready: false }, true).status,
    ).toBe("unavailable");
    expect(mineRewardsDisplay(q, context, false).status).toBe("unavailable");
    expect(
      createMineRewardsQuery(undefined, { ...context, address: zeroAddress })
        .enabled,
    ).toBe(false);
  });
});
