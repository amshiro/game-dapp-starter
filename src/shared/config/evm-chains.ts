// Explicit .ts extension: this module also runs under Node type stripping (scripts/env-check.ts).
import type { AppEnvironment } from "./parse-public-config.ts";

/**
 * Static facts of the EVM chains ORI supports. Runtime RPC endpoints are not
 * chain facts: they are selected per environment by NEXT_PUBLIC_EVM_RPC_URL.
 */
export type EvmChain = Readonly<{
  id: SupportedEvmChainId;
  name: string;
  testnet: boolean;
  nativeCurrency: Readonly<{ name: string; symbol: string; decimals: 18 }>;
  blockExplorer: Readonly<{ name: string; url: string }>;
}>;

export type SupportedEvmChainId = 56 | 97;

const BSC_MAINNET: EvmChain = Object.freeze({
  id: 56,
  name: "BNB Smart Chain",
  testnet: false,
  nativeCurrency: Object.freeze({ name: "BNB", symbol: "BNB", decimals: 18 }),
  blockExplorer: Object.freeze({ name: "BscScan", url: "https://bscscan.com" }),
});

const BSC_TESTNET: EvmChain = Object.freeze({
  id: 97,
  name: "BNB Smart Chain Testnet",
  testnet: true,
  nativeCurrency: Object.freeze({ name: "BNB", symbol: "tBNB", decimals: 18 }),
  blockExplorer: Object.freeze({
    name: "BscScan",
    url: "https://testnet.bscscan.com",
  }),
});

const CHAINS: Readonly<Record<SupportedEvmChainId, EvmChain>> = Object.freeze({
  56: BSC_MAINNET,
  97: BSC_TESTNET,
});

/** The business target chain of each environment; there is no default chain. */
const CHAIN_ID_BY_ENVIRONMENT: Readonly<
  Record<AppEnvironment, SupportedEvmChainId>
> = Object.freeze({ development: 97, production: 56 });

export const SUPPORTED_EVM_CHAINS: readonly EvmChain[] = Object.freeze([
  BSC_TESTNET,
  BSC_MAINNET,
]);

export function isSupportedEvmChainId(
  chainId: number,
): chainId is SupportedEvmChainId {
  return Object.hasOwn(CHAINS, chainId);
}

/** Returns undefined for chains ORI does not support; callers must fail closed. */
export function findEvmChain(chainId: number): EvmChain | undefined {
  return isSupportedEvmChainId(chainId) ? CHAINS[chainId] : undefined;
}

export function getEvmChainForEnvironment(
  environment: AppEnvironment,
): EvmChain {
  if (!Object.hasOwn(CHAIN_ID_BY_ENVIRONMENT, environment)) {
    throw new Error("Unsupported app environment for EVM chain selection");
  }
  return CHAINS[CHAIN_ID_BY_ENVIRONMENT[environment]];
}

export type EnvironmentChainResolution =
  | Readonly<{ ok: true; chain: EvmChain }>
  | Readonly<{
      ok: false;
      reason: "unsupported-chain" | "environment-mismatch";
      expected: EvmChain;
    }>;

/** Cross-checks the environment's declared chain id against the registry. */
export function resolveEnvironmentChain(
  environment: AppEnvironment,
  configuredChainId: number,
): EnvironmentChainResolution {
  const expected = getEvmChainForEnvironment(environment);
  if (!isSupportedEvmChainId(configuredChainId)) {
    return { ok: false, reason: "unsupported-chain", expected };
  }
  if (configuredChainId !== expected.id) {
    return { ok: false, reason: "environment-mismatch", expected };
  }
  return { ok: true, chain: expected };
}
