import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getEvmChainForEnvironment } from "../../../shared/config/evm-chains";
import type { WalletIdentity } from "../model/wallet-identity";
import { WalletSheet } from "./wallet-sheet";

const targetChain = getEvmChainForEnvironment("development");
const identity: WalletIdentity = {
  status: "connected",
  address: "0x1111111111111111111111111111111111111111",
  walletChainId: 97,
};
function render(current: WalletIdentity = identity, actionFailed = false) {
  return renderToStaticMarkup(
    <WalletSheet
      identity={current}
      targetChain={targetChain}
      actionFailed={actionFailed}
      onClose={vi.fn()}
      onDisconnect={vi.fn()}
    />,
  );
}

describe("Wallet Sheet contract", () => {
  it("exposes a labelled modal and labelled close/copy/disconnect controls", () => {
    const markup = render();
    expect(markup).toContain("<dialog");
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("My Wallet");
    for (const label of [
      "Close wallet",
      "Copy wallet address",
      "Disconnect wallet",
    ])
      expect(markup).toContain(`aria-label="${label}"`);
  });
  it("hides both embedded-only actions for external identities, without inventing a balance", () => {
    const markup = render();
    expect(markup).toContain("— BNB");
    expect(markup).toContain("BNB balance unavailable");
    expect(markup).not.toContain("Export");
    expect(markup).not.toContain("Receive");
    for (const invented of [
      "48.60",
      "Receive",
      "QR",
      "private key",
      "mnemonic",
    ])
      expect(markup).not.toContain(invented);
  });
  it("renders real BNB presentation while retaining the full exact amount", () => {
    const markup = renderToStaticMarkup(
      <WalletSheet
        identity={identity}
        targetChain={targetChain}
        balance={{
          status: "populated",
          text: "4.925025",
          exact: "4.925025853580438326",
          raw: BigInt("4925025853580438326"),
        }}
        actionFailed={false}
        onClose={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );
    expect(markup).toContain("4.925025");
    expect(markup).toContain("BNB");
    expect(markup).toContain('title="4.925025853580438326 BNB"');
    expect(markup).not.toContain("ORE");
  });
  it("renders the current identity and no previous account", () => {
    const next = "0x2222222222222222222222222222222222222222";
    const markup = render({ ...identity, address: next });
    expect(markup).toContain(next);
    expect(markup).not.toContain(identity.address);
  });
  it("removes address actions while SDK identity is synchronizing or unavailable", () => {
    for (const status of ["synchronizing", "wallet-missing"] as const) {
      const markup = render({ status });
      expect(markup).not.toContain(identity.address);
      expect(markup).not.toContain('aria-label="Copy wallet address"');
      expect(markup).not.toContain('aria-label="Disconnect wallet"');
      expect(markup).toContain(
        status === "synchronizing" ? "Loading…" : "Wallet unavailable",
      );
    }
  });
  it("distinguishes wrong/unknown network from target chain readiness", () => {
    const wrong = render({
      ...identity,
      status: "chain-mismatch",
      walletChainId: 56,
    });
    expect(wrong).toContain("Wrong network");
    expect(wrong).toContain("Testnet");
    expect(wrong).toContain("(97)");
    expect(render({ ...identity, status: "chain-unknown" })).toContain(
      "Network unknown",
    );
    expect(render()).not.toContain("Wrong network");
  });
  it("uses a recoverable, sanitized action failure message", () => {
    const markup = render(identity, true);
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Wallet action failed. Try again.");
    expect(markup).not.toContain("private SDK details");
  });
});
