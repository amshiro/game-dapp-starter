import { describe, expect, it } from "vitest";
import {
  deriveWalletIdentity,
  shortenWalletAddress,
  type WalletIdentityFacts,
} from "./wallet-identity";
import { connectionNotice } from "./connection-notice";

const address = "0x1111111111111111111111111111111111111111";
const otherAddress = "0x2222222222222222222222222222222222222222";
const facts: WalletIdentityFacts = {
  privyReady: true,
  walletsReady: true,
  authenticated: true,
  modalOpen: false,
  connectionStatus: "connected",
  address,
  chainId: 97,
  targetChainId: 97,
  wallets: [{ address, chainId: "eip155:97", walletClientType: "metamask" }],
};

describe("wallet identity projection", () => {
  it("keeps SDK initialization, modal and authentication distinct", () => {
    expect(deriveWalletIdentity({ ...facts, privyReady: false }).status).toBe(
      "loading",
    );
    expect(
      deriveWalletIdentity({ ...facts, modalOpen: true, authenticated: false })
        .status,
    ).toBe("connecting");
    expect(deriveWalletIdentity({ ...facts, authenticated: false })).toEqual({
      status: "unauthenticated",
    });
    expect(deriveWalletIdentity({ ...facts, walletsReady: false }).status).toBe(
      "loading",
    );
  });
  it("never treats an authenticated session as a connected wallet", () => {
    expect(
      deriveWalletIdentity({
        ...facts,
        connectionStatus: "disconnected",
        address: undefined,
      }),
    ).toEqual({ status: "wallet-missing" });
    expect(
      deriveWalletIdentity({ ...facts, connectionStatus: "reconnecting" }),
    ).toEqual({ status: "synchronizing" });
    expect(deriveWalletIdentity({ ...facts, address: "invalid" }).status).toBe(
      "wallet-missing",
    );
  });
  it("selects the Wagmi active account, not the first or linked wallet", () => {
    expect(
      deriveWalletIdentity({
        ...facts,
        wallets: [
          {
            address: otherAddress,
            chainId: "eip155:1",
            walletClientType: "metamask",
          },
          ...facts.wallets,
        ],
      }),
    ).toEqual({ status: "connected", address, walletChainId: 97 });
    expect(deriveWalletIdentity({ ...facts, wallets: [] })).toEqual({
      status: "synchronizing",
    });
    expect(deriveWalletIdentity({ ...facts, address: otherAddress })).toEqual({
      status: "synchronizing",
    });
  });
  it("rejects embedded identity and never interprets an unknown network as the target", () => {
    expect(
      deriveWalletIdentity({
        ...facts,
        wallets: [{ ...facts.wallets[0], walletClientType: "privy" }],
      }).status,
    ).toBe("unsupported-wallet");
    for (const chainId of [
      "unknown",
      "eip155:97oops",
      "solana:97",
      "eip155:9007199254740992",
    ]) {
      expect(
        deriveWalletIdentity({
          ...facts,
          wallets: [{ ...facts.wallets[0], chainId }],
        }).status,
      ).toBe("chain-unknown");
    }
    expect(deriveWalletIdentity({ ...facts, chainId: undefined }).status).toBe(
      "chain-unknown",
    );
    expect(deriveWalletIdentity({ ...facts, chainId: 56 }).status).toBe(
      "chain-unknown",
    );
  });
  it("reports the wallet's wrong chain even while the bridge still holds the target", () => {
    expect(
      deriveWalletIdentity({
        ...facts,
        wallets: [{ ...facts.wallets[0], chainId: "eip155:56" }],
      }),
    ).toEqual({ status: "chain-mismatch", address, walletChainId: 56 });
    expect(deriveWalletIdentity(facts)).toEqual({
      status: "connected",
      address,
      walletChainId: 97,
    });
  });
  it("drops the old address immediately on logout or active account change", () => {
    expect(
      deriveWalletIdentity({ ...facts, authenticated: false }),
    ).not.toHaveProperty("address");
    const next = {
      ...facts,
      address: otherAddress,
      wallets: [{ ...facts.wallets[0], address: otherAddress }],
    };
    expect(deriveWalletIdentity(next)).toHaveProperty("address", otherAddress);
    expect(shortenWalletAddress(address)).toBe("0x11...1111");
  });
});

describe("sanitized connection notices", () => {
  it.each([
    "exited_auth_flow",
    "exited_link_flow",
    { code: 4001 },
    { code: "4001" },
    { privyErrorCode: "exited_auth_flow" },
  ])("treats cancellation as a recoverable non-error", (error) => {
    expect(connectionNotice(error)).toBe("cancelled");
  });
  it.each([
    new Error("sensitive provider details"),
    "unknown_auth_error",
    "generic_connect_wallet_error",
    null,
    { code: -32002 },
  ])("does not expose unknown provider details", (error) => {
    expect(connectionNotice(error)).toBe("failed");
  });
});
