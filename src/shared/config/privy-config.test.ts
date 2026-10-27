import { describe, expect, test } from "vitest";
import { toViemChain } from "../web3/evm/viem-chain";
import { findEvmChain } from "./evm-chains";
import { createPrivyClientConfig } from "./privy-config";

const chain = toViemChain(findEvmChain(97)!, "http://localhost:8545/");

describe("Privy client config", () => {
  test("is wallet-only with external EVM wallets", () => {
    const config = createPrivyClientConfig(chain);
    expect(config.loginMethods).toEqual(["wallet"]);
    expect(config.appearance?.walletChainType).toBe("ethereum-only");
    expect(config.appearance?.walletList).toEqual([
      "binance",
      "okx_wallet",
      "metamask",
    ]);
  });

  test("disables embedded wallets for every chain type", () => {
    expect(createPrivyClientConfig(chain).embeddedWallets).toEqual({
      ethereum: { createOnLogin: "off" },
      solana: { createOnLogin: "off" },
    });
  });

  test("default chain is the only supported chain", () => {
    const config = createPrivyClientConfig(chain);
    expect(config.defaultChain).toBe(chain);
    expect(config.supportedChains).toEqual([chain]);
  });

  test("adds no non-wallet login, funding, or smart-wallet features", () => {
    const config = createPrivyClientConfig(chain);
    expect(Object.keys(config).sort()).toEqual([
      "appearance",
      "defaultChain",
      "embeddedWallets",
      "loginMethods",
      "supportedChains",
    ]);
  });
});
