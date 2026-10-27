export type AppEnvironment = "development" | "staging" | "production";

export type PublicConfigInput = Readonly<{
  NEXT_PUBLIC_APP_ENV?: string;
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_PRIVY_APP_ID?: string;
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID?: string;
  NEXT_PUBLIC_EVM_RPC_URL?: string;
  NEXT_PUBLIC_EVM_CONTRACT_ADDRESS?: string;
  NEXT_PUBLIC_SOLANA_RPC_URL?: string;
  NEXT_PUBLIC_ENABLE_VCONSOLE?: string;
}>;

export type PublicConfig = Readonly<{
  appEnvironment: AppEnvironment;
  apiBaseUrl: string | undefined;
  privyAppId: string | undefined;
  defaultEvmChainId: number | undefined;
  evmRpcUrl: string | undefined;
  evmContractAddress: string | undefined;
  solanaRpcUrl: string | undefined;
  enableVConsole: boolean;
}>;

function optionalText(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function invalid(name: keyof PublicConfigInput, expectation: string): never {
  // Never include raw values: a misconfigured public URL may contain credentials.
  throw new Error(`${name}: ${expectation}`);
}

function parseAppEnvironment(value: string | undefined): AppEnvironment {
  const normalized = optionalText(value);
  if (!normalized) {
    return invalid("NEXT_PUBLIC_APP_ENV", "is required");
  }
  if (
    normalized !== "development" &&
    normalized !== "staging" &&
    normalized !== "production"
  ) {
    return invalid(
      "NEXT_PUBLIC_APP_ENV",
      "must be development, staging, or production",
    );
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

function parseHttpUrl(
  name: keyof PublicConfigInput,
  value: string | undefined,
): string | undefined {
  const normalized = optionalText(value);
  if (normalized === undefined) return undefined;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return invalid(name, "must be an absolute HTTP(S) URL");
  }
  if (
    !/^https?:\/\//i.test(normalized) ||
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    /[\s\\]/.test(normalized)
  ) {
    return invalid(name, "must be an absolute HTTP(S) URL");
  }
  if (url.username || url.password) {
    return invalid(name, "must not contain URL credentials");
  }
  // Preserve namespace, path, query, and trailing slash exactly as configured.
  return normalized;
}

function parseContractAddress(value: string | undefined): string | undefined {
  const normalized = optionalText(value);
  if (normalized === undefined) return undefined;
  if (!/^0x[0-9a-fA-F]{40}$/.test(normalized) || /^0x0{40}$/.test(normalized)) {
    return invalid(
      "NEXT_PUBLIC_EVM_CONTRACT_ADDRESS",
      "must be a nonzero 0x-prefixed 20-byte hex address",
    );
  }
  // Syntax only: checksum, chain, deployment, and ABI belong to the future owner.
  return normalized;
}

/** Parse only public config facts; this does not establish Feature readiness. */
export function parsePublicConfig(input: PublicConfigInput): PublicConfig {
  return Object.freeze({
    appEnvironment: parseAppEnvironment(input.NEXT_PUBLIC_APP_ENV),
    apiBaseUrl: parseHttpUrl(
      "NEXT_PUBLIC_API_BASE_URL",
      input.NEXT_PUBLIC_API_BASE_URL,
    ),
    privyAppId: optionalText(input.NEXT_PUBLIC_PRIVY_APP_ID),
    defaultEvmChainId: parseChainId(input.NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID),
    evmRpcUrl: parseHttpUrl(
      "NEXT_PUBLIC_EVM_RPC_URL",
      input.NEXT_PUBLIC_EVM_RPC_URL,
    ),
    evmContractAddress: parseContractAddress(
      input.NEXT_PUBLIC_EVM_CONTRACT_ADDRESS,
    ),
    solanaRpcUrl: parseHttpUrl(
      "NEXT_PUBLIC_SOLANA_RPC_URL",
      input.NEXT_PUBLIC_SOLANA_RPC_URL,
    ),
    enableVConsole: parseDebugFlag(input.NEXT_PUBLIC_ENABLE_VCONSOLE),
  });
}
