import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MineBettingPanel } from "./components/mine-betting-panel";
import { MineRewardState } from "./components/mine-rewards";
import { presentMineRewards } from "./model/mine-rewards";
import { parseUnits } from "viem";

describe("Reward amount presentation", () => {
  it("shortens visible rewards but preserves accessible precision without extra UI", () => {
    const exact = "12.345678912345678901";
    const html = renderToStaticMarkup(
      <MineRewardState
        display={presentMineRewards({
          ethAmount: BigInt(0),
          oriDirect: parseUnits(exact, 18),
          oriRefined: BigInt(0),
        })}
      />,
    );
    expect(html).toContain(">12.345678</span>");
    expect(html).toContain(`${exact} ORI`);
    expect(html).not.toContain('aria-haspopup="dialog"');
  });
  it("keeps tiny nonzero rewards visible and claim kind based on raw values", () => {
    const display = presentMineRewards({
      ethAmount: BigInt(1),
      oriDirect: BigInt(1),
      oriRefined: BigInt(0),
    });
    const html = renderToStaticMarkup(<MineRewardState display={display} />);
    expect(html.match(/>&lt;0.000001<\/span>/g)).toHaveLength(2);
    expect(html).toContain('data-claim-method="claimAll"');
    expect(html).toContain('data-claim-method="claimEth"');
  });
});

it.each(["manual", "auto"] as const)(
  "replaces Mine %s balance and unit while loading",
  (initialMode) => {
    const html = renderToStaticMarkup(
      <MineBettingPanel
        initialMode={initialMode}
        display={{
          appearance: "unavailable",
          balanceLoading: true,
          balance: "123",
        }}
      />,
    );
    const row = html.match(
      /<div class="[^"]*balanceRow[^"]*">([\s\S]*?)<div class="[^"]*shortcuts/,
    )?.[1];
    expect(row).toContain('data-loading="data"');
    expect(row).not.toMatch(/BNB|123|—/);
  },
);
