import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { assetManagerAbi } from "./abi/asset-manager";
import { oreProtocolAbi } from "./abi/ore-protocol";
import { oreProtocolViewAbi } from "./abi/ore-protocol-view";
import { oriSwapRouterV2Abi } from "./abi/ori-swap-router-v2";
import { oriTokenAbi } from "./abi/ori-token";
import {
  getAssetAddress,
  getContractDeployment,
  getContractsForChain,
  isSupportedContractChain,
  isValidEvmAddress,
  type OriContractName,
} from "./evm-contracts";

const CONTRACTS: readonly OriContractName[] = [
  "oreProtocol",
  "oreProtocolView",
  "oriToken",
  "assetManager",
  "oriSwap",
];

type AbiEntry = Readonly<{ type: string; name?: string }>;
const members = (abi: readonly AbiEntry[], type: string) =>
  abi.filter((e) => e.type === type).map((e) => e.name);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
      );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

describe("ORI contract registry: chain separation", () => {
  test.each([56, 97])("chain %s has a complete contract set", (chainId) => {
    expect(isSupportedContractChain(chainId)).toBe(true);
    expect(Object.keys(getContractsForChain(chainId)).sort()).toEqual(
      [...CONTRACTS].sort(),
    );
  });

  test.each([1, 5, 137, 8453, 11155111, 0, Number.NaN])(
    "unsupported chain %s fails closed without fallback",
    (chainId) => {
      expect(isSupportedContractChain(chainId)).toBe(false);
      expect(() => getContractsForChain(chainId)).toThrow(
        `No ORI deployment for chain ${chainId}`,
      );
      expect(() => getContractDeployment(chainId, "oreProtocol")).toThrow();
    },
  );

  test("mainnet and testnet deployments never share an address", () => {
    for (const name of CONTRACTS) {
      expect(getContractDeployment(56, name).address.toLowerCase()).not.toBe(
        getContractDeployment(97, name).address.toLowerCase(),
      );
    }
  });

  test("known deployments resolve deterministically", () => {
    expect(getContractDeployment(56, "oreProtocol").address).toBe(
      "0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f",
    );
    expect(getContractDeployment(97, "oreProtocol").address).toBe(
      "0x8Cc12430C18187cE40002c9a67f803fc5591344a",
    );
    expect(getContractDeployment(56, "oriSwap")).toBe(
      getContractDeployment(56, "oriSwap"),
    );
  });

  test("unknown contract name fails closed", () => {
    expect(() =>
      getContractDeployment(56, "mainContract" as OriContractName),
    ).toThrow("Unknown ORI contract: mainContract");
    expect(() =>
      getContractDeployment(56, "toString" as OriContractName),
    ).toThrow("Unknown ORI contract");
  });

  test("assets are identifiers only and gaps fail closed", () => {
    expect(getAssetAddress(56, "wbnb")).toBe(
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    );
    expect(getAssetAddress(97, "originToken")).toBe(
      "0x7048FaCAee7Dd8198AC4F7A390d3333741D8aA19",
    );
    expect(() => getAssetAddress(97, "wbnb")).toThrow(
      "No wbnb address for chain 97",
    );
  });
});

describe("address validation", () => {
  test.each([
    "0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f",
    "0x7623c9d6385bae0c8bc24da6862e202bfdddec72",
  ])("accepts %s", (value) => {
    expect(isValidEvmAddress(value)).toBe(true);
  });

  test("lowercase form of a checksummed address is accepted", () => {
    expect(
      isValidEvmAddress("0xa1634f0b4417c753944239ea1a6ba5a97ce0156f"),
    ).toBe(true);
  });

  test.each([
    "0x0000000000000000000000000000000000000000",
    // Valid hex, wrong EIP-55 checksum (one letter's case flipped).
    "0xa1634f0B4417c753944239ea1a6bA5A97Ce0156f",
    "0x1234",
    "A1634f0B4417c753944239ea1a6bA5A97Ce0156f",
    "0xZZ34f0B4417c753944239ea1a6bA5A97Ce0156f",
    "0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f00",
    "",
  ])("rejects %s", (value) => {
    expect(isValidEvmAddress(value)).toBe(false);
  });

  test("every registered address is valid", () => {
    for (const chainId of [56, 97]) {
      for (const deployment of Object.values(getContractsForChain(chainId))) {
        expect(isValidEvmAddress(deployment.address)).toBe(true);
      }
    }
  });
});

