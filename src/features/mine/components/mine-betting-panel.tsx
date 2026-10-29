"use client";
import { useId, useRef, useState } from "react";
import {
  bettingModeForKey,
  unavailableBetting,
  type BettingMode,
  type BettingPresentation,
} from "../model/mine-presentation";
import { manualAmountShortcuts } from "../transaction/manual-model";
import { useMineCopy } from "../copy";
import {
  MineManualStatus,
  type ManualPanelControls,
} from "./mine-manual-status";
import styles from "./mine.module.css";

export function MineBettingPanel({
  display: suppliedDisplay = unavailableBetting,
  manual,
  initialMode = "manual",
}: Readonly<{
  display?: BettingPresentation;
  initialMode?: BettingMode;
  manual?: ManualPanelControls;
}>) {
  const copy = useMineCopy();
  const [mode, setMode] = useState<BettingMode>(initialMode);
  const activeManual = mode === "manual" ? manual : undefined;
  const display: BettingPresentation = activeManual?.display ?? suppliedDisplay;
  const id = useId();
  const tabs = useRef<Record<BettingMode, HTMLButtonElement | null>>({
    manual: null,
    auto: null,
  });
  const action =
    display.appearance === "disconnected"
      ? copy.connectWallet
      : display.appearance === "insufficient"
        ? copy.insufficient
        : copy.deploy;
  return (
    <section
      className={styles.betting}
      data-mode={mode}
      data-deployed={activeManual?.hasDeployedThisRound ? "true" : undefined}
      data-appearance={display.appearance}
      aria-label={copy.betting}
    >
      <div className={styles.tabs} role="tablist" aria-label={copy.bettingMode}>
        {(["manual", "auto"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            ref={(node) => {
              tabs.current[item] = node;
            }}
            id={`${id}-${item}`}
            aria-selected={mode === item}
            aria-controls={`${id}-panel`}
            tabIndex={mode === item ? 0 : -1}
            disabled={manual?.busy}
            onClick={() => setMode(item)}
            onKeyDown={(event) => {
              if (manual?.busy) return;
              const next = bettingModeForKey(mode, event.key);
              if (!next) return;
              event.preventDefault();
              setMode(next);
              tabs.current[next]?.focus();
            }}
          >
            {copy[item]}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${mode}`}
        tabIndex={0}
      >
        <div className={styles.betAmount}>
          {/* SOL/ORE are design placeholders. The verified deploy asset is native BNB; no placeholder token image. */}
          <span className={styles.betAsset}>
            <span className={styles.assetSlot} aria-hidden="true" />
            BNB
          </span>
          <input
            aria-label={copy.betAmount}
            aria-describedby={`${id}-boundary`}
            inputMode="decimal"
            type="text"
            readOnly={!activeManual || activeManual.busy}
            onChange={
              activeManual
                ? (event) => activeManual.setInput(event.target.value)
                : undefined
            }
            value={display.amount ?? ""}
            placeholder={activeManual ? "0.00" : "—"}
          />
        </div>
        <div className={styles.balanceRow}>
          <span
            className={
              display.appearance === "insufficient"
                ? styles.insufficient
                : undefined
            }
          >
            {copy.balance} {display.balance ?? "—"} BNB
          </span>
          <div className={styles.shortcuts} aria-label={copy.shortcuts}>
            {/* The Figma + labels are presets, not arithmetic; this never submits a transaction. */}
            {manualAmountShortcuts.map((value) => (
              <button
                key={value}
                type="button"
                disabled={!activeManual || activeManual.busy}
                onClick={
                  activeManual
                    ? () => activeManual.setShortcut(value)
                    : undefined
                }
              >
                +{value}
              </button>
            ))}
          </div>
        </div>
        {mode === "auto" && (
          <div className={styles.autoConfiguration}>
            <div className={styles.configRow}>
              <span className={styles.configLabel}>
                <span className={styles.blocksIcon} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                {copy.blocks}
              </span>
              <span>{display.blocks ?? "—"}</span>
            </div>
            <div className={styles.configRow}>
              <label className={styles.configLabel} htmlFor={`${id}-rounds`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ori/mine/rounds.svg" width={16} height={16} alt="" />
                {copy.rounds}
              </label>
              <div className={styles.roundStepper}>
                <button type="button" disabled aria-label={copy.decreaseRounds}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ori/mine/minus.svg"
                    width={16}
                    height={16}
                    alt=""
                  />
                </button>
                {/* Draft UI default 1 is drawn in frame 6; it is not an active automation or approved round limit. */}
                <input
                  id={`${id}-rounds`}
                  type="text"
                  inputMode="numeric"
                  value={display.rounds ?? "1"}
                  readOnly
                  aria-describedby={`${id}-boundary`}
                />
                <button type="button" disabled aria-label={copy.increaseRounds}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ori/mine/plus.svg" width={16} height={16} alt="" />
                </button>
              </div>
            </div>
          </div>
        )}
        <dl className={styles.betSummary}>
          <div>
            <dt>{copy.blocks}</dt>
            <dd>
              {mode === "auto"
                ? (display.selectedBlocks ?? "—")
                : display.blocks
                  ? `× ${display.blocks}`
                  : "—"}
            </dd>
          </div>
          {mode === "auto" && (
            <div>
              <dt>{copy.totalPerRound}</dt>
              <dd>{display.totalPerRound ?? "—"} BNB</dd>
            </div>
          )}
          <div>
            <dt>{copy.betTotal}</dt>
            <dd>{display.total ?? "—"} BNB</dd>
          </div>
        </dl>
        {/* Only the Manual owner can submit. Auto and isolated Figma fixtures remain non-executable. */}
        <button
          type="button"
          className={styles.deployAction}
          data-appearance={
            activeManual?.hasDeployedThisRound
              ? "unavailable"
              : display.appearance
          }
          aria-describedby={`${id}-boundary`}
          disabled={
            !activeManual ||
            activeManual.busy ||
            activeManual.hasDeployedThisRound === true ||
            (display.appearance === "disconnected"
              ? !activeManual.onConnect
              : !activeManual.canSubmit)
          }
          onClick={
            activeManual
              ? () => {
                  if (display.appearance === "disconnected")
                    activeManual.onConnect?.();
                  else if (activeManual.hasDeployedThisRound !== true)
                    activeManual.submit();
                }
              : undefined
          }
        >
          {activeManual?.busy
            ? activeManual.stateVisible
              ? copy.transaction.phases[activeManual.state.phase]
              : copy.loading
            : activeManual?.hasDeployedThisRound
              ? copy.transaction.alreadyDeployed
              : action}
          {!activeManual?.busy &&
          !activeManual?.hasDeployedThisRound &&
          display.appearance === "ready" &&
          display.total
            ? ` ${display.total} BNB`
            : ""}
        </button>
      </div>
      {activeManual && <MineManualStatus manual={activeManual} />}
      <p id={`${id}-boundary`} className={styles.boundary}>
        {activeManual ? copy.transaction.perCell : copy.actionsUnavailable}
      </p>
    </section>
  );
}
