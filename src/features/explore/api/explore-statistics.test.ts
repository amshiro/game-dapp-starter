import { describe, expect, it } from "vitest";
import { mapExploreStatistics } from "./explore-statistics";

describe("Explore statistics precision", () => {
  it("groups exact supply and truncates eight-decimal API amounts", () => {
    expect(
      mapExploreStatistics({
        max_supply: { value: "9007199254740993123" },
        buried_7d: { value: "123456789123456" },
        protocol_rev_7d: { value: "123" },
      }),
    ).toEqual({
      maxSupply: "9,007,199,254,740,993,123",
      buried: "1,234,567.891234",
      protocolRevenue: "0.000001",
    });
  });
  it("preserves real zeros and rejects missing or already unsafe amounts", () => {
    const zero = {
      max_supply: { value: "4200000" },
      buried_7d: { value: 0 },
      protocol_rev_7d: { value: 0 },
    };
    expect(mapExploreStatistics(zero).buried).toBe("0");
    expect(() => mapExploreStatistics({ ...zero, buried_7d: null })).toThrow();
    expect(() =>
      mapExploreStatistics({
        ...zero,
        max_supply: { value: 9007199254740992 },
      }),
    ).toThrow();
  });
});
