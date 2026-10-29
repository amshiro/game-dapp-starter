import { parseEther } from "viem";

// Current Figma Manual presets; the + labels replace per-cell input, never add to it.
export const manualAmountShortcuts = ["0.5", "1", "2"] as const;

export function hasDeployedThisRound(
  info:
    Readonly<{ hasParticipation: boolean; totalDeployed: bigint }> | undefined,
  squares: Readonly<{ mask: bigint }> | undefined,
): boolean | undefined {
  // Query keys must already match account + deployment + actual relevant round.
  // Contract capability to add different cells is intentionally NOT a product permission.
  if (
    info?.hasParticipation ||
    (info?.totalDeployed ?? BigInt(0)) > BigInt(0) ||
    (squares?.mask ?? BigInt(0)) > BigInt(0)
  )
    return true;
  return info && squares ? false : undefined;
}
export function assertFirstManualDeploy(
  info: Readonly<{ hasParticipation: boolean; totalDeployed: bigint }>,
  squares: Readonly<{ mask: bigint }>,
) {
  if (hasDeployedThisRound(info, squares))
    throw Error("already-deployed-round");
}

export function manualAmount(input: string): bigint {
  // A trailing decimal point is a valid editing state (e.g. "1.").
  input = input.replace(/\.$/, "");
  // Reject precision that parseEther would otherwise round; 1 wei is evidence, not a product minimum.
  if (!/^\d+(?:\.\d{1,18})?$/.test(input)) throw Error("invalid-amount");
  const raw = parseEther(input);
  if (raw <= BigInt(0) || raw >= BigInt(1) << BigInt(256))
    throw Error("invalid-amount");
  return raw;
}
export function cellMask(indices: readonly number[]): bigint {
  let mask = BigInt(0);
  for (const index of indices) {
    // Visible #1 maps to ABI bit 0, and #25 maps to bit 24.
    if (!Number.isInteger(index) || index < 0 || index >= 25)
      throw Error("invalid-mask");
    const bit = BigInt(1) << BigInt(index);
    if (mask & bit) throw Error("invalid-mask");
    mask |= bit;
  }
  if (!mask) throw Error("no-selection");
  return mask;
}
export function maskCount(mask: bigint): bigint {
  if (mask <= BigInt(0) || mask >= BigInt(1) << BigInt(25))
    throw Error("invalid-mask");
  return BigInt(mask.toString(2).replace(/0/g, "").length);
}
export function manualValue(mask: bigint, amount: bigint): bigint {
  const total = amount * maskCount(mask);
  if (amount <= BigInt(0) || total >= BigInt(1) << BigInt(256))
    throw Error("invalid-amount");
  // No extra 1%: the payable value is exactly per-square principal times selected count.
  return total;
}
export type DraftScope = Readonly<{ account?: string; round?: string }>;
export function reconcileSelection(
  previous: DraftScope,
  next: DraftScope,
  selected: readonly number[],
) {
  const changed =
    (next.account !== undefined &&
      previous.account !== undefined &&
      next.account !== previous.account) ||
    (next.round !== undefined &&
      previous.round !== undefined &&
      next.round !== previous.round);
  return {
    scope: {
      account: next.account ?? previous.account,
      round: next.round ?? previous.round,
    },
    selected: changed ? [] : selected,
  };
}

export function toggleCell(
  selected: readonly number[],
  index: number,
): readonly number[] {
  cellMask([index]);
  return selected.includes(index)
    ? selected.filter((i) => i !== index)
    : [...selected, index];
}

/** Fulfilled stored-round participation is historical, not a lock on an inferred next ID. */
export function manualParticipation(
  fulfilled: boolean | undefined,
  info: Parameters<typeof hasDeployedThisRound>[0],
  squares: Parameters<typeof hasDeployedThisRound>[1],
): boolean | undefined {
  if (fulfilled === undefined) return undefined;
  if (!fulfilled) return hasDeployedThisRound(info, squares);
  return info && squares ? false : undefined;
}
