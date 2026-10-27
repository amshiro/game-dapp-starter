"use client";
import { MinePage } from "./mine-page";
import { useMineBoard } from "./read/use-mine-board";
import type { MineReadContext } from "./read/mine-read-query";
export function MineReadPage({
  context,
}: Readonly<{ context: MineReadContext }>) {
  const reads = useMineBoard(context);
  return (
    <MinePage
      display={reads.display}
      refreshing={reads.refreshing}
      onRefresh={reads.canRefresh ? reads.refresh : undefined}
    />
  );
}
