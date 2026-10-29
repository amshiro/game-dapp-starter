"use client";

import { useId, useRef, useState } from "react";
import {
  modeForKey,
  stakeModes,
  type StakeMode,
  type StakeReadValue,
} from "../model/stake-display";
import { useStakeCopy } from "../copy";
import { findEvmChain } from "../../../shared/config/evm-chains";
import { parseStakeAmount, stakePercentage } from "../transaction/amount";
import type { StakeTransactionUI } from "../transaction/use-stake-transaction";
import type { StakeTxError } from "../transaction/errors";
import styles from "./stake.module.css";

export function StakePanel({
  available,
  staked,
  onRefresh,
  refreshing,
  transaction,
  draftScope,
}: Readonly<{
  available: StakeReadValue;
  staked: StakeReadValue;
  onRefresh?: () => void;
  refreshing: boolean;
  transaction?: StakeTransactionUI;
  draftScope?: string;
}>) {
  const copy = useStakeCopy();
  const [mode, setMode] = useState<StakeMode>("deposit");
  const balance = mode === "deposit" ? available : staked;
  const id = useId();
  const [draft, setDraft] = useState({ scope: draftScope, mode, value: "" });
  // Drafts belong to the current account and mode, never to the next identity after a switch.
  const input =
    draft.scope === draftScope && draft.mode === mode ? draft.value : "";
  const setInput = (value: string) =>
    setDraft({ scope: draftScope, mode, value });
  let amount: bigint | undefined, inputError: StakeTxError | undefined;
  if (input)
    try {
      amount = parseStakeAmount(input);
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
  const explorer = state?.operation
    ? findEvmChain(state.operation.chainId)?.blockExplorer.url
    : undefined;
  const statusText =
    state && state.phase !== "idle"
      ? state.error
        ? copy.transaction.errors[state.error]
        : state.phase === "success" && state.step === "approve"
          ? copy.transaction.approvalReady
          : `${state.step ? copy.transaction.steps[state.step] : copy[mode]} · ${copy.transaction.phases[state.phase]}`
      : undefined;

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
            {/* SOL is a Figma placeholder. Keep the icon slot empty until the ORI asset is confirmed (Q-03). */}
            <span className={styles.assetSlot} aria-hidden="true" />
            <span className={styles.asset}>ORI</span>
            {/* Figma example values are visual placeholders only; never use them as runtime business data. */}
            <input
              className={styles.amount}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              readOnly={unavailable || busy}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={!!inputError}
              placeholder="—"
              aria-label={`${copy[mode]} ${copy.amount}`}
              aria-describedby={`${id}-unavailable`}
            />
          </div>
          <div className={styles.balanceRow}>
            <p aria-busy={balance.status === "loading" || undefined}>
              {copy.balance}{" "}
              <span
                aria-label={`${mode === "deposit" ? copy.availableBalance : copy.stakedBalance}: ${balance.status === "populated" ? `${balance.exact ?? balance.text} ORI` : copy[balance.status]}`}
                title={
                  balance.status === "populated"
                    ? `${balance.exact ?? balance.text} ORI`
                    : undefined
                }
              >
                {balance.status === "populated" ? balance.text : "—"}
              </span>{" "}
              ORI
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
                    )
                      setInput(stakePercentage(balance.raw, percent));
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
            disabled={disabled}
            aria-busy={busy || undefined}
            onClick={() => {
              if (!disabled) void transaction?.start(mode, input);
            }}
            aria-describedby={`${id}-unavailable`}
          >
            {busy && state?.step
              ? `${copy.transaction.steps[state.step]} · ${copy.transaction.phases[state.phase]}`
              : needsApproval
                ? copy.transaction.approveAndDeposit
                : copy[mode]}
          </button>
        </div>
      </div>
      <div className={styles.state}>
        <p id={`${id}-unavailable`} role="status">
          {statusText ??
            (inputError
              ? copy.transaction.errors[inputError]
              : unavailable
                ? `${copy.actionsUnavailable}${balance.status !== "populated" ? ` · ${copy[balance.status]}` : ""}`
                : transaction?.allowanceError && mode === "deposit"
                  ? copy.transaction.allowanceError
                  : balance.status !== "populated"
                    ? copy[balance.status]
                    : mode === "deposit" && transaction?.allowanceLoading
                      ? copy.loading
                      : amount !== undefined
                        ? copy.transaction.phases.idle
                        : copy.transaction.enterAmount)}
          {state?.operation && state.phase !== "idle" && (
            <span className={styles.operationContext}>
              {" "}
              · {state.operation.account.slice(0, 6)}…
              {state.operation.account.slice(-4)} · BSC 97
            </span>
          )}
          {state?.hash && explorer && (
            <a
              href={`${explorer}/tx/${state.hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {" "}
              {copy.transaction.viewTransaction}
            </a>
          )}
        </p>
        {state?.phase === "refresh-failed" ? (
          <button
            type="button"
            onClick={() => void transaction?.retryRefresh()}
          >
            {copy.transaction.retryRefresh}
          </button>
        ) : state?.confirmationUnknown ? (
          <button
            type="button"
            onClick={() => void transaction?.retryConfirmation()}
          >
            {copy.transaction.checkTransaction}
          </button>
        ) : (
          onRefresh && (
            <button type="button" onClick={onRefresh} disabled={refreshing}>
              {copy.refresh}
            </button>
          )
        )}
      </div>
    </section>
  );
}
