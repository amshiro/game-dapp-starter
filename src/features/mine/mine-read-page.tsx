"use client";
import { MinePage } from "./mine-page";
import { useMineBoard } from "./read/use-mine-board";
import { useMineManual } from "./transaction/use-mine-manual";
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
  // Hide failed/wrong-chain cached snapshots from both presentation and submission permission.
  const snapshot =
    reads.display.status === "populated" ? reads.display.snapshot : undefined;
  const manual = useMineManual(context, snapshot, onConnect);
  const auto = useMineAuto(context, manual.selected, manual.busy, onConnect);
  // Unknown automation state fails closed for both write paths; local drafts remain editable.
  const manualAllowed = auto.accountReady && !auto.active && !auto.busy;
  return (
    <MinePage
      auto={auto}
      manual={{
        ...manual,
        busy: manual.busy || auto.busy,
        canSubmit: manual.canSubmit && manualAllowed,
        submit: () => {
          if (manualAllowed) manual.submit();
        },
      }}
      display={reads.display}
      refreshing={reads.refreshing}
      onRefresh={
        reads.canRefresh
          ? () => {
              reads.refresh();
              manual.refresh();
              auto.refresh();
            }
          : undefined
      }
    />
  );
}
