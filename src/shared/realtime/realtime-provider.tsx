"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { RealtimeCapability } from "../config/realtime-capability";
import { createPusherTransportFactory } from "./pusher-transport";
import {
  createRealtimeClient,
  type RealtimeClient,
  type RealtimeIssue,
  type RealtimeStatus,
} from "./realtime-client";
import type { RealtimeEvent, RealtimeSignal } from "./realtime-event";

const RealtimeContext = createContext<RealtimeClient | undefined>(undefined);

function reportIssue(issue: RealtimeIssue) {
  // Value-free by construction: kind plus channel / event names only.
  console.warn("[realtime]", issue);
}

/**
 * Owns the one realtime client of the tree. Creating it opens nothing: the
 * connection starts with the first `useRealtimeEvent` and is released when the
 * last one unmounts. Without a configured capability the hooks are no-ops.
 */
export function RealtimeProvider({
  capability,
  children,
}: Readonly<{ capability: RealtimeCapability; children: ReactNode }>) {
  const [client] = useState(() =>
    capability.status === "configured"
      ? createRealtimeClient({
          createTransport: createPusherTransportFactory(capability.endpoint),
          onIssue: reportIssue,
        })
      : undefined,
  );
  return <RealtimeContext value={client}>{children}</RealtimeContext>;
}

/**
 * Subscribe for the lifetime of the component. `definition` must be a stable
 * (module-level) value; the listener may change between renders freely.
 */
export function useRealtimeEvent<TPayload>(
  definition: RealtimeEvent<TPayload>,
  listener: (signal: RealtimeSignal<TPayload>) => void,
): void {
  const client = useContext(RealtimeContext);
  const onSignal = useEffectEvent(listener);
  useEffect(
    () => client?.subscribe(definition, (signal) => onSignal(signal)),
    [client, definition],
  );
}

const noSubscription = () => () => {};

/** `disabled` when realtime is not configured; polling is then the only freshness source. */
export function useRealtimeStatus(): RealtimeStatus | "disabled" {
  const client = useContext(RealtimeContext);
  return useSyncExternalStore(
    client?.onStatusChange ?? noSubscription,
    () => client?.getStatus() ?? "disabled",
    () => (client ? "idle" : "disabled"),
  );
}
