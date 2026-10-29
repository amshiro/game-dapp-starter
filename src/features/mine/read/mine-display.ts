import { formatDecimal } from "../../../shared/lib/number/format-decimal";
import { formatUnits } from "viem";
import type { MineBoardSnapshot, MineReadContext } from "./mine-read-query";

export type MineBoardDisplay =
  | Readonly<{ status: "unavailable" | "wrongChain" | "loading" | "error" }>
  | Readonly<{ status: "populated"; snapshot: MineBoardSnapshot }>;

export function mineBoardDisplay(
  query: Readonly<{
    data?: MineBoardSnapshot;
    isError: boolean;
    isPending: boolean;
  }>,
  context: MineReadContext,
  hasClient: boolean,
): MineBoardDisplay {
  if (context.targetChainId !== 97 || !hasClient)
    return { status: "unavailable" };
  if (context.wrongChain) return { status: "wrongChain" };
  // Never leave cached values looking healthy after a failed refresh or a chain change.
  if (query.isError) return { status: "error" };
  if (query.isPending || !query.data) return { status: "loading" };
  if (!query.data.initialized) return { status: "unavailable" };
  return { status: "populated", snapshot: query.data };
}

export function mineAmount(raw: bigint, precision: 4 | 6 = 4, compact = false) {
  if (raw < BigInt(0)) throw Error("Negative Mine amount");
  const exact = formatUnits(raw, 18);
  if (compact) {
    for (const [power, suffix] of [
      [12, "T"],
      [9, "B"],
      [6, "M"],
    ] as const) {
      if (raw >= BigInt(10) ** BigInt(18 + power)) {
        return {
          exact,
          text: `${formatDecimal(exact, { decimals: 2, group: true, shift: -power })}${suffix}`,
        };
      }
    }
  }
  return {
    exact,
    text: formatDecimal(exact, {
      decimals: precision,
      group: true,
      smallThreshold: true,
    }),
  };
}

export function mineCount(raw: bigint): string {
  const exact = raw.toString();
  for (const [power, suffix] of [
    [12, "T"],
    [9, "B"],
    [6, "M"],
    [3, "K"],
  ] as const) {
    if (raw >= BigInt(10) ** BigInt(power)) {
      return `${formatDecimal(exact, { decimals: 1, shift: -power })}${suffix}`;
    }
  }
  return exact;
}
