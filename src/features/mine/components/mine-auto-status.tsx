"use client";
import { useToastFeedback } from "../../../shared/ui/toast/use-toast-feedback";
import { mineTerminalError } from "../transaction/feedback";
import { useMineCopy } from "../copy";
import type { MineAutoUI } from "../transaction/use-mine-auto";
export function MineAutoStatus({ auto }: Readonly<{ auto: MineAutoUI }>) {
  const copy = useMineCopy(),
    state = auto.stateVisible ? auto.state : undefined;
  const errors = { ...copy.transaction.errors, ...copy.autoFlow.errors };
  const ordinaryFailure =
    state &&
    state.error !== "insufficient-native" &&
    !state.confirmationUnknown &&
    !state.chainConfirmed &&
    ["failed", "rejected"].includes(state.phase);
  useToastFeedback(
    !state
      ? undefined
      : mineTerminalError(state)
        ? {
            key: state,
            type: "error",
            message: ordinaryFailure
              ? copy.autoFlow.failure
              : state.error
                ? errors[state.error]
                : copy.autoFlow.phases[state.phase],
          }
        : state.phase === "success" && state.chainConfirmed
          ? {
              key: state,
              type: "success",
              message: copy.autoFlow.phases.success,
            }
          : undefined,
  );
  return null;
}
