"use client";

import type { ExploreDisplay, StatisticId } from "../model/explore-display";
import { useExploreCopy } from "../copy";
import styles from "./explore.module.css";

const order: readonly StatisticId[] = [
  "maxSupply",
  "circulatingSupply",
  "buried",
  "protocolRevenue",
];
export function ExploreStatistics({
  values,
}: Readonly<{ values: ExploreDisplay["statistics"] }>) {
  const copy = useExploreCopy();
  return (
    <section aria-label={copy.statistics}>
      <dl className={styles.statistics}>
        {order.map((id) => {
          const state = values[id];
          return (
            <div
              key={id}
              className={styles.statistic}
              aria-busy={state.status === "loading" || undefined}
            >
              <dt>{copy[id]}</dt>
              <dd
                aria-label={
                  state.status === "populated" ? undefined : copy[state.status]
                }
              >
                {id === "maxSupply" && (
                  <>
                    {/* Current Figma 16px raster, not a final Q-03 brand decision. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/ori/explore/ori-token.png"
                      width={16}
                      height={16}
                      alt=""
                    />
                  </>
                )}
                <span>{state.status === "populated" ? state.value : "—"}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
