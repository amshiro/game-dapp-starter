"use client";

import { StakePage } from "./stake-page";
import { unavailableStakeSummary } from "./model/stake-display";
import type { StakeReadContext } from "./read/stake-read-context";
import { useStakeTransaction } from "./transaction/use-stake-transaction";
import { useStakeReads } from "./read/use-stake-reads";

export function StakeReadPage({
  context,
}: Readonly<{ context: StakeReadContext }>) {
  const reads = useStakeReads(context);
  const transaction = useStakeTransaction(context);
  const draftScope =
    context.targetChainId === 97 &&
    context.account.status === "connected" &&
    context.account.chainId === 97
      ? `${context.targetChainId}:${context.account.address.toLowerCase()}`
      : undefined;
  return (
    <StakePage
      transaction={transaction}
      draftScope={draftScope}
      available={reads.available}
      staked={reads.staked}
      summary={{ ...unavailableStakeSummary, totalDeposit: reads.total }}
      onRefresh={
        reads.canRefresh
          ? () => {
              reads.refresh();
              transaction.refreshAllowance();
            }
          : undefined
      }
      refreshing={reads.refreshing}
    />
  );
}
