"use client";
import { useMineCopy } from "../copy";
import type { MineAutoUI } from "../transaction/use-mine-auto";
import styles from "./mine.module.css";
export function MineAutoStatus({ auto }: Readonly<{ auto: MineAutoUI }>) {
  const copy = useMineCopy(),
    state = auto.stateVisible ? auto.state : undefined;
  if (!state || state.phase === "idle")
    return auto.busy ? (
      <p role="status">{copy.transaction.otherPending}</p>
    ) : null;
  const errors = { ...copy.transaction.errors, ...copy.autoFlow.errors };
  // Confirmation uncertainty and confirmed verification/refresh failures retain recovery semantics.
  // Ordinary failures use one public message; decoded categories remain in the operation owner.
  const ordinaryFailure =
    !state.confirmationUnknown &&
    !state.chainConfirmed &&
    (state.phase === "failed" || state.phase === "rejected");
  return (
    <div className={styles.transactionStatus}>
      <p role="status" aria-live="polite">
        {ordinaryFailure
          ? copy.autoFlow.failure
          : state.error
            ? errors[state.error]
            : copy.autoFlow.phases[state.phase]}
      </p>
      {state.chainConfirmed && <p>{copy.transaction.chainConfirmed}</p>}
      {state.hash && (
        <p className={styles.txHash}>
          {copy.transaction.hash}: <code>{state.hash}</code>
        </p>
      )}
      {(state.confirmationUnknown ||
        ["refresh-failed", "verification-failed"].includes(state.phase)) && (
        <button type="button" onClick={() => void auto.retry()}>
          {state.confirmationUnknown
            ? copy.transaction.checkConfirmation
            : copy.transaction.retryVerification}
        </button>
      )}
    </div>
  );
}
