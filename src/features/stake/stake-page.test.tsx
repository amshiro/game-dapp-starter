import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useToastFeedback } from "../../shared/ui/toast/use-toast-feedback";
import type { StakeTransactionUI } from "./transaction/use-stake-transaction";
import { StakePage } from "./stake-page";
import { StakeSummary } from "./components/stake-summary";
import { modeForKey, unavailableStakeSummary } from "./model/stake-display";

vi.mock("../../shared/ui/toast/use-toast-feedback", () => ({
  useToastFeedback: vi.fn(),
}));

describe("Stake Core UI safety boundary", () => {
  it("defaults to an accessible Deposit tab without an executable funds path", () => {
    const html = renderToStaticMarkup(<StakePage />);
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('readOnly=""');
    expect(html).toContain('placeholder="0.00"');
    expect(html).toContain('src="/ori/explore/ori-token.png"');
    expect(html.match(/disabled=""/g)).toHaveLength(4);
    expect(html).not.toContain("<form");
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain("Actions unavailable");
    expect(html).not.toContain("Enter an amount to continue.");
    expect(html).not.toContain("Refresh");
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
    expect(html).toContain("Available ORI balance: Data unavailable");
    expect(html).toContain(">—</span> ORI");
    expect(html.match(/<dd /g)).toHaveLength(3);
    expect(html).not.toMatch(/<a\b|<dialog\b/);
  });
  it.each(["loading", "error", "empty", "unavailable"] as const)(
    "distinguishes %s from real principal and approved summary defaults",
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
      if (status === "loading") {
        expect(html.match(/<svg /g)).toHaveLength(3);
        expect(html.match(/aria-label="Loading…"/g)).toHaveLength(6);
        expect(html).not.toContain(">—</dd>");
      } else if (status === "error") {
        expect(html.match(/>Could not load data<\/dd>/g)).toHaveLength(3);
        expect(html).not.toContain("<svg");
      } else if (status === "unavailable") {
        expect(html).toContain(">0%</dd>");
        expect(html).toContain(">$0.00</dd>");
        expect(html.match(/>—<\/dd>/g)).toHaveLength(1);
      } else {
        expect(html.match(/>—<\/dd>/g)).toHaveLength(3);
        expect(html).not.toContain("<svg");
      }
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

describe("Stake populated display", () => {
  it("keeps exact principal accessible while all funds controls and reward fields stay unavailable", () => {
    const value = {
      status: "populated",
      text: "123.456789",
      exact: "123.456789123456789123",
      raw: BigInt("123456789123456789123"),
    } as const;
    const html = renderToStaticMarkup(
      <StakePage
        available={value}
        staked={{ status: "loading" }}
        summary={{ ...unavailableStakeSummary, totalDeposit: value }}
      />,
    );
    expect(html).not.toContain('title="');
    expect(html).toContain('aria-label="123.456789123456789123 ORI"');
    expect(html).toContain("Available ORI balance: 123.456789123456789123 ORI");
    expect(html).not.toContain("Refresh");
    expect(html.match(/disabled=""/g)).toHaveLength(4);
    expect(html).toContain(">0%</dd>");
    expect(html).toContain(">$0.00</dd>");
  });
  it("keeps balance loading local and distinguishes unavailable data from real zero", () => {
    const loading = renderToStaticMarkup(
      <StakePage available={{ status: "loading" }} />,
    );
    expect(loading).toContain('<svg width="13" height="13"');
    expect(loading).toContain("Available ORI balance: Loading…");
    expect(loading).toContain('data-loading="data"');
    expect(loading.match(/disabled=""/g)).toHaveLength(4);
    const zero = renderToStaticMarkup(
      <StakePage
        available={{
          status: "populated",
          text: "0",
          exact: "0",
          raw: BigInt(0),
        }}
      />,
    );
    expect(zero).toContain("Available ORI balance: 0 ORI");
    expect(zero).not.toContain("<svg");
    const error = renderToStaticMarkup(
      <StakePage available={{ status: "error" }} />,
    );
    expect(error).toContain('data-status="error"');
    expect(error).toContain(">Could not load data</span>");
    expect(error).not.toContain("<svg");
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

it("replaces both balance and summary amount/unit with Data Loading", () => {
  const html = renderToStaticMarkup(
    <StakePage
      available={{ status: "loading" }}
      summary={{
        ...unavailableStakeSummary,
        totalDeposit: { status: "loading" },
      }}
    />,
  );
  const balance = html.match(/<p aria-busy="true">([\s\S]*?)<\/p>/)?.[1];
  const total = html.match(
    /<dd data-status="loading"[^>]*>([\s\S]*?)<\/dd>/,
  )?.[1];
  expect(balance).toContain('data-loading="data"');
  expect(balance?.replace(/<[^>]*>/g, "")).not.toMatch(/ORI|—/);
  expect(total).toContain('data-loading="data"');
  expect(total).not.toMatch(/ORI|—/);
});
it.each(["approve", "deposit", "withdraw"] as const)(
  "does not render inline success text for %s",
  (step) => {
    const account = "0x0000000000000000000000000000000000000001";
    const transaction: StakeTransactionUI = {
      state: {
        phase: "success",
        step,
        chainConfirmed: true,
        hash: "0x1234",
        operation: {
          account,
          chainId: 97,
          kind: step === "withdraw" ? "withdraw" : "deposit",
          amount: BigInt(1),
          token: account,
          protocol: account,
          view: account,
        },
      },
      busy: false,
      allowance: BigInt(1),
      allowanceLoading: false,
      allowanceError: false,
      refreshAllowance: () => {},
      start: async () => {},
      retryRefresh: async () => {},
      retryConfirmation: async () => {},
    };
    const html = renderToStaticMarkup(
      <StakePage transaction={transaction} draftScope={`97:${account}`} />,
    );
    expect(html).not.toContain("Deposit successful");
    expect(html).not.toContain("Withdrawal successful");
    expect(html).not.toContain("0x1234");
    expect(useToastFeedback).toHaveBeenLastCalledWith(
      step === "approve"
        ? undefined
        : expect.objectContaining({ key: transaction.state, type: "success" }),
    );
    renderToStaticMarkup(
      <StakePage transaction={transaction} draftScope="97:another-account" />,
    );
    expect(useToastFeedback).toHaveBeenLastCalledWith(undefined);
  },
);

it.each(["failed", "confirming", "refresh-failed", "refreshing"] as const)(
  "keeps %s recovery on the original action without unlocking an active retry",
  (phase) => {
    const transaction: StakeTransactionUI = {
      state: {
        phase,
        chainConfirmed: phase.startsWith("refresh"),
        confirmationUnknown: true,
        error: "confirmation-unknown",
      },
      busy: true,
      allowance: BigInt(1),
      allowanceLoading: false,
      allowanceError: false,
      refreshAllowance: vi.fn(),
      start: vi.fn(),
      retryRefresh: vi.fn(),
      retryConfirmation: vi.fn(),
    };
    const html = renderToStaticMarkup(
      <StakePage transaction={transaction} draftScope="97:account" />,
    );
    expect(html).not.toContain("Confirmation is unknown");
    const buttons = html.match(
      /<button[^>]*class="[^"]*action[^"]*"[^>]*>[\s\S]*?<\/button>/g,
    );
    expect(buttons).toHaveLength(1);
    if (phase === "failed" || phase === "refresh-failed") {
      expect(buttons![0]).not.toContain('disabled=""');
      expect(buttons![0]).toContain(
        phase === "failed" ? "Check transaction" : "Retry refresh",
      );
      expect(useToastFeedback).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: "error" }),
      );
    } else {
      expect(buttons![0]).toContain('disabled=""');
      expect(useToastFeedback).toHaveBeenLastCalledWith(undefined);
    }
  },
);
