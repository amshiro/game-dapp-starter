"use client";
import { useQuery } from "@tanstack/react-query";
import { createMineWinnersQuery } from "./mine-winners-query";
import type { MineBoardSnapshot } from "./mine-read-query";
import type { ManualContext } from "../transaction/manual-transaction";
import type { MineResultsDisplay } from "../model/mine-presentation";
export function useMineWinners(
  context: ManualContext,
  snapshot?: MineBoardSnapshot,
) {
  const options = createMineWinnersQuery(context, snapshot),
    query = useQuery(options);
  const roundId = snapshot?.roundId.toString();
  const display: MineResultsDisplay = !options.enabled
    ? { status: "unavailable" }
    : query.isError
      ? { status: "error", roundId }
      : query.isPending || !query.data
        ? { status: "loading", roundId }
        : query.data;
  return {
    display,
    refresh: () => {
      if (options.enabled) void query.refetch();
    },
    canRefresh: options.enabled,
  };
}
