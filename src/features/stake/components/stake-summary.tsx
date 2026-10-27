import { stakeCopy as copy } from "../copy";
import type { StakeSummaryDisplay } from "../model/stake-display";
import styles from "./stake.module.css";

export function StakeSummary({
  values,
}: Readonly<{ values: StakeSummaryDisplay }>) {
  return (
    <section aria-label={copy.summary} className={styles.summary}>
      <h2>{copy.summary}</h2>
      <dl>
        {(["totalDeposit", "apr", "tvl"] as const).map((key) => {
          const value = values[key];
          return (
            <div
              key={key}
              className={styles.summaryRow}
              aria-busy={value.status === "loading" || undefined}
            >
              <dt>
                {copy[key]}
                {/* Q-24 content/behavior is still open; this is not a guessed tooltip or clickable Info control. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ori/stake/info.svg" width={12} height={12} alt="" />
              </dt>
              <dd
                title={
                  value.status === "populated" && value.exact
                    ? `${value.exact} ORI`
                    : undefined
                }
                aria-label={
                  value.status === "populated"
                    ? value.exact
                      ? `${value.exact} ORI`
                      : undefined
                    : copy[value.status]
                }
              >
                {value.status === "populated"
                  ? `${value.text}${value.exact ? " ORI" : ""}`
                  : "—"}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
