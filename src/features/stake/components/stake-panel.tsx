"use client";

import { useId, useRef, useState } from "react";
import {
  modeForKey,
  stakeModes,
  type StakeMode,
  type StakeReadValue,
} from "../model/stake-display";
import { useStakeCopy } from "../copy";
import styles from "./stake.module.css";

export function StakePanel({
  available,
  staked,
  onRefresh,
  refreshing,
}: Readonly<{
  available: StakeReadValue;
  staked: StakeReadValue;
  onRefresh?: () => void;
  refreshing: boolean;
}>) {
  const copy = useStakeCopy();
  const [mode, setMode] = useState<StakeMode>("deposit");
  const balance = mode === "deposit" ? available : staked;
  const id = useId();
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
              value=""
              readOnly
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
              {/* Q-16/17 transaction rules remain gated: no percentage math or editable amount draft yet. */}
              {[25, 50, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  disabled
                  aria-label={`${percent}% ${copy.percentage}`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
          {/* Principal reads do not authorize funds actions. There is deliberately no submit/sign/approve callback. */}
          <button
            className={styles.action}
            type="button"
            disabled
            aria-describedby={`${id}-unavailable`}
          >
            {copy[mode]}
          </button>
        </div>
      </div>
      <div className={styles.state}>
        <p id={`${id}-unavailable`} role="status">
          {copy.actionsUnavailable}
          {balance.status !== "populated" ? ` · ${copy[balance.status]}` : ""}
        </p>
        {onRefresh && (
          <button type="button" onClick={onRefresh} disabled={refreshing}>
            {copy.refresh}
          </button>
        )}
      </div>
    </section>
  );
}
