export type StakeMode = "deposit" | "withdraw";
export const stakeModes = ["deposit", "withdraw"] as const;

/** Local tab navigation only: mode changes never initiate a wallet or funds action. */
export function modeForKey(
  mode: StakeMode,
  key: string,
): StakeMode | undefined {
  if (key === "Home") return "deposit";
  if (key === "End") return "withdraw";
  if (key === "ArrowLeft" || key === "ArrowRight")
    return mode === "deposit" ? "withdraw" : "deposit";
  return undefined;
}

// Principal reads retain exact source values; unapproved APR/reward semantics remain unavailable.
export type StakeReadValue =
  | Readonly<{
      status:
        | "unavailable"
        | "loading"
        | "error"
        | "empty"
        | "disconnected"
        | "wrongChain";
    }>
  | Readonly<{
      status: "populated";
      text: string;
      exact?: string;
      raw?: bigint;
    }>;
export type StakeSummaryDisplay = Readonly<
  Record<"totalDeposit" | "apr" | "tvl", StakeReadValue>
>;
export const unavailableStakeSummary: StakeSummaryDisplay = {
  totalDeposit: { status: "unavailable" },
  apr: { status: "unavailable" },
  tvl: { status: "unavailable" },
};
