"use client";
import { MineCell } from "./components/mine-cell";
import { useMineCopy } from "./copy";
import { type MineBoardDisplay } from "./read/mine-display";
import { MineBettingPanel } from "./components/mine-betting-panel";
import { MineResults } from "./components/mine-results";
import { MineMetrics } from "./components/mine-metrics";
import {
  MineAutominerState,
  MineRewardState,
} from "./components/mine-automation-state";
import type {
  MineActionPresentation,
  MineResultsDisplay,
  MineCellVisual,
} from "./model/mine-presentation";
import styles from "./components/mine.module.css";

export function MinePage({
  display = { status: "unavailable" },
  onRefresh,
  refreshing = false,
  actionPresentation,
  results,
  cellPresentation,
}: Readonly<{
  display?: MineBoardDisplay;
  onRefresh?: () => void;
  refreshing?: boolean;
  actionPresentation?: MineActionPresentation;
  results?: MineResultsDisplay;
  cellPresentation?: Readonly<
    Partial<Record<number, { visual: MineCellVisual; ownAmount?: bigint }>>
  >;
}>) {
  const copy = useMineCopy();
  const snapshot =
    display.status === "populated" ? display.snapshot : undefined;
  const round = snapshot?.roundId.toString() ?? "—";
  // Figma example values are visual placeholders only; never use them as runtime business data.
  const message =
    display.status === "populated"
      ? snapshot?.transition
        ? copy.waiting
        : copy.unavailable
      : copy[display.status];
  return (
    <section className={styles.page} aria-labelledby="mine-title">
      <h1 id="mine-title" className="sr-only">
        {copy.title}
      </h1>
      <div className={styles.toolbar}>
        <span className={styles.round}>
          {copy.storedRound}: #{round}
        </span>
        <button
          type="button"
          className={styles.refresh}
          disabled={!onRefresh || refreshing}
          onClick={onRefresh}
        >
          {refreshing ? copy.loading : copy.refresh}
        </button>
      </div>
      <MineMetrics
        roundId={snapshot?.roundId.toString()}
        totalDeployed={snapshot?.totalDeployed}
        waiting={snapshot?.transition}
      />
      <p className={styles.notice} role="status" aria-live="polite">
        {message} · {copy.readOnly}
      </p>
      {/* Q-18/Q-19 are open: cells expose no selection interaction, even when the wallet is connected. */}
      <ol
        className={styles.board}
        aria-label={`${copy.board} · BNB`}
        aria-busy={display.status === "loading"}
      >
        {Array.from({ length: 25 }, (_, index) => (
          <MineCell
            key={index}
            index={index}
            visual={cellPresentation?.[index]?.visual}
            ownAmount={cellPresentation?.[index]?.ownAmount}
            amount={snapshot?.deployedPerSquare[index]}
            miners={snapshot?.minersPerSquare[index]}
          />
        ))}
      </ol>
      {/* Figma state != approved runtime state. The formal read owner supplies only form/unavailable. */}
      {actionPresentation?.kind === "autominer" ? (
        <>
          <MineAutominerState display={actionPresentation.automation} />
          {actionPresentation.rewards && (
            <MineRewardState display={actionPresentation.rewards} />
          )}
        </>
      ) : (
        <MineBettingPanel display={actionPresentation?.betting} />
      )}
      <MineResults display={results} />
    </section>
  );
}
