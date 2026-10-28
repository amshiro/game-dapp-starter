"use client";
import type { MineCellVisual } from "../model/mine-presentation";
import { useMineCopy } from "../copy";
import { mineAmount, mineCount } from "../read/mine-display";
import styles from "./mine.module.css";

/** Presentation-only Figma variants. No click handler or selection policy belongs here. */
export type MineCellProps = Readonly<{
  /** ABI index 0–24; the visible Figma label is #1–#25. */
  index: number;
  /** Native BNB wei, not ORI or a formatted decimal. Undefined stays unavailable. */
  amount?: bigint;
  /** Per-square participation count; never a round-wide unique miner count. */
  miners?: bigint;
  /** Isolated presentation capability; the formal route currently supplies only default. */
  visual?: MineCellVisual;
  ownAmount?: bigint;
}>;
export function MineCell({
  index,
  amount,
  miners,
  visual = "default",
  ownAmount,
}: MineCellProps) {
  const copy = useMineCopy();
  const value = amount === undefined ? undefined : mineAmount(amount);
  const own =
    ownAmount === undefined ||
    !["deployed", "combined", "auto-selected", "auto-muted"].includes(visual)
      ? undefined
      : mineAmount(ownAmount);
  const exact =
    visual !== "waiting" && value ? `${value.exact} BNB` : copy.unavailable;
  const count = miners?.toString() ?? copy.unavailable;
  return (
    <li
      className={styles.cell}
      data-visual={visual}
      aria-label={`#${index + 1}; ${copy.states[visual]}; ${copy.count}: ${count}; ${copy.amount}: ${exact}${own ? `; ${copy.ownAmount}: ${own.exact} BNB` : ""}`}
    >
      <div className={styles.cellTop} aria-hidden="true">
        <span className={styles.index}>#{index + 1}</span>
        <span className={styles.count} title={count}>
          <span>{miners === undefined ? "—" : mineCount(miners)}</span>
          {/* Exact Figma 8×8 participant icon; count is per square, never unique round miners. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ori/mine/participants.svg" width={8} height={8} alt="" />
        </span>
      </div>
      {own &&
        ["deployed", "combined", "auto-selected", "auto-muted"].includes(
          visual,
        ) && (
          <span
            className={styles.ownAmount}
            title={`${own.exact} BNB`}
            aria-hidden="true"
          >
            {own.text}
          </span>
        )}
      {visual !== "waiting" && (
        <span className={styles.cellAmount} title={exact} aria-hidden="true">
          {value?.text ?? "—"}
        </span>
      )}
    </li>
  );
}
