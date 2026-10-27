import { describe, expect, test } from "vitest";
import {
  SUPPORTED_EVM_CHAINS,
  findEvmChain,
  getEvmChainForEnvironment,
  isSupportedEvmChainId,
  resolveEnvironmentChain,
} from "./evm-chains";
import type { AppEnvironment } from "./parse-public-config";

describe("EVM chain registry", () => {
  test("supports exactly BSC Mainnet 56 and BSC Testnet 97", () => {
    expect(SUPPORTED_EVM_CHAINS.map((chain) => chain.id).sort()).toEqual([
      56, 97,
    ]);
    expect(isSupportedEvmChainId(56)).toBe(true);
    expect(isSupportedEvmChainId(97)).toBe(true);
  });

  test.each([1, 5, 137, 8453, 11155111, 0, -56, 56.5, Number.NaN])(
    "rejects unsupported chain %s without fallback",
    (chainId) => {
      expect(isSupportedEvmChainId(chainId)).toBe(false);
      expect(findEvmChain(chainId)).toBeUndefined();
    },
  );

  test("BSC Mainnet static facts", () => {
    expect(findEvmChain(56)).toEqual({
      id: 56,
      name: "BNB Smart Chain",
      testnet: false,
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      blockExplorer: { name: "BscScan", url: "https://bscscan.com" },
    });
  });

  test("BSC Testnet static facts", () => {
    expect(findEvmChain(97)).toEqual({
      id: 97,
      name: "BNB Smart Chain Testnet",
      testnet: true,
      nativeCurrency: { name: "BNB", symbol: "tBNB", decimals: 18 },
      blockExplorer: { name: "BscScan", url: "https://testnet.bscscan.com" },
    });
  });

  test("owns no runtime RPC or non-chain configuration", () => {
    for (const chain of SUPPORTED_EVM_CHAINS) {
      expect(Object.keys(chain).sort()).toEqual([
        "blockExplorer",
        "id",
        "name",
        "nativeCurrency",
        "testnet",
      ]);
    }
  });

  test("maps development → 97 and production → 56", () => {
    expect(getEvmChainForEnvironment("development").id).toBe(97);
    expect(getEvmChainForEnvironment("production").id).toBe(56);
  });

  test.each(["staging", "test", "toString", "__proto__", ""])(
    "unknown environment %s fails closed",
    (environment) => {
      expect(() =>
        getEvmChainForEnvironment(environment as AppEnvironment),
      ).toThrow("Unsupported app environment for EVM chain selection");
    },
  );

  test.each([
    ["development", 97],
    ["production", 56],
  ] as const)("%s with chain %s resolves", (environment, chainId) => {
    expect(resolveEnvironmentChain(environment, chainId)).toEqual({
      ok: true,
      chain: findEvmChain(chainId),
    });
  });

  test.each([
    ["development", 56, "environment-mismatch", 97],
    ["production", 97, "environment-mismatch", 56],
    ["development", 1, "unsupported-chain", 97],
    ["production", 11155111, "unsupported-chain", 56],
  ] as const)(
    "%s with chain %s fails as %s",
    (environment, chainId, reason, expectedId) => {
      const resolution = resolveEnvironmentChain(environment, chainId);
      expect(resolution).toMatchObject({ ok: false, reason });
      expect(!resolution.ok && resolution.expected.id).toBe(expectedId);
    },
  );

  test("registry entries cannot be mutated", () => {
    const chain = findEvmChain(56)!;
    expect(Object.isFrozen(SUPPORTED_EVM_CHAINS)).toBe(true);
    expect(Object.isFrozen(chain)).toBe(true);
    expect(Object.isFrozen(chain.nativeCurrency)).toBe(true);
    expect(Object.isFrozen(chain.blockExplorer)).toBe(true);
    expect(() => {
      (chain as { name: string }).name = "Other";
    }).toThrow();
    expect(findEvmChain(56)?.name).toBe("BNB Smart Chain");
  });
});
