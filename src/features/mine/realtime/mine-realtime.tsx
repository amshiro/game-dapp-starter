"use client";
import { useLayoutEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeEvent } from "../../../shared/realtime/realtime-provider";
import { oriRealtimeEvents } from "../../../shared/config/ori-realtime-events";
import type { ManualContext } from "../transaction/manual-transaction";
import type { MineBoardSnapshot } from "../read/mine-read-query";
import {
  MineRealtimeRefresh,
  mineRealtimeReadKeys,
} from "./mine-realtime-refresh";
export function MineRealtime({
  context,
  snapshot,
}: Readonly<{ context: ManualContext; snapshot?: MineBoardSnapshot }>) {
  const client = useQueryClient(),
    [refresh] = useState(() => new MineRealtimeRefresh());
  const keys = mineRealtimeReadKeys(context, snapshot);
  // Publish only committed context. Equal resource scopes preserve a pending batch across ordinary form renders.
  useLayoutEffect(() => {
    refresh.configure(client, keys);
  }, [refresh, client, keys]);
  useLayoutEffect(() => () => refresh.dispose(), [refresh]);
  useRealtimeEvent(oriRealtimeEvents.roundStarted, () => refresh.signal());
  useRealtimeEvent(oriRealtimeEvents.roundReset, () => refresh.signal());
  return null;
}
