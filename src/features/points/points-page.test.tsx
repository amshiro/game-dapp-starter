import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PointsPage } from "./points-page";
import { pointsDemoData } from "./data/points-demo-data";

describe("Points demo presentation", () => {
  it.each(["en", "zh-CN"] as const)(
    "clearly identifies the full Figma fixture in %s",
    (locale) => {
      const html = renderToStaticMarkup(<PointsPage locale={locale} />);
      expect(html).toContain(locale === "en" ? "Static demo" : "静态演示");
      expect(html).toContain("32,308.56");
      expect(html).toContain("2.3456 BNB");
      expect(html).not.toContain("SOL");
      expect(html.match(/<tr>/g)).toHaveLength(7);
      expect(html.match(/scope="col"/g)).toHaveLength(4);
      expect(html).not.toMatch(
        /<button|pagination|unavailable|claim|Connect Wallet/,
      );
      expect(
        new Set(pointsDemoData.records.map((record) => record.id)).size,
      ).toBe(6);
    },
  );
  it("accepts a replacement display owner without precision loss or HTML injection", () => {
    const html = renderToStaticMarkup(
      <PointsPage
        locale="en"
        model={{
          total: "900719925474099312345.56",
          records: [
            {
              id: "replacement",
              time: "<unsafe>",
              stake: "0.000000000000000001 BNB",
              value: "$0.01",
              earned: "0.01",
            },
          ],
        }}
      />,
    );
    expect(html).toContain("900719925474099312345.56");
    expect(html).toContain("0.000000000000000001 BNB");
    expect(html).toContain("&lt;unsafe&gt;");
    expect(html).not.toContain("32,308.56");
  });
});
