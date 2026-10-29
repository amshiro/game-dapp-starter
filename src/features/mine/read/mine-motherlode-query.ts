import { queryOptions } from "@tanstack/react-query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { MineReadClient, MineReadContext } from "./mine-read-query";

/** Public ORI treasury pool, not an account's claimable reward. */
export function createMineMotherlodeQuery(
  client: MineReadClient | undefined,
  context: MineReadContext,
) {
  const contracts =
    context.targetChainId === 97 ? getContractsForChain(97) : undefined;
  const enabled =
    !!contracts && client?.chain?.id === 97 && !context.wrongChain;
  // Chain + View deployment identify this public resource; client/enabled only gate transport.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions({
    queryKey: [
      "mine",
      "motherlode",
      context.targetChainId,
      contracts?.oreProtocolView.address.toLowerCase() ?? null,
    ],
    enabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: async ({ signal }): Promise<bigint> => {
      if (!enabled || !client || !contracts)
        throw Error("Mine Motherlode context unavailable");
      signal.throwIfAborted();
      if ((await client.getChainId()) !== 97)
        throw Error("Mine Motherlode RPC mismatch");
      const treasury = await client.readContract({
        ...contracts.oreProtocolView,
        functionName: "getTreasuryState",
      });
      signal.throwIfAborted();
      // User confirmed ORI, 18 decimals; do not combine the historical Origin pool.
      return treasury[5];
    },
  });
}
