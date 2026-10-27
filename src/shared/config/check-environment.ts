// Explicit .ts extension: this module also runs under Node type stripping (scripts/env-check.ts).
import {
  PUBLIC_CONFIG_KEYS,
  checkPublicConfigField,
  type AppEnvironment,
  type PublicConfigKey,
} from "./parse-public-config.ts";
import { resolveEnvironmentChain } from "./evm-chains.ts";

export const SERVER_POLICY_KEYS = ["RESTRICTED_COUNTRIES"] as const;
export const SERVER_SECRET_KEYS = ["BACKEND_APP_SECRET", "IPFS_JWT"] as const;
export const DEPLOYMENT_KEYS = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
] as const;

/** Retired names → canonical replacement (docs/project/environment.md). */
export const LEGACY_KEYS: Readonly<Record<string, string>> = {
  NEXT_PUBLIC_BASE_URL: "NEXT_PUBLIC_SITE_URL",
  NEXT_PUBLIC_API_URL: "NEXT_PUBLIC_API_BASE_URL",
  NEXT_PUBLIC_PRIVY_ID: "NEXT_PUBLIC_PRIVY_APP_ID",
  NEXT_PUBLIC_WS: "NEXT_PUBLIC_WS_URL",
  NEXT_PUBLIC_IPFS_DOMAIN: "NEXT_PUBLIC_IPFS_GATEWAY_URL",
  NEXT_PUBLIC_APP_ID: "NEXT_PUBLIC_BACKEND_APP_ID",
  NEXT_PUBLIC_APP_SECRET: "BACKEND_APP_SECRET",
  NEXT_PUBLIC_JWT_KEY: "IPFS_JWT",
  NEXT_PUBLIC_RESTRICTED_COUNTRIES: "RESTRICTED_COUNTRIES",
  NEXT_PUBLIC_EVM_CONTRACT_ADDRESS: "the chain deployment registry",
  NEXT_PUBLIC_SOLANA_RPC_URL: "nothing (not an ORI runtime)",
};

/** Required in every environment at the current stage: EVM foundation + ORI backend. */
const REQUIRED_PUBLIC_KEYS: readonly PublicConfigKey[] = [
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_PRIVY_APP_ID",
  "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
  "NEXT_PUBLIC_EVM_RPC_URL",
  "NEXT_PUBLIC_API_BASE_URL",
];

const PUBLIC_SECRET_NAME = /SECRET|JWT|PRIVATE|PASSWORD|MNEMONIC|TOKEN|API_KEY/;
const COUNTRY_LIST = /^[A-Z]{2}(,[A-Z]{2})*$/;
const TESTNET_HOST = /testnet|prebsc/i;

export type EnvCheckStatus = "PASS" | "FAIL" | "SKIP";

/** `note` is always composed from fixed text and variable names, never from values. */
export type EnvCheckResult = Readonly<{
  status: EnvCheckStatus;
  name: string;
  note?: string;
}>;

export type EnvSource = Readonly<Record<string, string | undefined>>;

const isSet = (value: string | undefined) => (value?.trim() ?? "") !== "";

export function checkEnvironment(
  env: EnvSource,
  mode: AppEnvironment,
): EnvCheckResult[] {
  const results: EnvCheckResult[] = [];
  const push = (status: EnvCheckStatus, name: string, note?: string) =>
    results.push(
      note === undefined ? { status, name } : { status, name, note },
    );

  const validPublic = new Set<PublicConfigKey>();
  for (const key of PUBLIC_CONFIG_KEYS) {
    const value = env[key];
    if (!isSet(value)) {
      if (REQUIRED_PUBLIC_KEYS.includes(key)) push("FAIL", key, "missing");
      else push("SKIP", key, "not set (optional)");
      continue;
    }
    const problem = checkPublicConfigField(key, value);
    if (problem) push("FAIL", key, problem);
    else validPublic.add(key);
  }

  // Coherence: the whole environment must belong to the mode being checked.
  if (validPublic.has("NEXT_PUBLIC_APP_ENV")) {
    const appEnv = env.NEXT_PUBLIC_APP_ENV?.trim() as AppEnvironment;
    if (appEnv !== mode) {
      validPublic.delete("NEXT_PUBLIC_APP_ENV");
      push(
        "FAIL",
        "NEXT_PUBLIC_APP_ENV",
        `does not match checked mode ${mode}`,
      );
    }
  }
  if (validPublic.has("NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID")) {
    // The environment → chain mapping is owned by the chain registry.
    const chainId = Number(env.NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID?.trim());
    const resolution = resolveEnvironmentChain(mode, chainId);
    if (!resolution.ok) {
      validPublic.delete("NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID");
      push(
        "FAIL",
        "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
        `must be ${resolution.expected.id} for ${mode}`,
      );
    }
  }
  if (validPublic.has("NEXT_PUBLIC_EVM_RPC_URL") && mode === "production") {
    const host = new URL(env.NEXT_PUBLIC_EVM_RPC_URL!.trim()).hostname;
    if (TESTNET_HOST.test(host)) {
      validPublic.delete("NEXT_PUBLIC_EVM_RPC_URL");
      push(
        "FAIL",
        "NEXT_PUBLIC_EVM_RPC_URL",
        "production must not use a testnet RPC",
      );
    }
  }
  for (const key of PUBLIC_CONFIG_KEYS)
    if (validPublic.has(key)) push("PASS", key);

  for (const key of SERVER_POLICY_KEYS) {
    const value = env[key];
    if (!isSet(value)) push("SKIP", key, "not set");
    else if (COUNTRY_LIST.test(value!.replace(/\s*,\s*/g, ",").trim()))
      push("PASS", key);
    else push("FAIL", key, "must be comma-separated ISO 3166-1 alpha-2 codes");
  }
  // Secrets and deployment credentials: presence only, never inspected further.
  for (const key of [...SERVER_SECRET_KEYS, ...DEPLOYMENT_KEYS]) {
    push(
      isSet(env[key]) ? "PASS" : "SKIP",
      key,
      isSet(env[key]) ? "set" : "not set",
    );
  }

  const contract = new Set<string>(PUBLIC_CONFIG_KEYS);
  for (const name of Object.keys(env).sort()) {
    if (name in LEGACY_KEYS) {
      push("FAIL", name, `legacy name; use ${LEGACY_KEYS[name]}`);
    } else if (
      name.startsWith("NEXT_PUBLIC_") &&
      PUBLIC_SECRET_NAME.test(name)
    ) {
      push("FAIL", name, "secret-like name must never be NEXT_PUBLIC_");
    } else if (name.startsWith("NEXT_PUBLIC_") && !contract.has(name)) {
      push("FAIL", name, "not in the Environment Contract");
    }
  }
  return results;
}

export function formatEnvCheck(
  mode: AppEnvironment,
  results: readonly EnvCheckResult[],
): string {
  const lines = results.map(
    (r) => `${r.status} ${r.name}${r.note ? `: ${r.note}` : ""}`,
  );
  const failed = results.filter((r) => r.status === "FAIL").length;
  lines.push(
    failed === 0
      ? `env:check ${mode}: PASS`
      : `env:check ${mode}: FAIL (${failed} problem${failed === 1 ? "" : "s"})`,
  );
  return lines.join("\n");
}
