/** Recovery is offered only at a stopped state; active confirmation/refresh stays locked. */
export function mineRecoveryAction(
  state: Readonly<{ phase: string; confirmationUnknown?: boolean }>,
) {
  if (state.phase === "failed" && state.confirmationUnknown)
    return "checkConfirmation" as const;
  if (state.phase === "verification-failed")
    return "retryVerification" as const;
  if (state.phase === "refresh-failed") return "retryRefresh" as const;
  return undefined;
}
export function mineTerminalError(state: Readonly<{ phase: string }>) {
  return [
    "failed",
    "rejected",
    "verification-failed",
    "refresh-failed",
  ].includes(state.phase);
}
