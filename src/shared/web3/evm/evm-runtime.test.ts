import { describe, expect, test } from "vitest";
import { resolveEvmCapability } from "../../config/evm-capability";
import {
  findEvmChain,
  getEvmChainForEnvironment,
} from "../../config/evm-chains";
import {
  parsePublicConfig,
  type PublicConfigInput,
} from "../../config/parse-public-config";
import { createEvmRuntime } from "./evm-runtime";
import { toViemChain } from "./viem-chain";
import { createWagmiConfig } from "./wagmi-config";

// Non-routable RPC and fake app id: config construction never touches a network.
const RPC = "http://localhost:8545/";
const development = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_PRIVY_APP_ID: "fake-app-id",
  NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "97",
  NEXT_PUBLIC_EVM_RPC_URL: RPC,
} as const;

function configured(input: PublicConfigInput) {
  const capability = resolveEvmCapability(() => parsePublicConfig(input));
  if (capability.status !== "configured") {
    throw new Error(`expected configured, got ${capability.reason}`);
  }
  return capability;
}

describe("registry chain → Viem chain", () => {
  test.each([56, 97] as const)("chain %s keeps registry metadata", (id) => {
    const registry = findEvmChain(id)!;
    const chain = toViemChain(registry, RPC);
    expect(chain).toMatchObject({
      id,
      name: registry.name,
      testnet: registry.testnet,
      nativeCurrency: registry.nativeCurrency,
      blockExplorers: { default: registry.blockExplorer },
    });
  });

  test("RPC is the provided endpoint and nothing else", () => {
    const chain = toViemChain(findEvmChain(97)!, RPC);
    expect(chain.rpcUrls).toEqual({ default: { http: [RPC] } });
  });

  test("development resolves to BSC Testnet 97", () => {
    expect(getEvmChainForEnvironment("development").id).toBe(97);
  });
});

describe("Wagmi config", () => {
  test("has exactly the target chain and uses the provided RPC", () => {
    const config = createWagmiConfig(toViemChain(findEvmChain(97)!, RPC), RPC);
    expect(config.chains.map((chain) => chain.id)).toEqual([97]);
    expect(config.getClient({ chainId: 97 }).transport.url).toBe(RPC);
  });

  test("Privy integration leaves no competing wallet connectors", () => {
    const config = createWagmiConfig(toViemChain(findEvmChain(97)!, RPC), RPC);
    expect(config.connectors).toEqual([]);
  });

  test("a chain outside the config is rejected", () => {
    const config = createWagmiConfig(toViemChain(findEvmChain(97)!, RPC), RPC);
    expect(() => config.getClient({ chainId: 56 })).toThrow();
  });
});

describe("EVM runtime", () => {
  test("development runtime targets 97 across Privy and Wagmi", () => {
    const runtime = createEvmRuntime(configured(development));
    expect(runtime.privyAppId).toBe("fake-app-id");
    expect(runtime.privyConfig.defaultChain?.id).toBe(97);
    expect(runtime.privyConfig.supportedChains?.map((c) => c.id)).toEqual([97]);
    expect(runtime.wagmiConfig.chains.map((c) => c.id)).toEqual([97]);
  });

  test("production runtime exists only for a valid production config", () => {
    const runtime = createEvmRuntime(
      configured({
        ...development,
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "56",
      }),
    );
    expect(runtime.wagmiConfig.chains.map((c) => c.id)).toEqual([56]);

    expect(() =>
      configured({ ...development, NEXT_PUBLIC_APP_ENV: "production" }),
    ).toThrow("environment-mismatch");
    expect(() =>
      configured({
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID: "56",
      }),
    ).toThrow("incomplete");
  });

  test("each call builds an independent Wagmi config", () => {
    const capability = configured(development);
    expect(createEvmRuntime(capability).wagmiConfig).not.toBe(
      createEvmRuntime(capability).wagmiConfig,
    );
  });
});
