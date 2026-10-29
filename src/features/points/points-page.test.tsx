import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PointsPage } from "./points-page";

describe("Points real-data presentation", () => {
  it.each(["en", "zh-CN"] as const)(
    "does not show demo rows in %s",
    (locale) => {
      const html = renderToStaticMarkup(<PointsPage locale={locale} />);
      expect(html).not.toMatch(/Static demo|静态演示|32,308.56|2.3456/);
      expect(html.match(/<tr>/g)).toHaveLength(1);
      expect(html.match(/scope="col"/g)).toHaveLength(4);
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

describe("Points section lifecycle", () => {
  it("shows a spinner while loading and no empty message", () => {
    const html = renderToStaticMarkup(
      <PointsPage locale="zh-CN" status="loading" />,
    );
    expect(html).toContain("<svg");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("暂无数据");
  });
  it("distinguishes success-empty from error", () => {
    const empty = renderToStaticMarkup(
      <PointsPage locale="zh-CN" status="empty" />,
    );
    const error = renderToStaticMarkup(
      <PointsPage locale="zh-CN" status="error" />,
    );
    expect(empty).toContain("暂无数据");
    expect(error).toContain("数据加载失败");
    expect(error).not.toContain("暂无数据");
  });
});
