import { requestOriBackend } from "../../../shared/api/ori-backend";
import { InvalidResponseError } from "../../../shared/api/errors";
import { formatDecimal } from "../../../shared/lib/number/format-decimal";

export function exploreObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new InvalidResponseError(
      "Invalid Explore response",
      "/v1/ori/explore",
    );
  return value as Record<string, unknown>;
}
export function exploreDecimal(value: unknown): string {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "number" &&
      (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER)) ||
    !/^\d+(?:\.\d+)?$/.test(String(value))
  )
    throw new InvalidResponseError("Invalid Explore amount", "/v1/ori/explore");
  return String(value);
}
export function mapExploreStatistics(value: unknown) {
  const data = exploreObject(value);
  const amount = (key: string) =>
    exploreDecimal(exploreObject(data[key]).value);
  return {
    maxSupply: formatDecimal(amount("max_supply"), { group: true }),
    buried: formatDecimal(amount("buried_7d"), {
      shift: -8,
      decimals: 6,
      group: true,
    }),
    protocolRevenue: formatDecimal(amount("protocol_rev_7d"), {
      shift: -8,
      decimals: 6,
      group: true,
    }),
  };
}
export async function getExploreStatistics(signal: AbortSignal) {
  return mapExploreStatistics(
    await requestOriBackend({ path: "/explore", signal }),
  );
}
