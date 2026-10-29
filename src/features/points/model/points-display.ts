import { formatDecimal } from "../../../shared/lib/number/format-decimal";
export type PointsDisplay = Readonly<{
  total: string;
  records: readonly Readonly<{
    id: string;
    time: string;
    stake: string;
    value: string;
    earned: string;
  }>[];
}>;

/** Keep API precision; only earned-points presentation uses fixed decimal places. */
export function formatPoints(value: string, fractionDigits?: number): string {
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw Error("Invalid points decimal");
  return formatDecimal(value, {
    decimals: fractionDigits,
    pad: fractionDigits !== undefined,
    group: true,
  });
}
