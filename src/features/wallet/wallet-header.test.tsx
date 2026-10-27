import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EvmTargetChainContext } from "../../shared/web3/evm/evm-target-chain-context";
import { WalletHeader } from "./wallet-header";
import { WalletHeaderView } from "./ui/wallet-header-view";
import { useWalletIdentity } from "./use-wallet-identity";
import { getEvmChainForEnvironment } from "../../shared/config/evm-chains";

const sdk = vi.hoisted(() => ({
  privy: { ready: true, authenticated: false, isModalOpen: false },
  wallets: {
    ready: true,
    wallets: [] as {
      address: string;
      chainId: string;
      walletClientType: string;
    }[],
  },
  connection: {
    status: "disconnected" as "connected" | "disconnected",
    address: undefined as string | undefined,
    chainId: undefined as number | undefined,
  },
  login: vi.fn(),
  connectWallet: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => sdk.privy),
  useWallets: () => sdk.wallets,
  useLogin: () => ({ login: sdk.login }),
  useConnectWallet: () => ({ connectWallet: sdk.connectWallet }),
  useLogout: () => ({ logout: sdk.logout }),
}));
vi.mock("wagmi", () => ({ useConnection: () => sdk.connection }));

function probe() {
  let result: ReturnType<typeof useWalletIdentity> | undefined;
  function Probe() {
    result = useWalletIdentity(97);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  if (!result) throw new Error("hook probe not rendered");
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  sdk.privy = { ready: true, authenticated: false, isModalOpen: false };
  sdk.wallets = { ready: true, wallets: [] };
  sdk.connection = {
    status: "disconnected",
    address: undefined,
    chainId: undefined,
  };
});

describe("wallet SDK wiring", () => {
  it("never invokes SDK hooks when the runtime boundary is unavailable", async () => {
    const { usePrivy } = await import("@privy-io/react-auth");
    const markup = renderToStaticMarkup(<WalletHeader />);
    expect(markup).toContain("disabled");
    expect(usePrivy).not.toHaveBeenCalled();
  });
  it("mounts the SDK-backed control only with a configured target", async () => {
    const { usePrivy } = await import("@privy-io/react-auth");
    const markup = renderToStaticMarkup(
      <EvmTargetChainContext value={getEvmChainForEnvironment("development")}>
        <WalletHeader />
      </EvmTargetChainContext>,
    );
    expect(usePrivy).toHaveBeenCalled();
    expect(markup).not.toContain("disabled");
  });
  it("does not crash when the wallet rejects or the SDK throws synchronously", () => {
    sdk.login.mockImplementationOnce(() => {
      throw { code: 4001 };
    });
    expect(() => probe().connect()).not.toThrow();
    expect(() => probe().connect()).not.toThrow();
  });
  it("allows retry after a recoverable provider failure and settles from SDK facts", () => {
    sdk.privy.authenticated = true;
    sdk.connectWallet.mockImplementationOnce(() => {
      throw { code: -32002, message: "private provider diagnostics" };
    });
    expect(() => probe().connect()).not.toThrow();
    expect(probe().identity).toEqual({ status: "wallet-missing" });
    probe().connect();
    expect(sdk.connectWallet).toHaveBeenCalledTimes(2);
    const address = "0x1111111111111111111111111111111111111111";
    sdk.connection = { status: "connected", address, chainId: 97 };
    sdk.wallets.wallets = [
      { address, chainId: "eip155:97", walletClientType: "okx_wallet" },
    ];
    expect(probe().identity).toEqual({
      status: "connected",
      address,
      walletChainId: 97,
    });
  });
  it("guards not-ready and modal-open interaction", () => {
    sdk.privy.ready = false;
    probe().connect();
    sdk.privy.ready = true;
    sdk.privy.isModalOpen = true;
    probe().connect();
    expect(sdk.login).not.toHaveBeenCalled();
    expect(sdk.connectWallet).not.toHaveBeenCalled();
  });
  it("uses wallet-only EVM login, and reconnects an authenticated session without relogin", () => {
    probe().connect();
    expect(sdk.login).toHaveBeenCalledWith({
      loginMethods: ["wallet"],
      walletChainType: "ethereum-only",
    });
    sdk.privy.authenticated = true;
    probe().connect();
    expect(sdk.connectWallet).toHaveBeenCalledWith({
      walletChainType: "ethereum-only",
    });
    expect(sdk.login).toHaveBeenCalledTimes(1);
  });
  it("delegates session logout to Privy and derives the next state from SDK facts", async () => {
    sdk.privy.authenticated = true;
    const address = "0x1111111111111111111111111111111111111111";
    sdk.connection = { status: "connected", address, chainId: 97 };
    sdk.wallets.wallets = [
      { address, chainId: "eip155:97", walletClientType: "metamask" },
    ];
    expect(probe().identity).toHaveProperty("address", address);
    sdk.logout.mockImplementation(async () => {
      sdk.privy.authenticated = false;
    });
    await probe().disconnect();
    expect(sdk.logout).toHaveBeenCalledTimes(1);
    expect(probe().identity).toEqual({ status: "unauthenticated" });
  });
});

describe("Header accessibility", () => {
  it("has a real enabled Connect button and disables loading", () => {
    expect(
      renderToStaticMarkup(
        <WalletHeaderView
          identity={{ status: "unauthenticated" }}
          onConnect={() => {}}
        />,
      ),
    ).not.toContain("disabled");
    const loading = renderToStaticMarkup(
      <WalletHeaderView identity={{ status: "loading" }} />,
    );
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("disabled");
  });
  it("renders read-only identity and explicit mismatch without a fake button", () => {
    const markup = renderToStaticMarkup(
      <WalletHeaderView
        identity={{
          status: "chain-mismatch",
          address: "0x1111111111111111111111111111111111111111",
          walletChainId: 56,
        }}
        targetChain={getEvmChainForEnvironment("development")}
      />,
    );
    expect(markup).toContain("Wrong network");
    expect(markup).toContain("Wallet chain 56");
    expect(markup).toContain("Testnet (97)");
    expect(markup).toContain('role="status"');
    expect(markup).not.toContain("<button");
  });
  it("announces cancellation separately from failures, with retry still available", () => {
    const cancelled = renderToStaticMarkup(
      <WalletHeaderView
        identity={{ status: "unauthenticated" }}
        notice="cancelled"
      />,
    );
    expect(cancelled).toContain("Connection cancelled");
    expect(cancelled).not.toContain('role="alert"');
    expect(cancelled).not.toContain("disabled");
    const failed = renderToStaticMarkup(
      <WalletHeaderView
        identity={{ status: "unauthenticated" }}
        notice="failed"
      />,
    );
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("Connection failed");
  });
});
