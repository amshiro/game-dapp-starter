"use client";
import { useMineCopy } from "../copy";
import type {
  AutomationPresentation,
  RewardPresentation,
} from "../model/mine-presentation";
import type { MineAutoUI } from "../transaction/use-mine-auto";
import styles from "./mine.module.css";

/** Frame 4b runtime is driven by chain active, never by the currently selected tab or backend id. */
export function MineAutominerState({
  display = {},
  auto,
}: Readonly<{ display?: AutomationPresentation; auto?: MineAutoUI }>) {
  const copy = useMineCopy();
  return (
    <section className={styles.autominer} aria-label={copy.autominer}>
      <h2>{copy.autominer}</h2>
      <dl className={styles.betSummary}>
        <div>
          <dt>{copy.blocks}</dt>
          <dd>
            {auto?.running?.random ? `${copy.autoFlow.random} ` : ""}
            {display.blocks ?? "—"}
          </dd>
        </div>
        <div>
          <dt>{copy.roundsRemaining}</dt>
          <dd>{display.roundsRemaining ?? ""}</dd>
        </div>
        <div>
          <dt>{copy.totalPerRound}</dt>
          <dd>{display.totalPerRound ?? "—"} BNB</dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.deployAction}
        data-appearance="ready"
        disabled={!auto?.canStop}
        onClick={auto?.stop}
      >
        {auto?.busy
          ? copy.autoFlow.phases[auto.state.phase]
          : copy.stopAutominer}
      </button>
    </section>
  );
}

/** Isolated frame 4b shell, not M5 reward integration. No claimable labels, asset guesses, handlers or reads. */
export function MineRewardState({
  display = {},
}: Readonly<{ display?: RewardPresentation }>) {
  const copy = useMineCopy();
  return (
    <section className={styles.rewardState} aria-label={copy.rewards}>
      <h2>{copy.rewards}</h2>
      <div className={styles.rewardCard}>
        <dl>
          {(
            [
              [copy.rewardAsset, display.direct],
              [copy.unrefined, display.unrefined],
              [copy.refined, display.refined],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt>
                {label}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ori/mine/info.svg" width={12} height={12} alt="" />
              </dt>
              <dd>{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className={styles.claimVisual} disabled>
          {copy.claim}
        </button>
        <button type="button" className={styles.claimSecondary} disabled>
          {copy.claimOnly}
        </button>
      </div>
    </section>
  );
}
