export type ResultPhase =
  "idle" | "eliminating" | "revealing" | "holding" | "settled";
export type ResultInput = Readonly<{
  scope: string;
  roundId: bigint;
  winner?: number;
}>;
export type ResultFrame = Readonly<{
  key?: string;
  phase: ResultPhase;
  lost: readonly number[];
  winner?: number;
}>;
const empty: ResultFrame = { phase: "idle", lost: [] };
export const resultKey = (input: ResultInput) =>
  `${input.scope}:${input.roundId}`;
export function losingOrder(winner: number, random: () => number): number[] {
  if (!Number.isInteger(winner) || winner < 0 || winner >= 25)
    throw Error("Invalid winning square");
  const order = Array.from({ length: 25 }, (_, i) => i).filter(
    (i) => i !== winner,
  );
  // Randomness changes visual elimination order only; it must never select a winning square.
  for (let i = order.length - 1; i > 0; i--) {
    const r = random();
    if (r < 0 || r >= 1 || !Number.isFinite(r))
      throw Error("Invalid visual random source");
    const j = Math.floor(r * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
/** Feature-local animation clock. It owns no round state, query cache, selection or transaction permission. */
export class MineResultAnimation {
  private frame: ResultFrame = empty;
  private input?: ResultInput;
  private observedLive = false;
  private seen = false;
  private timer?: ReturnType<typeof setTimeout>;
  private listeners = new Set<() => void>();
  constructor(private readonly random: () => number = Math.random) {}
  getSnapshot = () => this.frame;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(frame: ResultFrame) {
    this.frame = frame;
    for (const listener of this.listeners) listener();
  }
  private cancel() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
  observe(input: ResultInput | undefined, reducedMotion = false) {
    if (!input) {
      this.cancel();
      this.set(empty);
      return;
    }
    if (this.input?.scope === input.scope && input.roundId < this.input.roundId)
      return;
    const key = resultKey(input);
    if (!this.input || resultKey(this.input) !== key) {
      // Real query identity always supersedes an old animation; elapsed UI time cannot create a next round.
      this.cancel();
      this.observedLive = false;
      this.seen = false;
      this.set(empty);
    }
    this.input = input;
    if (input.winner === undefined) {
      this.observedLive = true;
      this.cancel();
      this.set({ key, phase: "idle", lost: [] });
      return;
    }
    if (
      !Number.isInteger(input.winner) ||
      input.winner < 0 ||
      input.winner >= 25
    ) {
      this.cancel();
      this.set(empty);
      return;
    }
    if (this.seen) {
      if (
        reducedMotion ||
        this.frame.key !== key ||
        this.frame.phase === "idle"
      )
        this.settle();
      return;
    }
    this.seen = true;
    // Initial/late fulfilled snapshots render their true final result, without replaying an old draw on refresh.
    if (!this.observedLive || reducedMotion) {
      this.settle();
      return;
    }
    const order = losingOrder(input.winner, this.random);
    const step = (count: number) => {
      this.set({ key, phase: "eliminating", lost: order.slice(0, count) });
      this.timer = setTimeout(() => {
        if (count < 24) step(count + 1);
        else {
          this.set({
            key,
            phase: "revealing",
            lost: order,
            winner: input.winner,
          });
          this.timer = setTimeout(() => {
            this.set({
              key,
              phase: "holding",
              lost: order,
              winner: input.winner,
            });
            this.timer = setTimeout(() => this.settle(), 10_000);
          }, 150);
        }
      }, 150);
    };
    step(1);
  }
  settle = () => {
    this.cancel();
    const i = this.input;
    if (i?.winner === undefined) return;
    this.set({
      key: resultKey(i),
      phase: "settled",
      lost: Array.from({ length: 25 }, (_, n) => n).filter(
        (n) => n !== i.winner,
      ),
      winner: i.winner,
    });
  };
  suspend = () => {
    this.cancel();
    this.settle();
  };
}
