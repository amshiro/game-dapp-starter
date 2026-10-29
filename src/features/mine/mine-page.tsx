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
import type { MineManualUI } from "./transaction/use-mine-manual";
import styles from "./components/mine.module.css";

export function MinePage({
  display = { status: "unavailable" },
  onRefresh,
  refreshing = false,
  actionPresentation,
  results,
  cellPresentation,
  manual,
}: Readonly<{
  manual?: MineManualUI;
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
        {message}
        {manual ? "" : ` · ${copy.readOnly}`}
      </p>
      {/* Public cell deployment never locks another account out of its first Manual selection. */}
      <ol
        className={styles.board}
        aria-label={`${copy.board} · BNB`}
        aria-busy={display.status === "loading"}
      >
        {Array.from({ length: 25 }, (_, index) => (
          <MineCell
            key={index}
            index={index}
            visual={
              cellPresentation?.[index]?.visual ??
              (manual?.ownMask && manual.ownMask & (BigInt(1) << BigInt(index))
                ? manual.selected.includes(index)
                  ? "combined"
                  : "deployed"
                : manual?.selected.includes(index)
                  ? "selected"
                  : "default")
            }
            ownAmount={
              cellPresentation?.[index]?.ownAmount ??
              manual?.ownAmounts.get(index)
            }
            onToggle={manual ? () => manual.toggle(index) : undefined}
            selected={manual?.selected.includes(index)}
            selectionDisabled={manual ? !manual.selectionEnabled : undefined}
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
        <MineBettingPanel
          display={actionPresentation?.betting}
          manual={manual}
        />
      )}
      <MineResults display={results} />
    </section>
  );
}
