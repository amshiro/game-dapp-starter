import { manualError, type ManualError } from "./manual-errors";
import type { MineRewardAmounts } from "../model/mine-rewards";
export type ClaimKind = "claimAll" | "claimEth";
export type ClaimError =
  ManualError | "nothing-to-claim" | "claim-window-passed";
export class ClaimFault extends Error {
  constructor(public readonly kind: ClaimError) {
    super(kind);
  }
}
export function claimError(error: unknown): ClaimError {
  if (error instanceof ClaimFault) return error.kind;
  const seen = new Set<unknown>();
  let e = error;
  while (e && typeof e === "object" && !seen.has(e)) {
    seen.add(e);
    const x = e as { data?: { errorName?: string }; cause?: unknown };
    if (x.data?.errorName === "NothingToClaim") return "nothing-to-claim";
    if (x.data?.errorName === "ClaimWindowPassed") return "claim-window-passed";
    e = x.cause;
  }
  return manualError(error);
}
export function hasClaimReward(kind: ClaimKind, rewards: MineRewardAmounts) {
  return kind === "claimEth"
    ? rewards.ethAmount > BigInt(0)
    : rewards.oriDirect > BigInt(0) || rewards.oriRefined > BigInt(0);
}
