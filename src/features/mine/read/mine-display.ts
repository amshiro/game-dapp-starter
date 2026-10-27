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

export function mineAmount(raw: bigint) {
  const exact = formatUnits(raw, 18);
  const [whole, fraction] = exact.split(".");
  const digits = fraction?.slice(0, 4).replace(/0+$/, "");
  // Truncate presentation only; exact decimal and raw bigint remain available for inspection.
  return {
    exact,
    text: digits
      ? `${whole}.${digits}`
      : whole === "0" && raw > BigInt(0)
        ? "<0.0001"
        : whole,
  };
}

export function mineCount(raw: bigint): string {
  const exact = raw.toString();
  if (exact.length <= 3) return exact;
  // String slicing keeps even uint256 counts lossless at the source; no Number conversion.
  const groups = [
    [12, "T"],
    [9, "B"],
    [6, "M"],
    [3, "K"],
  ] as const;
  for (const [power, suffix] of groups) {
    if (exact.length > power) {
      const split = exact.length - power;
      const tenth = exact[split];
      return `${exact.slice(0, split)}${tenth === "0" ? "" : `.${tenth}`}${suffix}`;
    }
  }
  return exact;
}
