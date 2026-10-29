import { formatUnits, parseUnits } from "viem";
export function parseStakeAmount(value: string): bigint {
  // Validate precision before parseUnits: library rounding must never choose a transaction amount.
  if (!/^\d+(?:\.\d{1,18})?$/.test(value)) throw new Error("invalid-amount");
  const raw = parseUnits(value, 18);
  if (raw <= BigInt(0)) throw new Error("zero-amount");
  if (raw >= BigInt(1) << BigInt(256)) throw new Error("invalid-amount");
  return raw;
}
export function stakePercentage(
  raw: bigint,
  percent: 25 | 50 | 75 | 100,
): string {
  // ORI principal only; BNB gas is a different asset and is never subtracted here.
  return formatUnits((raw * BigInt(percent)) / BigInt(100), 18);
}