describe("ABI identity", () => {
  test.each([
    [
      "oreProtocol",
      [
        "deployManual",
        "registerAutomation",
        "stopAutomation",
        "claimAll",
        "claimEth",
        "depositStake",
        "withdrawStake",
        "claimStakeYield",
        "checkpoint",
      ],
    ],
    [
      "oreProtocolView",
      [
        "getCurrentRoundInfo",
        "getCurrentRoundSquareStats",
        "getMinerSquares",
        "getUserRewards",
        "getStakeInfo",
        "getTreasuryState",
        "getAutomation",
      ],
    ],
    [
      "oriToken",
      ["balanceOf", "allowance", "approve", "decimals", "MAX_SUPPLY", "cap"],
    ],
    [
      "assetManager",
      ["deposit", "depositETH", "withdraw2", "withdrawETH", "bury"],
    ],
    ["oriSwap", ["buyOri", "sellOri", "getAmountOut"]],
  ] as const)("%s exposes its key functions", (name, functions) => {
    const abi = getContractDeployment(56, name).abi as readonly AbiEntry[];
    expect(abi.length).toBeGreaterThan(0);
    expect(members(abi, "function")).toEqual(
      expect.arrayContaining([...functions]),
    );
  });

  test("OreProtocol keeps its events and errors", () => {
    const abi = oreProtocolAbi as readonly AbiEntry[];
    expect(members(abi, "event")).toEqual(
      expect.arrayContaining([
        "DeployEvent",
        "ResetEvent",
        "ClaimEth",
        "ClaimOre",
      ]),
    );
    expect(members(abi, "error")).toEqual(
      expect.arrayContaining(["AlreadyDeployedThisRound", "ClaimWindowPassed"]),
    );
  });

  test("ORI token uses its full ABI, not a reduced ERC20 subset", () => {
    expect(getContractDeployment(97, "oriToken").abi).toBe(oriTokenAbi);
    expect(members(oriTokenAbi as readonly AbiEntry[], "function")).toEqual(
      expect.arrayContaining(["mint", "burn", "grantRole", "treasury"]),
    );
  });

  test("both chains share one ABI object per contract", () => {
    for (const name of CONTRACTS) {
      expect(getContractDeployment(56, name).abi).toBe(
        getContractDeployment(97, name).abi,
      );
    }
  });

  test.each([
    ["asset-manager", assetManagerAbi],
    ["ore-protocol", oreProtocolAbi],
    ["ore-protocol-view", oreProtocolViewAbi],
    ["ori-swap-router-v2", oriSwapRouterV2Abi],
    ["ori-token", oriTokenAbi],
  ] as const)(
    "%s content matches the sha256 recorded at copy time",
    (file, abi) => {
      const source = readFileSync(
        new URL(`./abi/${file}.ts`, import.meta.url),
        "utf8",
      );
      const recorded = /Canonical ABI sha256: ([0-9a-f]{64})/.exec(source)?.[1];
      expect(recorded).toBeDefined();
      expect(createHash("sha256").update(canonical(abi)).digest("hex")).toBe(
        recorded,
      );
    },
  );
});

describe("immutability", () => {
  test("registry and ABIs cannot be mutated", () => {
    const deployment = getContractDeployment(56, "oreProtocol");
    expect(Object.isFrozen(getContractsForChain(56))).toBe(true);
    expect(Object.isFrozen(deployment)).toBe(true);
    expect(Object.isFrozen(deployment.abi)).toBe(true);
    expect(Object.isFrozen(deployment.abi[0])).toBe(true);
    expect(() => {
      (deployment as { address: string }).address = "0x0";
    }).toThrow();
    expect(getContractDeployment(56, "oreProtocol").address).toBe(
      "0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f",
    );
  });
});
