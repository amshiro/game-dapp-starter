"use client";
import { useId } from "react";
import { useMineCopy } from "../copy";
import type { MineResultsDisplay } from "../model/mine-presentation";
import styles from "./mine.module.css";

export function MineResults({
  display = { status: "unavailable" },
}: Readonly<{ display?: MineResultsDisplay }>) {
  const copy = useMineCopy();
  const id = useId();
  // Unknown/empty lists are not placeholder participants. Only the current fulfilled round query can supply winners.
  const rows = display.status === "populated" ? display.rows : [];
  if (!rows.length) return null;
  return (
    <section className={styles.miners} aria-labelledby={`${id}-title`}>
      <div className={styles.minersHeader}>
        <h2 id={`${id}-title`}>{copy.miners}</h2>
        <span>
          {copy.round}: #{display.roundId ?? "—"}
        </span>
      </div>
      <div
        className={styles.resultsScroll}
        role="region"
        aria-label={copy.results}
        tabIndex={0}
      >
        <table className={styles.resultsTable}>
          <caption className="sr-only">{copy.results}</caption>
          <colgroup>
            <col className={styles.addressColumn} />
            <col />
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th scope="col">{copy.address}</th>
              <th scope="col">{copy.resultAmount}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                data-current-user={row.isCurrentUser || undefined}
              >
                <th scope="row" title={row.address ?? row.addressText}>
                  {row.isCurrentUser ? copy.you : row.addressText}
                </th>
                <td>
                  <span className={styles.resultAmounts}>
                    {row.amounts.map((amount, index) => (
                      <span key={index} className={styles.resultAmount}>
                        {index > 0 && (
                          <span className={styles.amountSeparator}>+</span>
                        )}
                        {/* Human-confirmed BNB/ORI replaces Figma's SOL placeholder; keep each icon's 14px slot. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            amount.unit === "BNB"
                              ? "/ori/mine/reward-bnb.svg"
                              : "/ori/explore/ori-token.png"
                          }
                          width={14}
                          height={14}
                          alt=""
                        />
                        <span className="sr-only">{amount.unit}</span>
                        <span
                          title={
                            amount.exact
                              ? `${amount.exact} ${amount.unit}`
                              : undefined
                          }
                        >
                          {amount.text}
                        </span>
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
