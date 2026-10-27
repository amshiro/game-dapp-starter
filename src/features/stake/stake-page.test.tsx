import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StakePage } from "./stake-page";
import { StakeSummary } from "./components/stake-summary";
import { modeForKey, unavailableStakeSummary } from "./model/stake-display";

describe("Stake Core UI safety boundary", () => {
  it("defaults to an accessible Deposit tab without an executable funds path", () => {
    const html = renderToStaticMarkup(<StakePage />);
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('readOnly=""');
    expect(html.match(/disabled=""/g)).toHaveLength(4);
    expect(html).not.toContain("<form");
    expect(html).not.toContain('type="submit"');
    expect(html).toContain("Actions unavailable");
    const panel = html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(panel).toBeTruthy();
    expect(html).toContain(`id="${panel}"`);
  });
  it("does not promote design samples, SOL placeholders or old yield features into runtime", () => {
    const html = renderToStaticMarkup(<StakePage />);
    expect(html).not.toMatch(
      /0\.42|2\.3056|1,560,253|12\.56|560,253\.29|SOL|Claim|Account|claimAndDeposit/,
    );
    expect(html).toContain("ORI");
    expect(html).toContain("Bal: — ORI");
    expect(html.match(/<dd /g)).toHaveLength(3);
    expect(html).not.toMatch(/<a\b|<dialog\b/);
  });
  it.each(["loading", "error", "empty", "unavailable"] as const)(
    "keeps %s values unknown rather than zero",
    (status) => {
      const html = renderToStaticMarkup(
        <StakeSummary
          values={{
            totalDeposit: { status },
            apr: { status },
            tvl: { status },
          }}
        />,
      );
      expect(html.match(/>—<\/dd>/g)).toHaveLength(3);
      expect(html).not.toContain(">0</dd>");
      if (status === "loading")
        expect(html.match(/aria-busy="true"/g)).toHaveLength(3);
    },
  );
  it("preserves future caller-owned formatted precision without interpreting APR or money", () => {
    const html = renderToStaticMarkup(
      <StakeSummary
        values={{
          ...unavailableStakeSummary,
          totalDeposit: {
            status: "populated",
            text: "900719925474099312345.000001",
          },
          apr: { status: "populated", text: "<TEST>" },
        }}
      />,
    );
    expect(html).toContain("900719925474099312345.000001");
    expect(html).toContain("&lt;TEST&gt;");
  });
});

describe("Stake mode keyboard navigation", () => {
  it("supports arrow wrap and Home/End activation independently of wallet/data", () => {
    expect(modeForKey("deposit", "ArrowRight")).toBe("withdraw");
    expect(modeForKey("deposit", "ArrowLeft")).toBe("withdraw");
    expect(modeForKey("withdraw", "ArrowRight")).toBe("deposit");
    expect(modeForKey("withdraw", "ArrowLeft")).toBe("deposit");
    expect(modeForKey("withdraw", "Home")).toBe("deposit");
    expect(modeForKey("deposit", "End")).toBe("withdraw");
  });
  it("leaves native Tab/Enter/Space behavior untouched", () => {
    for (const key of ["Tab", "Enter", " ", "Escape"])
      expect(modeForKey("deposit", key)).toBeUndefined();
  });
});
