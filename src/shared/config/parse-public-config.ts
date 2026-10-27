export type AppEnvironment = "development" | "production";

/** Browser-visible runtime variables of the Environment Contract (docs/project/environment.md). */
export const PUBLIC_CONFIG_KEYS = [
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_BACKEND_APP_ID",
  "NEXT_PUBLIC_PRIVY_APP_ID",
  "NEXT_PUBLIC_WS_URL",
  "NEXT_PUBLIC_REFERRAL_CODE",
  "NEXT_PUBLIC_IPFS_GATEWAY_URL",
  "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
  "NEXT_PUBLIC_EVM_RPC_URL",
  "NEXT_PUBLIC_ENABLE_VCONSOLE",
] as const;

export type PublicConfigKey = (typeof PUBLIC_CONFIG_KEYS)[number];

export type PublicConfigInput = Readonly<
  Partial<Record<PublicConfigKey, string | undefined>>
>;

export type PublicConfig = Readonly<{
  appEnvironment: AppEnvironment;
  siteUrl: string | undefined;
  apiBaseUrl: string | undefined;
  backendAppId: string | undefined;
  privyAppId: string | undefined;
  wsUrl: string | undefined;
  referralCode: string | undefined;
  ipfsGatewayUrl: string | undefined;
  defaultEvmChainId: number | undefined;
  evmRpcUrl: string | undefined;
  enableVConsole: boolean;
}>;

function optionalText(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function invalid(name: PublicConfigKey, expectation: string): never {
  // Never include raw values: a misconfigured public URL may contain credentials.
  throw new Error(`${name}: ${expectation}`);
}

function parseAppEnvironment(value: string | undefined): AppEnvironment {
  const normalized = optionalText(value);
  if (!normalized) {
    return invalid("NEXT_PUBLIC_APP_ENV", "is required");
  }
  if (normalized !== "development" && normalized !== "production") {
    return invalid("NEXT_PUBLIC_APP_ENV", "must be development or production");
  }
  return normalized;
}

function parseDebugFlag(value: string | undefined): boolean {
  const normalized = optionalText(value);
  if (normalized === undefined || normalized === "false") return false;
  if (normalized === "true") return true;
  return invalid("NEXT_PUBLIC_ENABLE_VCONSOLE", "must be true or false");
}

function parseChainId(value: string | undefined): number | undefined {
  const normalized = optionalText(value);
  if (normalized === undefined) return undefined;
  const parsed = Number(normalized);
  if (
    !/^[0-9]+$/.test(normalized) ||
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return invalid(
      "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
      "must be a positive safe decimal integer",
    );
  }
  return parsed;
}

function parseUrl(
  name: PublicConfigKey,
  value: string | undefined,
  protocols: readonly string[],
): URL | undefined {
  const normalized = optionalText(value);
  if (normalized === undefined) return undefined;
  const expectation = `must be an absolute ${protocols.map((p) => p.slice(0, -1)).join("/")} URL`;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return invalid(name, expectation);
  }
  if (
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(normalized) ||
    !protocols.includes(url.protocol) ||
    /[\s\\]/.test(normalized)
  ) {
    return invalid(name, expectation);
  }
  if (url.username || url.password) {
    return invalid(name, "must not contain URL credentials");
  }
  return url;
}

const HTTP = ["http:", "https:"] as const;

/** Preserve namespace, path, query, and trailing slash exactly as configured. */
function parseHttpUrl(name: PublicConfigKey, value: string | undefined) {
  return parseUrl(name, value, HTTP) && optionalText(value);
}

/** Origin only (scheme, host, optional port); a single trailing slash is dropped. */
function parseSiteUrl(value: string | undefined): string | undefined {
  const url = parseUrl("NEXT_PUBLIC_SITE_URL", value, HTTP);
  if (url === undefined) return undefined;
  if (url.pathname !== "/" || url.search || url.hash) {
    return invalid(
      "NEXT_PUBLIC_SITE_URL",
      "must be an origin without path, query, or fragment",
    );
  }
  return url.origin;
}

function parseWsUrl(value: string | undefined): string | undefined {
  return (
    parseUrl("NEXT_PUBLIC_WS_URL", value, ["ws:", "wss:"]) &&
    optionalText(value)
  );
}

/** Parse only public config facts; this does not establish Feature readiness. */
export function parsePublicConfig(input: PublicConfigInput): PublicConfig {
  return Object.freeze({
    appEnvironment: parseAppEnvironment(input.NEXT_PUBLIC_APP_ENV),
    siteUrl: parseSiteUrl(input.NEXT_PUBLIC_SITE_URL),
    apiBaseUrl: parseHttpUrl(
      "NEXT_PUBLIC_API_BASE_URL",
      input.NEXT_PUBLIC_API_BASE_URL,
    ),
    backendAppId: optionalText(input.NEXT_PUBLIC_BACKEND_APP_ID),
    privyAppId: optionalText(input.NEXT_PUBLIC_PRIVY_APP_ID),
    wsUrl: parseWsUrl(input.NEXT_PUBLIC_WS_URL),
    referralCode: optionalText(input.NEXT_PUBLIC_REFERRAL_CODE),
    ipfsGatewayUrl: parseHttpUrl(
      "NEXT_PUBLIC_IPFS_GATEWAY_URL",
      input.NEXT_PUBLIC_IPFS_GATEWAY_URL,
    ),
    defaultEvmChainId: parseChainId(input.NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID),
    evmRpcUrl: parseHttpUrl(
      "NEXT_PUBLIC_EVM_RPC_URL",
      input.NEXT_PUBLIC_EVM_RPC_URL,
    ),
    enableVConsole: parseDebugFlag(input.NEXT_PUBLIC_ENABLE_VCONSOLE),
  });
}

const FIELD_VALIDATORS: Readonly<
  Record<PublicConfigKey, (value: string | undefined) => unknown>
> = {
  NEXT_PUBLIC_APP_ENV: parseAppEnvironment,
  NEXT_PUBLIC_SITE_URL: parseSiteUrl,
  NEXT_PUBLIC_API_BASE_URL: (v) => parseHttpUrl("NEXT_PUBLIC_API_BASE_URL", v),
  NEXT_PUBLIC_BACKEND_APP_ID: optionalText,
  NEXT_PUBLIC_PRIVY_APP_ID: optionalText,
  NEXT_PUBLIC_WS_URL: parseWsUrl,
  NEXT_PUBLIC_REFERRAL_CODE: optionalText,
  NEXT_PUBLIC_IPFS_GATEWAY_URL: (v) =>
    parseHttpUrl("NEXT_PUBLIC_IPFS_GATEWAY_URL", v),
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: parseChainId,
  NEXT_PUBLIC_EVM_RPC_URL: (v) => parseHttpUrl("NEXT_PUBLIC_EVM_RPC_URL", v),
  NEXT_PUBLIC_ENABLE_VCONSOLE: parseDebugFlag,
};

/**
 * Validate one public variable in isolation; returns a value-free problem
 * description, or undefined when the value is acceptable (including absent).
 */
export function checkPublicConfigField(
  key: PublicConfigKey,
  value: string | undefined,
): string | undefined {
  try {
    FIELD_VALIDATORS[key](value);
    return undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return message.startsWith(`${key}: `)
      ? message.slice(key.length + 2)
      : "invalid";
  }
}
