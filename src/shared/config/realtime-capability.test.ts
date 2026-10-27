import { describe, expect, test } from "vitest";
import { oriRealtimeEvents } from "./ori-realtime-events";
import {
  parsePublicConfig,
  type PublicConfigInput,
} from "./parse-public-config";
import { resolveRealtimeCapability } from "./realtime-capability";

// Fake, non-routable endpoint and key.
const complete = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_WS_URL: "wss://ws.example.test",
  NEXT_PUBLIC_PUSHER_APP_KEY: "fake-pusher-key",
} as const;

function resolve(input: PublicConfigInput) {
  return resolveRealtimeCapability(() => parsePublicConfig(input));
}

describe("realtime capability", () => {
  test("wss origin + key → TLS endpoint on 443 with no path prefix", () => {
    expect(resolve(complete)).toEqual({
      status: "configured",
      endpoint: {
        appKey: "fake-pusher-key",
        host: "ws.example.test",
        port: 443,
        tls: true,
        path: "",
      },
    });
  });

  test("ws URL with port and path prefix", () => {
    expect(
      resolve({ ...complete, NEXT_PUBLIC_WS_URL: "ws://localhost:6001/ws/" }),
    ).toMatchObject({
      status: "configured",
      endpoint: { host: "localhost", port: 6001, tls: false, path: "/ws" },
    });
  });

  test.each([
    [{ NEXT_PUBLIC_WS_URL: undefined }, ["NEXT_PUBLIC_WS_URL"]],
    [{ NEXT_PUBLIC_PUSHER_APP_KEY: " " }, ["NEXT_PUBLIC_PUSHER_APP_KEY"]],
    [
      { NEXT_PUBLIC_WS_URL: "", NEXT_PUBLIC_PUSHER_APP_KEY: "" },
      ["NEXT_PUBLIC_WS_URL", "NEXT_PUBLIC_PUSHER_APP_KEY"],
    ],
  ])("missing values → incomplete (%#)", (patch, missing) => {
    expect(resolve({ ...complete, ...patch })).toEqual({
      status: "unavailable",
      reason: "incomplete",
      missing,
    });
  });

  test.each([
    "wss://ws.example.test/app/fake-pusher-key",
    "wss://ws.example.test/app",
    "wss://ws.example.test/?protocol=7",
  ])("URL that pre-empts the protocol path or query → invalid: %s", (url) => {
    expect(resolve({ ...complete, NEXT_PUBLIC_WS_URL: url })).toMatchObject({
      status: "unavailable",
      reason: "invalid",
    });
  });

  test("unparseable public config → invalid, without the raw value", () => {
    const capability = resolve({
      ...complete,
      NEXT_PUBLIC_WS_URL: "https://fake-secretish.example.test",
    });
    expect(capability).toEqual({
      status: "unavailable",
      reason: "invalid",
      message: expect.stringContaining("NEXT_PUBLIC_WS_URL"),
    });
    expect(JSON.stringify(capability)).not.toContain("fake-secretish");
  });
});

describe("ORI realtime event catalog", () => {
  test("wire names match the legacy Echo subscriptions without the namespace dot", () => {
    expect(
      Object.values(oriRealtimeEvents).map(({ channel, event }) => [
        channel,
        event,
      ]),
    ).toEqual([
      ["round.new_round", "round.data.started"],
      ["round.reset", "round.data.reset"],
    ]);
  });

  test("payloads pass through untyped (schema Unknown)", () => {
    const payload = { anything: 1 };
    expect(oriRealtimeEvents.roundReset.parse(payload)).toBe(payload);
  });
});
