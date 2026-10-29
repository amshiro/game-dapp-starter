"use client";
import { useToastFeedback } from "../../../shared/ui/toast/use-toast-feedback";
import { mineTerminalError } from "../transaction/feedback";
import { useMineCopy } from "../copy";
import type { MineManualUI } from "../transaction/use-mine-manual";
import styles from "./mine.module.css";

export type ManualPanelControls = Pick<
  MineManualUI,
  | "display"
  | "input"
  | "setInput"
  | "setShortcut"
  | "busy"
  | "canSubmit"
  | "submit"
  | "onConnect"
  | "state"
  | "stateVisible"
  | "error"
  | "retry"
  | "hasDeployedThisRound"
>;

export function MineManualStatus({
  manual,
}: Readonly<{ manual: ManualPanelControls }>) {
  const copy = useMineCopy();
  const message =
    manual.error === "invalid-amount"
      ? copy.transaction.errors[manual.error]
      : manual.display.appearance === "insufficient"
        ? copy.insufficient
        : undefined;
  return message ? (
    <div className={styles.transactionStatus}>
      <p className={styles.amountError} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  ) : null;
}

export function MineManualFeedback({
  manual,
}: Readonly<{ manual: ManualPanelControls }>) {
  const copy = useMineCopy().transaction;
  const state = manual.stateVisible ? manual.state : undefined;
  useToastFeedback(
    !state
      ? undefined
      : mineTerminalError(state)
        ? {
            key: state,
            type: "error",
            message: state.error
              ? copy.errors[state.error]
              : copy.phases[state.phase],
          }
        : state.phase === "success" && state.chainConfirmed
          ? { key: state, type: "success", message: copy.phases.success }
          : undefined,
  );
  return null;
}
