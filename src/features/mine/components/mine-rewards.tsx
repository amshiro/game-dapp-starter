"use client";
import { mineRecoveryAction } from "../transaction/feedback";
import { mineAmount } from "../read/mine-display";
import { useId } from "react";
import { useMineCopy } from "../copy";
import type { MineRewardsDisplay } from "../model/mine-rewards";
import type { MineClaimUI } from "../transaction/use-mine-claim";
import styles from "./mine.module.css";
export function MineRewardState({
  display,
  onRetry,
  claim,
}: Readonly<{
  display?: MineRewardsDisplay;
  onRetry?: () => void;
  claim?: MineClaimUI;
}>) {
  const copy = useMineCopy(),
    id = useId();
  const recovery = claim?.stateVisible
    ? mineRecoveryAction(claim.state)
    : undefined;
  const pendingKind =
    claim?.stateVisible && claim.busy ? claim.state.operation?.kind : undefined;
  // Keep the original action reachable even when confirmed claims have already zeroed reward reads.
  if (claim && pendingKind && (!display || display.status !== "populated")) {
    return (
      <section className={styles.rewardState} aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`}>{copy.rewards}</h2>
        <div className={styles.rewardCard} data-layout="compact">
          <button
            type="button"
            className={styles.claimVisual}
            data-claim-method={pendingKind}
            disabled={!recovery}
            onClick={() => void claim?.retry()}
          >
            {recovery
              ? copy.transaction[recovery]
              : copy.claimFlow.phases[claim.state.phase]}
          </button>
        </div>
      </section>
    );
  }
  if (
    !display ||
    display.status === "empty" ||
    display.status === "disconnected"
  )
    return null;
  if (display.status !== "populated") {
    const message =
      display.status === "wrong-chain"
        ? copy.wrongChain
        : display.status === "unavailable"
          ? copy.unavailable
          : copy[display.status];
    return (
      <div className={styles.rewardState}>
        <p className={styles.notice} role="status" aria-live="polite">
          {copy.rewards} · {message}
        </p>
        {display.status === "error" && onRetry && (
          <button type="button" className={styles.refresh} onClick={onRetry}>
            {copy.refresh}
          </button>
        )}
      </div>
    );
  }
  return (
    <section className={styles.rewardState} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{copy.rewards}</h2>
      <div
        className={styles.rewardCard}
        data-layout={
          display.rows.length === 3 &&
          display.showClaimAll &&
          display.showClaimEth
            ? "complete"
            : "compact"
        }
      >
        <dl>
          {display.rows.map((row) => (
            <div key={row.field}>
              <dt>
                {copy[row.label]}
                {/* The current Figma info mark is decorative; no unapproved reward/fee tooltip copy. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ori/mine/info.svg" width={12} height={12} alt="" />
              </dt>
              <dd
                className={styles.rewardValue}
                aria-label={`${row.exact} ${row.asset}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    row.asset === "BNB"
                      ? "/ori/mine/reward-bnb.svg"
                      : "/ori/explore/ori-token.png"
                  }
                  width={14}
                  height={14}
                  alt=""
                />
                <span>{mineAmount(row.raw, 6).text}</span>
              </dd>
            </div>
          ))}
        </dl>
        {/* Eligibility never replaces the runtime fresh read + simulation before signing. */}
        {(display.showClaimAll || pendingKind === "claimAll") && (
          <button
            type="button"
            className={styles.claimVisual}
            data-claim-method="claimAll"
            disabled={
              !(recovery && pendingKind === "claimAll") && !claim?.canClaimAll
            }
            onClick={() =>
              recovery ? void claim?.retry() : claim?.submit("claimAll")
            }
            aria-describedby={!claim ? `${id}-readonly` : undefined}
            title={!claim ? copy.rewardsReadOnly : undefined}
          >
            {recovery && pendingKind === "claimAll"
              ? copy.transaction[recovery]
              : claim?.busy &&
                  claim.stateVisible &&
                  claim.state.operation?.kind === "claimAll"
                ? copy.claimFlow.phases[claim.state.phase]
                : copy.claim}
          </button>
        )}
        {(display.showClaimEth || pendingKind === "claimEth") && (
          <button
            type="button"
            className={styles.claimSecondary}
            data-claim-method="claimEth"
            disabled={
              !(recovery && pendingKind === "claimEth") && !claim?.canClaimEth
            }
            onClick={() =>
              recovery ? void claim?.retry() : claim?.submit("claimEth")
            }
            aria-describedby={!claim ? `${id}-readonly` : undefined}
            title={!claim ? copy.rewardsReadOnly : undefined}
          >
            {recovery && pendingKind === "claimEth"
              ? copy.transaction[recovery]
              : claim?.busy &&
                  claim.stateVisible &&
                  claim.state.operation?.kind === "claimEth"
                ? copy.claimFlow.phases[claim.state.phase]
                : copy.claimOnly}
          </button>
        )}
        {!claim && (
          <span id={`${id}-readonly`} className="sr-only">
            {copy.rewardsReadOnly}
          </span>
        )}
      </div>
    </section>
  );
}
