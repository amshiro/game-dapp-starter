import { afterEach, describe, expect, it, vi } from "vitest";
import { MineResultAnimation, losingOrder, resultKey } from "./mine-result";
const live = { scope: "97:protocol:view", roundId: BigInt("9007199254740993") };
const result = { ...live, winner: 24 };
afterEach(() => vi.useRealTimers());
describe("canonical Mine result presentation", () => {
  it("shuffles exactly 24 losers and never changes the chain winner", () => {
    const order = losingOrder(24, () => 0.5);
    expect(new Set(order).size).toBe(24);
    expect(order).not.toContain(24);
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 24 }, (_, n) => n),
    );
    expect(() => losingOrder(25, Math.random)).toThrow();
  });
  it("uses 24×150ms then 150ms reveal and a 10s hold", () => {
    vi.useFakeTimers();
    const a = new MineResultAnimation(() => 0);
    a.observe(live);
    a.observe(result);
    expect(a.getSnapshot().phase).toBe("eliminating");
    expect(a.getSnapshot().winner).toBeUndefined();
    expect(a.getSnapshot().lost).toHaveLength(1);
    vi.advanceTimersByTime(3599);
    expect(a.getSnapshot().phase).toBe("eliminating");
    expect(a.getSnapshot().lost).toHaveLength(24);
    vi.advanceTimersByTime(1);
    expect(a.getSnapshot()).toMatchObject({ phase: "revealing", winner: 24 });
    vi.advanceTimersByTime(150);
    expect(a.getSnapshot().phase).toBe("holding");
    vi.advanceTimersByTime(9999);
    expect(a.getSnapshot().phase).toBe("holding");
    vi.advanceTimersByTime(1);
    expect(a.getSnapshot().phase).toBe("settled");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not replay a historical fulfilled round on refresh", () => {
    vi.useFakeTimers();
    const a = new MineResultAnimation();
    a.observe(result);
    expect(a.getSnapshot()).toMatchObject({ phase: "settled", winner: 24 });
    expect(vi.getTimerCount()).toBe(0);
    a.observe(result);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("duplicate query results do not restart or extend an in-flight draw", () => {
    vi.useFakeTimers();
    const a = new MineResultAnimation();
    a.observe(live);
    a.observe(result);
    vi.advanceTimersByTime(1800);
    const before = a.getSnapshot();
    a.observe({ ...result });
    expect(a.getSnapshot()).toBe(before);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1800);
    expect(a.getSnapshot().phase).toBe("revealing");
    a.suspend();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("a real new round cancels the old animation without manufacturing a successor", () => {
    vi.useFakeTimers();
    const a = new MineResultAnimation();
    a.observe(live);
    a.observe(result);
    const next = { ...live, roundId: live.roundId + BigInt(3) };
    a.observe(next);
    expect(a.getSnapshot()).toMatchObject({
      key: resultKey(next),
      phase: "idle",
      lost: [],
    });
    vi.runAllTimers();
    expect(a.getSnapshot().winner).toBeUndefined();
    a.observe(result);
    expect(a.getSnapshot().key).toBe(resultKey(next));
  });
  it("reduced motion, backgrounding and cleanup settle without a residual timer", () => {
    vi.useFakeTimers();
    const a = new MineResultAnimation();
    a.observe(live);
    a.observe(result, true);
    expect(a.getSnapshot().phase).toBe("settled");
    expect(vi.getTimerCount()).toBe(0);
    const b = new MineResultAnimation();
    b.observe(live);
    b.observe(result);
    b.suspend();
    expect(b.getSnapshot().phase).toBe("settled");
    expect(vi.getTimerCount()).toBe(0);
    b.observe(result);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("unavailable/wrong-chain input hides the result and recovery does not replay", () => {
    vi.useFakeTimers();
    const a = new MineResultAnimation();
    a.observe(live);
    a.observe(result);
    a.observe(undefined);
    expect(a.getSnapshot()).toMatchObject({ phase: "idle", lost: [] });
    expect(vi.getTimerCount()).toBe(0);
    a.observe(result);
    expect(a.getSnapshot().phase).toBe("settled");
  });
});
