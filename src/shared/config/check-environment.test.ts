import { describe, expect, test } from "vitest";
import { checkEnvironment, formatEnvCheck } from "./check-environment";

// Fake values only: tests never read real local environment files or secrets.
const development = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_PRIVY_APP_ID: "fake-dev-app",
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "97",
  NEXT_PUBLIC_EVM_RPC_URL: "https://bsc-testnet.example.test",
  NEXT_PUBLIC_API_BASE_URL: "https://api-dev.example.test",
  NEXT_PUBLIC_ENABLE_VCONSOLE: "false",
  RESTRICTED_COUNTRIES: "CN",
};

const production = {
  NEXT_PUBLIC_APP_ENV: "production",
  NEXT_PUBLIC_PRIVY_APP_ID: "fake-prod-app",
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "56",
  NEXT_PUBLIC_EVM_RPC_URL: "https://bsc-mainnet.example.test",
  NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
  RESTRICTED_COUNTRIES: "CN,US",
};

const fails = (
  env: Record<string, string>,
  mode: "development" | "production",
) => checkEnvironment(env, mode).filter((r) => r.status === "FAIL");

describe("env check", () => {
  test("valid development environment passes", () => {
    expect(fails(development, "development")).toEqual([]);
  });

  test("valid production environment passes", () => {
    expect(fails(production, "production")).toEqual([]);
  });

  test("optional integrations are skipped, not failed", () => {
    const results = checkEnvironment(development, "development");
    expect(results).toContainEqual({
      status: "SKIP",
      name: "NEXT_PUBLIC_SITE_URL",
      note: "not set (optional)",
    });
    expect(results).toContainEqual({
      status: "SKIP",
      name: "BACKEND_APP_SECRET",
      note: "not set",
    });
  });

  test("starter backend app id and secret stay optional for ORI", () => {
    const results = checkEnvironment(development, "development");
    expect(results).toContainEqual({
      status: "SKIP",
      name: "NEXT_PUBLIC_BACKEND_APP_ID",
      note: "not set (optional)",
    });
    expect(
      fails(
        {
          ...development,
          NEXT_PUBLIC_BACKEND_APP_ID: "fake-backend-app",
          BACKEND_APP_SECRET: "fake-backend-secret",
        },
        "development",
      ),
    ).toEqual([]);
  });

  test.each([
    "NEXT_PUBLIC_APP_ENV",
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
    "NEXT_PUBLIC_EVM_RPC_URL",
    "NEXT_PUBLIC_API_BASE_URL",
  ])("missing required %s fails", (key) => {
    expect(fails({ ...development, [key]: "" }, "development")).toContainEqual({
      status: "FAIL",
      name: key,
      note: "missing",
    });
  });

  test.each(["staging", "prod"])(
    "invalid app environment %s fails",
    (value) => {
      expect(
        fails({ ...development, NEXT_PUBLIC_APP_ENV: value }, "development"),
      ).toContainEqual({
        status: "FAIL",
        name: "NEXT_PUBLIC_APP_ENV",
        note: "must be development or production",
      });
    },
  );

  test("app environment must match the checked mode", () => {
    expect(fails(development, "production").map((r) => r.name)).toContain(
      "NEXT_PUBLIC_APP_ENV",
    );
  });

  test.each([
    [
      { ...development, NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "56" },
      "development",
      "must be 97 for development",
    ],
    [
      { ...production, NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "97" },
      "production",
      "must be 56 for production",
    ],
  ] as const)("chain id must match the environment (%#)", (env, mode, note) => {
    expect(fails(env, mode)).toContainEqual({
      status: "FAIL",
      name: "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
      note,
    });
  });

  test("invalid chain id and URL fail with value-free notes", () => {
    const result = fails(
      {
        ...development,
        NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "0x61",
        NEXT_PUBLIC_EVM_RPC_URL: "ftp://rpc.example.test",
        NEXT_PUBLIC_WS_URL: "https://ws.example.test",
      },
      "development",
    );
    expect(result.map((r) => r.name)).toEqual(
      expect.arrayContaining([
        "NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID",
        "NEXT_PUBLIC_EVM_RPC_URL",
        "NEXT_PUBLIC_WS_URL",
      ]),
    );
  });

  test("invalid boolean fails", () => {
    expect(
      fails(
        { ...development, NEXT_PUBLIC_ENABLE_VCONSOLE: "yes" },
        "development",
      ),
    ).toContainEqual({
      status: "FAIL",
      name: "NEXT_PUBLIC_ENABLE_VCONSOLE",
      note: "must be true or false",
    });
  });

  test("production must not use a testnet RPC", () => {
    expect(
      fails(
        {
          ...production,
          NEXT_PUBLIC_EVM_RPC_URL: "https://data-seed-prebsc-1-s1.example.test",
        },
        "production",
      ),
    ).toContainEqual({
      status: "FAIL",
      name: "NEXT_PUBLIC_EVM_RPC_URL",
      note: "production must not use a testnet RPC",
    });
  });

  test.each(["cn", "CN;US", "CHN"])(
    "invalid restricted countries %s fails",
    (value) => {
      expect(
        fails(
          { ...development, RESTRICTED_COUNTRIES: value },
          "development",
        ).map((r) => r.name),
      ).toContain("RESTRICTED_COUNTRIES");
    },
  );

  test.each([
    "NEXT_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_PRIVY_ID",
    "NEXT_PUBLIC_WS",
    "NEXT_PUBLIC_IPFS_DOMAIN",
    "NEXT_PUBLIC_APP_ID",
    "NEXT_PUBLIC_APP_SECRET",
    "NEXT_PUBLIC_JWT_KEY",
    "NEXT_PUBLIC_RESTRICTED_COUNTRIES",
    "NEXT_PUBLIC_EVM_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_SOLANA_RPC_URL",
  ])("legacy name %s fails even when blank", (name) => {
    const failure = fails({ ...development, [name]: "" }, "development").find(
      (r) => r.name === name,
    );
    expect(failure?.note).toMatch(/^legacy name; use /);
  });

  test.each([
    "NEXT_PUBLIC_BACKEND_APP_SECRET",
    "NEXT_PUBLIC_IPFS_JWT",
    "NEXT_PUBLIC_CLOUDFLARE_API_TOKEN",
    "NEXT_PUBLIC_PRIVY_APP_SECRET",
  ])("public secret-like name %s fails", (name) => {
    expect(
      fails({ ...development, [name]: "x" }, "development"),
    ).toContainEqual({
      status: "FAIL",
      name,
      note: "secret-like name must never be NEXT_PUBLIC_",
    });
  });

  test("unknown public variable fails as outside the contract", () => {
    expect(
      fails({ ...development, NEXT_PUBLIC_FEATURE_X: "1" }, "development"),
    ).toContainEqual({
      status: "FAIL",
      name: "NEXT_PUBLIC_FEATURE_X",
      note: "not in the Environment Contract",
    });
  });

  test("secret and invalid values never appear in the output", () => {
    const values = {
      backend: "fake-backend-secret-0001",
      ipfs: "fake-ipfs-jwt-0002",
      deploy: "fake-deploy-token-0003",
      legacy: "fake-legacy-secret-0004",
      badUrl: "https://user:fake-url-password-0005@example.test",
      badChain: "fake-chain-0006",
    };
    const output = formatEnvCheck(
      "development",
      checkEnvironment(
        {
          ...development,
          BACKEND_APP_SECRET: values.backend,
          IPFS_JWT: values.ipfs,
          CLOUDFLARE_API_TOKEN: values.deploy,
          NEXT_PUBLIC_APP_SECRET: values.legacy,
          NEXT_PUBLIC_API_BASE_URL: values.badUrl,
          NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: values.badChain,
        },
        "development",
      ),
    );
    for (const value of Object.values(values))
      expect(output).not.toContain(value);
    expect(output).toContain("PASS BACKEND_APP_SECRET: set");
    expect(output).toMatch(/env:check development: FAIL \(\d+ problems\)$/);
  });
});
