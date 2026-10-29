import { describe, expect, it } from "vitest";
import { formatPoints } from "./points-display";

describe("Points decimal formatting", () => {
  it("groups totals without losing precision", () => {
    expect(formatPoints("900719925474099312345.123456")).toBe(
      "900,719,925,474,099,312,345.123456",
    );
  });
  it("truncates earned points to exactly two decimals", () => {
    expect(formatPoints("1234.999", 2)).toBe("1,234.99");
    expect(formatPoints("0.000001", 2)).toBe("0.00");
    expect(formatPoints("12", 2)).toBe("12.00");
  });
});
