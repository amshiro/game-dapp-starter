import { queryOptions } from "@tanstack/react-query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { StakeReadClient } from "./stake-read-queries";
import type { StakeReadContext } from "./stake-read-context";

export function createStakeAllowanceQuery(
  client: StakeReadClient | undefined,
  context: StakeReadContext,
  blockNumber?: bigint,
) {
  const c = getContractsForChain(97);
  const account =
    context.account.status === "connected" &&
    context.account.chainId === 97 &&
    context.targetChainId === 97
      ? context.account.address
      : undefined;
  const enabled = !!account && client?.chain?.id === 97;
  const key = [
    "stake",
    "allowance",
    context.targetChainId,
    c.oriToken.address.toLowerCase(),
    c.oreProtocol.address.toLowerCase(),
    account?.toLowerCase() ?? null,
  ] as const;
  // The key freezes chain + token + spender + owner; execution guards never substitute an old account.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions({
    queryKey: key,
    enabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      if (!enabled || !client || !account)
        throw new Error("Stake allowance unavailable");
      signal.throwIfAborted();
      if ((await client.getChainId()) !== 97)
        throw new Error("Stake RPC chain mismatch");
      const result = await client.readContract({
        address: c.oriToken.address,
        abi: c.oriToken.abi,
        functionName: "allowance",
        args: [account, c.oreProtocol.address],
        blockNumber,
      });
      signal.throwIfAborted();
      return result;
    },
  });
}
