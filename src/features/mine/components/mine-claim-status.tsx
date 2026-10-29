"use client";
import { useMineCopy } from "../copy";
import type { MineClaimUI } from "../transaction/use-mine-claim";
import styles from "./mine.module.css";
export function MineClaimStatus({ claim }: Readonly<{ claim: MineClaimUI }>) {
  const copy = useMineCopy(),
    state = claim.state;
  if (!claim.stateVisible)
    return claim.busy ? (
      <p role="status">{copy.transaction.otherPending}</p>
    ) : null;
  if (state.phase === "idle") return null;
  const recover =
    state.confirmationUnknown ||
    ["verification-failed", "refresh-failed"].includes(state.phase);
  const ordinary =
    state.phase === "failed" &&
    !state.confirmationUnknown &&
    !state.chainConfirmed;
  return (
    <div className={styles.transactionStatus}>
      <p role="status" aria-live="polite">
        {ordinary
          ? copy.claimFlow.failure
          : state.confirmationUnknown
            ? copy.transaction.errors["confirmation-unknown"]
            : copy.claimFlow.phases[state.phase]}
      </p>
      {state.chainConfirmed && <p>{copy.transaction.chainConfirmed}</p>}
      {state.hash && (
        <p className={styles.txHash}>
          {copy.transaction.hash}: <code>{state.hash}</code>
        </p>
      )}
      {recover && (
        <button
          type="button"
          disabled={["preparing", "confirming", "refreshing"].includes(
            state.phase,
          )}
          onClick={() => void claim.retry()}
        >
          {state.confirmationUnknown
            ? copy.transaction.checkConfirmation
            : state.phase === "refresh-failed"
              ? copy.transaction.retryRefresh
              : copy.transaction.retryVerification}
        </button>
      )}
    </div>
  );
}
