import { StakePanel } from "./components/stake-panel";
import { StakeSummary } from "./components/stake-summary";
import {
  unavailableStakeSummary,
  type StakeSummaryDisplay,
} from "./model/stake-display";
import { stakeCopy as copy } from "./copy";
import styles from "./components/stake.module.css";

export function StakePage({
  summary = unavailableStakeSummary,
}: Readonly<{ summary?: StakeSummaryDisplay }>) {
  return (
    <div className={styles.page}>
      <h1 className="text-page-title font-bold">{copy.title}</h1>
      <StakePanel />
      <StakeSummary values={summary} />
    </div>
  );
}
