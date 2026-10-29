import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Hash } from "viem";
import { MineRewardState } from "../components/mine-rewards";
import { MineClaimStatus } from "../components/mine-claim-status";
import { presentMineRewards } from "../model/mine-rewards";
import type { MineClaimUI } from "./use-mine-claim";
const reward = presentMineRewards({
  ethAmount: BigInt(1),
  oriDirect: BigInt(1),
  oriRefined: BigInt(1),
});
function ui(phase: MineClaimUI["state"]["phase"] = "idle"): MineClaimUI {
  const busy = !["idle", "success", "failed", "rejected"].includes(phase);
  return {
    state: {
      phase,
      chainConfirmed: [
        "success",
        "refresh-failed",
        "verification-failed",
        "refreshing",
      ].includes(phase),
      operation: {
        account: "0x0000000000000000000000000000000000000001",
        chainId: 97,
        protocol: "0x0000000000000000000000000000000000000002",
        kind: "claimAll",
      },
      hash: phase === "idle" ? undefined : (`0x${"1".repeat(64)}` as Hash),
    },
    busy,
    stateVisible: true,
    canClaimAll: !busy,
    canClaimEth: !busy,
    submit: vi.fn(),
    retry: vi.fn(async () => {}),
  };
}
describe("Rewards claim UI", () => {
  it("normal runtime both entries use actual enabled buttons", () => {
    const html = renderToStaticMarkup(
      <MineRewardState display={reward} claim={ui()} />,
    );
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).not.toContain('disabled=""');
  });
  it.each([
    "preparing",
    "awaiting-signature",
    "confirming",
    "refreshing",
  ] as const)(
    "%s disables all claim entries while preserving card geometry",
    (phase) => {
      const claim = ui(phase),
        html = renderToStaticMarkup(
          <>
            <MineRewardState display={reward} claim={claim} />
            <MineClaimStatus claim={claim} />
          </>,
        );
      expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(2);
      expect(html).toContain('data-layout="complete"');
      expect(html).not.toContain("Read-only rewards");
    },
  );
  it("ordinary failure is generic, not the decoded raw contract error", () => {
    const claim = ui("failed");
    claim.state = { ...claim.state, error: "claim-window-passed" };
    const html = renderToStaticMarkup(<MineClaimStatus claim={claim} />);
    expect(html).toContain("Operation failed. Please try again.");
    expect(html).not.toContain("ClaimWindowPassed");
  });
  it("confirmed refresh failure remains recoverable after rewards become all zero", () => {
    const claim = ui("refresh-failed"),
      html = renderToStaticMarkup(
        <>
          <MineRewardState
            display={presentMineRewards({
              ethAmount: BigInt(0),
              oriDirect: BigInt(0),
              oriRefined: BigInt(0),
            })}
            claim={claim}
          />
          <MineClaimStatus claim={claim} />
        </>,
      );
    expect(html).not.toContain("data-claim-method");
    expect(html).toContain("Retry Refresh");
    expect(html).toContain("Chain confirmed");
    expect(html).not.toContain("try again");
  });
  it("new account never sees old account's hash or success; pending original operation still blocks", () => {
    const claim = ui("confirming");
    claim.stateVisible = false;
    const html = renderToStaticMarkup(<MineClaimStatus claim={claim} />);
    expect(html).not.toContain(claim.state.hash);
    expect(html).toContain("previous operation");
    claim.busy = false;
    expect(renderToStaticMarkup(<MineClaimStatus claim={claim} />)).toBe("");
  });
  it("user rejection is cancellation, not a permanent loading state", () => {
    const html = renderToStaticMarkup(
      <MineClaimStatus claim={ui("rejected")} />,
    );
    expect(html).toContain("Wallet request cancelled");
    expect(html).not.toContain("Retry Refresh");
  });
});
