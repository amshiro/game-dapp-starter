import { createConfig } from "@privy-io/wagmi";
import type { Chain } from "viem";
import { http } from "wagmi";

/**
 * Wagmi config with exactly one active chain: the environment's business
 * target chain. Privy's createConfig drops non-mock connectors and enables
 * `ssr`, so Privy remains the only wallet connection owner.
 */
export function createWagmiConfig(chain: Chain, rpcUrl: string) {
  return createConfig({
    chains: [chain],
    transports: { [chain.id]: http(rpcUrl) },
  });
}
