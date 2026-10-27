import type { PublicConfig, PublicConfigInput } from "./parse-public-config";

type RealtimeCapabilityKey = Extract<
  keyof PublicConfigInput,
  "NEXT_PUBLIC_WS_URL" | "NEXT_PUBLIC_PUSHER_APP_KEY"
>;

/** Connection facts for a Pusher-protocol server; the key is a public app key. */
export type RealtimeEndpoint = Readonly<{
  appKey: string;
  host: string;
  port: number;
  tls: boolean;
  /** Prefix before the protocol's `/app/<key>`; empty for a bare origin. */
  path: string;
}>;

export type RealtimeCapability =
  | Readonly<{ status: "configured"; endpoint: RealtimeEndpoint }>
  | Readonly<{
      status: "unavailable";
      reason: "incomplete";
      missing: readonly RealtimeCapabilityKey[];
    }>
  | Readonly<{ status: "unavailable"; reason: "invalid"; message: string }>;

function invalid(message: string): RealtimeCapability {
  return Object.freeze({ status: "unavailable", reason: "invalid", message });
}

/**
 * Realtime is optional: without it the app keeps its polling freshness. The URL
 * names the server; the client appends `/app/<key>` itself, so a configured URL
 * that already carries it (or a query / fragment) is rejected rather than guessed at.
 */
export function resolveRealtimeCapability(
  readConfig: () => PublicConfig,
): RealtimeCapability {
  let config: PublicConfig;
  try {
    config = readConfig();
  } catch (error) {
    return invalid(
      error instanceof Error ? error.message : "public config is unreadable",
    );
  }

  const { wsUrl, pusherAppKey } = config;
  if (wsUrl === undefined || pusherAppKey === undefined) {
    const missing: RealtimeCapabilityKey[] = [];
    if (wsUrl === undefined) missing.push("NEXT_PUBLIC_WS_URL");
    if (pusherAppKey === undefined) missing.push("NEXT_PUBLIC_PUSHER_APP_KEY");
    return Object.freeze({
      status: "unavailable",
      reason: "incomplete",
      missing: Object.freeze(missing),
    });
  }

  const url = new URL(wsUrl);
  if (url.search || url.hash) {
    return invalid("NEXT_PUBLIC_WS_URL: must not contain query or fragment");
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (/(^|\/)app(\/|$)/.test(path)) {
    return invalid("NEXT_PUBLIC_WS_URL: must not include the /app/<key> path");
  }
  const tls = url.protocol === "wss:";
  return Object.freeze({
    status: "configured",
    endpoint: Object.freeze({
      appKey: pusherAppKey,
      host: url.hostname,
      port: url.port ? Number(url.port) : tls ? 443 : 80,
      tls,
      path,
    }),
  });
}
