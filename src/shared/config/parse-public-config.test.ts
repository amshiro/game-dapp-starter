import { describe, expect, test } from "vitest";
import { parsePublicConfig } from "./parse-public-config";

const base = { NEXT_PUBLIC_APP_ENV: "development" };

describe("public config", () => {
  test("allows unused integrations to be absent without selecting defaults", () => {
    expect(parsePublicConfig(base)).toEqual({
      appEnvironment: "development",
      apiBaseUrl: undefined,
      privyAppId: undefined,
      defaultEvmChainId: undefined,
      evmRpcUrl: undefined,
      evmContractAddress: undefined,
      solanaRpcUrl: undefined,
      enableVConsole: false,
    });
  });

  test.each([undefined, "", " "])(
    "rejects missing app environment: %s",
    (value) => {
      expect(() => parsePublicConfig({ NEXT_PUBLIC_APP_ENV: value })).toThrow(
        "NEXT_PUBLIC_APP_ENV: is required",
      );
    },
  );

  test.each(["development", "staging", "production"])("accepts %s", (value) => {
    expect(
      parsePublicConfig({ NEXT_PUBLIC_APP_ENV: ` ${value} ` }).appEnvironment,
    ).toBe(value);
  });

  test.each(["preview", "test", "PRODUCTION"])(
    "rejects unknown environment: %s",
    (value) => {
      expect(() => parsePublicConfig({ NEXT_PUBLIC_APP_ENV: value })).toThrow(
        "NEXT_PUBLIC_APP_ENV",
      );
    },
  );

  test.each([
    ["true", true],
    ["false", false],
    [" false ", false],
    ["", false],
  ] as const)("parses debug flag %s as %s", (value, expected) => {
    expect(
      parsePublicConfig({ ...base, NEXT_PUBLIC_ENABLE_VCONSOLE: value })
        .enableVConsole,
    ).toBe(expected);
  });

  test.each(["1", "0", "yes", "TRUE"])(
    "rejects ambiguous boolean: %s",
    (value) => {
      expect(() =>
        parsePublicConfig({ ...base, NEXT_PUBLIC_ENABLE_VCONSOLE: value }),
      ).toThrow("NEXT_PUBLIC_ENABLE_VCONSOLE");
    },
  );

  test.each([
    ["1", 1],
    [" 8453 ", 8453],
    ["9007199254740991", Number.MAX_SAFE_INTEGER],
  ] as const)("parses safe chain id: %s", (value, expected) => {
    expect(
      parsePublicConfig({ ...base, NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: value })
        .defaultEvmChainId,
    ).toBe(expected);
  });

  test.each([
    "0",
    "-1",
    "1.5",
    "1e3",
    "0x1",
    "NaN",
    "Infinity",
    "9007199254740992",
  ])("rejects invalid chain id: %s", (value) => {
    expect(() =>
      parsePublicConfig({ ...base, NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: value }),
    ).toThrow("NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID");
  });

  test.each([
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_EVM_RPC_URL",
    "NEXT_PUBLIC_SOLANA_RPC_URL",
  ] as const)("validates and preserves %s", (key) => {
    const value = "https://example.com/service/v1/?network=test";
    expect(
      Object.values(parsePublicConfig({ ...base, [key]: ` ${value} ` })),
    ).toContain(value);
    for (const invalid of [
      "/api",
      "not-a-url",
      "ftp://example.com",
      "https:example.com",
      "https://exa mple.com",
      "https://user:fake-password@example.com",
    ]) {
      expect(() => parsePublicConfig({ ...base, [key]: invalid })).toThrow(key);
    }
  });

  test("allows local HTTP endpoints", () => {
    expect(
      parsePublicConfig({
        ...base,
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001/v1/",
      }).apiBaseUrl,
    ).toBe("http://localhost:3001/v1/");
  });

  test("normalizes blank optional inputs and trims an opaque public app id", () => {
    const config = parsePublicConfig({
      ...base,
      NEXT_PUBLIC_API_BASE_URL: " ",
      NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: " ",
      NEXT_PUBLIC_EVM_CONTRACT_ADDRESS: " ",
      NEXT_PUBLIC_PRIVY_APP_ID: " fake-app-id ",
    });
    expect(config.apiBaseUrl).toBeUndefined();
    expect(config.defaultEvmChainId).toBeUndefined();
    expect(config.evmContractAddress).toBeUndefined();
    expect(config.privyAppId).toBe("fake-app-id");
  });

  test("preserves address case without implying checksum or deployment validity", () => {
    const address = `0x${"aB".repeat(20)}`;
    expect(
      parsePublicConfig({ ...base, NEXT_PUBLIC_EVM_CONTRACT_ADDRESS: address })
        .evmContractAddress,
    ).toBe(address);
  });

  test.each(["0x1234", `0x${"0".repeat(40)}`, `0x${"z".repeat(40)}`])(
    "rejects invalid or zero contract: %s",
    (value) => {
      expect(() =>
        parsePublicConfig({ ...base, NEXT_PUBLIC_EVM_CONTRACT_ADDRESS: value }),
      ).toThrow("NEXT_PUBLIC_EVM_CONTRACT_ADDRESS");
    },
  );

  test("does not copy extra fields or disclose rejected values", () => {
    const input = { ...base, CLOUDFLARE_API_TOKEN: "fake-deployment-value" };
    expect(parsePublicConfig(input)).not.toHaveProperty("CLOUDFLARE_API_TOKEN");
    expect(() =>
      parsePublicConfig({
        ...base,
        NEXT_PUBLIC_API_BASE_URL: "https://user:fake-password@example.com",
      }),
    ).toThrow("NEXT_PUBLIC_API_BASE_URL: must not contain URL credentials");
  });
});
