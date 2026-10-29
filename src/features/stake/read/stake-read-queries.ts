import { queryOptions } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { StakeReadContext } from "./stake-read-context";

export type StakeReadClient = Pick<
  PublicClient,
  "chain" | "getChainId" | "readContract"
>;
export const stakeReadKeys = { all: ["stake", "principal-read"] as const };
// Runtime evidence confirms these units only on Development 97, not Production 56.
export const VERIFIED_STAKE_CHAIN = 97;
export const VERIFIED_ORI_DECIMALS = 18;

export function createStakeReadQueries(
  client: StakeReadClient | undefined,
  context: StakeReadContext,
  blockNumber?: bigint,
) {
  const contracts =
    context.targetChainId === VERIFIED_STAKE_CHAIN
      ? getContractsForChain(context.targetChainId)
      : undefined;
  const walletChainMatches =
    context.account.status !== "connected" ||
    context.account.chainId === context.targetChainId;
  const readable =
    walletChainMatches &&
    !!contracts &&
    client?.chain?.id === context.targetChainId &&
    context.account.status !== "wrong-chain" &&
    context.account.status !== "unavailable";
  const address =
    context.account.status === "connected" &&
    context.account.chainId === context.targetChainId
      ? context.account.address
      : undefined;
  const personalReadable = readable && address !== undefined;
  const base = [
    ...stakeReadKeys.all,
    context.targetChainId,
    contracts?.oriToken.address.toLowerCase() ?? null,
    contracts?.oreProtocolView.address.toLowerCase() ?? null,
  ] as const;

  async function read(
    signal: AbortSignal,
    enabled: boolean,
    run: () => Promise<bigint>,
  ) {
    // Query refetch() can bypass enabled; guard the operation itself as well.
    if (!enabled || !client) throw new Error("Stake read context unavailable");
    signal.throwIfAborted();
    if ((await client.getChainId()) !== context.targetChainId)
      throw new Error("Stake RPC chain mismatch");
    signal.throwIfAborted();
    const result = await run();
    // Viem's transport is not abortable here; consuming the signal prevents stale results from settling.
    signal.throwIfAborted();
    return result;
  }
  const policy = {
    staleTime: 30_000,
    retry: 1,
    refetchOnMount: "always" as const,
    refetchInterval: false as const,
  };
  // Keys already encode chain + Registry deployments + account. Client identity and enabled
  // guards are execution context, not serializable cache dimensions.
  return {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    available: queryOptions({
      ...policy,
      queryKey: [...base, "available", address?.toLowerCase() ?? null] as const,
      enabled: personalReadable,
      queryFn: ({ signal }) =>
        read(signal, personalReadable, async () => {
          if (!client || !contracts || !address)
            throw new Error("Stake account unavailable");
          return client.readContract({
            address: contracts.oriToken.address,
            abi: contracts.oriToken.abi,
            functionName: "balanceOf",
            args: [address],
            blockNumber,
          });
        }),
    }),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    staked: queryOptions({
      ...policy,
      queryKey: [...base, "staked", address?.toLowerCase() ?? null] as const,
      enabled: personalReadable,
      queryFn: ({ signal }) =>
        read(signal, personalReadable, async () => {
          if (!client || !contracts || !address)
            throw new Error("Stake account unavailable");
          const result = await client.readContract({
            address: contracts.oreProtocolView.address,
            abi: contracts.oreProtocolView.abi,
            functionName: "getStakeInfo",
            args: [address],
            blockNumber,
          });
          // pendingRewards is not proven immediately claimable ORI. Only the principal crosses this boundary.
          return result[0];
        }),
    }),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    total: queryOptions({
      ...policy,
      queryKey: [...base, "total"] as const,
      enabled: readable,
      queryFn: ({ signal }) =>
        read(signal, readable, async () => {
          if (!client || !contracts)
            throw new Error("Stake runtime unavailable");
          const result = await client.readContract({
            address: contracts.oreProtocolView.address,
            abi: contracts.oreProtocolView.abi,
            functionName: "getTreasuryState",
            blockNumber,
          });
          // stakeRewardsFactor/rewardDebt are accounting fields, never ordinary ORI amounts.
          return result[0];
        }),
    }),
  };
}
