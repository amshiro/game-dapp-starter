import { describe, expect, test } from "vitest";
import { resolveEvmCapability } from "./evm-capability";
import { findEvmChain } from "./evm-chains";
import {
  parsePublicConfig,
  type PublicConfigInput,
} from "./parse-public-config";

// Fake app id and non-routable RPC; the chain must be the registry's target chain.
const complete = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_PRIVY_APP_ID: "fake-app-id",
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "97",
  NEXT_PUBLIC_EVM_RPC_URL: "http://localhost:8545/",
} as const;

function resolve(input: PublicConfigInput) {
  return resolveEvmCapability(() => parsePublicConfig(input));
}

describe("EVM capability", () => {
  test("all required values present → configured with the registry chain", () => {
    expect(resolve(complete)).toEqual({
      status: "configured",
      appEnvironment: "development",
      privyAppId: "fake-app-id",
      chain: findEvmChain(97),
      rpcUrl: "http://localhost:8545/",
    });
  });

  test("production with chain 56 → configured", () => {
    const capability = resolve({
      ...complete,
      NEXT_PUBLIC_APP_ENV: "production",
      NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "56",
    });
    expect(capability).toMatchObject({
      status: "configured",
      chain: { id: 56 },
    });
  });

  test.each([
    ["development", "56", "environment-mismatch", 97],
    ["production", "97", "environment-mismatch", 56],
    ["development", "1", "unsupported-chain", 97],
    ["development", "31337", "unsupported-chain", 97],
    ["production", "1", "unsupported-chain", 56],
  ] as const)(
    "%s with chain %s → unavailable (%s)",
    (environment, chainId, reason, expectedChainId) => {
      const capability = resolve({
        ...complete,
        NEXT_PUBLIC_APP_ENV: environment,
        NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: chainId,
      });
      expect(capability).toEqual({
        status: "unavailable",
        reason,
        configuredChainId: Number(chainId),
        expectedChainId,
      });
      expect(capability).not.toHaveProperty("rpcUrl");
      expect(capability).not.toHaveProperty("privyAppId");
    },
  );

  test.each([
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
    "NEXT_PUBLIC_EVM_RPC_URL",
  ] as const)("missing %s → unavailable", (key) => {
    for (const absent of [undefined, "", " "]) {
      expect(resolve({ ...complete, [key]: absent })).toEqual({
        status: "unavailable",
        reason: "incomplete",
        missing: [key],
      });
    }
  });

  test("template-style config with only an app environment selects no chain or RPC", () => {
    const capability = resolve({ NEXT_PUBLIC_APP_ENV: "development" });
    expect(capability).toEqual({
      status: "unavailable",
      reason: "incomplete",
      missing: [
        "NEXT_PUBLIC_PRIVY_APP_ID",
        "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
        "NEXT_PUBLIC_EVM_RPC_URL",
      ],
    });
    expect(capability).not.toHaveProperty("chainId");
    expect(capability).not.toHaveProperty("rpcUrl");
  });

  test("missing app environment → unavailable instead of throwing", () => {
    expect(resolve({ ...complete, NEXT_PUBLIC_APP_ENV: undefined })).toEqual({
      status: "unavailable",
      reason: "invalid",
      message: "NEXT_PUBLIC_APP_ENV: is required",
    });
  });

  test.each([
    ["NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID", "0x38"],
    ["NEXT_PUBLIC_EVM_RPC_URL", "https://user:fake-password@example.com"],
    ["NEXT_PUBLIC_API_BASE_URL", "not-a-url"],
  ] as const)(
    "invalid %s → unavailable without partial values or leaked input",
    (key, value) => {
      const capability = resolve({ ...complete, [key]: value });
      expect(capability).toMatchObject({
        status: "unavailable",
        reason: "invalid",
      });
      expect(capability).not.toHaveProperty("privyAppId");
      expect(JSON.stringify(capability)).toContain(key);
      expect(JSON.stringify(capability)).not.toContain(value);
    },
  );

  test("non-Error failure still fails closed", () => {
    expect(
      resolveEvmCapability(() => {
        throw "unexpected";
      }),
    ).toEqual({
      status: "unavailable",
      reason: "invalid",
      message: "public config is unreadable",
    });
  });

  test("result cannot be mutated into a configured state", () => {
    const capability = resolve({ NEXT_PUBLIC_APP_ENV: "development" });
    expect(Object.isFrozen(capability)).toBe(true);
    if (
      capability.status === "unavailable" &&
      capability.reason === "incomplete"
    ) {
      expect(Object.isFrozen(capability.missing)).toBe(true);
    }
  });
});
