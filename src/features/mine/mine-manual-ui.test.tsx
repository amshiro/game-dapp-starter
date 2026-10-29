import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/i18n/locale-provider";
import { MineCell } from "./components/mine-cell";
import { MineBettingPanel } from "./components/mine-betting-panel";
import {
  MineManualStatus,
  type ManualPanelControls,
} from "./components/mine-manual-status";
function controls(
  overrides: Partial<ManualPanelControls> = {},
): ManualPanelControls {
  return {
    display: {
      appearance: "ready",
      amount: "0.02",
      blocks: "4",
      balance: "1",
      total: "0.08",
    },
    input: "0.02",
    setInput: vi.fn(),
    setShortcut: vi.fn(),
    busy: false,
    canSubmit: true,
    submit: vi.fn(),
    onConnect: vi.fn(),
    state: { phase: "idle", chainConfirmed: false },
    stateVisible: true,
    error: undefined,
    retry: vi.fn(async () => {}),
    hasDeployedThisRound: false,
    ...overrides,
  };
}
describe("Manual mounted UI boundary", () => {
  it("uses pressed buttons over the unchanged Figma cell surface", () => {
    const html = renderToStaticMarkup(
      <MineCell
        index={24}
        amount={BigInt(100)}
        miners={BigInt(1)}
        onToggle={() => {}}
        selected
        visual="selected"
      />,
    );
    expect(html).toContain('aria-label="Select cell #25"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('disabled=""');
  });
  it("locks cell controls only when the owner explicitly disables editing", () => {
    const html = renderToStaticMarkup(
      <MineCell index={0} onToggle={() => {}} selectionDisabled />,
    );
    expect(html).toContain('disabled=""');
  });
  it("enables Manual input, shortcuts and action", () => {
    const html = renderToStaticMarkup(<MineBettingPanel manual={controls()} />);
    expect(html).not.toContain('readOnly=""');
    expect(html).toContain("Deploy 0.08 BNB");
    expect(html).not.toContain('disabled=""');
    expect(html).not.toMatch(/Select All|Clear All|<form/);
  });
  it("keeps the deployed form editable and uses only the disabled action for its notice", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="zh-CN">
        <MineBettingPanel
          manual={controls({
            hasDeployedThisRound: true,
            canSubmit: false,
            display: {
              appearance: "unavailable",
              amount: "0.03",
              blocks: "2",
              total: "0.06",
            },
          })}
        />
      </LocaleProvider>,
    );
    expect(html).not.toContain('readOnly=""');
    expect(html).toContain('value="0.03"');
    expect(html).toContain("× 2");
    expect(html).toContain("0.06");
    expect(html).toMatch(
      /<button[^>]*data-appearance="unavailable"[^>]*disabled=""[^>]*>本轮已部署<\/button>/,
    );
    expect(html.match(/本轮已部署/g)).toHaveLength(1);
    expect(html).not.toContain("不能再次手动部署");
    expect(html.match(/disabled=""/g)).toHaveLength(1);
    for (const label of ["+0.5", "+1", "+2"]) expect(html).toContain(label);
  });
  it("keeps shortcuts disabled during the existing transaction busy boundary", () => {
    const html = renderToStaticMarkup(
      <MineBettingPanel
        manual={controls({
          busy: true,
          canSubmit: false,
          state: { phase: "preparing", chainConfirmed: false },
        })}
      />,
    );
    expect(html.match(/disabled=""/g)).toHaveLength(6);
    expect(html).toContain('readOnly=""');
  });
  it("does not let Manual permission leak into Auto", () => {
    const html = renderToStaticMarkup(
      <MineBettingPanel initialMode="auto" manual={controls()} />,
    );
    expect(html).toContain('readOnly=""');
    expect(html).toContain("Actions unavailable");
    expect(html).not.toContain("0.08");
  });
  it.each([
    "disconnected",
    "no-selection",
    "insufficient",
    "unavailable",
  ] as const)("renders %s without enabling deploy", (appearance) => {
    const html = renderToStaticMarkup(
      <MineBettingPanel
        manual={controls({
          display: { appearance },
          canSubmit: false,
          onConnect: undefined,
        })}
      />,
    );
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });
  it("keeps a connected-wallet operation status out of another account's UI", () => {
    const html = renderToStaticMarkup(
      <MineManualStatus
        manual={controls({
          state: {
            phase: "failed",
            chainConfirmed: false,
            error: "receipt-reverted",
            hash: `0x${"1".repeat(64)}`,
          },
          stateVisible: false,
        })}
      />,
    );
    expect(html).not.toContain("reverted");
    expect(html).not.toContain("Transaction hash");
  });
  it("confirmed refresh failure offers reads-only recovery", () => {
    const html = renderToStaticMarkup(
      <MineBettingPanel
        manual={controls({
          busy: true,
          canSubmit: false,
          state: {
            phase: "refresh-failed",
            chainConfirmed: true,
            error: "refresh-failed",
          },
        })}
      />,
    );
    expect(html).toContain("Retry Refresh");
    expect(html).toContain("Chain confirmed");
    expect(html).toContain("Retry refresh only.");
  });
});
