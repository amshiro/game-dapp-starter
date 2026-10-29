import { QueryClient } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
} from "viem";
import { bscTestnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createMineMotherlodeQuery } from "./mine-motherlode-query";

const context = { targetChainId: 97, wrongChain: false };
function harness(value: bigint, chain = "0x61") {
  const view = getContractsForChain(97).oreProtocolView;
  let reads = 0;
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          if (method === "eth_chainId") return chain;
          if (method !== "eth_call") throw Error("Only read RPC allowed");
          const [call] = params as [{ to: string; data: `0x${string}` }];
          expect(call.to.toLowerCase()).toBe(view.address.toLowerCase());
          expect(
            decodeFunctionData({ abi: view.abi, data: call.data }).functionName,
          ).toBe("getTreasuryState");
          reads++;
          return encodeFunctionResult({
            abi: view.abi,
            functionName: "getTreasuryState",
            result: [
              BigInt("1"),
              BigInt("2"),
              BigInt("3"),
              BigInt("4"),
              BigInt("5"),
              value,
            ],
          });
        },
      },
      { retryCount: 0 },
    ),
  });
  return { client, reads: () => reads, cache: new QueryClient() };
}
describe("ORI Motherlode public read", () => {
  it.each([
    BigInt("0"),
    BigInt("600000000000000000"),
    BigInt("9007199254740993123456789"),
  ])("reads the ORI pool losslessly: %s", async (value) => {
    const h = harness(value);
    expect(
      await h.cache.fetchQuery(createMineMotherlodeQuery(h.client, context)),
    ).toBe(value);
    expect(h.reads()).toBe(1);
    h.cache.clear();
  });
  it.each([
    { targetChainId: 56, wrongChain: false },
    { targetChainId: 97, wrongChain: true },
  ])("refuses disabled context even with imperative fetch", async (ctx) => {
    const h = harness(BigInt("1"));
    const options = createMineMotherlodeQuery(h.client, ctx);
    expect(options.enabled).toBe(false);
    await expect(
      h.cache.fetchQuery({ ...options, retry: false }),
    ).rejects.toThrow("context unavailable");
    expect(h.reads()).toBe(0);
    h.cache.clear();
  });
  it("refuses mismatched RPC", async () => {
    const h = harness(BigInt("1"), "0x38");
    await expect(
      h.cache.fetchQuery({
        ...createMineMotherlodeQuery(h.client, context),
        retry: false,
      }),
    ).rejects.toThrow("RPC mismatch");
    expect(h.reads()).toBe(0);
    h.cache.clear();
  });
});
