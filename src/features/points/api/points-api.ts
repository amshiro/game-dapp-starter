import { formatEther, type Address } from "viem";
import { requestOriBackend } from "../../../shared/api/ori-backend";
import { InvalidResponseError } from "../../../shared/api/errors";
import type { Locale } from "../../../shared/i18n/locale";
import { formatPoints, type PointsDisplay } from "../model/points-display";

function invalid(): never {
  throw new InvalidResponseError("Invalid Points response", "/v1/ori/points");
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  return value as Record<string, unknown>;
}
export function pointsDecimal(value: unknown): string {
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER)
  )
    return invalid();
  if (typeof value !== "string" && typeof value !== "number") return invalid();
  const text = String(value);
  if (!/^\d+(?:\.\d+)?$/.test(text)) return invalid();
  return text;
}
function assertMiner(data: Record<string, unknown>, account: Address) {
  if (
    data.miner !== undefined &&
    (typeof data.miner !== "string" ||
      data.miner.toLowerCase() !== account.toLowerCase())
  )
    invalid();
}
export function pointsTotal(data: unknown, account: Address): string {
  if (data === null || (Array.isArray(data) && data.length === 0)) return "0";
  const row = object(data);
  if (Object.keys(row).length === 0) return "0";
  assertMiner(row, account);
  return formatPoints(pointsDecimal(row.total_points));
}
export function pointsRecord(
  data: unknown,
  account: Address,
  locale: Locale,
): PointsDisplay["records"][number] {
  const row = object(data);
  assertMiner(row, account);
  const id = pointsDecimal(row.id);
  if (!/^\d+$/.test(id)) return invalid();
  const wei = pointsDecimal(row.bet_amount);
  // User-confirmed wei; decimal storage suffix must contain zeroes only.
  if (!/^\d+(?:\.0+)?$/.test(wei)) return invalid();
  const timestamp = pointsDecimal(row.timestamp);
  if (!/^\d+$/.test(timestamp)) return invalid();
  const seconds = BigInt(timestamp);
  if (seconds > BigInt("8640000000000")) return invalid();
  const date = new Date(Number(seconds) * 1000);
  if (!Number.isFinite(date.getTime())) return invalid();
  return {
    id,
    time: new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
    stake: `${formatEther(BigInt(wei.split(".")[0]))} BNB`,
    value: "—",
    earned: formatPoints(pointsDecimal(row.points_reward), 2),
  };
}
export async function getPointsTotal(account: Address, signal: AbortSignal) {
  return pointsTotal(
    await requestOriBackend({
      path: "/points/user",
      form: { miner: account },
      signal,
    }),
    account,
  );
}
export async function getPointsRecords(
  account: Address,
  locale: Locale,
  signal: AbortSignal,
  page = 1,
) {
  if (!Number.isSafeInteger(page) || page < 1) return invalid();
  const raw = await requestOriBackend({
    path: "/points/list",
    form: { miner: account, page: String(page), page_size: "20" },
    signal,
  });
  if (raw === null || (Array.isArray(raw) && raw.length === 0))
    return { records: [], totalPoints: undefined, total: 0 };
  const data = object(raw);
  if (!Array.isArray(data.list) || data.list.length > 20) return invalid();
  const count = pointsDecimal(data.total);
  if (!/^\d+$/.test(count) || BigInt(count) > BigInt(Number.MAX_SAFE_INTEGER))
    return invalid();
  const total = Number(count);
  const records = data.list.map((item) => pointsRecord(item, account, locale));
  if (
    new Set(records.map((row) => row.id)).size !== records.length ||
    records.length > total
  )
    return invalid();
  return {
    records,
    total,
    totalPoints: Object.hasOwn(data, "user_points")
      ? pointsTotal(data.user_points, account)
      : undefined,
  };
}
