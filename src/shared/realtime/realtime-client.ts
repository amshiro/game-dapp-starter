import type { RealtimeEvent, RealtimeSignal } from "./realtime-event";

/** `idle`: no connection wanted; `unavailable`: lost, the transport keeps retrying. */
export type RealtimeStatus =
  "idle" | "connecting" | "connected" | "unavailable" | "failed";

export type RealtimeChannelHandlers = Readonly<{
  onEvent: (event: string, data: unknown) => void;
  onSubscribed: () => void;
  onSubscriptionError: () => void;
}>;

/** One connection; at most one `subscribe` per channel at a time. */
export type RealtimeTransport = Readonly<{
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, handlers: RealtimeChannelHandlers) => void;
  unsubscribe: (channel: string) => void;
}>;

export type RealtimeTransportHooks = Readonly<{
  onStatus: (status: RealtimeStatus) => void;
  onTransportError: () => void;
}>;

export type RealtimeTransportFactory = (
  hooks: RealtimeTransportHooks,
) => Promise<RealtimeTransport>;

/** Value-free: issues name the channel / event, never the payload. */
export type RealtimeIssue =
  | Readonly<{ kind: "transport-load-failed" }>
  | Readonly<{ kind: "transport-error" }>
  | Readonly<{ kind: "subscription-failed"; channel: string }>
  | Readonly<{ kind: "malformed-payload"; channel: string; event: string }>
  | Readonly<{ kind: "listener-failed"; channel: string; event: string }>;

export type RealtimeClient = Readonly<{
  /** Returns an idempotent unsubscribe. The same listener is registered once per event. */
  subscribe: <TPayload>(
    definition: RealtimeEvent<TPayload>,
    listener: (signal: RealtimeSignal<TPayload>) => void,
  ) => () => void;
  getStatus: () => RealtimeStatus;
  onStatusChange: (listener: () => void) => () => void;
}>;

type Listener = (signal: RealtimeSignal<unknown>) => void;

type Registration = {
  definition: RealtimeEvent<unknown>;
  count: number;
};

type ChannelEntry = {
  /** event name → listener → registration */
  events: Map<string, Map<Listener, Registration>>;
  subscribed: boolean;
  confirmedOnce: boolean;
};

export type RealtimeClientOptions = Readonly<{
  createTransport: RealtimeTransportFactory;
  onIssue: (issue: RealtimeIssue) => void;
  /** Delay before releasing unused channels / the connection; absorbs remounts. */
  idleTimeoutMs?: number;
}>;

/**
 * Connection is lazy and reference-counted: the first listener opens it, and it
 * is released `idleTimeoutMs` after the last one leaves. Each channel is bound to
 * the transport once, however many listeners it has. Reconnection and channel
 * re-subscription belong to the transport; the client turns a repeated
 * subscription confirmation into a `resync` signal.
 */
export function createRealtimeClient({
  createTransport,
  onIssue,
  idleTimeoutMs = 1_000,
}: RealtimeClientOptions): RealtimeClient {
  const channels = new Map<string, ChannelEntry>();
  const statusListeners = new Set<() => void>();
  let status: RealtimeStatus = "idle";
  let transport: RealtimeTransport | undefined;
  let loading = false;
  let connected = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  function setStatus(next: RealtimeStatus) {
    if (next === status) return;
    status = next;
    for (const listener of statusListeners) listener();
  }

  function listenerCount() {
    let total = 0;
    for (const entry of channels.values())
      for (const listeners of entry.events.values()) total += listeners.size;
    return total;
  }

  function deliver(
    channel: string,
    listeners: Iterable<[Listener, Registration]>,
    signalFor: (registration: Registration) => RealtimeSignal<unknown>,
    event: string,
  ) {
    for (const [listener, registration] of listeners) {
      let signal: RealtimeSignal<unknown>;
      try {
        signal = signalFor(registration);
      } catch {
        onIssue({ kind: "malformed-payload", channel, event });
        continue;
      }
      try {
        listener(signal);
      } catch {
        // One failing listener must not starve the others.
        onIssue({ kind: "listener-failed", channel, event });
      }
    }
  }

  function bindChannel(channel: string, entry: ChannelEntry) {
    if (!transport || entry.subscribed) return;
    entry.subscribed = true;
    transport.subscribe(channel, {
      onEvent: (event, data) => {
        const listeners = channels.get(channel)?.events.get(event);
        if (!listeners) return;
        deliver(
          channel,
          [...listeners],
          ({ definition }) => ({
            type: "event",
            payload: definition.parse(data),
          }),
          event,
        );
      },
      onSubscribed: () => {
        const current = channels.get(channel);
        if (!current) return;
        if (!current.confirmedOnce) {
          current.confirmedOnce = true;
          return;
        }
        for (const [event, listeners] of current.events)
          deliver(channel, [...listeners], () => ({ type: "resync" }), event);
      },
      onSubscriptionError: () =>
        onIssue({ kind: "subscription-failed", channel }),
    });
  }

  function ensureConnection() {
    if (transport) {
      if (!connected) {
        connected = true;
        transport.connect();
      }
      for (const [channel, entry] of channels) bindChannel(channel, entry);
      return;
    }
    if (loading) return;
    loading = true;
    setStatus("connecting");
    createTransport({
      onStatus: setStatus,
      onTransportError: () => onIssue({ kind: "transport-error" }),
    }).then(
      (created) => {
        loading = false;
        transport = created;
        connected = false;
        if (listenerCount() > 0) ensureConnection();
        else release();
      },
      () => {
        loading = false;
        setStatus("failed");
        onIssue({ kind: "transport-load-failed" });
      },
    );
  }

  function release() {
    for (const [channel, entry] of channels) {
      if (entry.events.size > 0) continue;
      channels.delete(channel);
      if (entry.subscribed) transport?.unsubscribe(channel);
    }
    if (transport && connected && listenerCount() === 0) {
      connected = false;
      transport.disconnect();
      setStatus("idle");
    }
  }

  function scheduleRelease() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = undefined;
      release();
    }, idleTimeoutMs);
  }

  return Object.freeze({
    subscribe<TPayload>(
      definition: RealtimeEvent<TPayload>,
      listener: (signal: RealtimeSignal<TPayload>) => void,
    ) {
      const key = listener as Listener;
      let entry = channels.get(definition.channel);
      if (!entry) {
        entry = { events: new Map(), subscribed: false, confirmedOnce: false };
        channels.set(definition.channel, entry);
      }
      let listeners = entry.events.get(definition.event);
      if (!listeners) {
        listeners = new Map();
        entry.events.set(definition.event, listeners);
      }
      const registration = listeners.get(key);
      if (registration) registration.count += 1;
      else
        listeners.set(key, {
          definition: definition as RealtimeEvent<unknown>,
          count: 1,
        });

      clearTimeout(idleTimer);
      idleTimer = undefined;
      ensureConnection();

      let active = true;
      return () => {
        if (!active) return;
        active = false;
        const current = channels.get(definition.channel);
        const eventListeners = current?.events.get(definition.event);
        const found = eventListeners?.get(key);
        if (!current || !eventListeners || !found) return;
        found.count -= 1;
        if (found.count > 0) return;
        eventListeners.delete(key);
        if (eventListeners.size === 0) current.events.delete(definition.event);
        if (listenerCount() === 0 || current.events.size === 0)
          scheduleRelease();
      };
    },
    getStatus: () => status,
    onStatusChange(listener: () => void) {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
  });
}
