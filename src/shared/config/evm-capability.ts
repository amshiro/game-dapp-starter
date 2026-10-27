import {
  resolveEnvironmentChain,
  type EvmChain,
  type SupportedEvmChainId,
} from "./evm-chains";
import type {
  AppEnvironment,
  PublicConfig,
  PublicConfigInput,
} from "./parse-public-config";

type EvmCapabilityKey = Extract<
  keyof PublicConfigInput,
  | "NEXT_PUBLIC_PRIVY_APP_ID"
  | "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID"
  | "NEXT_PUBLIC_EVM_RPC_URL"
>;

export type EvmCapability =
  | Readonly<{
      status: "configured";
      appEnvironment: AppEnvironment;
      privyAppId: string;
      chain: EvmChain;
      rpcUrl: string;
    }>
  | Readonly<{
      status: "unavailable";
      reason: "incomplete";
      missing: readonly EvmCapabilityKey[];
    }>
  | Readonly<{
      status: "unavailable";
      reason: "invalid";
      message: string;
    }>
  | Readonly<{
      status: "unavailable";
      reason: "unsupported-chain" | "environment-mismatch";
      configuredChainId: number;
      expectedChainId: SupportedEvmChainId;
    }>;

/**
 * Privy + EVM integration is all-or-nothing: no default chain, no fallback RPC.
 * The configured chain must be in the chain registry and be the environment's
 * business target chain. Says nothing about wallet, connector, Contract, or
 * Feature readiness.
 */
export function resolveEvmCapability(
  readConfig: () => PublicConfig,
): EvmCapability {
  let config: PublicConfig;
  try {
    config = readConfig();
  } catch (error) {
    // Parser messages name the variable only; non-EVM pages must keep working.
    return Object.freeze({
      status: "unavailable",
      reason: "invalid",
      message:
        error instanceof Error ? error.message : "public config is unreadable",
    });
  }

  const { appEnvironment, privyAppId, defaultEvmChainId, evmRpcUrl } = config;
  if (
    privyAppId === undefined ||
    defaultEvmChainId === undefined ||
    evmRpcUrl === undefined
  ) {
    const missing: EvmCapabilityKey[] = [];
    if (privyAppId === undefined) missing.push("NEXT_PUBLIC_PRIVY_APP_ID");
    if (defaultEvmChainId === undefined) {
      missing.push("NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID");
    }
    if (evmRpcUrl === undefined) missing.push("NEXT_PUBLIC_EVM_RPC_URL");
    return Object.freeze({
      status: "unavailable",
      reason: "incomplete",
      missing: Object.freeze(missing),
    });
  }

  const resolution = resolveEnvironmentChain(appEnvironment, defaultEvmChainId);
  if (!resolution.ok) {
    return Object.freeze({
      status: "unavailable",
      reason: resolution.reason,
      configuredChainId: defaultEvmChainId,
      expectedChainId: resolution.expected.id,
    });
  }

  return Object.freeze({
    status: "configured",
    appEnvironment,
    privyAppId,
    chain: resolution.chain,
    rpcUrl: evmRpcUrl,
  });
}
