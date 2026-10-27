import { describe, expect, test, vi } from "vitest";
import type PusherClient from "pusher-js";
import type { Options } from "pusher-js";
import { createPusherTransportFactory } from "./pusher-transport";

type Callback = (...args: never[]) => void;

class FakeChannel {
  global: ((event: string, data: unknown) => void) | undefined;
  bind_global(callback: (event: string, data: unknown) => void) {
    this.global = callback;
  }
  unbind_global() {
    this.global = undefined;
  }
}

class FakePusher {
  static instances: FakePusher[] = [];
  connection = {
    handlers: new Map<string, Callback>(),
    bind(event: string, callback: Callback) {
      this.handlers.set(event, callback);
    },
  };
  channels = new Map<string, FakeChannel>();
  connect = vi.fn();
  disconnect = vi.fn();
  constructor(
    readonly key: string,
    readonly options: Options,
  ) {
    FakePusher.instances.push(this);
  }
  subscribe(name: string) {
    const channel = this.channels.get(name) ?? new FakeChannel();
    this.channels.set(name, channel);
    return channel;
  }
  unsubscribe = vi.fn((name: string) => this.channels.delete(name));
  channel(name: string) {
    return this.channels.get(name);
  }
}

const endpoint = {
  appKey: "fake-pusher-key",
  host: "ws.example.test",
  port: 443,
  tls: true,
  path: "",
};

async function setup() {
  FakePusher.instances = [];
  const hooks = { onStatus: vi.fn(), onTransportError: vi.fn() };
  const transport = await createPusherTransportFactory(
    endpoint,
    async () =>
      // The fake implements only what the adapter touches.
      FakePusher as unknown as new (k: string, o: Options) => PusherClient,
  )(hooks);
  return { transport, hooks };
}

describe("pusher transport", () => {
  test("loading the transport does not construct (= connect) the client", async () => {
    await setup();
    expect(FakePusher.instances).toHaveLength(0);
  });

  test("connect constructs a WebSocket-only, stats-free client for the endpoint", async () => {
    const { transport } = await setup();
    transport.connect();
    const [pusher] = FakePusher.instances;
    expect(pusher.key).toBe("fake-pusher-key");
    expect(pusher.options).toEqual({
      cluster: "",
      wsHost: "ws.example.test",
      wsPort: 443,
      wssPort: 443,
      wsPath: "",
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
      enableStats: false,
    });
    transport.disconnect();
    transport.connect();
    expect(FakePusher.instances).toHaveLength(1);
    expect(pusher.disconnect).toHaveBeenCalledTimes(1);
    expect(pusher.connect).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["initialized", "idle"],
    ["connecting", "connecting"],
    ["connected", "connected"],
    ["unavailable", "unavailable"],
    ["failed", "failed"],
    ["disconnected", "idle"],
  ])("connection state %s → %s", async (pusherState, status) => {
    const { transport, hooks } = await setup();
    transport.connect();
    FakePusher.instances[0].connection.handlers.get("state_change")!({
      previous: "connecting",
      current: pusherState,
    } as never);
    expect(hooks.onStatus).toHaveBeenLastCalledWith(status);
  });

  test("connection errors are reported without their contents", async () => {
    const { transport, hooks } = await setup();
    transport.connect();
    FakePusher.instances[0].connection.handlers.get("error")!({
      data: "fake-frame-0001",
    } as never);
    expect(hooks.onTransportError).toHaveBeenCalledWith();
  });

  test("channel events are routed; protocol events become lifecycle callbacks", async () => {
    const { transport } = await setup();
    transport.connect();
    const handlers = {
      onEvent: vi.fn(),
      onSubscribed: vi.fn(),
      onSubscriptionError: vi.fn(),
    };
    transport.subscribe("test.a", handlers);
    const channel = FakePusher.instances[0].channels.get("test.a")!;
    channel.global!("pusher:subscription_succeeded", {});
    channel.global!("pusher:subscription_error", {});
    channel.global!("pusher_internal:member_added", {});
    channel.global!("started", { n: 1 });
    expect(handlers.onSubscribed).toHaveBeenCalledTimes(1);
    expect(handlers.onSubscriptionError).toHaveBeenCalledTimes(1);
    expect(handlers.onEvent).toHaveBeenCalledExactlyOnceWith("started", {
      n: 1,
    });
  });

  test("unsubscribe unbinds before leaving the channel", async () => {
    const { transport } = await setup();
    transport.connect();
    transport.subscribe("test.a", {
      onEvent: vi.fn(),
      onSubscribed: vi.fn(),
      onSubscriptionError: vi.fn(),
    });
    const pusher = FakePusher.instances[0];
    const channel = pusher.channels.get("test.a")!;
    transport.unsubscribe("test.a");
    expect(channel.global).toBeUndefined();
    expect(pusher.unsubscribe).toHaveBeenCalledWith("test.a");
  });

  test("subscribing before connect is a programming error", async () => {
    const { transport } = await setup();
    expect(() =>
      transport.subscribe("test.a", {
        onEvent: vi.fn(),
        onSubscribed: vi.fn(),
        onSubscriptionError: vi.fn(),
      }),
    ).toThrow("not connected");
  });
});
