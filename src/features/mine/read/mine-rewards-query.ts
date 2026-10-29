import { queryOptions } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { ManualContext } from "../transaction/manual-transaction";
import type { MineRewardAmounts } from "../model/mine-rewards";
export type MineRewardsClient = Pick<
  PublicClient,
  "chain" | "getChainId" | "getBlock" | "readContract"
>;
export function createMineRewardsQuery(
  client: MineRewardsClient | undefined,
  context: ManualContext,
  minimumBlock?: bigint,
) {
  const contracts =
    context.targetChainId === 97 ? getContractsForChain(97) : undefined;
  const account = context.address;
  const enabled =
    !!contracts &&
    client?.chain?.id === 97 &&
    context.ready &&
    !context.wrongChain &&
    !!account;
  const queryKey = [
    "mine",
    "rewards",
    context.targetChainId,
    contracts?.oreProtocol.address.toLowerCase() ?? null,
    contracts?.oriToken.address.toLowerCase() ?? null,
    account?.toLowerCase() ?? null,
  ] as const;
  // minimumBlock pins a receipt-aware fresh read of the same resource; no second historical/server-state owner.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions({
    queryKey,
    enabled,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: false as const,
    queryFn: async ({ signal }): Promise<MineRewardAmounts> => {
      if (!enabled || !client || !contracts || !account)
        throw Error("Mine Rewards context unavailable");
      signal.throwIfAborted();
      if ((await client.getChainId()) !== 97)
        throw Error("Mine Rewards RPC mismatch");
      const block = await client.getBlock({ blockTag: "latest" });
      if (
        block.number === null ||
        (minimumBlock !== undefined && block.number < minimumBlock)
      )
        throw Error("Mine Rewards head unavailable");
      const [ethAmount, oriDirect, oriRefined] = await client.readContract({
        ...contracts.oreProtocol,
        functionName: "getUserRewards",
        args: [account],
        blockNumber: block.number,
      });
      signal.throwIfAborted();
      return { ethAmount, oriDirect, oriRefined };
    },
  });
}
