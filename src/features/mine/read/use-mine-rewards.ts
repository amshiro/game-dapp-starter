"use client";
import { mineReadFreshness } from "./mine-freshness";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { ManualContext } from "../transaction/manual-transaction";
import {
  presentMineRewards,
  type MineRewardAmounts,
  type MineRewardsDisplay,
} from "../model/mine-rewards";
import { createMineRewardsQuery } from "./mine-rewards-query";
export function mineRewardsDisplay(
  query: Readonly<{
    data?: MineRewardAmounts;
    isError: boolean;
    isPending: boolean;
  }>,
  context: ManualContext,
  hasClient: boolean,
): MineRewardsDisplay {
  if (!context.address) return { status: "disconnected" };
  if (context.wrongChain) return { status: "wrong-chain" };
  if (context.targetChainId !== 97 || !hasClient || !context.ready)
    return { status: "unavailable" };
  // A failed refresh is not a zero balance. Never expose stale rewards from an unhealthy account/chain read.
  if (query.isError) return { status: "error" };
  if (query.isPending || !query.data) return { status: "loading" };
  return presentMineRewards(query.data);
}
export function useMineRewards(context: ManualContext) {
  const client = usePublicClient({ chainId: context.targetChainId });
  const options = createMineRewardsQuery(client, context);
  const query = useQuery({
    ...options,
    ...mineReadFreshness("rewards", options.enabled === true),
  });
  return {
    display: mineRewardsDisplay(query, context, !!client),
    refreshing: query.isFetching,
    canRefresh: options.enabled,
    refresh: () => {
      if (options.enabled === true) void query.refetch();
    },
  };
}
