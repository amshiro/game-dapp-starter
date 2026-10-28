"use client";
import type { BettingPresentation } from "./model/mine-presentation";
import { MinePage } from "./mine-page";
import { useMineBoard } from "./read/use-mine-board";
import type { MineReadContext } from "./read/mine-read-query";
export function MineReadPage({
  context,
  betting,
}: Readonly<{ context: MineReadContext; betting?: BettingPresentation }>) {
  const reads = useMineBoard(context);
  return (
    <MinePage
      actionPresentation={{ kind: "form", betting }}
      display={reads.display}
      refreshing={reads.refreshing}
      onRefresh={reads.canRefresh ? reads.refresh : undefined}
    />
  );
}
