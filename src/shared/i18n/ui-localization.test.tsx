import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "./locale-provider";
import { nextLocale, resolveLocale } from "./locale";
import { StakePage } from "../../features/stake/stake-page";
import { ExplorePage } from "../../features/explore/explore-page";
import { WalletSheet } from "../../features/wallet/ui/wallet-sheet";
import { getEvmChainForEnvironment } from "../config/evm-chains";
import stakeEn from "../../features/stake/locales/en.json";
import stakeZh from "../../features/stake/locales/zh-CN.json";
import exploreEn from "../../features/explore/locales/en.json";
import exploreZh from "../../features/explore/locales/zh-CN.json";
import walletEn from "../../features/wallet/locales/en.json";
import walletZh from "../../features/wallet/locales/zh-CN.json";
import modalEn from "../ui/modal/locales/en.json";
import modalZh from "../ui/modal/locales/zh-CN.json";

const chain = getEvmChainForEnvironment("development");
describe("request-owned locale boundary", () => {
  it("accepts only explicit supported preferences and toggles reversibly", () => {
    expect(resolveLocale()).toBe("en");
    expect(resolveLocale("zh-CN")).toBe("zh-CN");
    expect(resolveLocale("zh_CN")).toBe("en");
    expect(resolveLocale("<script>")).toBe("en");
    expect(nextLocale(nextLocale("en"))).toBe("en");
  });
  it.each([
    [stakeEn, stakeZh],
    [exploreEn, exploreZh],
    [walletEn, walletZh],
    [modalEn, modalZh],
  ])("provides every owner key in both languages", (en, zh) => {
    function compare(a: unknown, b: unknown) {
      if (typeof a === "string") {
        expect(typeof b).toBe("string");
        if (typeof b === "string") expect(b.trim()).not.toBe("");
        return;
      }
      if (!a || !b || typeof a !== "object" || typeof b !== "object")
        throw new Error("Invalid translation resource");
      expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
      for (const [key, value] of Object.entries(a))
        compare(value, (b as Record<string, unknown>)[key]);
    }
    compare(en, zh);
  });
  it("localizes existing UI and accessible controls while preserving external-wallet restrictions", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="zh-CN">
        <StakePage />
        <ExplorePage />
        <WalletSheet
          identity={{
            status: "connected",
            address: "0x0000000000000000000000000000000000000001",
            walletChainId: 97,
          }}
          targetChain={chain}
          actionFailed={false}
          onClose={() => {}}
          onDisconnect={async () => {}}
        />
      </LocaleProvider>,
    );
    for (const text of [
      "质押",
      "探索",
      "我的钱包",
      "关闭钱包",
      "复制钱包地址",
      "断开钱包",
      "数据暂不可用",
    ])
      expect(html).toContain(text);
    expect(html).not.toMatch(/>Export<|>Receive<|>导出<|>接收<|48\.60/);
    expect(html).toContain("ORI");
    expect(html).toContain("BNB");
    expect(html).not.toContain("ORE");
  });
  it("does not leak a Chinese render into the next English render", () => {
    renderToStaticMarkup(
      <LocaleProvider locale="zh-CN">
        <StakePage />
      </LocaleProvider>,
    );
    const en = renderToStaticMarkup(
      <LocaleProvider locale="en">
        <StakePage />
      </LocaleProvider>,
    );
    expect(en).toContain(">Stake</h1>");
    expect(en).not.toContain("质押");
  });
});
