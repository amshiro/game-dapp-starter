import { defineRealtimeEvent } from "../realtime/realtime-event";

/**
 * ORI public realtime events (docs/project/api.md#realtime). Wire event names:
 * the old client listened with Laravel Echo's leading-dot form
 * (`.round.data.started`), which means "no namespace", i.e. exactly these names.
 *
 * Payloads stay `unknown`: the backend has not published their schema and the
 * Development server could not be observed (Q-47). Consumers use these events as
 * freshness signals only and re-read state through the API.
 */
export const oriRealtimeEvents = Object.freeze({
  roundStarted: defineRealtimeEvent({
    channel: "round.new_round",
    event: "round.data.started",
  }),
  roundReset: defineRealtimeEvent({
    channel: "round.reset",
    event: "round.data.reset",
  }),
});
