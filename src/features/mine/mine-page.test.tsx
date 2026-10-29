import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { presentMineRewards } from "./model/mine-rewards";
import { MinePage } from "./mine-page";
import { MineCell } from "./components/mine-cell";
import { LocaleProvider } from "../../shared/i18n/locale-provider";

const snapshot = {
  blockNumber: BigInt(100),
  roundId: BigInt("9007199254740993"),
  initialized: true,
  totalDeployed: BigInt("1000000000000000"),
  transition: true,
  deployedPerSquare: Array.from({ length: 25 }, (_, i) =>
    i === 3 ? BigInt("1000000000000000") : BigInt(0),
  ),
  minersPerSquare: Array.from({ length: 25 }, (_, i) =>
    i === 3 ? BigInt(1) : BigInt(0),
  ),
};
describe("Mine read-only page", () => {
  it("renders 25 semantic cells with real stored data and no selection/funds affordance", () => {
    const html = renderToStaticMarkup(
      <MinePage
        display={{ status: "populated", snapshot }}
        onRefresh={() => {}}
      />,
    );
    expect(html.match(/<li /g)).toHaveLength(25);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('readOnly=""');
    expect(html).not.toContain("Stored round");
    expect(html).toContain("Waiting");
    expect(html).toContain(
      "#4; Read-only; Participation count: 1; Deployed amount: 0.001 BNB",
    );
    expect(html.match(/data-visual="default"/g)).toHaveLength(25);
    expect(html).not.toMatch(
      /<form|Claim<|SOL|32,578|2896\.32|256\.3|00:48|326/,
    );
    expect(html).toContain("Data unavailable");
  });
  it.each(["loading", "error", "unavailable", "wrongChain"] as const)(
    "keeps %s slots unknown and does not invent rows",
    (status) => {
      const html = renderToStaticMarkup(<MinePage display={{ status }} />);
      expect(html.match(/<li /g)).toHaveLength(25);
      expect(html).not.toContain("0.001");
      expect(html).not.toContain(">0<");
      expect(html).not.toContain("0xAB");
      if (status === "loading") {
        expect(html).toContain('aria-busy="true"');
        expect(html).toContain('role="status" aria-label="Loading…"');
        const board = html.slice(html.indexOf("<ol"), html.indexOf("</ol>"));
        expect(board).not.toContain(">—<");
      }
    },
  );
  it.each(["default", "selected", "deployed", "combined"] as const)(
    "supports isolated %s presentation without enabling runtime interaction",
    (visual) => {
      const html = renderToStaticMarkup(
        <MineCell
          index={7}
          visual={visual}
          ownAmount={BigInt("280000000000000000")}
        />,
      );
      expect(html).toContain(`data-visual="${visual}"`);
      expect(html).not.toMatch(/<button|tabindex|role="button"/);
      if (visual === "deployed" || visual === "combined")
        expect(html).toContain("0.28");
    },
  );
  it("composes the second frame-4 state only from explicit presentation props, never from selecting Auto", () => {
    const html = renderToStaticMarkup(
      <MinePage
        display={{ status: "populated", snapshot }}
        actionPresentation={{
          kind: "autominer",
          automation: {},
          rewards: presentMineRewards({
            ethAmount: BigInt(1),
            oriDirect: BigInt(1),
            oriRefined: BigInt(1),
          }),
        }}
        cellPresentation={{ 13: { visual: "winning" } }}
      />,
    );
    expect(html).toContain("Stop autominer");
    expect(html).toContain("Rewards");
    expect(html).toContain('data-visual="winning"');
    expect(html).not.toContain('role="tablist"');
    expect(html).toContain('disabled=""');
    const runtime = renderToStaticMarkup(
      <MinePage display={{ status: "populated", snapshot }} />,
    );
    expect(runtime).not.toContain("Stop autominer");
    expect(runtime).not.toContain("Rewards");
  });
  it("uses the request locale without changing blockchain identity", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="zh-CN">
        <MinePage display={{ status: "populated", snapshot }} />
      </LocaleProvider>,
    );
    expect(html).not.toContain("已存储轮次");
    expect(html).toContain("参与计数: 1");
  });
});
