import type PusherClient from "pusher-js";
import type { Options } from "pusher-js";
import type { RealtimeEndpoint } from "../config/realtime-capability";
import type {
  RealtimeStatus,
  RealtimeTransport,
  RealtimeTransportFactory,
} from "./realtime-client";

type PusherConstructor = new (appKey: string, options: Options) => PusherClient;

const STATUS: Readonly<Record<string, RealtimeStatus>> = {
  initialized: "idle",
  connecting: "connecting",
  connected: "connected",
  unavailable: "unavailable",
  failed: "failed",
  disconnected: "idle",
};

// Loaded on first use so the protocol client stays out of the initial bundle.
const loadPusher = async (): Promise<PusherConstructor> =>
  (await import("pusher-js")).default;

/**
 * Pusher-protocol transport (Laravel broadcasting servers speak it). pusher-js
 * owns reconnection, backoff, ping / pong and re-subscription after reconnect.
 * WebSocket only: no HTTP fallbacks, no stats beacon, no auth (public channels).
 */
export function createPusherTransportFactory(
  endpoint: RealtimeEndpoint,
  load: () => Promise<PusherConstructor> = loadPusher,
): RealtimeTransportFactory {
  return async ({ onStatus, onTransportError }) => {
    const Pusher = await load();
    let pusher: PusherClient | undefined;

    const transport: RealtimeTransport = {
      connect() {
        if (pusher) {
          pusher.connect();
          return;
        }
        // The constructor connects immediately; build it only when wanted.
        pusher = new Pusher(endpoint.appKey, {
          // Required by the v8 constructor; unused once wsHost is set.
          cluster: "",
          wsHost: endpoint.host,
          wsPort: endpoint.port,
          wssPort: endpoint.port,
          wsPath: endpoint.path,
          forceTLS: endpoint.tls,
          enabledTransports: ["ws", "wss"],
          enableStats: false,
        });
        pusher.connection.bind(
          "state_change",
          ({ current }: { current: string }) =>
            onStatus(STATUS[current] ?? "unavailable"),
        );
        // Error objects may carry frame contents; report the fact only.
        pusher.connection.bind("error", () => onTransportError());
      },
      disconnect() {
        pusher?.disconnect();
      },
      subscribe(name, handlers) {
        if (!pusher) throw new Error("realtime transport is not connected");
        pusher.subscribe(name).bind_global((event: string, data: unknown) => {
          if (event === "pusher:subscription_succeeded") {
            handlers.onSubscribed();
          } else if (event === "pusher:subscription_error") {
            handlers.onSubscriptionError();
          } else if (
            !event.startsWith("pusher:") &&
            !event.startsWith("pusher_internal:")
          ) {
            handlers.onEvent(event, data);
          }
        });
      },
      unsubscribe(name) {
        pusher?.channel(name)?.unbind_global();
        pusher?.unsubscribe(name);
      },
    };
    return transport;
  };
}
