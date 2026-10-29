"use client";

import { StakePanel } from "./components/stake-panel";
import { StakeSummary } from "./components/stake-summary";
import {
  unavailableStakeSummary,
  type StakeSummaryDisplay,
  type StakeReadValue,
} from "./model/stake-display";
import { useStakeCopy } from "./copy";
import type { StakeTransactionUI } from "./transaction/use-stake-transaction";
import styles from "./components/stake.module.css";

export function StakePage({
  summary = unavailableStakeSummary,
  available = { status: "unavailable" },
  staked = { status: "unavailable" },
  transaction,
  draftScope,
}: Readonly<{
  summary?: StakeSummaryDisplay;
  available?: StakeReadValue;
  staked?: StakeReadValue;
  transaction?: StakeTransactionUI;
  draftScope?: string;
}>) {
  const copy = useStakeCopy();
  return (
    <div className={styles.page}>
      <h1 className="text-page-title font-bold">{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>
      <StakePanel
        transaction={transaction}
        draftScope={draftScope}
        available={available}
        staked={staked}
      />
      <StakeSummary values={summary} />
    </div>
  );
}
