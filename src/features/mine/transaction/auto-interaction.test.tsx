import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { useMineAuto, type MineAutoUI } from "./use-mine-auto";
import { useMineManual, type MineManualUI } from "./use-mine-manual";
import { AutoTransaction } from "./auto-transaction";
import { MineBettingPanel } from "../components/mine-betting-panel";
import { MinePage } from "../mine-page";
const fixture = vi.hoisted(() => ({ manualDeployed: true, active: false }));
const account = "0x0000000000000000000000000000000000000001" as const;
const queryClient = new QueryClient();
vi.mock("wagmi", () => ({
  useConfig: () => ({}),
  usePublicClient: () => ({ chain: { id: 97 } }),
  useBalance: () => ({
    data: { value: BigInt("1000000000000000000") },
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@tanstack/react-query", async (original) => ({
  ...(await original<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => queryClient,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const name = queryKey.at(-1);
    const data =
      queryKey[1] === "automation"
        ? name === "config"
          ? BigInt(1)
          : name === "enrichment"
            ? { remaining: "2" }
            : {
                owner: account,
                active: fixture.active,
                mask: BigInt(1),
                randomizeMask: false,
                amountPerSquare: BigInt(1),
                balance: BigInt(10),
                botFee: BigInt(1),
              }
        : name === "info"
          ? {
              hasParticipation: fixture.manualDeployed,
              totalDeployed: fixture.manualDeployed ? BigInt(1) : BigInt(0),
            }
          : {
              mask: fixture.manualDeployed ? BigInt(1) : BigInt(0),
              indices: fixture.manualDeployed ? [0] : [],
              amounts: fixture.manualDeployed ? [BigInt(1)] : [],
            };
    return { data, isError: false, isPending: false, refetch: vi.fn() };
  },
}));
function renderRuntime(page = false) {
  let manualResult!: MineManualUI, autoResult!: MineAutoUI;
  function Probe() {
    const [step, setStep] = useState(0);
    const context = {
      address: account,
      targetChainId: 97,
      ready: true,
      wrongChain: false,
    };
    const manual = useMineManual(context, {
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
    });
    const auto = useMineAuto(context, manual.selected, manual.busy);
    if (!step) {
      manual.toggle(0);
      manual.setInput("0.02");
      auto.setInput("0.02");
      auto.setBlocks("2");
      setStep(1);
    }
    if (step === 1 && !page) auto.submit();
    manualResult = manual;
    autoResult = auto;
    return page ? (
      <MinePage manual={manual} auto={auto} />
    ) : (
      <MineBettingPanel initialMode="auto" manual={manual} auto={auto} />
    );
  }
  return {
    html: renderToStaticMarkup(<Probe />),
    manual: manualResult,
    auto: autoResult,
  };
}
afterEach(() => {
  fixture.manualDeployed = true;
  fixture.active = false;
  vi.restoreAllMocks();
  queryClient.clear();
});
describe("human-locked asymmetric Manual / Auto interaction", () => {
  it("a real Manual hook reporting deployed does not block Auto hook eligibility or register dispatch", () => {
    const start = vi
      .spyOn(AutoTransaction.prototype, "start")
      .mockResolvedValue(undefined);
    const h = renderRuntime();
    expect(h.manual.hasDeployedThisRound).toBe(true);
    expect(h.manual.canSubmit).toBe(false);
    expect(h.auto.canSubmit).toBe(true);
    expect(h.html).toContain("Deploy 0.02 BNB");
    expect(start).toHaveBeenCalledWith(
      "register",
      expect.objectContaining({
        randomizeMask: false,
        cellsPerRound: BigInt(1),
      }),
    );
  });
  it("changing only the Manual deployed flag leaves Auto eligibility unchanged", () => {
    vi.spyOn(AutoTransaction.prototype, "start").mockResolvedValue(undefined);
    fixture.manualDeployed = false;
    const before = renderRuntime();
    fixture.manualDeployed = true;
    const after = renderRuntime();
    expect(before.auto.canSubmit).toBe(true);
    expect(after.auto.canSubmit).toBe(true);
    expect(after.manual.hasDeployedThisRound).toBe(true);
  });
  it("active chain automation removes the entire Trade Card, not only its Manual button", () => {
    fixture.active = true;
    const h = renderRuntime(true);
    expect(h.auto.active).toBe(true);
    expect(h.auto.canSubmit).toBe(false);
    expect(h.html).not.toContain('role="tablist"');
    expect(h.html).not.toContain('role="tabpanel"');
    expect(h.html).not.toContain('aria-label="Betting / Deploy"');
    expect(h.html).not.toContain("Deploy amount per cell");
    expect(h.html).toContain("Stop autominer");
  });
  it("Stop's refreshed chain inactive restores Trade, while the independent Manual single-deploy lock remains", () => {
    fixture.active = true;
    expect(renderRuntime(true).html).not.toContain('role="tablist"');
    fixture.active = false;
    const after = renderRuntime(true);
    expect(after.html).toContain('role="tablist"');
    expect(after.manual.hasDeployedThisRound).toBe(true);
    expect(after.html).toContain("Already deployed this round");
    expect(after.manual.canSubmit).toBe(false);
    expect(after.auto.canSubmit).toBe(true);
  });
});
