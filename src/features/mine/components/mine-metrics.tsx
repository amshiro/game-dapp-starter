"use client";
import { useState } from "react";
import { useMineCopy } from "../copy";
import { mineAmount } from "../read/mine-display";
import styles from "./mine.module.css";

type MetricId = "motherlode" | "remaining" | "total" | "personal";
export function MineMetrics({
  roundId,
  motherlodeOre,
  totalDeployed,
  personalDeployed,
  waiting = false,
  countdown,
}: Readonly<{
  roundId?: string;
  motherlodeOre?: bigint;
  totalDeployed?: bigint;
  personalDeployed?: bigint;
  waiting?: boolean;
  countdown?: string;
}>) {
  const copy = useMineCopy();
  const [alternate, setAlternate] = useState<
    Partial<Record<MetricId, boolean>>
  >({});
  const total =
    totalDeployed === undefined
      ? undefined
      : mineAmount(totalDeployed, 4, true);
  const personal =
    personalDeployed === undefined
      ? undefined
      : mineAmount(personalDeployed, 4, true);
  const motherlode =
    motherlodeOre === undefined
      ? undefined
      : mineAmount(motherlodeOre, 4, true);
  const items = [
    {
      id: "motherlode",
      label: copy.motherlode,
      text: motherlode?.text ?? "—",
      exact: motherlode ? `${motherlode.exact} ORI` : copy.unavailable,
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
      text: personal?.text ?? "—",
      exact: personal ? `${personal.exact} BNB` : copy.unavailable,
    },
  ] as const;
  return (
    <dl className={styles.metrics}>
      {items.map((item) => (
        <div
          key={item.id}
          onPointerEnter={(event) => {
            if (
              event.pointerType === "mouse" &&
              window.matchMedia("(min-width: 500px) and (hover: hover)").matches
            )
              setAlternate((value) => ({ ...value, [item.id]: true }));
          }}
          onPointerLeave={(event) => {
            if (
              event.pointerType === "mouse" &&
              window.matchMedia("(min-width: 500px) and (hover: hover)").matches
            )
              setAlternate((value) => ({ ...value, [item.id]: false }));
          }}
          className={`${styles.metric} ${item.id === "motherlode" ? styles.accent : ""}`}
        >
          <dt>
            <button
              type="button"
              aria-pressed={!!alternate[item.id]}
              onClick={(event) => {
                if (
                  event.detail === 0 ||
                  !window.matchMedia("(min-width: 500px) and (hover: hover)")
                    .matches
                )
                  setAlternate((value) => ({
                    ...value,
                    [item.id]: !value[item.id],
                  }));
              }}
            >
              {alternate[item.id]
                ? item.id === "remaining"
                  ? `${copy.storedRound}: #${roundId ?? "—"}`
                  : "≈$ 0"
                : item.label}
            </button>
          </dt>
          {/* User-confirmed zero is a display placeholder until USD quotes are connected. */}
          <dd aria-label={`${item.label}: ${item.exact}`}>
            {item.id === "motherlode" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/ori/explore/ori-token.png"
                width={16}
                height={16}
                alt=""
              />
            )}
            {(item.id === "total" || item.id === "personal") && (
              // Native BNB replaces the design's SOL placeholder.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/ori/mine/reward-bnb.svg"
                width={16}
                height={16}
                alt=""
              />
            )}
            <span>{item.text}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
