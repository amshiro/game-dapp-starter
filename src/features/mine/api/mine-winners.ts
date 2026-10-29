import { formatUnits, isAddress, type Address } from "viem";
import { InvalidResponseError } from "../../../shared/api/errors";
import type {
  MineResultRow,
  MineResultsDisplay,
} from "../model/mine-presentation";
export const mineWinnersPath = "/round_winners/round";
function invalid(): never {
  throw new InvalidResponseError(
    "Invalid Mine winners response",
    `/v1/ori${mineWinnersPath}`,
  );
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  return value as Record<string, unknown>;
}
export function winnerInteger(raw: unknown): bigint {
  if (typeof raw === "string" && /^\d+$/.test(raw)) return BigInt(raw);
  if (typeof raw === "number" && Number.isSafeInteger(raw) && raw >= 0)
    return BigInt(raw);
  return invalid();
}
export function winnerAmount(raw: bigint) {
  // Winners API uses human-confirmed 8-place scaled integers, NOT the chain's 18-decimal wei/token amounts.
  const exact = formatUnits(raw, 8),
    [whole, fraction] = exact.split(".");
  const short = fraction?.slice(0, 6).replace(/0+$/, "");
  return { raw, exact, text: short ? `${whole}.${short}` : whole };
}
export function mineWinnersDisplay(
  raw: unknown,
  roundId: bigint,
  account?: Address,
): MineResultsDisplay {
  const response = record(raw);
  if (roundId <= BigInt(0) || !Array.isArray(response.list)) return invalid();
  if (
    response.round_id !== undefined &&
    winnerInteger(response.round_id) !== roundId
  )
    return invalid();
  const seen = new Map<string, number>();
  // Preserve every backend row/order. Only index 0 may be "You"; never promote/filter a later matching account.
  const rows: MineResultRow[] = response.list.map((item, index) => {
    const row = record(item),
      address = row.winner_address;
    if (typeof address !== "string" || !isAddress(address, { strict: false }))
      return invalid();
    if (row.round_id !== undefined && winnerInteger(row.round_id) !== roundId)
      return invalid();
    const ori = winnerAmount(winnerInteger(row.ore_reward)),
      bnb = winnerAmount(winnerInteger(row.eth_reward));
    const identity = `${roundId}:${address.toLowerCase()}`,
      occurrence = seen.get(identity) ?? 0;
    seen.set(identity, occurrence + 1);
    return {
      // Backend has no verified unique row ID. Per-address occurrence preserves duplicates without index-wide identity churn.
      id: `${identity}:${occurrence}`,
      address,
      addressText: `${address.slice(0, 4)}...${address.slice(-4)}`,
      isCurrentUser:
        index === 0 && address.toLowerCase() === account?.toLowerCase(),
      amounts: [
        ...(ori.raw > BigInt(0) ? [{ ...ori, unit: "ORI" as const }] : []),
        { ...bnb, unit: "BNB" as const },
      ],
    };
  });
  return rows.length
    ? { status: "populated", roundId: roundId.toString(), rows }
    : { status: "empty", roundId: roundId.toString() };
}
