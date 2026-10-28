"use client";
import { useState } from "react";
import { useMineCopy } from "../copy";
import { mineAmount } from "../read/mine-display";
import styles from "./mine.module.css";

type MetricId = "motherlode" | "remaining" | "total" | "personal";
export function MineMetrics({
  roundId,
  totalDeployed,
  waiting = false,
  countdown,
}: Readonly<{
  roundId?: string;
  totalDeployed?: bigint;
  waiting?: boolean;
  countdown?: string;
}>) {
  const copy = useMineCopy();
  const [alternate, setAlternate] = useState<
    Partial<Record<MetricId, boolean>>
  >({});
  const total =
    totalDeployed === undefined ? undefined : mineAmount(totalDeployed);
  const items = [
    {
      id: "motherlode",
      label: copy.motherlode,
      text: "—",
      exact: copy.unavailable,
    },
    {
      id: "remaining",
      label: copy.remaining,
      text: waiting ? copy.waiting : (countdown ?? "—"),
      exact: waiting ? copy.waiting : (countdown ?? copy.unavailable),
    },
    {
      id: "total",
      label: copy.total,
      text: total?.text ?? "—",
      exact: total ? `${total.exact} BNB` : copy.unavailable,
    },
    {
      id: "personal",
      label: copy.personal,
      text: "—",
      exact: copy.unavailable,
    },
  ] as const;
  return (
    <dl className={styles.metrics}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`${styles.metric} ${item.id === "motherlode" ? styles.accent : ""}`}
        >
          <dt>
            <button
              type="button"
              aria-pressed={!!alternate[item.id]}
              onClick={() =>
                setAlternate((value) => ({
                  ...value,
                  [item.id]: !value[item.id],
                }))
              }
            >
              {alternate[item.id]
                ? item.id === "remaining"
                  ? `${copy.storedRound}: #${roundId ?? "—"}`
                  : "≈$ —"
                : item.label}
            </button>
          </dt>
          {/* Figma alternate USD values are samples, not quotes. No price/Motherlode/reward owner is guessed here. */}
          <dd title={item.exact} aria-label={`${item.label}: ${item.exact}`}>
            <span>{item.text}</span>
            {item.id === "total" && <small>BNB</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
