import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MinePage } from "../mine-page";
import { MineBettingPanel } from "../components/mine-betting-panel";
import { MineAutoStatus } from "../components/mine-auto-status";
import type { AutoError } from "./auto-model";
import { MineAutominerState } from "../components/mine-automation-state";
import { LocaleProvider } from "../../../shared/i18n/locale-provider";
import type { MineAutoUI } from "./use-mine-auto";
function model(overrides: Partial<MineAutoUI> = {}): MineAutoUI {
  return {
    state: { phase: "idle", chainConfirmed: false },
    busy: false,
    loading: false,
    formBusy: false,
    input: "0.02",
    display: {
      appearance: "ready",
      amount: "0.02",
      blocks: "2",
      rounds: "3",
      selectedBlocks: "#1, #25",
      totalPerRound: "0.04",
      total: "0.12",
      balance: "1",
    },
    error: undefined,
    intent: undefined,
    executorFee: BigInt("1000000000000"),
    setInput: vi.fn(),
    setBlocks: vi.fn(),
    setRounds: vi.fn(),
    fixed: true,
    setShortcut: vi.fn(),
    canSubmit: true,
    onConnect: undefined,
    submit: vi.fn(),
    active: false,
    accountReady: true,
    running: undefined,
    stop: vi.fn(),
    canStop: false,
    stateVisible: true,
    retry: vi.fn(async () => {}),
    refresh: vi.fn(),
    ...overrides,
  };
}
describe("Auto configuration and Running Card composition", () => {
  it("reuses the approved Auto layout with editable amount, replacement shortcuts and locked fixed count", () => {
    const html = renderToStaticMarkup(
      <MineBettingPanel initialMode="auto" auto={model()} />,
    );
    expect(html).toContain('value="0.02"');
    expect(html).toMatch(
      /<input[^>]*aria-label="Blocks"[^>]*readOnly=""[^>]*value="2"/,
    );
    expect(html).toContain('value="3"');
    expect(html).toContain("Executor fee / round");
    expect(html).toContain("0.000001");
    expect(html).toContain("Deploy 0.12 BNB");
    expect(html).not.toContain("Deploy 0.120003");
    expect(html).toMatch(/<button type="button">\+0.5<\/button>/);
    expect(html).toMatch(/<button type="button">\+1<\/button>/);
    expect(html).toMatch(/<button type="button">\+2<\/button>/);
  });
  it("leaves random count editable and insufficient actual funding disables submission", () => {
    const a = model({
      fixed: false,
      canSubmit: false,
      display: {
        appearance: "insufficient",
        blocks: "2",
        rounds: "1",
        amount: "0.02",
        total: "0.04",
      },
    });
    const html = renderToStaticMarkup(
      <MineBettingPanel initialMode="auto" auto={a} />,
    );
    expect(html).not.toMatch(/<input[^>]*aria-label="Blocks"[^>]*readOnly=""/);
    expect(html).toContain('disabled=""');
    expect(html).toContain("Insufficient BNB");
  });
  it("active chain owner replaces the entire form and no remaining fallback is invented", () => {
    const a = model({
      active: true,
      running: {
        blocks: "× 2",
        random: true,
        roundsRemaining: undefined,
        totalPerRound: "0.04",
      },
      canStop: true,
    });
    const html = renderToStaticMarkup(<MinePage auto={a} />);
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("Deploy amount per cell");
    expect(html).toContain("Stop autominer");
    expect(html).toContain("Rounds remaining</dt><dd></dd>");
    expect(html).toContain("Random");
    const populated = renderToStaticMarkup(
      <MineAutominerState
        display={{ ...a.running, roundsRemaining: "003" }}
        auto={a}
      />,
    );
    expect(populated).toContain(">003</dd>");
    expect(renderToStaticMarkup(<MinePage auto={model()} />)).toContain(
      'role="tablist"',
    );
  });
  it("exposes fee and state copy in Chinese without changing the numeric model", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="zh-CN">
        <MineBettingPanel initialMode="auto" auto={model()} />
      </LocaleProvider>,
    );
    expect(html).toContain("执行费 / 每轮");
    expect(html).toContain("0.12 BNB");
  });
});

describe("Auto public failure messages", () => {
  it.each([
    "simulation-reverted",
    "receipt-reverted",
    "rpc-error",
    "already-active",
    "not-active",
    "user-rejected",
  ] as const)("uses the same generic message for ordinary %s", (error) => {
    const a = model({
      state: {
        phase: error === "user-rejected" ? "rejected" : "failed",
        chainConfirmed: false,
        error,
      },
    });
    const html = renderToStaticMarkup(<MineAutoStatus auto={a} />);
    expect(html).toContain("Operation failed. Please try again.");
    expect(a.state.error).toBe(error);
    expect(html).not.toContain(error);
  });
  it.each(["refresh-failed", "verification-failed"] as const)(
    "preserves confirmed %s recovery and forbids resend",
    (error) => {
      const a = model({
        state: { phase: error, chainConfirmed: true, error },
        busy: true,
      });
      const html = renderToStaticMarkup(<MineAutoStatus auto={a} />);
      expect(html).toContain("Chain confirmed (1 confirmation)");
      expect(html).toContain("Retry verification / refresh");
      expect(html).not.toContain("Operation failed. Please try again.");
    },
  );
  it("keeps confirmation unknown distinct from an ordinary failure", () => {
    const a = model({
      state: {
        phase: "failed",
        chainConfirmed: false,
        error: "confirmation-unknown" as AutoError,
        confirmationUnknown: true,
      },
      busy: true,
    });
    const html = renderToStaticMarkup(<MineAutoStatus auto={a} />);
    expect(html).toContain("Check confirmation");
    expect(html).not.toContain("Operation failed. Please try again.");
  });
});
