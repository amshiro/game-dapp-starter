import { parsePublicConfig, type PublicConfig } from "./parse-public-config";

/** Public build-time configuration, read on demand without import-time effects. */
export function readPublicConfig(): PublicConfig {
  // Keep literal accesses so Next/vinext can inline these in browser bundles.
  // Never spread process.env or include Server/Worker/deployment configuration.
  return parsePublicConfig({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID:
      process.env.NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID,
    NEXT_PUBLIC_EVM_RPC_URL: process.env.NEXT_PUBLIC_EVM_RPC_URL,
    NEXT_PUBLIC_EVM_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_EVM_CONTRACT_ADDRESS,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_ENABLE_VCONSOLE: process.env.NEXT_PUBLIC_ENABLE_VCONSOLE,
  });
}
