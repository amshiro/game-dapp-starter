"use client";
import { MinePage } from "./mine-page";
import { useMineBoard } from "./read/use-mine-board";
import { useMineManual } from "./transaction/use-mine-manual";
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
  return (
    <MinePage
      manual={manual}
      display={reads.display}
      refreshing={reads.refreshing}
      onRefresh={
        reads.canRefresh
          ? () => {
              reads.refresh();
              manual.refresh();
            }
          : undefined
      }
    />
  );
}
