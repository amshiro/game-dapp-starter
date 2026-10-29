"use client";
import { useToastFeedback } from "../../../shared/ui/toast/use-toast-feedback";
import { mineTerminalError } from "../transaction/feedback";
import { useMineCopy } from "../copy";
import type { MineClaimUI } from "../transaction/use-mine-claim";
export function MineClaimStatus({ claim }: Readonly<{ claim: MineClaimUI }>) {
  const copy = useMineCopy(),
    state = claim.stateVisible ? claim.state : undefined;
  useToastFeedback(
    !state
      ? undefined
      : mineTerminalError(state)
        ? {
            key: state,
            type: "error",
            message: state.confirmationUnknown
              ? copy.transaction.errors["confirmation-unknown"]
              : state.phase === "failed" && !state.chainConfirmed
                ? copy.claimFlow.failure
                : copy.claimFlow.phases[state.phase],
          }
        : state.phase === "success" && state.chainConfirmed
          ? {
              key: state,
              type: "success",
              message: copy.claimFlow.phases.success,
            }
          : undefined,
  );
  return null;
}
