import { queryOptions } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { formatDecimal } from "../../../shared/lib/number/format-decimal";

type SupplyClient = Pick<PublicClient, "chain" | "getChainId" | "readContract">;
export function exploreSupplyQuery(
  client: SupplyClient | undefined,
  chainId: number,
) {
  const token =
    chainId === 97 ? getContractsForChain(chainId).oriToken : undefined;
  const enabled = !!token && client?.chain?.id === chainId;
  // Chain and deployment identify the data; client and enabled only guard execution.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions({
    queryKey: ["explore", "supply", chainId, token?.address ?? null],
    enabled,
    staleTime: 10_000,
    refetchInterval: 10_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      if (!enabled || !client || !token)
        throw Error("Explore supply unavailable");
      signal.throwIfAborted();
      if ((await client.getChainId()) !== chainId)
        throw Error("Explore RPC chain mismatch");
      signal.throwIfAborted();
      const amount = await client.readContract({
        address: token.address,
        abi: token.abi,
        functionName: "totalSupply",
      });
      signal.throwIfAborted();
      return formatDecimal(amount.toString(), {
        shift: -18,
        decimals: 2,
        pad: true,
        group: true,
      });
    },
  });
}
