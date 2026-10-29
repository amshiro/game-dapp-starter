import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  MineRealtimeRefresh,
  mineRealtimeReadKeys,
} from "./mine-realtime-refresh";
import {
  createRealtimeClient,
  type RealtimeChannelHandlers,
} from "../../../shared/realtime/realtime-client";
import { oriRealtimeEvents } from "../../../shared/config/ori-realtime-events";
import type { MineBoardSnapshot } from "../read/mine-read-query";
vi.mock("../../../shared/config/public-config", () => ({
  readPublicConfig: () => ({ apiBaseUrl: "https://example.test" }),
}));
const a = "0x0000000000000000000000000000000000000001" as const,
  b = "0x0000000000000000000000000000000000000002" as const;
const context = {
  targetChainId: 97,
  address: a,
  ready: true,
  wrongChain: false,
};
const snapshot: MineBoardSnapshot = {
  roundId: BigInt(42),
  blockNumber: BigInt(100),
  initialized: true,
  totalDeployed: BigInt(0),
  deployedPerSquare: [],
  minersPerSquare: [],
  transition: false,
  randomnessFulfilled: false,
};
afterEach(() => vi.useRealTimers());
describe("Mine realtime freshness-only integration", () => {
  it("uses existing owner keys for current chain/round/viewer, never another account or global invalidation", () => {
    const keys = mineRealtimeReadKeys(context, snapshot);
    expect(keys).toHaveLength(8);
    expect(keys.some((k) => k.includes("stored-board"))).toBe(true);
    expect(keys.some((k) => k.includes("winners"))).toBe(true);
    expect(keys.filter((k) => k.includes(a))).toHaveLength(6);
    expect(
      mineRealtimeReadKeys({ ...context, wrongChain: true }, snapshot),
    ).toEqual([]);
    expect(
      mineRealtimeReadKeys({ ...context, targetChainId: 56 }, snapshot),
    ).toEqual([]);
    expect(
      mineRealtimeReadKeys(
        { ...context, address: undefined, ready: false },
        snapshot,
      ),
    ).toHaveLength(2);
  });
  it("coalesces duplicate notifications, throttles bursts and never patches cached state", async () => {
    vi.useFakeTimers();
    const client = new QueryClient(),
      invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
    const patch = vi.spyOn(client, "setQueryData"),
      refresh = new MineRealtimeRefresh(() => true);
    refresh.configure(client, [["mine", "board"]]);
    refresh.signal();
    refresh.signal();
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith(
      { queryKey: ["mine", "board"], exact: true, refetchType: "active" },
      { cancelRefetch: false },
    );
    refresh.signal();
    await vi.advanceTimersByTimeAsync(1000);
    expect(invalidate).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4000);
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(patch).not.toHaveBeenCalled();
    refresh.dispose();
    client.clear();
  });
  it("hidden marks resources stale without network; scope change cancels old batch and unmount releases timer", async () => {
    vi.useFakeTimers();
    const client = new QueryClient(),
      invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue(),
      refresh = new MineRealtimeRefresh(() => false);
    refresh.configure(client, [["mine", "old", a]]);
    refresh.signal();
    refresh.configure(client, [["mine", "new", b]]);
    await vi.advanceTimersByTimeAsync(300);
    expect(invalidate).not.toHaveBeenCalled();
    refresh.signal();
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).toHaveBeenCalledWith(
      { queryKey: ["mine", "new", b], exact: true, refetchType: "none" },
      { cancelRefetch: false },
    );
    refresh.signal();
    refresh.dispose();
    await vi.advanceTimersByTimeAsync(10000);
    expect(invalidate).toHaveBeenCalledTimes(1);
    client.clear();
  });
  it("subscribes through F7; malformed/old payload cannot drive round state, resync requests canonical reads", async () => {
    vi.useFakeTimers();
    const client = new QueryClient(),
      invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue(),
      refresh = new MineRealtimeRefresh(() => true);
    refresh.configure(client, [["mine", "stored-board", 97]]);
    const channels = new Map<string, RealtimeChannelHandlers>();
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      subscribe: (channel: string, h: RealtimeChannelHandlers) =>
        channels.set(channel, h),
      unsubscribe: vi.fn(),
    };
    const realtime = createRealtimeClient({
      createTransport: async () => transport,
      onIssue: vi.fn(),
      idleTimeoutMs: 0,
    });
    const offStart = realtime.subscribe(oriRealtimeEvents.roundStarted, () =>
        refresh.signal(),
      ),
      offReset = realtime.subscribe(oriRealtimeEvents.roundReset, () =>
        refresh.signal(),
      );
    await vi.advanceTimersByTimeAsync(0);
    const start = channels.get("round.new_round")!,
      reset = channels.get("round.reset")!;
    start.onSubscribed();
    reset.onSubscribed();
    start.onEvent("round.data.started", {
      round_id: "9999999999999999999",
      winning_square: 24,
    });
    reset.onEvent("round.data.reset", "malformed untrusted payload");
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).toHaveBeenCalledTimes(1);
    start.onSubscribed();
    await vi.advanceTimersByTimeAsync(5000);
    expect(invalidate).toHaveBeenCalledTimes(2);
    offStart();
    offReset();
    refresh.dispose();
    await vi.advanceTimersByTimeAsync(0);
    expect(transport.unsubscribe).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
