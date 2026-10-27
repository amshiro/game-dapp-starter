"use client";

import { useId, useRef, useState } from "react";
import { modeForKey, stakeModes, type StakeMode } from "../model/stake-display";
import { stakeCopy as copy } from "../copy";
import styles from "./stake.module.css";

export function StakePanel() {
  const [mode, setMode] = useState<StakeMode>("deposit");
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
            <p>{copy.balance} — ORI</p>
            <div className={styles.presets}>
              {/* Q-16/17 and data ownership are unresolved: no percentage math or editable amount draft yet. */}
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
          {/* This is a UI-only slice. There is deliberately no submit/sign/approve callback. */}
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
      <p id={`${id}-unavailable`} className={styles.state} role="status">
        {copy.actionsUnavailable} · {copy.unavailable}
      </p>
    </section>
  );
}
