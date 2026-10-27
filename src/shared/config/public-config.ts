import { parsePublicConfig, type PublicConfig } from "./parse-public-config";

/** Public build-time configuration, read on demand without import-time effects. */
export function readPublicConfig(): PublicConfig {
  // Keep literal accesses so Next/vinext can inline these in browser bundles.
  // Never spread process.env or include Server/Worker/deployment configuration.
  return parsePublicConfig({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BACKEND_APP_ID: process.env.NEXT_PUBLIC_BACKEND_APP_ID,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    NEXT_PUBLIC_REFERRAL_CODE: process.env.NEXT_PUBLIC_REFERRAL_CODE,
    NEXT_PUBLIC_IPFS_GATEWAY_URL: process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL,
    NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID:
      process.env.NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID,
    NEXT_PUBLIC_EVM_RPC_URL: process.env.NEXT_PUBLIC_EVM_RPC_URL,
    NEXT_PUBLIC_ENABLE_VCONSOLE: process.env.NEXT_PUBLIC_ENABLE_VCONSOLE,
  });
}
