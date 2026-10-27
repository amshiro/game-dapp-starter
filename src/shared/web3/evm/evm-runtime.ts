import type { EvmCapability } from "../../config/evm-capability";
import { createPrivyClientConfig } from "../../config/privy-config";
import { toViemChain } from "./viem-chain";
import { createWagmiConfig } from "./wagmi-config";

export type EvmRuntime = ReturnType<typeof createEvmRuntime>;

/**
 * Provider inputs for one runtime: environment → registry chain → Viem chain
 * → Privy + Wagmi config. Callers create one per provider tree, never at
 * module scope, so no Wagmi store is shared across Server requests.
 */
export function createEvmRuntime(
  capability: Extract<EvmCapability, { status: "configured" }>,
) {
  const chain = toViemChain(capability.chain, capability.rpcUrl);
  return {
    privyAppId: capability.privyAppId,
    privyConfig: createPrivyClientConfig(chain),
    wagmiConfig: createWagmiConfig(chain, capability.rpcUrl),
  };
}
