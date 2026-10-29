"use client";
import { mineReadFreshness } from "./mine-freshness";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { createMineBoardQuery, type MineReadContext } from "./mine-read-query";
import { createMineMotherlodeQuery } from "./mine-motherlode-query";
import { mineBoardDisplay } from "./mine-display";

export function useMineBoard(context: MineReadContext) {
  const client = usePublicClient({ chainId: context.targetChainId });
  const options = createMineBoardQuery(client, context);
  const query = useQuery({
    ...options,
    ...mineReadFreshness("board", options.enabled === true),
  });
  const motherlodeOptions = createMineMotherlodeQuery(client, context);
  const motherlode = useQuery({
    ...motherlodeOptions,
    ...mineReadFreshness("motherlode", motherlodeOptions.enabled === true),
  });
  return {
    motherlodeOre:
      motherlodeOptions.enabled && !motherlode.isError
        ? motherlode.data
        : undefined,
    snapshot: query.data,
    display: mineBoardDisplay(query, context, !!client),
    refreshing: query.isFetching,
    canRefresh: options.enabled,
    refresh: () => {
      if (options.enabled === true) void query.refetch();
      if (motherlodeOptions.enabled === true) void motherlode.refetch();
    },
  };
}
