import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MineBettingPanel } from "./components/mine-betting-panel";
import { MineAutominerState } from "./components/mine-automation-state";
import { MineRewardState } from "./components/mine-rewards";
import { MineResults } from "./components/mine-results";
import { MineCell } from "./components/mine-cell";
import { MineMetrics } from "./components/mine-metrics";
import {
  bettingModeForKey,
  type MineCellVisual,
} from "./model/mine-presentation";

// TEST fixtures exercise drawn states only. These are not approved balances, payout formulas or deploy permissions.
const testBetting = {
  amount: "0.42",
  balance: "2.3056",
  blocks: "2",
  total: "0.84",
};
describe("Mine Manual / Auto presentation boundary", () => {
  it.each([
    "unavailable",
    "disconnected",
    "no-selection",
    "insufficient",
    "ready",
  ] as const)("renders %s without an executable action", (appearance) => {
    const html = renderToStaticMarkup(
      <MineBettingPanel display={{ ...testBetting, appearance }} />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('readOnly=""');
    expect(html).toContain("BNB");
    expect(html).not.toContain("SOL");
    expect(html).not.toContain("<form");
    const controls = html.match(/<button[^>]*>/g)!;
    expect(
      controls
        .filter((button) => !button.includes('role="tab"'))
        .every((button) => button.includes('disabled=""')),
    ).toBe(true);
    if (appearance === "insufficient")
      expect(html).toContain("Insufficient BNB");
    if (appearance === "disconnected") expect(html).toContain("Connect wallet");
  });
  it("shows Auto fields and the drawn draft round default without computing unapproved totals", () => {
    const html = renderToStaticMarkup(<MineBettingPanel initialMode="auto" />);
    expect(html).toContain("Total per round");
    expect(html).toContain("Rounds");
    expect(html).toContain('value="1"');
    expect(html).toContain('aria-label="Decrease rounds"');
    expect(html).toContain('aria-label="Increase rounds"');
    expect(html).not.toMatch(/0\.02|0\.06|0\.42|2\.3056/);
    expect(html).not.toContain('value="0"');
    expect(html).toContain("Actions unavailable");
  });
  it("accepts display strings without deriving a total from selected blocks, rounds or amount", () => {
    const html = renderToStaticMarkup(
      <MineBettingPanel
        initialMode="auto"
        display={{
          appearance: "ready",
          amount: "TEST-A",
          totalPerRound: "TEST-B",
          total: "TEST-C",
          rounds: "3",
          selectedBlocks: "#2, #8",
        }}
      />,
    );
    expect(html).toContain("TEST-A");
    expect(html).toContain("TEST-B");
    expect(html).toContain("TEST-C");
  });
  it("supports tab arrow wrap/Home/End and leaves native Enter/Space/Tab alone", () => {
    expect(bettingModeForKey("manual", "ArrowRight")).toBe("auto");
    expect(bettingModeForKey("auto", "ArrowLeft")).toBe("manual");
    expect(bettingModeForKey("auto", "Home")).toBe("manual");
    expect(bettingModeForKey("manual", "End")).toBe("auto");
    for (const key of ["Enter", " ", "Tab"])
      expect(bettingModeForKey("manual", key)).toBeUndefined();
  });
});

describe("Mine results rows", () => {
  it("renders one/two-amount rows with stable address/amount columns, not a guessed ranking", () => {
    const html = renderToStaticMarkup(
      <MineResults
        display={{
          status: "populated",
          roundId: "9007199254740993",
          rows: [
            {
              id: "TEST-row-1",
              addressText: "TEST & <miner>",
              amounts: [{ text: "1.23", unit: "BNB" }],
            },
            {
              id: "TEST-row-2",
              addressText: "TEST second",
              amounts: [
                { text: "TEST-ORI", unit: "ORI" },
                { text: "TEST-BNB", unit: "BNB" },
              ],
            },
          ],
        }}
      />,
    );
    expect(html).toContain("9007199254740993");
    expect(html).toContain("TEST &amp; &lt;miner&gt;");
    expect(html.match(/scope="row"/g)).toHaveLength(2);
    expect(html.match(/scope="col"/g)).toHaveLength(2);
    expect(html).toContain("TEST-ORI");
    expect(html).toContain("TEST-BNB");
    expect(html).not.toContain("Rank");
  });
  it.each(["empty", "unavailable", "error", "loading"] as const)(
    "has explicit %s layout without fabricated miners or a previous-round ID",
    (status) => {
      const html = renderToStaticMarkup(<MineResults display={{ status }} />);
      expect(html).toContain("<table");
      expect(html).toContain('colSpan="2"');
      expect(html).not.toContain('scope="row"');
      expect(html).not.toMatch(/0xAB|1654|1653/);
      if (status === "loading") expect(html).toContain('aria-busy="true"');
    },
  );
});

describe("Frame 4 static visual variants", () => {
  it.each([
    "default",
    "selected",
    "deployed",
    "combined",
    "auto-selected",
    "auto-muted",
    "winning",
    "lost",
    "waiting",
  ] satisfies MineCellVisual[])(
    "supports %s without inventing state transitions",
    (visual) => {
      const html = renderToStaticMarkup(
        <MineCell
          index={13}
          visual={visual}
          amount={BigInt("1430800000000000000")}
          miners={BigInt(1200)}
          ownAmount={BigInt("280000000000000000")}
        />,
      );
      expect(html).toContain(`data-visual="${visual}"`);
      expect(html).toContain("#14");
      expect(html).not.toMatch(/<button|tabindex|aria-selected/);
      if (visual === "waiting") expect(html).not.toContain(">1.4308</span>");
    },
  );
  it("renders an unknown Autominer without invented reward rows or claim entries", () => {
    const html = renderToStaticMarkup(
      <>
        <MineAutominerState />
        <MineRewardState />
      </>,
    );
    expect(html).toContain("Stop autominer");
    expect(html).toContain("Rounds remaining");
    expect(html).not.toContain("Rewards");
    expect(html).not.toMatch(/ORE|BURY|1,560,253|12\.56/);
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
  });
  it("renders the Waiting metric separately from a fixture-only countdown", () => {
    const waiting = renderToStaticMarkup(
      <MineMetrics waiting roundId="1654" />,
    );
    expect(waiting).toContain("Waiting");
    expect(waiting).not.toContain("00:48");
    const fixture = renderToStaticMarkup(<MineMetrics countdown="TEST-TIME" />);
    expect(fixture).toContain("TEST-TIME");
  });
});
