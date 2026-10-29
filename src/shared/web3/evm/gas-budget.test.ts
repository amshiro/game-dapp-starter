import { describe, expect, it } from "vitest";
import { bufferedGasFees } from "./gas-budget";
describe("5% legacy fee budget", () => {
  it.each([
    [BigInt("100"), BigInt("100"), BigInt("105"), BigInt("105")],
    [BigInt("1"), BigInt("1"), BigInt("2"), BigInt("2")],
    [
      BigInt("21001"),
      BigInt("1000000001"),
      BigInt("22052"),
      BigInt("1050000002"),
    ],
  ])(
    "rounds each input upward: %s / %s",
    (gas, price, expectedGas, expectedPrice) => {
      expect(bufferedGasFees(gas, price)).toEqual({
        gas: expectedGas,
        gasPrice: expectedPrice,
        budget: expectedGas * expectedPrice,
      });
    },
  );
  it("preserves integers beyond Number precision", () => {
    const x = BigInt("900719925474099312345");
    const result = bufferedGasFees(x, x);
    expect(result.gas * BigInt("100")).toBeGreaterThanOrEqual(
      x * BigInt("105"),
    );
    expect((result.gas - BigInt("1")) * BigInt("100")).toBeLessThan(
      x * BigInt("105"),
    );
    expect(result.budget).toBe(result.gas * result.gasPrice);
  });
  it.each([
    [BigInt("0"), BigInt("1")],
    [BigInt("1"), BigInt("0")],
    [-BigInt("1"), BigInt("1")],
  ])("rejects invalid estimate %s / %s", (gas, price) =>
    expect(() => bufferedGasFees(gas, price)).toThrow(),
  );
});
