import { describe, expect, it } from "vitest";
import { parseUnits } from "viem";
import { mineAmount } from "./mine-display";

describe("Mine display precision never changes raw amounts", () => {
  it.each([
    ["0", 4, false, "0"],
    ["0.000000000000000001", 4, false, "<0.0001"],
    ["0.000000000000000001", 6, false, "<0.000001"],
    ["0.000001", 6, false, "0.000001"],
    ["0.0001", 4, false, "0.0001"],
    ["12.345678912345678901", 6, false, "12.345678"],
    ["1.999999999999999999", 4, false, "1.9999"],
    ["1234.500000000000000001", 4, false, "1,234.5"],
    ["999999.999999999999999999", 4, true, "999,999.9999"],
    ["1000000", 4, true, "1M"],
    ["1239999", 4, true, "1.23M"],
    ["1234567890", 4, true, "1.23B"],
    ["1234567890000", 4, true, "1.23T"],
    [
      "900719925474099312.34567890123456789",
      6,
      false,
      "900,719,925,474,099,312.345678",
    ],
  ] as const)("%s / %i precision", (exact, precision, compact, text) => {
    const raw = parseUnits(exact, 18);
    expect(mineAmount(raw, precision, compact)).toEqual({ exact, text });
    expect(parseUnits(mineAmount(raw, precision, compact).exact, 18)).toBe(raw);
  });
  it("refuses negative token quantities", () => {
    expect(() => mineAmount(BigInt(-1))).toThrow("Negative Mine amount");
  });
});
