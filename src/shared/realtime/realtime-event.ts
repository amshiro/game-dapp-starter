/**
 * A typed (channel, event) pair. `parse` is the payload boundary: it receives the
 * decoded wire data as `unknown` and throws when the payload is malformed, in
 * which case the listener is not called.
 */
export type RealtimeEvent<TPayload> = Readonly<{
  channel: string;
  event: string;
  parse: (data: unknown) => TPayload;
}>;

/**
 * What a listener receives: an event, or `resync` after the channel was
 * re-subscribed following a connection gap, during which events may have been
 * missed. Freshness listeners usually treat both the same way (refetch).
 */
export type RealtimeSignal<TPayload> =
  Readonly<{ type: "event"; payload: TPayload }> | Readonly<{ type: "resync" }>;

export function defineRealtimeEvent<TPayload = unknown>(definition: {
  channel: string;
  event: string;
  parse?: (data: unknown) => TPayload;
}): RealtimeEvent<TPayload> {
  return Object.freeze({
    channel: definition.channel,
    event: definition.event,
    parse: definition.parse ?? ((data: unknown) => data as TPayload),
  });
}
