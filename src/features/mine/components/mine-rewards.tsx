"use client";
import { useId } from "react";
import { useMineCopy } from "../copy";
import type { MineRewardsDisplay } from "../model/mine-rewards";
import styles from "./mine.module.css";
export function MineRewardState({
  display,
  onRetry,
}: Readonly<{ display?: MineRewardsDisplay; onRetry?: () => void }>) {
  const copy = useMineCopy(),
    id = useId();
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
                title={`${row.exact} ${row.asset}`}
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
                <span>{row.exact}</span>
              </dd>
            </div>
          ))}
        </dl>
        {/* M5 defines entry visibility only. Claim writes, tax/window semantics and signing remain M6. */}
        {display.showClaimAll && (
          <button
            type="button"
            className={styles.claimVisual}
            data-claim-method="claimAll"
            disabled
            aria-describedby={`${id}-readonly`}
            title={copy.rewardsReadOnly}
          >
            {copy.claim}
          </button>
        )}
        {display.showClaimEth && (
          <button
            type="button"
            className={styles.claimSecondary}
            data-claim-method="claimEth"
            disabled
            aria-describedby={`${id}-readonly`}
            title={copy.rewardsReadOnly}
          >
            {copy.claimOnly}
          </button>
        )}
        <span id={`${id}-readonly`} className="sr-only">
          {copy.rewardsReadOnly}
        </span>
      </div>
    </section>
  );
}
