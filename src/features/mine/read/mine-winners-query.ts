import { queryOptions } from "@tanstack/react-query";
import {
  requestOriBackend,
  type OriBackendRequest,
} from "../../../shared/api/ori-backend";
import { readPublicConfig } from "../../../shared/config/public-config";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { mineWinnersDisplay, mineWinnersPath } from "../api/mine-winners";
import type { ManualContext } from "../transaction/manual-transaction";
import type { MineBoardSnapshot } from "./mine-read-query";
import type { MineResultsDisplay } from "../model/mine-presentation";
export function createMineWinnersQuery(
  context: ManualContext,
  snapshot?: MineBoardSnapshot,
  request: (options: OriBackendRequest) => Promise<unknown> = requestOriBackend,
  readConfig = readPublicConfig,
) {
  const account = context.ready ? context.address : undefined;
  const roundId = snapshot?.roundId;
  // Only a verified fulfilled result supplies the current result round. Never query storedRound +/- 1 or participants.
  const enabled =
    context.targetChainId === 97 &&
    !context.wrongChain &&
    !!snapshot?.initialized &&
    snapshot.randomnessFulfilled === true &&
    snapshot.winningSquare !== undefined &&
    snapshot.winningSquare >= 0 &&
    snapshot.winningSquare < 25 &&
    roundId !== undefined &&
    roundId > BigInt(0);
  let base: string | null = null;
  try {
    base = readConfig().apiBaseUrl ?? null;
  } catch {
    /* Query reports configuration failure through the normal API boundary. */
  }
  const queryKey = [
    "mine",
    "winners",
    context.targetChainId,
    getContractsForChain(97).oreProtocol.address.toLowerCase(),
    base,
    roundId?.toString() ?? null,
    account?.toLowerCase() ?? null,
  ] as const;
  // Key includes deployment, backend, result round and optional viewer; enabled/snapshot only gate the same resource.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions({
    queryKey,
    enabled,
    staleTime: 0,
    retry: 1,
    refetchOnMount: "always" as const,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: enabled ? 10_000 : false,
    refetchIntervalInBackground: false,
    queryFn: async ({ signal }): Promise<MineResultsDisplay> => {
      if (!enabled || roundId === undefined)
        throw Error("Mine winners context unavailable");
      signal.throwIfAborted();
      const response = await request({
        path: mineWinnersPath,
        form: { round_id: roundId.toString(), winner_address: account ?? "" },
        signal,
        readConfig,
      });
      signal.throwIfAborted();
      return mineWinnersDisplay(response, roundId, account);
    },
  });
}
