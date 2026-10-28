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
  // Previous-round / winners rows still have no approved data owner. Never reuse the current round or legacy Rank data.
  const rows = display.status === "populated" ? display.rows : [];
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
        aria-busy={display.status === "loading"}
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
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row" title={row.addressText}>
                    {row.addressText}
                  </th>
                  <td>
                    <span className={styles.resultAmounts}>
                      {row.amounts.map((amount, index) => (
                        <span key={index} className={styles.resultAmount}>
                          {index > 0 && (
                            <span className={styles.amountSeparator}>+</span>
                          )}
                          <span className={styles.resultUnit}>
                            {amount.unit}
                          </span>
                          <span>{amount.text}</span>
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className={styles.resultsMessage}>
                  {display.status === "populated"
                    ? copy.empty
                    : copy[display.status]}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
