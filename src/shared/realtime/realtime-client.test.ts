import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createRealtimeClient,
  type RealtimeChannelHandlers,
  type RealtimeIssue,
  type RealtimeTransportHooks,
} from "./realtime-client";
import { defineRealtimeEvent } from "./realtime-event";

// Synthetic test channels / events; not ORI payloads.
const started = defineRealtimeEvent({ channel: "test.a", event: "started" });
const reset = defineRealtimeEvent({ channel: "test.a", event: "reset" });
const other = defineRealtimeEvent({ channel: "test.b", event: "started" });
const strict = defineRealtimeEvent({
  channel: "test.a",
  event: "started",
  parse: (data) => {
    if (typeof data !== "object" || data === null || !("id" in data))
      throw new Error("malformed");
    return data as { id: unknown };
  },
});

function fakeTransport() {
  const state = {
    hooks: undefined as RealtimeTransportHooks | undefined,
    channels: new Map<string, RealtimeChannelHandlers>(),
    connects: 0,
    disconnects: 0,
    subscribes: [] as string[],
    unsubscribes: [] as string[],
  };
  const createTransport = vi.fn(async (hooks: RealtimeTransportHooks) => {
    state.hooks = hooks;
    return {
      connect: () => {
        state.connects += 1;
      },
      disconnect: () => {
        state.disconnects += 1;
      },
      subscribe: (channel: string, handlers: RealtimeChannelHandlers) => {
        if (state.channels.has(channel)) throw new Error("double subscribe");
        state.subscribes.push(channel);
        state.channels.set(channel, handlers);
      },
      unsubscribe: (channel: string) => {
        state.unsubscribes.push(channel);
        state.channels.delete(channel);
      },
    };
  });
  const emit = (channel: string, event: string, data: unknown) =>
    state.channels.get(channel)?.onEvent(event, data);
  const confirm = (channel: string) =>
    state.channels.get(channel)?.onSubscribed();
  return { state, createTransport, emit, confirm };
}

