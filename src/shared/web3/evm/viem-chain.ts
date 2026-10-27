import { defineChain, type Chain } from "viem";
import type { EvmChain } from "../../config/evm-chains";

/**
 * Viem chain derived from the chain registry. Chain facts come only from the
 * registry; the RPC is the environment's runtime endpoint, never a built-in one.
 */
export function toViemChain(chain: EvmChain, rpcUrl: string): Chain {
  return defineChain({
    id: chain.id,
    name: chain.name,
    testnet: chain.testnet,
    nativeCurrency: { ...chain.nativeCurrency },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: { default: { ...chain.blockExplorer } },
  });
}
