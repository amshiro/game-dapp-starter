"use client";

import { useId, useRef, useState } from "react";
import {
  modeForKey,
  stakeModes,
  type StakeMode,
  type StakeReadValue,
} from "../model/stake-display";
import { useStakeCopy } from "../copy";
import { useToastFeedback } from "../../../shared/ui/toast/use-toast-feedback";
import { formatDecimal } from "../../../shared/lib/number/format-decimal";
import { DataLoading } from "../../../shared/ui/data-loading/data-loading";
import { parseStakeAmount, stakePercentage } from "../transaction/amount";
import type { StakeTransactionUI } from "../transaction/use-stake-transaction";
import type { StakeTxError } from "../transaction/errors";
import styles from "./stake.module.css";

export function StakePanel({
  available,
  staked,
  transaction,
  draftScope,
}: Readonly<{
  available: StakeReadValue;
  staked: StakeReadValue;
  transaction?: StakeTransactionUI;
  draftScope?: string;
}>) {
  const copy = useStakeCopy();
  const [mode, setMode] = useState<StakeMode>("deposit");
  const balance = mode === "deposit" ? available : staked;
  const id = useId();
  const [draft, setDraft] = useState<{
    scope?: string;
    mode: StakeMode;
    value: string;
    exact?: string;
  }>({ scope: draftScope, mode, value: "" });
  // Drafts belong to the current account and mode, never to the next identity after a switch.
  const input =
    draft.scope === draftScope && draft.mode === mode ? draft.value : "";
  const submissionInput =
    draft.scope === draftScope && draft.mode === mode
      ? (draft.exact ?? input)
      : input;
  const setInput = (value: string) =>
    setDraft({
      scope: draftScope,
      mode,
      value,
    });
  let amount: bigint | undefined, inputError: StakeTxError | undefined;
  if (input && !transaction?.busy)
    try {
      amount = parseStakeAmount(submissionInput);
      if (
        balance.status === "populated" &&
        balance.raw !== undefined &&
        amount > balance.raw
      )
        inputError =
          mode === "deposit" ? "insufficient-ori" : "insufficient-staked";
    } catch (error) {
      inputError =
        error instanceof Error && error.message === "zero-amount"
          ? "zero-amount"
          : "invalid-amount";
    }
  const busy = transaction?.busy ?? false;
  const unavailable = !transaction || !draftScope;
  const needsApproval =
    mode === "deposit" &&
    amount !== undefined &&
    transaction?.allowance !== undefined &&
    transaction.allowance < amount;
  const disabled =
    unavailable ||
    busy ||
    amount === undefined ||
    !!inputError ||
    balance.status !== "populated" ||
    balance.raw === undefined ||
    (mode === "deposit" && transaction.allowance === undefined);
  const state = transaction?.state;
  const recovery =
    state?.phase === "refresh-failed"
      ? "refresh"
      : state?.phase === "failed" && state.confirmationUnknown
        ? "confirmation"
        : undefined;
  const stateVisible =
    !state?.operation ||
    draftScope ===
      `${state.operation.chainId}:${state.operation.account.toLowerCase()}`;
  const canRecover = stateVisible && !!recovery;
  useToastFeedback(
    !state || !stateVisible
      ? undefined
      : state.error &&
          ["failed", "rejected", "refresh-failed"].includes(state.phase)
        ? {
            key: state,
            type: "error",
            message: copy.transaction.errors[state.error],
          }
        : state.phase === "success" &&
            state.chainConfirmed &&
            (state.step === "deposit" || state.step === "withdraw")
          ? {
              key: state,
              type: "success",
              message: copy.transaction.success[state.step],
            }
          : undefined,
  );
  const [clearedOperation, setClearedOperation] =
    useState<StakeTransactionUI["state"]["operation"]>(undefined);
  if (
    state?.phase === "success" &&
    (state.step === "deposit" || state.step === "withdraw") &&
    state.chainConfirmed &&
    state.operation &&
    state.operation !== clearedOperation
  ) {
    setClearedOperation(state.operation);
    if (
      mode === state.operation.kind &&
      draftScope ===
        `${state.operation.chainId}:${state.operation.account.toLowerCase()}`
    ) {
      setDraft({ scope: draftScope, mode, value: "" });
    }
  }

  const tabs = useRef<Record<StakeMode, HTMLButtonElement | null>>({
    deposit: null,
    withdraw: null,
  });
  return (
    <section aria-label={copy.mode} className={styles.panelSection}>
      <div className={styles.panel}>
        <div role="tablist" aria-label={copy.mode} className={styles.tabs}>
          {stakeModes.map((item) => (
            <button
              key={item}
              ref={(node) => {
                tabs.current[item] = node;
              }}
              type="button"
              disabled={busy}
              role="tab"
              id={`${id}-${item}`}
              aria-selected={mode === item}
              aria-controls={`${id}-panel`}
              tabIndex={mode === item ? 0 : -1}
              onClick={() => setMode(item)}
              onKeyDown={(event) => {
                const next = modeForKey(mode, event.key);
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
          id={`${id}-panel`}
          className={styles.content}
          role="tabpanel"
          aria-labelledby={`${id}-${mode}`}
          tabIndex={0}
        >
          <div className={styles.amountRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.assetSlot}
              src="/ori/explore/ori-token.png"
              width={20}
              height={20}
              alt=""
            />
            <span className={styles.asset}>ORI</span>
            {/* Figma example values are visual placeholders only; never use them as runtime business data. */}
            <input
              className={styles.amount}
              value={input}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "" || /^\d*\.?\d{0,6}$/.test(value)) {
                  setInput(value.startsWith(".") ? `0${value}` : value);
                }
              }}
              readOnly={unavailable || busy}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={!!inputError}
              placeholder="0.00"
              aria-label={`${copy[mode]} ${copy.amount}`}
              aria-describedby={inputError ? `${id}-status` : undefined}
            />
          </div>
          <div className={styles.balanceRow}>
            <p aria-busy={balance.status === "loading" || undefined}>
              {copy.balance}{" "}
              <span
                className={styles.balanceValue}
                data-status={balance.status}
                aria-label={`${mode === "deposit" ? copy.availableBalance : copy.stakedBalance}: ${balance.status === "populated" ? `${balance.exact ?? balance.text} ORI` : copy[balance.status]}`}
              >
                {balance.status === "loading" ? (
                  <DataLoading label={copy.loading} />
                ) : balance.status === "populated" ? (
                  balance.text
                ) : balance.status === "error" ? (
                  copy.error
                ) : (
                  "—"
                )}
              </span>{" "}
              {balance.status !== "loading" && "ORI"}
            </p>
            <div className={styles.presets}>
              {/* The Figma 100% control is Max; the exact helper also supports 75% without floating point. */}
              {([25, 50, 100] as const).map((percent) => (
                <button
                  key={percent}
                  type="button"
                  disabled={
                    unavailable ||
                    busy ||
                    balance.status !== "populated" ||
                    balance.raw === undefined
                  }
                  onClick={() => {
                    if (
                      balance.status === "populated" &&
                      balance.raw !== undefined
                    ) {
                      const exact = stakePercentage(balance.raw, percent);
                      setDraft({
                        scope: draftScope,
                        mode,
                        exact,
                        value: formatDecimal(exact, { decimals: 6 }),
                      });
                    }
                  }}
                  aria-label={`${percent}% ${copy.percentage}`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
          {/* The event invokes the Feature owner; render/effects never submit wallet transactions. */}
          <button
            className={styles.action}
            type="button"
            disabled={canRecover ? false : disabled}
            aria-busy={(busy && !canRecover) || undefined}
            onClick={() => {
              if (canRecover) {
                if (recovery === "refresh") void transaction?.retryRefresh();
                else void transaction?.retryConfirmation();
              } else if (!disabled)
                void transaction?.start(mode, submissionInput);
            }}
            aria-describedby={inputError ? `${id}-status` : undefined}
          >
            {busy && !canRecover && <DataLoading label={copy.loading} />}
            {canRecover
              ? recovery === "refresh"
                ? copy.transaction.retryRefresh
                : copy.transaction.checkTransaction
              : busy && state?.step
                ? `${copy.transaction.steps[state.step]} · ${copy.transaction.phases[state.phase]}`
                : needsApproval
                  ? copy.transaction.approveAndDeposit
                  : copy[mode]}
          </button>
          {inputError && (
            <div className={styles.state}>
              <p
                id={`${id}-status`}
                role="status"
                aria-live="polite"
                className={styles.amountError}
              >
                {copy.transaction.errors[inputError]}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
