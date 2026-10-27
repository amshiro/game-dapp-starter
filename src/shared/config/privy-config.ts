import type { PrivyClientConfig } from "@privy-io/react-auth";
import type { Chain } from "viem";

/**
 * ORI wallet model: wallet-only login with external EVM wallets and no
 * embedded wallets. Client values here override the Privy dashboard.
 * Visual customisation of the Privy modal belongs to a later design task.
 */
export function createPrivyClientConfig(chain: Chain): PrivyClientConfig {
  return {
    loginMethods: ["wallet"],
    appearance: {
      walletChainType: "ethereum-only",
      walletList: ["binance", "okx_wallet", "metamask"],
      showWalletLoginFirst: true,
    },
    embeddedWallets: {
      ethereum: { createOnLogin: "off" },
      solana: { createOnLogin: "off" },
    },
    defaultChain: chain,
    supportedChains: [chain],
  };
}
