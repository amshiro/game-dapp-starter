"use client";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { createMineBoardQuery, type MineReadContext } from "./mine-read-query";
import { mineBoardDisplay } from "./mine-display";

export function useMineBoard(context: MineReadContext) {
  const client = usePublicClient({ chainId: context.targetChainId });
  const options = createMineBoardQuery(client, context);
  const query = useQuery(options);
  return {
    snapshot: query.data,
    display: mineBoardDisplay(query, context, !!client),
    refreshing: query.isFetching,
    canRefresh: options.enabled,
    refresh: () => {
      if (options.enabled) void query.refetch();
    },
  };
}
