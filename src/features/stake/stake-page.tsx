"use client";

import { StakePanel } from "./components/stake-panel";
import { StakeSummary } from "./components/stake-summary";
import {
  unavailableStakeSummary,
  type StakeSummaryDisplay,
  type StakeReadValue,
} from "./model/stake-display";
import { useStakeCopy } from "./copy";
import styles from "./components/stake.module.css";

export function StakePage({
  summary = unavailableStakeSummary,
  available = { status: "unavailable" },
  staked = { status: "unavailable" },
  onRefresh,
  refreshing = false,
}: Readonly<{
  summary?: StakeSummaryDisplay;
  available?: StakeReadValue;
  staked?: StakeReadValue;
  onRefresh?: () => void;
  refreshing?: boolean;
}>) {
  const copy = useStakeCopy();
  return (
    <div className={styles.page}>
      <h1 className="text-page-title font-bold">{copy.title}</h1>
      <StakePanel
        available={available}
        staked={staked}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <StakeSummary values={summary} />
    </div>
  );
}
