"use client";
import { MineRealtime } from "./realtime/mine-realtime";
import { MinePage } from "./mine-page";
import { useMineBoard } from "./read/use-mine-board";
import { useMineManual } from "./transaction/use-mine-manual";
import { useMineRewards } from "./read/use-mine-rewards";
import { useMineWinners } from "./read/use-mine-winners";
import { useMineClaim } from "./transaction/use-mine-claim";
import { useMineAuto } from "./transaction/use-mine-auto";
import type { ManualContext } from "./transaction/manual-transaction";

export function MineReadPage({
  context,
  onConnect,
}: Readonly<{
  context: ManualContext;
  onConnect?: () => void;
}>) {
  const reads = useMineBoard(context);
  const rewards = useMineRewards(context);
  // Hide failed/wrong-chain cached snapshots from both presentation and submission permission.
  const snapshot =
    reads.display.status === "populated" ? reads.display.snapshot : undefined;
  const winners = useMineWinners(context, snapshot);
  const manual = useMineManual(context, snapshot, onConnect);
  // Completed Manual deployment is not an Auto registration lock; only pending signing/confirmation blocks concurrency.
  const auto = useMineAuto(context, manual.selected, manual.busy, onConnect);
  // Unknown automation state fails closed for both write paths; local drafts remain editable.
  const claim = useMineClaim(
    context,
    rewards.display,
    manual.busy || auto.busy,
  );
  const manualAllowed =
    auto.accountReady && !auto.active && !auto.busy && !claim.busy;
  return (
    <>
      {context.targetChainId === 97 && !context.wrongChain && (
        <MineRealtime context={context} snapshot={snapshot} />
      )}
      <MinePage
        results={winners.display}
        claim={claim}
        auto={{
          ...auto,
          formBusy: auto.formBusy || claim.busy,
          canSubmit: auto.canSubmit && !claim.busy,
          canStop: auto.canStop && !claim.busy,
          submit: () => {
            if (!claim.busy) auto.submit();
          },
          stop: () => {
            if (!claim.busy) auto.stop();
          },
        }}
        rewards={rewards.display}
        onRewardsRefresh={rewards.canRefresh ? rewards.refresh : undefined}
        manual={{
          ...manual,
          busy: manual.busy || auto.busy || claim.busy,
          canSubmit: manual.canSubmit && manualAllowed,
          submit: () => {
            if (manualAllowed) manual.submit();
          },
        }}
        display={reads.display}
        motherlodeOre={reads.motherlodeOre}
        refreshing={reads.refreshing}
        onRefresh={
          reads.canRefresh
            ? () => {
                reads.refresh();
                manual.refresh();
                auto.refresh();
                rewards.refresh();
                winners.refresh();
              }
            : undefined
        }
      />
    </>
  );
}
