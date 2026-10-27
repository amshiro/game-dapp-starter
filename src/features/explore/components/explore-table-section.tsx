"use client";

import { useId } from "react";
import type {
  BuybackRow,
  MiningRow,
  PaginationDisplay,
  ReadDisplay,
  ExploreSectionId,
} from "../model/explore-display";
import { exploreCopy as copy } from "../copy";
import { ExplorePagination } from "./explore-pagination";
import styles from "./explore.module.css";

export function ExploreTableSection({
  kind,
  data,
  pagination,
  onPageChange,
}: Readonly<{
  kind: ExploreSectionId;
  data: ReadDisplay<readonly MiningRow[]> | ReadDisplay<readonly BuybackRow[]>;
  pagination?: PaginationDisplay;
  onPageChange?: (page: number) => void;
}>) {
  const heading = useId();
  const buybacks = kind === "buybacks";
  const columns = buybacks
    ? [copy.time, copy.spent, copy.oriBuried, copy.stakingYield]
    : [copy.round, copy.block, copy.winner, copy.winners, copy.deployed];
  const rows = data.status === "populated" ? data.value : [];
  const status = data.status === "populated" ? "empty" : data.status;
  return (
    <section aria-labelledby={heading} className={styles.section}>
      <h2 id={heading}>{copy[kind]}</h2>
      <p className={styles.description}>{copy[`${kind}Description`]}</p>
      <div
        className={styles.tableScroll}
        role="region"
        aria-label={`${copy[kind]} ${copy.table}`}
        tabIndex={0}
        aria-busy={data.status === "loading" || undefined}
      >
        <table
          className={`${styles.table} ${buybacks ? styles.buybacks : styles.mining}`}
          aria-labelledby={heading}
        >
          <colgroup>
            {columns.map((name, i) => (
              <col key={name} className={styles[`column${i}`]} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((name) => (
                <th key={name} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, i) => (
                  <td key={i} title={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p
          className={styles.readState}
          role={status === "error" ? "alert" : "status"}
        >
          {copy[status]}
        </p>
      )}
      <ExplorePagination
        title={copy[kind]}
        page={pagination}
        busy={
          data.status === "loading" ||
          data.status === "unavailable" ||
          data.status === "error"
        }
        onPageChange={onPageChange}
      />
    </section>
  );
}
