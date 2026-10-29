"use client";
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
  const copy = useMineCopy().transaction;
  const state = manual.stateVisible ? manual.state : undefined;
  // The deployed-state notice belongs to the action button, never a second status block.
  if (
    !manual.busy &&
    !manual.error &&
    manual.hasDeployedThisRound &&
    (!state || state.phase === "idle")
  )
    return null;
  if (
    !state?.chainConfirmed &&
    (state?.error === "already-deployed-round" ||
      state?.error === "duplicate-cell")
  )
    return null;
  const message = state?.error
    ? copy.errors[state.error]
    : manual.error
      ? copy.errors[manual.error]
      : manual.busy && !manual.stateVisible
        ? copy.otherPending
        : state && state.phase !== "idle"
          ? copy.phases[state.phase]
          : manual.hasDeployedThisRound === undefined
            ? copy.accountUnavailable
            : copy.perCell;
  const quiet =
    !manual.busy &&
    !manual.error &&
    (manual.hasDeployedThisRound !== undefined ||
      manual.display.appearance === "disconnected") &&
    (!state || state.phase === "idle");
  return (
    <div className={quiet ? styles.boundary : styles.transactionStatus}>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {state?.chainConfirmed && <p>{copy.chainConfirmed}</p>}
      {state?.operationRound !== undefined && (
        <p>
          {copy.operationRound}: #{state.operationRound.toString()}
        </p>
      )}
      {state?.hash && (
        <p className={styles.txHash}>
          {copy.hash}: <code>{state.hash}</code>
        </p>
      )}
      {state &&
        (["refresh-failed", "verification-failed"].includes(state.phase) ||
          state.confirmationUnknown) && (
          <button type="button" onClick={() => void manual.retry()}>
            {state.confirmationUnknown
              ? copy.checkConfirmation
              : state.phase === "verification-failed"
                ? copy.retryVerification
                : copy.retryRefresh}
          </button>
        )}
    </div>
  );
}
