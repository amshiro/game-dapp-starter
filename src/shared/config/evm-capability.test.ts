import { describe, expect, test } from "vitest";
import { resolveEvmCapability } from "./evm-capability";
import {
  parsePublicConfig,
  type PublicConfigInput,
} from "./parse-public-config";

// Fake, non-routable values: no real Privy app, chain, or RPC is implied.
const complete = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_PRIVY_APP_ID: "fake-app-id",
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "31337",
  NEXT_PUBLIC_EVM_RPC_URL: "http://localhost:8545/",
} as const;

function resolve(input: PublicConfigInput) {
  return resolveEvmCapability(() => parsePublicConfig(input));
}

describe("EVM capability", () => {
  test("all required values present → configured with exact values", () => {
    expect(resolve(complete)).toEqual({
      status: "configured",
      appEnvironment: "development",
      privyAppId: "fake-app-id",
      chainId: 31337,
      rpcUrl: "http://localhost:8545/",
    });
  });

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
