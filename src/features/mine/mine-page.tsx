"use client";
import { MineCell } from "./components/mine-cell";
import { useMineCopy } from "./copy";
import { mineAmount, type MineBoardDisplay } from "./read/mine-display";
import styles from "./components/mine.module.css";

export function MinePage({
  display = { status: "unavailable" },
  onRefresh,
  refreshing = false,
}: Readonly<{
  display?: MineBoardDisplay;
  onRefresh?: () => void;
  refreshing?: boolean;
}>) {
  const copy = useMineCopy();
  const snapshot =
    display.status === "populated" ? display.snapshot : undefined;
  const round = snapshot?.roundId.toString() ?? "—";
  const total = snapshot ? mineAmount(snapshot.totalDeployed) : undefined;
  // Figma example values are visual placeholders only; never use them as runtime business data.
  const message =
    display.status === "populated"
      ? snapshot?.transition
        ? copy.waiting
        : copy.unavailable
      : copy[display.status];
  const metrics = [
    {
      label: copy.motherlode,
      text: "—",
      exact: copy.unavailable,
      accent: true,
    },
    { label: copy.remaining, text: "—", exact: copy.unavailable },
    {
      label: copy.total,
      text: total?.text ?? "—",
      exact: total ? `${total.exact} BNB` : copy.unavailable,
      unit: "BNB",
    },
    // No personal read or unapproved rewards/price/Motherlode semantics in this public board slice.
    { label: copy.personal, text: "—", exact: copy.unavailable },
  ];
  return (
    <section className={styles.page} aria-labelledby="mine-title">
      <h1 id="mine-title" className="sr-only">
        {copy.title}
      </h1>
      <div className={styles.toolbar}>
        <span className={styles.round}>
          {copy.storedRound}: #{round}
        </span>
        <button
          type="button"
          className={styles.refresh}
          disabled={!onRefresh || refreshing}
          onClick={onRefresh}
        >
          {refreshing ? copy.loading : copy.refresh}
        </button>
      </div>
      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`${styles.metric} ${metric.accent ? styles.accent : ""}`}
          >
            <dt>{metric.label}</dt>
            <dd
              title={metric.exact}
              aria-label={`${metric.label}: ${metric.exact}`}
            >
              <span>{metric.text}</span>
              {metric.unit && <small>{metric.unit}</small>}
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.notice} role="status" aria-live="polite">
        {message} · {copy.readOnly}
      </p>
      {/* Q-18/Q-19 are open: cells expose no selection interaction, even when the wallet is connected. */}
      <ol
        className={styles.board}
        aria-label={`${copy.board} · BNB`}
        aria-busy={display.status === "loading"}
      >
        {Array.from({ length: 25 }, (_, index) => (
          <MineCell
            key={index}
            index={index}
            amount={snapshot?.deployedPerSquare[index]}
            miners={snapshot?.minersPerSquare[index]}
          />
        ))}
      </ol>
      <section className={styles.miners} aria-labelledby="miners-title">
        <div className={styles.minersHeader}>
          <h2 id="miners-title">{copy.miners}</h2>
          <span>
            {copy.round}: #{round}
          </span>
        </div>
        <p className={styles.minersUnavailable}>{copy.unavailable}</p>
      </section>
    </section>
  );
}
