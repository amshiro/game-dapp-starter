import { describe, expect, test } from "vitest";
import {
  PUBLIC_CONFIG_KEYS,
  checkPublicConfigField,
  parsePublicConfig,
} from "./parse-public-config";

const base = { NEXT_PUBLIC_APP_ENV: "development" };

describe("public config", () => {
  test("allows unused integrations to be absent without selecting defaults", () => {
    expect(parsePublicConfig(base)).toEqual({
      appEnvironment: "development",
      siteUrl: undefined,
      apiBaseUrl: undefined,
      backendAppId: undefined,
      privyAppId: undefined,
      wsUrl: undefined,
      referralCode: undefined,
      ipfsGatewayUrl: undefined,
      defaultEvmChainId: undefined,
      evmRpcUrl: undefined,
      enableVConsole: false,
    });
  });

  test("parses a complete development foundation (fake values)", () => {
    const config = parsePublicConfig({
      ...base,
      NEXT_PUBLIC_PRIVY_APP_ID: "fake-privy-app",
      NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "97",
      NEXT_PUBLIC_EVM_RPC_URL: "https://rpc.example.test/",
    });
    expect(config).toMatchObject({
      appEnvironment: "development",
      privyAppId: "fake-privy-app",
      defaultEvmChainId: 97,
      evmRpcUrl: "https://rpc.example.test/",
    });
  });

  test("accepts production", () => {
    expect(
      parsePublicConfig({ NEXT_PUBLIC_APP_ENV: " production " }).appEnvironment,
    ).toBe("production");
  });

  test.each([undefined, "", " "])(
    "rejects missing app environment: %s",
    (value) => {
      expect(() => parsePublicConfig({ NEXT_PUBLIC_APP_ENV: value })).toThrow(
        "NEXT_PUBLIC_APP_ENV: is required",
      );
    },
  );

  test.each(["staging", "preview", "test", "PRODUCTION"])(
    "rejects unsupported environment: %s",
    (value) => {
      expect(() => parsePublicConfig({ NEXT_PUBLIC_APP_ENV: value })).toThrow(
        "NEXT_PUBLIC_APP_ENV: must be development or production",
      );
    },
  );

  test("exposes exactly the Environment Contract public variables", () => {
    expect([...PUBLIC_CONFIG_KEYS].sort()).toEqual(
      [
        "NEXT_PUBLIC_API_BASE_URL",
        "NEXT_PUBLIC_APP_ENV",
        "NEXT_PUBLIC_BACKEND_APP_ID",
        "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
        "NEXT_PUBLIC_ENABLE_VCONSOLE",
        "NEXT_PUBLIC_EVM_RPC_URL",
        "NEXT_PUBLIC_IPFS_GATEWAY_URL",
        "NEXT_PUBLIC_PRIVY_APP_ID",
        "NEXT_PUBLIC_PUSHER_APP_KEY",
        "NEXT_PUBLIC_REFERRAL_CODE",
        "NEXT_PUBLIC_SITE_URL",
        "NEXT_PUBLIC_WS_URL",
      ].sort(),
    );
    expect(PUBLIC_CONFIG_KEYS.some((key) => /SECRET|JWT|TOKEN/.test(key))).toBe(
      false,
    );
  });

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
    ["97", 97],
    [" 56 ", 56],
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
    "0x38",
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
    "NEXT_PUBLIC_IPFS_GATEWAY_URL",
  ] as const)("validates and preserves HTTP(S) URL %s", (key) => {
    const value = "https://example.com/service/v1/?network=test";
    expect(
      Object.values(parsePublicConfig({ ...base, [key]: ` ${value} ` })),
    ).toContain(value);
    for (const invalid of [
      "/api",
      "not-a-url",
      "ftp://example.com",
      "wss://example.com",
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

  test.each([
    ["https://ori.example", "https://ori.example"],
    ["https://ori.example/", "https://ori.example"],
    ["http://localhost:3000", "http://localhost:3000"],
  ])("normalizes site origin %s", (value, expected) => {
    expect(
      parsePublicConfig({ ...base, NEXT_PUBLIC_SITE_URL: value }).siteUrl,
    ).toBe(expected);
  });

  test.each([
    "https://ori.example/app",
    "https://ori.example/?ref=1",
    "https://ori.example/#top",
    "ori.example",
    "wss://ori.example",
  ])("rejects non-origin site URL: %s", (value) => {
    expect(() =>
      parsePublicConfig({ ...base, NEXT_PUBLIC_SITE_URL: value }),
    ).toThrow("NEXT_PUBLIC_SITE_URL");
  });

  test.each(["wss://ws.example/app", "ws://localhost:6001"])(
    "accepts WebSocket URL %s",
    (value) => {
      expect(
        parsePublicConfig({ ...base, NEXT_PUBLIC_WS_URL: value }).wsUrl,
      ).toBe(value);
    },
  );

  test.each(["https://ws.example", "ws.example", "wss://user:pw@ws.example"])(
    "rejects non-WebSocket or credentialed URL: %s",
    (value) => {
      expect(() =>
        parsePublicConfig({ ...base, NEXT_PUBLIC_WS_URL: value }),
      ).toThrow("NEXT_PUBLIC_WS_URL");
    },
  );

  test("trims opaque public identifiers and normalizes blanks to undefined", () => {
    const config = parsePublicConfig({
      ...base,
      NEXT_PUBLIC_PRIVY_APP_ID: " fake-app-id ",
      NEXT_PUBLIC_BACKEND_APP_ID: " fake-backend ",
      NEXT_PUBLIC_REFERRAL_CODE: " ",
      NEXT_PUBLIC_SITE_URL: " ",
    });
    expect(config.privyAppId).toBe("fake-app-id");
    expect(config.backendAppId).toBe("fake-backend");
    expect(config.referralCode).toBeUndefined();
    expect(config.siteUrl).toBeUndefined();
  });

  test("never reads server or deployment variables and never discloses rejected values", () => {
    const input = {
      ...base,
      BACKEND_APP_SECRET: "fake-backend-secret",
      IPFS_JWT: "fake-ipfs-jwt",
      CLOUDFLARE_API_TOKEN: "fake-deploy-token",
    };
    const config = parsePublicConfig(input);
    expect(JSON.stringify(config)).not.toMatch(
      /fake-(backend-secret|ipfs-jwt|deploy-token)/,
    );
    expect(() =>
      parsePublicConfig({
        ...base,
        NEXT_PUBLIC_API_BASE_URL: "https://user:fake-password@example.com",
      }),
    ).toThrow("NEXT_PUBLIC_API_BASE_URL: must not contain URL credentials");
  });

  test("field check returns value-free problems", () => {
    expect(
      checkPublicConfigField("NEXT_PUBLIC_EVM_RPC_URL", undefined),
    ).toBeUndefined();
    const problem = checkPublicConfigField(
      "NEXT_PUBLIC_EVM_RPC_URL",
      "https://user:fake-password@example.com",
    );
    expect(problem).toBe("must not contain URL credentials");
    expect(problem).not.toContain("fake-password");
  });
});
