import {
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mineReadFreshness } from "./mine-freshness";
// Exercise browser QueryObserver scheduling, not a second production timer implementation.
vi.stubGlobal("window", {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});
const { QueryClient, QueryObserver, focusManager, onlineManager } =
  await import("@tanstack/react-query");
let cache: InstanceType<typeof QueryClient>;
let cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  cache.mount();
});
afterEach(() => {
  for (const f of cleanups) f();
  cleanups = [];
  cache.unmount();
  cache.clear();
  vi.useRealTimers();
});
afterAll(() => vi.unstubAllGlobals());
function observe(
  fn: () => Promise<unknown>,
  resource: "board" | "rewards" = "board",
) {
  const options = {
    queryKey: ["mine", resource],
    queryFn: fn,
    enabled: true,
    ...mineReadFreshness(resource, true),
  };
  const observer = new QueryObserver(cache, options);
  const unsubscribe = observer.subscribe(() => {});
  cleanups.push(unsubscribe);
  return { observer, options, unsubscribe };
}
describe("Mine route-only Query freshness", () => {
  it("polls the existing owner, pauses hidden, refreshes immediately on focus, releases on unmount", async () => {
    const read = vi.fn(async () => ({ round: "42" })),
      h = observe(read);
    await vi.advanceTimersByTimeAsync(0);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(read).toHaveBeenCalledTimes(2);
    focusManager.setFocused(false);
    await vi.advanceTimersByTimeAsync(45000);
    expect(read).toHaveBeenCalledTimes(2);
    focusManager.setFocused(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(read).toHaveBeenCalledTimes(3);
    h.unsubscribe();
    await vi.advanceTimersByTimeAsync(60000);
    expect(read).toHaveBeenCalledTimes(3);
  });
  it("stops disconnected/wrong-chain owners when enabled becomes false", async () => {
    const read = vi.fn(async () => 1),
      h = observe(read, "rewards");
    await vi.advanceTimersByTimeAsync(0);
    h.observer.setOptions({
      ...h.options,
      enabled: false,
      ...mineReadFreshness("rewards", false),
    });
    await vi.advanceTimersByTimeAsync(120000);
    expect(read).toHaveBeenCalledTimes(1);
  });
  it("backs off failed reads then resumes normal budget after successful refresh", async () => {
    let fail = true;
    const read = vi.fn(async () => {
        if (fail) throw Error("network");
        return 1;
      }),
      h = observe(read);
    await vi.advanceTimersByTimeAsync(0);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(read).toHaveBeenCalledTimes(2);
    fail = false;
    await h.observer.refetch();
    expect(read).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(15000);
    expect(read).toHaveBeenCalledTimes(4);
  });
  it("does not overlap slow requests or multiply requests for shared-key consumers", async () => {
    let finish!: (value: number) => void;
    const read = vi.fn(
      () =>
        new Promise<number>((r) => {
          finish = r;
        }),
    );
    const h = observe(read);
    const second = new QueryObserver(cache, h.options);
    cleanups.push(second.subscribe(() => {}));
    await vi.advanceTimersByTimeAsync(60000);
    expect(read).toHaveBeenCalledTimes(1);
    finish(1);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(15000);
    expect(read).toHaveBeenCalledTimes(2);
    finish(2);
    await vi.advanceTimersByTimeAsync(0);
  });
  it("offline does not request; reconnect refreshes without needing realtime", async () => {
    const read = vi.fn(async () => 1);
    observe(read);
    await vi.advanceTimersByTimeAsync(0);
    onlineManager.setOnline(false);
    await vi.advanceTimersByTimeAsync(30000);
    expect(read).toHaveBeenCalledTimes(1);
    onlineManager.setOnline(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it("cancelled old account/round cannot settle into a new resource key", async () => {
    let finish!: (value: number) => void;
    let signal!: AbortSignal;
    const observer = new QueryObserver(cache, {
      queryKey: ["mine", "old"],
      queryFn: ({ signal: s }) => {
        signal = s;
        return new Promise<number>((r) => {
          finish = r;
        });
      },
      ...mineReadFreshness("account", true),
    });
    const unsubscribe = observer.subscribe(() => {});
    cleanups.push(unsubscribe);
    observer.setOptions({
      queryKey: ["mine", "new"],
      queryFn: async () => 2,
      ...mineReadFreshness("account", true),
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(signal.aborted).toBe(true);
    finish(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(cache.getQueryData(["mine", "new"])).toBe(2);
    expect(cache.getQueryData(["mine", "old"])).toBeUndefined();
  });
});
