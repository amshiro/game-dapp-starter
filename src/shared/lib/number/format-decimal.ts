import BigNumber from "bignumber.js";

// Isolate display policy from library-global configuration and other consumers.
const Decimal = BigNumber.clone({ ROUNDING_MODE: BigNumber.ROUND_DOWN });
export function formatDecimal(
  exact: string,
  options: Readonly<{
    decimals?: number;
    pad?: boolean;
    group?: boolean;
    smallThreshold?: boolean;
    shift?: number;
  }> = {},
): string {
  if (!/^-?\d+(?:\.\d+)?$/.test(exact)) throw Error("Invalid decimal string");
  const {
    decimals,
    pad = false,
    group = false,
    smallThreshold = false,
    shift = 0,
  } = options;
  if (
    decimals !== undefined &&
    (!Number.isSafeInteger(decimals) || decimals < 0)
  )
    throw Error("Invalid display precision");
  if (!Number.isSafeInteger(shift)) throw Error("Invalid decimal shift");
  const value = new Decimal(exact).shiftedBy(shift);
  if (!value.isFinite()) throw Error("Non-finite decimal");
  if (smallThreshold && decimals !== undefined) {
    const threshold = new Decimal("1").shiftedBy(-decimals);
    if (value.isPositive() && !value.isZero() && value.lt(threshold))
      return `<${threshold.toFixed()}`;
  }
  const rounded =
    decimals === undefined
      ? value
      : value.decimalPlaces(decimals, Decimal.ROUND_DOWN);
  const places =
    pad && decimals !== undefined ? decimals : rounded.decimalPlaces();
  if (places === null) throw Error("Non-finite decimal");
  return rounded.toFormat(places, Decimal.ROUND_DOWN, {
    decimalSeparator: ".",
    groupSeparator: group ? "," : "",
    groupSize: 3,
  });
}
