"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { createStakeReadQueries } from "./stake-read-queries";
import { principalDisplay } from "./stake-read-display";
import type { StakeReadContext } from "./stake-read-context";

export function useStakeReads(context: StakeReadContext) {
  const client = usePublicClient({ chainId: context.targetChainId });
  const options = createStakeReadQueries(client, context);
  const available = useQuery(options.available);
  const staked = useQuery(options.staked);
  const total = useQuery(options.total);
  const displayContext: StakeReadContext = client
    ? context
    : { ...context, account: { status: "unavailable" } };
  return {
    available: principalDisplay(available, displayContext, true),
    staked: principalDisplay(staked, displayContext, true),
    total: principalDisplay(total, displayContext, false),
    refreshing: available.isFetching || staked.isFetching || total.isFetching,
    canRefresh: !!client && options.total.enabled,
    refresh: () => {
      void Promise.allSettled([
        ...(options.available.enabled ? [available.refetch()] : []),
        ...(options.staked.enabled ? [staked.refetch()] : []),
        ...(options.total.enabled ? [total.refetch()] : []),
      ]);
    },
  };
}