function setup(createTransport = fakeTransport()) {
  const issues: RealtimeIssue[] = [];
  const client = createRealtimeClient({
    createTransport: createTransport.createTransport,
    onIssue: (issue) => issues.push(issue),
    idleTimeoutMs: 1_000,
  });
  return { client, issues, ...createTransport };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("realtime client", () => {
  test("creating a client opens nothing", () => {
    const { createTransport, client } = setup();
    expect(createTransport).not.toHaveBeenCalled();
    expect(client.getStatus()).toBe("idle");
  });

  test("first subscription loads the transport, connects, then binds the channel", async () => {
    const { client, state } = setup();
    client.subscribe(started, () => {});
    expect(client.getStatus()).toBe("connecting");
    await vi.runAllTimersAsync();
    expect(state.connects).toBe(1);
    expect(state.subscribes).toEqual(["test.a"]);
  });

  test("transport status is mirrored and observable", async () => {
    const { client, state } = setup();
    const onChange = vi.fn();
    client.onStatusChange(onChange);
    client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    state.hooks!.onStatus("connected");
    expect(client.getStatus()).toBe("connected");
    state.hooks!.onStatus("connected");
    expect(onChange).toHaveBeenCalledTimes(2); // connecting, connected
  });

  test("events reach only listeners of that channel and event", async () => {
    const { client, emit } = setup();
    const onStarted = vi.fn();
    const onReset = vi.fn();
    const onOther = vi.fn();
    client.subscribe(started, onStarted);
    client.subscribe(reset, onReset);
    client.subscribe(other, onOther);
    await vi.runAllTimersAsync();
    emit("test.a", "started", { n: 1 });
    emit("test.a", "unknown-event", {});
    expect(onStarted).toHaveBeenCalledWith({
      type: "event",
      payload: { n: 1 },
    });
    expect(onReset).not.toHaveBeenCalled();
    expect(onOther).not.toHaveBeenCalled();
  });

  test("one transport subscription per channel, however many listeners", async () => {
    const { client, state } = setup();
    client.subscribe(started, () => {});
    client.subscribe(reset, () => {});
    client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    client.subscribe(reset, () => {});
    expect(state.subscribes).toEqual(["test.a"]);
  });

  test("the same listener registered twice is called once and needs both releases", async () => {
    const { client, emit, state } = setup();
    const listener = vi.fn();
    const first = client.subscribe(started, listener);
    const second = client.subscribe(started, listener);
    await vi.runAllTimersAsync();
    emit("test.a", "started", 1);
    expect(listener).toHaveBeenCalledTimes(1);

    first();
    first(); // idempotent
    emit("test.a", "started", 2);
    expect(listener).toHaveBeenCalledTimes(2);

    second();
    emit("test.a", "started", 3);
    expect(listener).toHaveBeenCalledTimes(2);
    await vi.runAllTimersAsync();
    expect(state.unsubscribes).toEqual(["test.a"]);
  });

  test("last unsubscribe releases channel and connection after the idle delay", async () => {
    const { client, state } = setup();
    const off = client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    off();
    expect(state.disconnects).toBe(0);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(state.unsubscribes).toEqual(["test.a"]);
    expect(state.disconnects).toBe(1);
    expect(client.getStatus()).toBe("idle");
  });

  test("remount within the idle delay keeps the connection (StrictMode, route change)", async () => {
    const { client, state } = setup();
    const off = client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    off();
    client.subscribe(started, () => {});
    await vi.advanceTimersByTimeAsync(5_000);
    expect(state.disconnects).toBe(0);
    expect(state.unsubscribes).toEqual([]);
    expect(state.subscribes).toEqual(["test.a"]);
  });

  test("an emptied channel is released while others stay connected", async () => {
    const { client, state } = setup();
    const offA = client.subscribe(started, () => {});
    client.subscribe(other, () => {});
    await vi.runAllTimersAsync();
    offA();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(state.unsubscribes).toEqual(["test.a"]);
    expect(state.disconnects).toBe(0);
  });

  test("subscribing again after release reconnects the same transport", async () => {
    const { client, state, createTransport } = setup();
    const off = client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    off();
    await vi.advanceTimersByTimeAsync(1_000);
    client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(state.connects).toBe(2);
    expect(state.subscribes).toEqual(["test.a", "test.a"]);
  });

  test("unsubscribing before the transport loads leaves nothing connected", async () => {
    const { client, state } = setup();
    const off = client.subscribe(started, () => {});
    off();
    await vi.runAllTimersAsync();
    expect(state.connects).toBe(0);
    expect(state.subscribes).toEqual([]);
  });

  test("re-confirmed subscription after a connection gap emits resync, the first does not", async () => {
    const { client, confirm } = setup();
    const onStarted = vi.fn();
    const onReset = vi.fn();
    client.subscribe(started, onStarted);
    client.subscribe(reset, onReset);
    await vi.runAllTimersAsync();
    confirm("test.a");
    expect(onStarted).not.toHaveBeenCalled();
    confirm("test.a"); // transport re-subscribed after reconnect
    expect(onStarted).toHaveBeenCalledWith({ type: "resync" });
    expect(onReset).toHaveBeenCalledWith({ type: "resync" });
  });

  test("malformed payload is reported without the payload and skips only that listener", async () => {
    const { client, emit, issues } = setup();
    const onStrict = vi.fn();
    const onLoose = vi.fn();
    client.subscribe(strict, onStrict);
    client.subscribe(started, onLoose);
    await vi.runAllTimersAsync();
    emit("test.a", "started", "fake-not-json-0001");
    expect(onStrict).not.toHaveBeenCalled();
    expect(onLoose).toHaveBeenCalledTimes(1);
    expect(issues).toEqual([
      { kind: "malformed-payload", channel: "test.a", event: "started" },
    ]);
    expect(JSON.stringify(issues)).not.toContain("fake-not-json");

    emit("test.a", "started", { id: 7 });
    expect(onStrict).toHaveBeenCalledWith({
      type: "event",
      payload: { id: 7 },
    });
  });

  test("a throwing listener does not starve the others", async () => {
    const { client, emit, issues } = setup();
    const after = vi.fn();
    client.subscribe(started, () => {
      throw new Error("boom");
    });
    client.subscribe(started, after);
    await vi.runAllTimersAsync();
    emit("test.a", "started", {});
    expect(after).toHaveBeenCalledTimes(1);
    expect(issues).toEqual([
      { kind: "listener-failed", channel: "test.a", event: "started" },
    ]);
  });

  test("transport load failure → failed status; a later subscription retries", async () => {
    const fake = fakeTransport();
    const real = fake.createTransport.getMockImplementation()!;
    fake.createTransport.mockImplementationOnce(() =>
      Promise.reject(new Error("chunk")),
    );
    const { client, issues, state } = setup(fake);
    client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    expect(client.getStatus()).toBe("failed");
    expect(issues).toEqual([{ kind: "transport-load-failed" }]);

    fake.createTransport.mockImplementation(real);
    client.subscribe(reset, () => {});
    await vi.runAllTimersAsync();
    expect(state.subscribes).toEqual(["test.a"]);
  });

  test("subscription and transport errors become value-free issues", async () => {
    const { client, state, issues } = setup();
    client.subscribe(started, () => {});
    await vi.runAllTimersAsync();
    state.channels.get("test.a")!.onSubscriptionError();
    state.hooks!.onTransportError();
    expect(issues).toEqual([
      { kind: "subscription-failed", channel: "test.a" },
      { kind: "transport-error" },
    ]);
  });
});
