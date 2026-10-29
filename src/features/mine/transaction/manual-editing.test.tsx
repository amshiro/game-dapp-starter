import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { useMineManual, type MineManualUI } from "./use-mine-manual";
import type { ManualContext } from "./manual-transaction";
import { manualAmountShortcuts } from "./manual-model";
import { ManualTransaction } from "./manual-transaction";
import { MineBettingPanel } from "../components/mine-betting-panel";
import type { MineBoardSnapshot } from "../read/mine-read-query";
const fixture = vi.hoisted(() => ({ unknown: false, keys: [] as string[] }));
const queryClient = new QueryClient();
vi.mock("wagmi", () => ({
  useConfig: () => ({}),
  usePublicClient: () => ({ chain: { id: 97 } }),
  useBalance: () => ({
    data: { value: BigInt("1000000000000000000") },
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@tanstack/react-query", async (original) => ({
  ...(await original<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => queryClient,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const round = queryKey[5];
    fixture.keys.push(String(round));
    const deployed = round === "42";
    return {
      data: fixture.unknown
        ? undefined
        : queryKey.at(-1) === "info"
          ? {
              hasParticipation: deployed,
              totalDeployed: deployed ? BigInt(1) : BigInt(0),
            }
          : {
              mask: deployed ? BigInt(1) : BigInt(0),
              indices: deployed ? [0] : [],
              amounts: deployed ? [BigInt(1)] : [],
            },
      isError: false,
      refetch: vi.fn(),
    };
  },
}));
// Server rendering exercises real hook state updates without a DOM, wallet, or RPC transport.
function renderEditing(nextRound = false) {
  let result!: MineManualUI;
  function Probe() {
    const [step, setStep] = useState(0);
    const roundId = BigInt(nextRound && step >= 3 ? 43 : 42);
    const snapshot: MineBoardSnapshot = {
      roundId,
      blockNumber: BigInt(100),
      totalDeployed: BigInt(1),
      deployedPerSquare: [],
      minersPerSquare: [],
      transition: false,
      initialized: true,
      randomnessFulfilled: false,
      canDeploy: true,
      live: true,
    };
    const manual = useMineManual(
      {
        targetChainId: 97,
        address: "0x0000000000000000000000000000000000000001",
        ready: true,
        wrongChain: false,
      },
      snapshot,
    );
    if (step === 0) {
      manual.toggle(0);
      setStep(1);
    }
    if (step === 1) {
      manual.toggle(24);
      manual.setInput("0.02");
      setStep(2);
    }
    if (step === 2) {
      manual.submit();
      manual.toggle(0);
      manual.setInput("0.03");
      setStep(nextRound ? 3 : 4);
    }
    if (step === 3) {
      manual.toggle(24);
      setStep(4);
    }
    if (step === 4 && !nextRound) manual.submit();
    result = manual;
    return <MineBettingPanel manual={manual} />;
  }
  const html = renderToStaticMarkup(<Probe />);
  return { result, html };
}
afterEach(() => {
  fixture.unknown = false;
  fixture.keys = [];
  vi.restoreAllMocks();
  queryClient.clear();
});
describe("deployed account: editable draft remains separate from submission permission", () => {
  it("supports selection/deselection and amount edits with exact updated totals, but never starts another transaction", () => {
    const start = vi.spyOn(ManualTransaction.prototype, "start");
    const { result, html } = renderEditing();
    expect(result.hasDeployedThisRound).toBe(true);
    expect(result.selectionEnabled).toBe(true);
    expect(result.selected).toEqual([24]);
    expect(result.input).toBe("0.03");
    expect(result.display.total).toBe("0.03");
    expect(result.canSubmit).toBe(false);
    expect(start).not.toHaveBeenCalled();
    expect(html).not.toContain('readOnly=""');
    expect(html).toContain('value="0.03"');
    expect(html).toMatch(
      /disabled=""[^>]*>Already deployed this round<\/button>/,
    );
    expect(html.match(/Already deployed this round/g)).toHaveLength(1);
    expect(html).not.toContain("no second Manual deploy");
  });
  it("unlocks only from the new round's account Query, with no manual lock reset", () => {
    const { result } = renderEditing(true);
    expect(fixture.keys).toContain("43");
    expect(result.hasDeployedThisRound).toBe(false);
    expect(result.selected).toEqual([24]);
    expect(result.canSubmit).toBe(true);
  });
  it("unknown account state keeps drafts editable but submission fails closed", () => {
    fixture.unknown = true;
    const start = vi.spyOn(ManualTransaction.prototype, "start");
    const { result } = renderEditing();
    expect(result.hasDeployedThisRound).toBeUndefined();
    expect(result.selectionEnabled).toBe(true);
    expect(result.selected).toEqual([24]);
    expect(result.canSubmit).toBe(false);
    expect(start).not.toHaveBeenCalled();
  });
});

function renderShortcuts(
  values: readonly (typeof manualAmountShortcuts)[number][],
  contextOverride: Partial<ManualContext> = {},
) {
  let result!: MineManualUI;
  const seen: { input: string; total?: string; count: number }[] = [];
  function Probe() {
    const [step, setStep] = useState(0);
    const manual = useMineManual(
      {
        targetChainId: 97,
        address: "0x0000000000000000000000000000000000000001",
        ready: true,
        wrongChain: false,
        ...contextOverride,
      },
      {
        roundId: BigInt(42),
        blockNumber: BigInt(100),
        totalDeployed: BigInt(1),
        deployedPerSquare: [],
        minersPerSquare: [],
        transition: false,
        initialized: true,
        randomnessFulfilled: false,
        canDeploy: true,
        live: true,
      },
    );
    if (step === 0) {
      manual.toggle(0);
      setStep(1);
    } else if (step === 1) {
      manual.toggle(3);
      setStep(2);
    } else if (step === 2) {
      manual.toggle(24);
      manual.setInput("0.02");
      setStep(3);
    } else if (step < 3 + values.length) {
      manual.setShortcut(values[step - 3]);
      setStep(step + 1);
    }
    if (step >= 4)
      seen.push({
        input: manual.input,
        total: manual.display.total,
        count: manual.selected.length,
      });
    if (step === 3 + values.length) manual.submit();
    result = manual;
    return <MineBettingPanel manual={manual} />;
  }
  const html = renderToStaticMarkup(<Probe />);
  return { result, seen, html };
}
describe("Figma Manual per-cell presets", () => {
  it.each([
    ["0.5", "1.5"],
    ["1", "3"],
    ["2", "6"],
  ] as const)(
    "replaces .02 with %s for three selected cells, total %s",
    (value, total) => {
      const start = vi.spyOn(ManualTransaction.prototype, "start");
      const { result, html } = renderShortcuts([value]);
      expect(result.input).toBe(value);
      expect(result.display.total).toBe(total);
      expect(result.selected).toEqual([0, 3, 24]);
      expect(result.hasDeployedThisRound).toBe(true);
      expect(result.canSubmit).toBe(false);
      expect(start).not.toHaveBeenCalled();
      expect(html.match(/disabled=""/g)).toHaveLength(1);
      expect(html).toMatch(
        /disabled=""[^>]*>Already deployed this round<\/button>/,
      );
    },
  );
  it("repeated clicks overwrite rather than accumulate and never alter selected count", () => {
    const { seen, result } = renderShortcuts(["2", "0.5", "1", "0.5"]);
    expect(seen).toEqual([
      { input: "2", total: "6", count: 3 },
      { input: "0.5", total: "1.5", count: 3 },
      { input: "1", total: "3", count: 3 },
      { input: "0.5", total: "1.5", count: 3 },
    ]);
    expect(result.canSubmit).toBe(false);
  });
  it.each([
    { ready: false, address: undefined },
    { ready: false, wrongChain: true },
  ])(
    "keeps local shortcuts usable without a target-ready wallet",
    (context) => {
      const start = vi.spyOn(ManualTransaction.prototype, "start");
      const { result, html } = renderShortcuts(["0.5"], context);
      expect(result.input).toBe("0.5");
      expect(result.display.total).toBe("1.5");
      expect(result.canSubmit).toBe(false);
      expect(start).not.toHaveBeenCalled();
      expect(html.match(/disabled=""/g)).toHaveLength(1);
    },
  );
});
