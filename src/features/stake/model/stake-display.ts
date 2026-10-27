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

// Display text only; decimals, APR semantics and canonical sources belong to the future Data Slice.
export type StakeReadValue =
  | Readonly<{ status: "unavailable" | "loading" | "error" | "empty" }>
  | Readonly<{ status: "populated"; text: string }>;
export type StakeSummaryDisplay = Readonly<
  Record<"totalDeposit" | "apr" | "tvl", StakeReadValue>
>;
export const unavailableStakeSummary: StakeSummaryDisplay = {
  totalDeposit: { status: "unavailable" },
  apr: { status: "unavailable" },
  tvl: { status: "unavailable" },
};
