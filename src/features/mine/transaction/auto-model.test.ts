import { describe, expect, it } from "vitest";
import { autoIntent, autoError } from "./auto-model";
import { automationEnrichment } from "../read/mine-automation-queries";
const fee = BigInt("1000000000000"),
  a = "0x0000000000000000000000000000000000000001";
describe("Auto fixed/random intent and human-approved funding", () => {
  it("maps #1/#25 with bigint and derives fixed count, ignoring a conflicting blocks draft", () => {
    const i = autoIntent([0, 24], "25", "3", "0.02", fee);
    expect(i.mask).toBe(BigInt(1) | (BigInt(1) << BigInt(24)));
    expect(i.randomizeMask).toBe(false);
    expect(i.cellsPerRound).toBe(BigInt(2));
    expect(i.roundPrincipal).toBe(BigInt("40000000000000000"));
    expect(i.displayTotal).toBe(BigInt("120000000000000000"));
    expect(i.value).toBe(i.displayTotal + fee * BigInt(3));
  });
  it.each(["1", "25"])("encodes random count %s as mask=count", (blocks) => {
    const i = autoIntent([], blocks, "1", "0.000000000000000001", fee);
    expect(i.mask).toBe(BigInt(blocks));
    expect(i.randomizeMask).toBe(true);
  });
  it.each(["0", "26", "-1", "2.5", ""])(
    "rejects invalid random count %s",
    (blocks) =>
      expect(() => autoIntent([], blocks, "1", "0.1", fee)).toThrow(
        "invalid-blocks",
      ),
  );
  it.each(["1", "9999"])("accepts product rounds %s", (rounds) =>
    expect(autoIntent([], "1", rounds, "1", fee).rounds).toBe(BigInt(rounds)),
  );
  it.each(["0", "10000", "1.5", ""])("rejects product rounds %s", (rounds) =>
    expect(() => autoIntent([], "1", rounds, "1", fee)).toThrow(
      "invalid-rounds",
    ),
  );
  it("preserves amounts beyond Number precision and rejects fractional wei/overflow", () => {
    expect(
      autoIntent([], "1", "1", "9007199254740993.000000000000000001", BigInt(0))
        .value,
    ).toBe(BigInt("9007199254740993000000000000000001"));
    expect(() =>
      autoIntent([], "1", "1", "0.0000000000000000001", fee),
    ).toThrow();
    expect(() =>
      autoIntent([], "25", "9999", (BigInt(1) << BigInt(255)).toString(), fee),
    ).toThrow();
  });
  it("requires more than displayed principal when fees are nonzero", () => {
    const i = autoIntent([], "2", "3", "0.02", fee);
    expect(i.value > i.displayTotal).toBe(true);
    expect(i.value - i.displayTotal).toBe(fee * BigInt(3));
  });
});
describe("backend-only remaining rounds", () => {
  it.each([
    null,
    {},
    { extend_data: {} },
    { extend_data: { round_remaining: null } },
  ])("leaves missing values empty", (raw) =>
    expect(automationEnrichment(raw, a).remaining).toBeUndefined(),
  );
  it("preserves zero/leading zeros and never derives from balance/cost", () => {
    expect(
      automationEnrichment(
        { user: a, extend_data: { round_remaining: "003" } },
        a,
      ).remaining,
    ).toBe("003");
    expect(
      automationEnrichment({ extend_data: { round_remaining: 0 } }, a)
        .remaining,
    ).toBe("0");
    expect(
      automationEnrichment(
        {
          balance: "99999999999999999999",
          amount_per_square: 1,
          extend_data: {},
        },
        a,
      ),
    ).toEqual({});
    expect(() =>
      automationEnrichment(
        { user: "0x0000000000000000000000000000000000000002" },
        a,
      ),
    ).toThrow();
  });
  it("maps specific Auto errors without displaying raw provider messages", () => {
    expect(
      autoError({ cause: { data: { errorName: "AutomationAlreadyActive" } } }),
    ).toBe("already-active");
    expect(autoError({ data: { errorName: "AutomationNotAuthorized" } })).toBe(
      "not-active",
    );
  });
});
