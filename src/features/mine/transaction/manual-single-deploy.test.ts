import { describe, expect, it } from "vitest";
import { createMineAccountQueries } from "../read/mine-account-queries";
import {
  assertFirstManualDeploy,
  cellMask,
  hasDeployedThisRound,
  manualAmount,
  manualValue,
  reconcileSelection,
} from "./manual-model";
const zero = BigInt(0),
  one = BigInt(1);
const blank = { hasParticipation: false, totalDeployed: zero };
describe("human-approved Manual single-deploy product policy", () => {
  it("allows selecting multiple cells before the first deploy", () => {
    assertFirstManualDeploy(blank, { mask: zero });
    const mask = cellMask([0, 2, 7]);
    expect(mask).toBe(BigInt(133));
    expect(manualValue(mask, manualAmount("0.000001"))).toBe(
      BigInt("3000000000000"),
    );
  });
  it.each([
    [{ hasParticipation: true, totalDeployed: zero }, { mask: zero }],
    [{ hasParticipation: false, totalDeployed: one }, { mask: zero }],
    [blank, { mask: one }],
  ])(
    "blocks every second deploy, including entirely different cells",
    (info, squares) => {
      // No intersection with the next mask is required: any participation locks this round.
      expect(cellMask([24]) & squares.mask).toBe(zero);
      expect(hasDeployedThisRound(info, squares)).toBe(true);
      expect(() => assertFirstManualDeploy(info, squares)).toThrow(
        "already-deployed-round",
      );
    },
  );
  it("does not treat unavailable account reads as permission", () => {
    expect(hasDeployedThisRound(undefined, undefined)).toBeUndefined();
    expect(hasDeployedThisRound(blank, undefined)).toBeUndefined();
    expect(hasDeployedThisRound(undefined, { mask: zero })).toBeUndefined();
  });
  it("does not carry old participation into a genuinely different account/round query", () => {
    const account = "0x0000000000000000000000000000000000000001" as const;
    const old = createMineAccountQueries(undefined, {
      chainId: 97,
      account,
      roundId: BigInt(1654),
      enabled: true,
    });
    const next = createMineAccountQueries(undefined, {
      chainId: 97,
      account,
      roundId: BigInt(1655),
      enabled: true,
    });
    expect(old.info.queryKey).not.toEqual(next.info.queryKey);
    expect(old.squares.queryKey).not.toEqual(next.squares.queryKey);
    expect(
      hasDeployedThisRound(
        { hasParticipation: true, totalDeployed: one },
        { mask: one },
      ),
    ).toBe(true);
    expect(hasDeployedThisRound(blank, { mask: zero })).toBe(false);
  });
  it("clears a previous round's draft and never creates an automatic transaction", () => {
    const result = reconcileSelection(
      { account: "a", round: "97:1654" },
      { account: "a", round: "97:1655" },
      [0, 2, 7],
    );
    expect(result.selected).toEqual([]);
  });
});
