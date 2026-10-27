import { assetManagerAbi } from "./abi/asset-manager";
import { oreProtocolAbi } from "./abi/ore-protocol";
import { oreProtocolViewAbi } from "./abi/ore-protocol-view";
import { oriSwapRouterV2Abi } from "./abi/ori-swap-router-v2";
import { oriTokenAbi } from "./abi/ori-token";
import { isSupportedEvmChainId, type SupportedEvmChainId } from "./evm-chains";

/**
 * ORI contract deployments per chain (source: ori-website master config/chains.ts).
 * Chain identity lives in evm-chains.ts; this module owns ORI deployments only.
 */
export type EvmAddress = `0x${string}`;

const ABIS = {
  oreProtocol: oreProtocolAbi,
  oreProtocolView: oreProtocolViewAbi,
  oriToken: oriTokenAbi,
  assetManager: assetManagerAbi,
  oriSwap: oriSwapRouterV2Abi,
} as const;

export type OriContractName = keyof typeof ABIS;

/**
 * Token addresses used only as identifiers (e.g. backend price lookup by
 * contract address); ORI makes no on-chain calls to them, so they carry no ABI.
 */
export type OriAssetName = "originToken" | "wbnb";

export type ContractDeployment<N extends OriContractName = OriContractName> =
  Readonly<{ name: N; address: EvmAddress; abi: (typeof ABIS)[N] }>;

type DeploymentSet = Readonly<{
  contracts: Readonly<Record<OriContractName, EvmAddress>>;
  /** A missing asset is a known gap, never filled with a placeholder. */
  assets: Readonly<Partial<Record<OriAssetName, EvmAddress>>>;
}>;

const DEPLOYMENTS: Readonly<Record<SupportedEvmChainId, DeploymentSet>> = {
  56: {
    contracts: {
      oreProtocol: "0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f",
      oreProtocolView: "0x9BdAc803A7e2b83821dFc58651B73d3f983DEdD3",
      oriToken: "0xBBF7cc1c4e3A0ed3F0b05C3700322D36ba210101",
      assetManager: "0x641fD5502c4bE2c4Bd7aA7aCaca0548cbAB319eA",
      oriSwap: "0x6050c41Fa3395494feb87798CEaBB8840a8D0b67",
    },
    assets: {
      originToken: "0xe75B8CF742Bb13342688d740C271368412664444",
      wbnb: "0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    },
  },
  97: {
    contracts: {
      oreProtocol: "0x8Cc12430C18187cE40002c9a67f803fc5591344a",
      oreProtocolView: "0xF2db01A5Ef364a55C9aCBDC2223711fB6Ea334A4",
      oriToken: "0x65Ca17cd1F049F54b40A3A2E622Fd67380Cb0101",
      assetManager: "0xb1D5F44E94Ab9428E6217c3517355c173F3544D0",
      oriSwap: "0x7623c9d6385bae0c8bc24da6862e202bfdddec72",
    },
    // WBNB is empty for chain 97 in the source configuration.
    assets: { originToken: "0x7048FaCAee7Dd8198AC4F7A390d3333741D8aA19" },
  },
};

/** Syntax check only: 0x + 40 hex, non-zero. Checksum validation arrives with Viem (F5). */
export function isValidEvmAddress(value: string): value is EvmAddress {
  return /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/.test(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function buildRegistry() {
  const seen = new Map<string, string>();
  const registry = {} as Record<
    SupportedEvmChainId,
    Readonly<{
      contracts: Readonly<{ [N in OriContractName]: ContractDeployment<N> }>;
      assets: DeploymentSet["assets"];
    }>
  >;
  for (const [chainKey, set] of Object.entries(DEPLOYMENTS)) {
    const chainId = Number(chainKey) as SupportedEvmChainId;
    const addresses = [
      ...Object.entries(set.contracts),
      ...Object.entries(set.assets),
    ];
    for (const [name, address] of addresses) {
      if (!isValidEvmAddress(address)) {
        throw new Error(`Invalid ${name} address for chain ${chainId}`);
      }
      const key = address.toLowerCase();
      if (seen.has(key)) {
        throw new Error(`${name} on chain ${chainId} reuses ${seen.get(key)}`);
      }
      seen.set(key, `${name} on chain ${chainId}`);
    }
    const contracts = Object.fromEntries(
      (Object.keys(ABIS) as OriContractName[]).map((name) => [
        name,
        { name, address: set.contracts[name], abi: ABIS[name] },
      ]),
    ) as { [N in OriContractName]: ContractDeployment<N> };
    registry[chainId] = { contracts, assets: { ...set.assets } };
  }
  return deepFreeze(registry);
}

// Built once at import: an invalid or cross-chain-reused address fails closed here.
const REGISTRY = buildRegistry();

export function isSupportedContractChain(
  chainId: number,
): chainId is SupportedEvmChainId {
  return isSupportedEvmChainId(chainId) && Object.hasOwn(REGISTRY, chainId);
}

function deploymentsFor(chainId: number) {
  if (!isSupportedContractChain(chainId)) {
    throw new Error(`No ORI deployment for chain ${chainId}`);
  }
  return REGISTRY[chainId];
}

export function getContractsForChain(chainId: number) {
  return deploymentsFor(chainId).contracts;
}

export function getContractDeployment<N extends OriContractName>(
  chainId: number,
  name: N,
): ContractDeployment<N> {
  const contracts = deploymentsFor(chainId).contracts;
  if (!Object.hasOwn(contracts, name)) {
    throw new Error(`Unknown ORI contract: ${String(name)}`);
  }
  return contracts[name];
}

export function getAssetAddress(
  chainId: number,
  name: OriAssetName,
): EvmAddress {
  const assets = deploymentsFor(chainId).assets;
  const address = Object.hasOwn(assets, name) ? assets[name] : undefined;
  if (address === undefined) {
    throw new Error(`No ${name} address for chain ${chainId}`);
  }
  return address;
}
