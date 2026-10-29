import type { MineRewardsDisplay } from "./mine-rewards";
// These are Figma presentation variants, not a protocol state machine or transaction permissions.
export type MineCellVisual =
  | "default"
  | "selected"
  | "deployed"
  | "combined"
  | "auto-selected"
  | "auto-muted"
  | "winning"
  | "lost"
  | "waiting";
export type BettingMode = "manual" | "auto";
export type BettingPresentation = Readonly<{
  appearance:
    "unavailable" | "disconnected" | "no-selection" | "insufficient" | "ready";
  amount?: string;
  balance?: string;
  blocks?: string;
  rounds?: string;
  selectedBlocks?: string;
  totalPerRound?: string;
  total?: string;
}>;
export const unavailableBetting: BettingPresentation = {
  appearance: "unavailable",
};
export function bettingModeForKey(
  current: BettingMode,
  key: string,
): BettingMode | undefined {
  if (key === "Home") return "manual";
  if (key === "End") return "auto";
  if (key === "ArrowLeft" || key === "ArrowRight")
    return current === "manual" ? "auto" : "manual";
}

// Strings here are already formatted presentation values; no backend schema, payout formula or API mapping.
export type MineResultRow = Readonly<{
  id: string;
  addressText: string;
  amounts: readonly Readonly<{ text: string; unit: string }>[];
}>;
export type MineResultsDisplay =
  | Readonly<{
      status: "unavailable" | "empty" | "loading" | "error";
      roundId?: string;
    }>
  | Readonly<{
      status: "populated";
      roundId: string;
      rows: readonly MineResultRow[];
    }>;
export type AutomationPresentation = Readonly<{
  blocks?: string;
  roundsRemaining?: string;
  totalPerRound?: string;
}>;
/** Isolated Figma variations; production running/reward facts come from their query owners. */
export type MineActionPresentation =
  | Readonly<{ kind: "form"; betting?: BettingPresentation }>
  | Readonly<{
      kind: "autominer";
      automation: AutomationPresentation;
      rewards?: MineRewardsDisplay;
    }>;
