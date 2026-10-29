import { describe, expect, it } from "vitest";
import BigNumber from "bignumber.js";
import { formatDecimal } from "./format-decimal";

describe("Exact decimal presentation", () => {
  it("preserves large decimal strings and uses explicit grouping", () => {
    expect(formatDecimal("900719925474099312345.123456", { group: true })).toBe(
      "900,719,925,474,099,312,345.123456",
    );
  });
  it("truncates without rounding up and pads only when requested", () => {
    expect(formatDecimal("999.9999999", { decimals: 6 })).toBe("999.999999");
    expect(formatDecimal("12.3", { decimals: 2, pad: true })).toBe("12.30");
    expect(formatDecimal("12.3000", { decimals: 6 })).toBe("12.3");
    expect(formatDecimal("-1.239", { decimals: 2 })).toBe("-1.23");
  });
  it("keeps exact zero distinct from positive values below the display threshold", () => {
    expect(formatDecimal("0", { decimals: 6, smallThreshold: true })).toBe("0");
    expect(
      formatDecimal("0.000000000000000001", {
        decimals: 6,
        smallThreshold: true,
      }),
    ).toBe("<0.000001");
    expect(formatDecimal("0.000000000000000001")).toBe("0.000000000000000001");
    expect(formatDecimal("0.00000001", { decimals: 6 })).toBe("0");
  });
  it("scales compact values exactly, independent of global rounding config", () => {
    const previous = BigNumber.config();
    try {
      BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_UP });
      expect(formatDecimal("999999999", { shift: -6, decimals: 2 })).toBe(
        "999.99",
      );
    } finally {
      BigNumber.config(previous);
    }
  });
  it.each(["NaN", "Infinity", "1e3", "", "1,000"])(
    "rejects noncanonical decimal input %s",
    (input) => {
      expect(() => formatDecimal(input)).toThrow();
    },
  );
});
