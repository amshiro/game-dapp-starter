"use client";
import { mineRecoveryAction } from "../transaction/feedback";
import { useMineCopy } from "../copy";
import type { AutomationPresentation } from "../model/mine-presentation";
import type { MineAutoUI } from "../transaction/use-mine-auto";
import styles from "./mine.module.css";

/** Frame 4b runtime is driven by chain active, never by the currently selected tab or backend id. */
export function MineAutominerState({
  display = {},
  auto,
}: Readonly<{ display?: AutomationPresentation; auto?: MineAutoUI }>) {
  const copy = useMineCopy();
  const recovery = auto?.stateVisible
    ? mineRecoveryAction(auto.state)
    : undefined;
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
        disabled={!recovery && !auto?.canStop}
        onClick={recovery ? () => void auto?.retry() : auto?.stop}
      >
        {recovery
          ? copy.transaction[recovery]
          : auto?.busy
            ? copy.autoFlow.phases[auto.state.phase]
            : copy.stopAutominer}
      </button>
    </section>
  );
}
