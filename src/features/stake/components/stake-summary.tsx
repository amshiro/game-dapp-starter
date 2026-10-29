"use client";

import { useStakeCopy } from "../copy";
import { useEffect, useId, useRef, useState } from "react";
import { DataLoading } from "../../../shared/ui/data-loading/data-loading";
import type { StakeSummaryDisplay } from "../model/stake-display";
import styles from "./stake.module.css";

export function StakeSummary({
  values,
}: Readonly<{ values: StakeSummaryDisplay }>) {
  const copy = useStakeCopy();
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const [openHint, setOpenHint] = useState<keyof StakeSummaryDisplay | null>(
    null,
  );
  const canHover = () =>
    window.matchMedia("(min-width: 500px) and (hover: hover)").matches;
  useEffect(() => {
    if (!openHint) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        (!root.current?.contains(event.target) ||
          !event.target.closest("[data-stake-hint]"))
      )
        setOpenHint(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenHint(null);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [openHint]);
  return (
    <section ref={root} aria-label={copy.summary} className={styles.summary}>
      <h2>{copy.summary}</h2>
      <dl>
        {(["totalDeposit", "apr", "tvl"] as const).map((key) => {
          const value = values[key];
          return (
            <div
              key={key}
              className={styles.summaryRow}
              aria-busy={value.status === "loading" || undefined}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse" && canHover())
                  setOpenHint(null);
              }}
            >
              <dt>
                {copy[key]}
                <button
                  type="button"
                  className={styles.infoButton}
                  data-stake-hint
                  aria-label={copy[key]}
                  aria-expanded={openHint === key}
                  aria-describedby={
                    openHint === key ? `${id}-${key}` : undefined
                  }
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse" && canHover())
                      setOpenHint(key);
                  }}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible"))
                      setOpenHint(key);
                  }}
                  onBlur={() => setOpenHint(null)}
                  onClick={() => {
                    if (!canHover()) setOpenHint(openHint === key ? null : key);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ori/stake/info.svg"
                    width={12}
                    height={12}
                    alt=""
                  />
                </button>
                {openHint === key && (
                  <span
                    id={`${id}-${key}`}
                    role="tooltip"
                    data-stake-hint
                    className={styles.infoTooltip}
                  >
                    {copy.hints[key]}
                  </span>
                )}
              </dt>
              <dd
                data-status={value.status}
                aria-label={
                  value.status === "populated"
                    ? value.exact
                      ? `${value.exact} ORI`
                      : undefined
                    : copy[value.status]
                }
              >
                {value.status === "loading" ? (
                  <DataLoading label={copy.loading} />
                ) : value.status === "populated" ? (
                  `${value.text}${value.exact ? " ORI" : ""}`
                ) : value.status === "error" ? (
                  copy.error
                ) : value.status === "unavailable" && key !== "totalDeposit" ? (
                  key === "apr" ? (
                    "0%"
                  ) : (
                    "$0.00"
                  )
                ) : (
                  "—"
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
