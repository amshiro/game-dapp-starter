"use client";

import { StakePage } from "./stake-page";
import { unavailableStakeSummary } from "./model/stake-display";
import type { StakeReadContext } from "./read/stake-read-context";
import { useStakeReads } from "./read/use-stake-reads";

export function StakeReadPage({
  context,
}: Readonly<{ context: StakeReadContext }>) {
  const reads = useStakeReads(context);
  return (
    <StakePage
      available={reads.available}
      staked={reads.staked}
      summary={{ ...unavailableStakeSummary, totalDeposit: reads.total }}
      onRefresh={reads.canRefresh ? reads.refresh : undefined}
      refreshing={reads.refreshing}
    />
  );
}
