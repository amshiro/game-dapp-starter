import { manualAmount, cellMask, maskCount } from "./manual-model";
import { manualError, type ManualError } from "./manual-errors";
export type AutoError =
  | ManualError
  | "invalid-blocks"
  | "invalid-rounds"
  | "already-active"
  | "not-active"
  | "fee-changed";
export class AutoFault extends Error {
  constructor(public readonly kind: AutoError) {
    super(kind);
  }
}
export function autoError(error: unknown): AutoError {
  if (error instanceof AutoFault) return error.kind;
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const x = current as { data?: { errorName?: string }; cause?: unknown };
    if (x.data?.errorName === "AutomationAlreadyActive")
      return "already-active";
    if (x.data?.errorName === "AutomationNotAuthorized") return "not-active";
    current = x.cause;
  }
  return manualError(error);
}
export type AutoIntent = Readonly<{
  mask: bigint;
  randomizeMask: boolean;
  cellsPerRound: bigint;
  amountPerSquare: bigint;
  rounds: bigint;
  executorFee: bigint;
  roundPrincipal: bigint;
  displayTotal: bigint;
  value: bigint;
}>;
function positiveInteger(input: string, maximum: bigint, error: AutoError) {
  if (!/^\d+$/.test(input)) throw new AutoFault(error);
  const n = BigInt(input);
  if (n < BigInt(1) || n > maximum) throw new AutoFault(error);
  return n;
}
export function autoIntent(
  selected: readonly number[],
  blocks: string,
  rounds: string,
  amount: string,
  executorFee: bigint,
): AutoIntent {
  const count = selected.length
    ? BigInt(selected.length)
    : positiveInteger(blocks, BigInt(25), "invalid-blocks");
  // Fixed mode is a bitmask; random mode deliberately overloads mask with cells per round, not chain blocks.
  const mask = selected.length ? cellMask(selected) : count;
  if (selected.length && maskCount(mask) !== count)
    throw new AutoFault("invalid-mask");
  const n = positiveInteger(rounds, BigInt(9999), "invalid-rounds"); // Product cap, not a verified contract maximum.
  const perCell = manualAmount(amount);
  if (executorFee < BigInt(0) || executorFee >= BigInt(1) << BigInt(96))
    throw new AutoFault("fee-changed");
  const roundPrincipal = perCell * count,
    displayTotal = roundPrincipal * n;
  // Development 97 register funding follows the human-approved principal + executorFee formula;
  // successful per-round deduction still requires live-round runtime QA.
  const value = (roundPrincipal + executorFee) * n;
  if (value >= BigInt(1) << BigInt(256)) throw new AutoFault("invalid-amount");
  return Object.freeze({
    mask,
    randomizeMask: !selected.length,
    cellsPerRound: count,
    amountPerSquare: perCell,
    rounds: n,
    executorFee,
    roundPrincipal,
    displayTotal,
    value,
  });
}
