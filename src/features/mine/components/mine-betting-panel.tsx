"use client";
import { formatEther } from "viem";
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
import type { MineAutoUI } from "../transaction/use-mine-auto";
import styles from "./mine.module.css";

export function MineBettingPanel({
  display: suppliedDisplay = unavailableBetting,
  manual,
  auto,
  initialMode = "manual",
}: Readonly<{
  display?: BettingPresentation;
  initialMode?: BettingMode;
  manual?: ManualPanelControls;
  auto?: MineAutoUI;
}>) {
  const copy = useMineCopy();
  const [mode, setMode] = useState<BettingMode>(initialMode);
  const activeManual = mode === "manual" ? manual : undefined;
  const activeForm = mode === "auto" ? auto : manual;
  const formBusy = !!manual?.busy || !!auto?.busy;
  const display: BettingPresentation = activeForm?.display ?? suppliedDisplay;
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
            disabled={formBusy}
            onClick={() => setMode(item)}
            onKeyDown={(event) => {
              if (formBusy) return;
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
            readOnly={!activeForm || formBusy}
            onChange={
              activeForm
                ? (event) => activeForm.setInput(event.target.value)
                : undefined
            }
            value={display.amount ?? ""}
            placeholder={activeForm ? "0.00" : "—"}
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
                disabled={!activeForm || formBusy}
                onClick={
                  activeForm ? () => activeForm.setShortcut(value) : undefined
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
              <input
                className={styles.cellsInput}
                aria-label={copy.blocks}
                inputMode="numeric"
                type="text"
                value={display.blocks ?? ""}
                readOnly={!auto || auto.fixed || formBusy}
                onChange={
                  auto
                    ? (event) => auto.setBlocks(event.target.value)
                    : undefined
                }
              />
            </div>
            <div className={styles.configRow}>
              <label className={styles.configLabel} htmlFor={`${id}-rounds`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ori/mine/rounds.svg" width={16} height={16} alt="" />
                {copy.rounds}
              </label>
              <div className={styles.roundStepper}>
                <button
                  type="button"
                  disabled={
                    !auto ||
                    formBusy ||
                    !/^\d+$/.test(display.rounds ?? "") ||
                    BigInt(display.rounds ?? "0") <= BigInt(1)
                  }
                  onClick={() =>
                    auto?.setRounds(
                      (BigInt(display.rounds ?? "1") - BigInt(1)).toString(),
                    )
                  }
                  aria-label={copy.decreaseRounds}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ori/mine/minus.svg"
                    width={16}
                    height={16}
                    alt=""
                  />
                </button>
                {/* 1–9999 is a human-approved UI cap, not a contract maximum. */}
                <input
                  id={`${id}-rounds`}
                  type="text"
                  inputMode="numeric"
                  value={display.rounds ?? "1"}
                  readOnly={!auto || formBusy}
                  onChange={
                    auto
                      ? (event) => auto.setRounds(event.target.value)
                      : undefined
                  }
                  aria-describedby={`${id}-boundary`}
                />
                <button
                  type="button"
                  disabled={
                    !auto ||
                    formBusy ||
                    !/^\d+$/.test(display.rounds ?? "") ||
                    BigInt(display.rounds ?? "0") >= BigInt(9999)
                  }
                  onClick={() =>
                    auto?.setRounds(
                      (BigInt(display.rounds ?? "1") + BigInt(1)).toString(),
                    )
                  }
                  aria-label={copy.increaseRounds}
                >
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
          {mode === "auto" && auto && (
            <div>
              <dt>{copy.autoFlow.executorFee}</dt>
              <dd>
                {auto.executorFee === undefined
                  ? "—"
                  : formatEther(auto.executorFee)}{" "}
                BNB
              </dd>
            </div>
          )}
        </dl>
        {/* Displayed principal excludes executor fees; the Auto owner validates the larger payable value. */}
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
            !activeForm ||
            formBusy ||
            activeManual?.hasDeployedThisRound === true ||
            (display.appearance === "disconnected"
              ? !activeForm.onConnect
              : !activeForm.canSubmit)
          }
          onClick={
            activeForm
              ? () => {
                  if (display.appearance === "disconnected")
                    activeForm.onConnect?.();
                  else if (activeManual?.hasDeployedThisRound !== true)
                    activeForm.submit();
                }
              : undefined
          }
        >
          {formBusy
            ? auto?.busy
              ? auto.stateVisible
                ? copy.autoFlow.phases[auto.state.phase]
                : copy.loading
              : manual?.stateVisible
                ? copy.transaction.phases[manual.state.phase]
                : copy.loading
            : mode === "auto" && auto?.loading
              ? copy.loading
              : activeManual?.hasDeployedThisRound
                ? copy.transaction.alreadyDeployed
                : action}
          {!formBusy &&
          !activeManual?.hasDeployedThisRound &&
          display.appearance === "ready" &&
          display.total
            ? ` ${display.total} BNB`
            : ""}
        </button>
      </div>
      {activeManual && <MineManualStatus manual={activeManual} />}
      {mode === "auto" && auto?.error && (
        <p className={styles.boundary} role="status">
          {{ ...copy.transaction.errors, ...copy.autoFlow.errors }[auto.error]}
        </p>
      )}
      <p id={`${id}-boundary`} className={styles.boundary}>
        {activeForm
          ? mode === "auto"
            ? copy.autoFlow.funding
            : copy.transaction.perCell
          : copy.actionsUnavailable}
      </p>
    </section>
  );
}
