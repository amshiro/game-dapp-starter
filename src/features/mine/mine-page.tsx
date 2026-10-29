"use client";
import { MineCell } from "./components/mine-cell";
import { useMineCopy } from "./copy";
import { type MineBoardDisplay } from "./read/mine-display";
import { MineBettingPanel } from "./components/mine-betting-panel";
import { MineResults } from "./components/mine-results";
import { MineMetrics } from "./components/mine-metrics";
import { MineAutominerState } from "./components/mine-automation-state";
import { MineRewardState } from "./components/mine-rewards";
import type { MineRewardsDisplay } from "./model/mine-rewards";
import type {
  MineActionPresentation,
  MineResultsDisplay,
  MineCellVisual,
} from "./model/mine-presentation";
import type { MineManualUI } from "./transaction/use-mine-manual";
import type { MineAutoUI } from "./transaction/use-mine-auto";
import { MineManualFeedback } from "./components/mine-manual-status";
import { mineRecoveryAction } from "./transaction/feedback";
import { MineAutoStatus } from "./components/mine-auto-status";
import { useMineResult } from "./result/use-mine-result";
import type { MineClaimUI } from "./transaction/use-mine-claim";
import { MineClaimStatus } from "./components/mine-claim-status";
import styles from "./components/mine.module.css";

export function MinePage({
  display = { status: "unavailable" },
  onRefresh,
  motherlodeOre,
  refreshing = false,
  actionPresentation,
  results,
  cellPresentation,
  manual,
  auto,
  rewards,
  onRewardsRefresh,
  claim,
}: Readonly<{
  manual?: MineManualUI;
  auto?: MineAutoUI;
  claim?: MineClaimUI;
  rewards?: MineRewardsDisplay;
  onRewardsRefresh?: () => void;
  display?: MineBoardDisplay;
  motherlodeOre?: bigint;
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
  const result = useMineResult(snapshot);
  return (
    <section className={styles.page} aria-labelledby="mine-title">
      <h1 id="mine-title" className="sr-only">
        {copy.title}
      </h1>
      <MineMetrics
        roundId={snapshot?.roundId.toString()}
        motherlodeOre={motherlodeOre}
        totalDeployed={snapshot?.totalDeployed}
        personalDeployed={snapshot ? manual?.personalDeployed : undefined}
        waiting={snapshot?.transition}
      />
      {display.status !== "populated" && display.status !== "loading" && (
        <p className={styles.notice} role="status" aria-live="polite">
          {copy[display.status]}
          {display.status === "error" && onRefresh && (
            <button
              type="button"
              className={styles.refresh}
              disabled={refreshing}
              onClick={onRefresh}
            >
              {refreshing ? copy.loading : copy.refresh}
            </button>
          )}
        </p>
      )}
      <div className={styles.boardContainer}>
        {display.status === "loading" && (
          <div
            className={styles.boardLoading}
            role="status"
            aria-label={copy.loading}
          >
            <span className={styles.spinner} aria-hidden="true" />
          </div>
        )}
        {/* Public cell deployment never locks another account out of its first Manual selection. */}
        <ol
          className={styles.board}
          data-result-phase={result?.phase}
          aria-label={`${copy.board} · BNB`}
          aria-busy={display.status === "loading"}
        >
          {Array.from({ length: 25 }, (_, index) => (
            <MineCell
              key={index}
              index={index}
              loading={display.status === "loading"}
              result={
                result?.winner === index
                  ? "winning"
                  : result?.lost.includes(index)
                    ? "lost"
                    : undefined
              }
              visual={
                cellPresentation?.[index]?.visual ??
                (manual?.ownMask &&
                manual.ownMask & (BigInt(1) << BigInt(index))
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
              onToggle={
                manual && !auto?.active ? () => manual.toggle(index) : undefined
              }
              selected={manual?.selected.includes(index)}
              selectionDisabled={
                manual
                  ? !manual.selectionEnabled || auto?.busy || auto?.active
                  : undefined
              }
              amount={snapshot?.deployedPerSquare[index]}
              miners={snapshot?.minersPerSquare[index]}
            />
          ))}
        </ol>
      </div>
      {result?.winner !== undefined && (
        <p className={styles.notice} role="status" aria-live="polite">
          {copy.resultRound} #{round} · {copy.winningCell} #{result.winner + 1}
        </p>
      )}
      {/* Running state comes from the chain owner; isolated Figma reward variants never create runtime rewards. */}
      {auto?.active ||
      (auto?.stateVisible &&
        auto.state.operation?.kind === "stop" &&
        (mineRecoveryAction(auto.state) || auto.busy)) ? (
        <MineAutominerState display={auto.running} auto={auto} />
      ) : actionPresentation?.kind === "autominer" ? (
        <>
          <MineAutominerState display={actionPresentation.automation} />
        </>
      ) : (
        <MineBettingPanel
          display={actionPresentation?.betting}
          manual={manual}
          auto={auto}
        />
      )}
      {manual && <MineManualFeedback manual={manual} />}
      {auto && <MineAutoStatus auto={auto} />}
      {claim && <MineClaimStatus claim={claim} />}
      <MineRewardState
        claim={claim}
        display={
          rewards ??
          (actionPresentation?.kind === "autominer"
            ? actionPresentation.rewards
            : undefined)
        }
        onRetry={onRewardsRefresh}
      />
      <MineResults display={results} />
    </section>
  );
}
