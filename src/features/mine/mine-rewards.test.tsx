import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MineRewardState } from "./components/mine-rewards";
import {
  presentMineRewards,
  type MineRewardAmounts,
} from "./model/mine-rewards";
import { MinePage } from "./mine-page";
import { LocaleProvider } from "../../shared/i18n/locale-provider";
const zero: MineRewardAmounts = {
  ethAmount: BigInt(0),
  oriDirect: BigInt(0),
  oriRefined: BigInt(0),
};
const render = (data: MineRewardAmounts) =>
  renderToStaticMarkup(<MineRewardState display={presentMineRewards(data)} />);
describe("human-confirmed Mine reward visibility / read-only claim entries", () => {
  it("all zeros remove the entire section/card/buttons, not three zero rows", () =>
    expect(render(zero)).toBe(""));
  it("only BNB shows only native reward and claimEth entry", () => {
    const html = render({ ...zero, ethAmount: BigInt(1) });
    expect(html).toContain("0.000000000000000001");
    expect(html).toContain("BNB");
    expect(html).toContain('data-claim-method="claimEth"');
    expect(html).not.toContain('data-claim-method="claimAll"');
    expect(html).not.toContain("Unrefined ORI");
    expect(html.match(/<dt>/g)).toHaveLength(1);
  });
  it.each(["oriDirect", "oriRefined"] as const)(
    "%s shows claimAll, without a native claim entry",
    (field) => {
      const html = render({ ...zero, [field]: BigInt(1) });
      expect(html).toContain('data-claim-method="claimAll"');
      expect(html).not.toContain('data-claim-method="claimEth"');
      expect(html).toContain(
        field === "oriDirect" ? "Unrefined ORI" : "Refined ORI",
      );
    },
  );
  it("mixed data renders canonical labels, exact numbers and both disabled entries", () => {
    const html = render({
      ethAmount: BigInt("1000000000000000000"),
      oriDirect: BigInt("12560000000000000000"),
      oriRefined: BigInt("9007199254740993000000000000000001"),
    });
    expect(html.match(/<dt>/g)).toHaveLength(3);
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(2);
    expect(html).toContain('data-layout="complete"');
    expect(html).not.toMatch(/ORE|BURY|Claimable|claimable/);
    expect(html).toContain('title="9007199254740993.000000000000000001 ORI"');
  });
  it("shows approved Chinese labels and does not reinterpret them as Origin rewards", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="zh-CN">
        <MineRewardState
          display={presentMineRewards({
            ethAmount: BigInt(1),
            oriDirect: BigInt(1),
            oriRefined: BigInt(1),
          })}
        />
      </LocaleProvider>,
    );
    for (const label of [
      "BNB",
      "未精炼 ORI",
      "已精炼 ORI",
      "领取",
      "仅领取 BNB",
    ])
      expect(html).toContain(label);
    expect(html).not.toContain("起源");
  });
  it("reward loading/error/unavailable are distinct from zero; no unknown claims are invented", () => {
    for (const status of [
      "loading",
      "error",
      "unavailable",
      "wrong-chain",
    ] as const) {
      const html = renderToStaticMarkup(
        <MineRewardState display={{ status }} onRetry={() => {}} />,
      );
      expect(html).toContain("Rewards");
      expect(html).not.toContain("data-claim-method");
      if (status === "error") expect(html).toContain("Refresh");
    }
    expect(
      renderToStaticMarkup(
        <MineRewardState display={{ status: "disconnected" }} />,
      ),
    ).toBe("");
  });
  it("Rewards compose independently of whether Auto is active or the Trade form is visible", () => {
    const rewards = presentMineRewards({ ...zero, oriDirect: BigInt(1) });
    const manual = renderToStaticMarkup(<MinePage rewards={rewards} />);
    expect(manual).toContain('role="tablist"');
    expect(manual).toContain("Unrefined ORI");
    const running = renderToStaticMarkup(
      <MinePage
        rewards={rewards}
        actionPresentation={{ kind: "autominer", automation: {} }}
      />,
    );
    expect(running).not.toContain('role="tablist"');
    expect(running).toContain("Unrefined ORI");
    expect(running.match(/data-claim-method="claimAll"/g)).toHaveLength(1);
  });
});
