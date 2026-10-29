import { queryOptions } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";

export type MineReadClient = Pick<
  PublicClient,
  "chain" | "getChainId" | "getBlock" | "readContract"
>;
export type MineReadContext = Readonly<{
  targetChainId: number;
  wrongChain: boolean;
}>;
export type MineBoardSnapshot = Readonly<{
  blockNumber: bigint;
  roundId: bigint;
  totalDeployed: bigint;
  deployedPerSquare: readonly bigint[];
  minersPerSquare: readonly bigint[];
  transition: boolean;
  canDeploy?: boolean;
  live?: boolean;
  randomnessFulfilled?: boolean;
  winningSquare?: number;
  startBlock?: bigint;
  endBlock?: bigint;
  initialized: boolean;
}>;
export const mineReadKeys = { all: ["mine", "stored-board"] as const };

export function createMineBoardQuery(
  client: MineReadClient | undefined,
  context: MineReadContext,
  minimumBlock?: bigint,
) {
  // Only Development 97 has M1 runtime evidence; never fall back to an unverified deployment.
  const contracts =
    context.targetChainId === 97 ? getContractsForChain(97) : undefined;
  const enabled =
    !!contracts && client?.chain?.id === 97 && !context.wrongChain;
  const queryKey = [
    ...mineReadKeys.all,
    context.targetChainId,
    contracts?.oreProtocol.address.toLowerCase() ?? null,
    contracts?.oreProtocolView.address.toLowerCase() ?? null,
  ] as const;
  // This key names the latest atomic snapshot; future historical queries must also key by roundId.
  // Account is deliberately absent: this public snapshot does not belong to the connected wallet.
  // Future realtime events invalidate this owner as freshness signals, never replace its data.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions({
    queryKey,
    enabled,
    staleTime: 30_000,
    retry: 1,
    refetchOnMount: "always" as const,
    refetchInterval: false as const,
    queryFn: async ({ signal }): Promise<MineBoardSnapshot> => {
      // Imperative refetch/fetchQuery can bypass enabled; fail closed at the read boundary too.
      if (!enabled || !client || !contracts)
        throw new Error("Mine read context unavailable");
      signal.throwIfAborted();
      if ((await client.getChainId()) !== 97)
        throw new Error("Mine RPC chain mismatch");
      const block = await client.getBlock({ blockTag: "latest" });
      if (
        minimumBlock !== undefined &&
        block.number !== null &&
        block.number < minimumBlock
      )
        throw new Error("Mine RPC head predates receipt");
      if (block.number === null) throw new Error("Mine block unavailable");
      signal.throwIfAborted();
      const at = { blockNumber: block.number };
      const [board, current] = await Promise.all([
        client.readContract({
          ...contracts.oreProtocol,
          functionName: "board",
          ...at,
        }),
        client.readContract({
          ...contracts.oreProtocolView,
          functionName: "getCurrentRoundInfo",
          ...at,
        }),
      ]);
      signal.throwIfAborted();
      // Stored round identity is not automatically the next deployable round; never infer roundId + 1.
      const roundId = current[0];
      const round = await client.readContract({
        ...contracts.oreProtocolView,
        functionName: "getRoundData",
        args: [roundId],
        ...at,
      });
      signal.throwIfAborted();
      // Pin the entire snapshot, and refuse mismatched identity/amounts instead of mixing rounds.
      if (
        board[0] !== roundId ||
        round.id !== roundId ||
        round.totalDeployed !== current[3] ||
        round.startBlock !== current[1] ||
        round.endBlock !== current[2] ||
        round.deployedPerSquare.length !== 25 ||
        round.minersPerSquare.length !== 25
      )
        throw new Error("Inconsistent Mine snapshot");
      if (
        round.randomnessFulfilled &&
        (round.winningSquare < 0 || round.winningSquare >= 25)
      )
        throw new Error("Invalid fulfilled Mine result");
      return {
        startBlock: round.startBlock,
        endBlock: round.endBlock,
        // An unfulfilled default winner is never a verified result; keep it out of presentation.
        winningSquare: round.randomnessFulfilled
          ? round.winningSquare
          : undefined,
        canDeploy: current[4],
        live: board[6],
        randomnessFulfilled: round.randomnessFulfilled,
        initialized:
          roundId > BigInt(0) &&
          round.startBlock > BigInt(0) &&
          round.endBlock > round.startBlock,
        blockNumber: block.number,
        roundId,
        totalDeployed: current[3],
        deployedPerSquare: round.deployedPerSquare,
        minersPerSquare: round.minersPerSquare,
        // Presentation safety guard, not a new protocol enum or a canDeploy => active rule.
        transition:
          roundId === BigInt(0) ||
          round.startBlock === BigInt(0) ||
          round.endBlock <= block.number ||
          round.randomnessFulfilled,
      };
    },
  });
}
