import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AboutPage } from "./about-page";
import { getAboutCopy, recoveredInlineCopy } from "./data/about-copy";

describe("About recovered content", () => {
  it.each(["en", "zh-CN"] as const)(
    "publishes only Figma's five sections in %s, initially collapsed",
    (locale) => {
      const html = renderToStaticMarkup(<AboutPage locale={locale} />);
      expect(html.match(/aria-expanded="false"/g)).toHaveLength(5);
      expect(html.match(/role="region"/g)).toHaveLength(5);
      expect(html.match(/ inert=""/g)).toHaveLength(5);
      expect(html.match(/aria-hidden="true"/g)).toHaveLength(5);
      expect(html).toContain('href="https://ori.supply"');
      expect(html).toContain('href="https://x.com/refinORI"');
      expect(html).toContain('href="https://t.me/refinORI"');
      expect(html).toContain(
        `href="https://whitepaper.ori.supply${locale === "en" ? "/en" : ""}"`,
      );
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).not.toMatch(
        /&lt;\/?\d+&gt;|Learn about the BUBY|Solana blockchain/,
      );
      expect(Object.keys(getAboutCopy(locale).sections)).toEqual([
        "intro",
        "mining",
        "staking",
        "tokenomics",
        "links",
      ]);
    },
  );
  it("preserves conflicting recovered rates as copy, without interpreting them as contract rules", () => {
    const copy = getAboutCopy("en");
    expect(
      copy.sections.staking.blocks.map((block) => block.text).join(" "),
    ).toContain("6%");
    expect(
      copy.sections.tokenomics.blocks.map((block) => block.text).join(" "),
    ).toContain("10%");
  });
  it("renders numbered emphasis safely and escapes other markup", () => {
    const html = renderToStaticMarkup(
      <p>{recoveredInlineCopy("<0>ORI</0> <script>unsafe</script>")}</p>,
    );
    expect(html).toContain("<strong>ORI</strong>");
    expect(html).toContain("&lt;script&gt;unsafe&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
