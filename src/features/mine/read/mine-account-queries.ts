import { queryOptions } from "@tanstack/react-query";
import type { Address } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { MineReadClient } from "./mine-read-query";
export type MineAccountContext = Readonly<{
  chainId: number;
  account?: Address;
  roundId?: bigint;
  enabled: boolean;
}>;
export function createMineAccountQueries(
  client: MineReadClient | undefined,
  context: MineAccountContext,
  blockNumber?: bigint,
) {
  const c = getContractsForChain(97),
    account = context.account,
    round = context.roundId;
  const enabled =
    context.enabled &&
    context.chainId === 97 &&
    client?.chain?.id === 97 &&
    !!account &&
    round !== undefined;
  const base = [
    "mine",
    "account",
    context.chainId,
    c.oreProtocol.address.toLowerCase(),
    c.oreProtocolView.address.toLowerCase(),
    round?.toString() ?? null,
    account?.toLowerCase() ?? null,
  ] as const;
  async function guard(signal: AbortSignal) {
    if (!enabled || !client || !account || round === undefined)
      throw Error("Mine account context unavailable");
    signal.throwIfAborted();
    if ((await client.getChainId()) !== 97)
      throw Error("Mine account RPC mismatch");
    return { client, account, round };
  }
  return {
    // base includes deployment/round/account; blockNumber pins a fresh read of the same resource.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    info: queryOptions({
      queryKey: [...base, "info"] as const,
      enabled,
      staleTime: 30_000,
      retry: 1,
      queryFn: async ({ signal }) => {
        const { client, account, round } = await guard(signal);
        const r = await client.readContract({
          ...c.oreProtocolView,
          functionName: "getMinerRoundInfo",
          args: [round, account],
          blockNumber,
        });
        signal.throwIfAborted();
        // Reward shares/bonus have no approved amount semantics; only principal and participation cross this boundary.
        return {
          checkpointed: r[0],
          hasParticipation: r[1],
          totalDeployed: r[2],
        };
      },
    }),
    // Same deployment-scoped resource; this is not a separate historical-block cache.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    squares: queryOptions({
      queryKey: [...base, "squares"] as const,
      enabled,
      staleTime: 30_000,
      retry: 1,
      queryFn: async ({ signal }) => {
        const { client, account, round } = await guard(signal);
        const r = await client.readContract({
          ...c.oreProtocolView,
          functionName: "getMinerSquares",
          args: [round, account],
          blockNumber,
        });
        signal.throwIfAborted();
        if (
          r[1].length !== r[2].length ||
          r[0] < BigInt(0) ||
          r[0] >= BigInt(1) << BigInt(25)
        )
          throw Error("Invalid Mine account squares");
        let mask = BigInt(0);
        for (const index of r[1]) {
          if (index < 0 || index >= 25 || mask & (BigInt(1) << BigInt(index)))
            throw Error("Invalid Mine square index");
          mask |= BigInt(1) << BigInt(index);
        }
        if (mask !== r[0]) throw Error("Mine account mask mismatch");
        return { mask: r[0], indices: r[1], amounts: r[2] };
      },
    }),
  };
}
