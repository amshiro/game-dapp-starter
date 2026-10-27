// ABI copied verbatim from ori-website/constant/OreProtocolView.json (master).
// Contract: OreProtocolView (src/OreProtocolView.sol) (Foundry artifact)
// Canonical ABI sha256: 80bd95f18b94f34aa9a9eb4f0bba49262296f2a9e3b4e664cc744757317a35da
// Protocol interface data: do not edit by hand; re-copy from the source artifact.
export const oreProtocolViewAbi = [
  {
    type: "constructor",
    inputs: [{ name: "_protocol", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAutomation",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct OreProtocol.Automation",
        components: [
          { name: "owner", type: "address", internalType: "address" },
          { name: "balance", type: "uint256", internalType: "uint256" },
          { name: "mask", type: "uint256", internalType: "uint256" },
          { name: "amountPerSquare", type: "uint256", internalType: "uint256" },
          { name: "randomizeMask", type: "bool", internalType: "bool" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentRoundInfo",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint64", internalType: "uint64" },
      { name: "startBlock", type: "uint64", internalType: "uint64" },
      { name: "endBlock", type: "uint64", internalType: "uint64" },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
      { name: "canDeploy", type: "bool", internalType: "bool" },
      { name: "canReset", type: "bool", internalType: "bool" },
      { name: "randomnessRequested", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentRoundSquareStats",
    inputs: [],
    outputs: [
      {
        name: "squareAmounts",
        type: "uint256[25]",
        internalType: "uint256[25]",
      },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentRoundSquares",
    inputs: [{ name: "miner", type: "address", internalType: "address" }],
    outputs: [
      { name: "mask", type: "uint256", internalType: "uint256" },
      { name: "squares", type: "uint8[]", internalType: "uint8[]" },
      { name: "amounts", type: "uint256[]", internalType: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEthReward",
    inputs: [
      { name: "roundId", type: "uint64", internalType: "uint64" },
      { name: "miner", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEthRewards",
    inputs: [
      { name: "roundIds", type: "uint64[]", internalType: "uint64[]" },
      { name: "miner", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "totalReward", type: "uint256", internalType: "uint256" },
      { name: "rewards", type: "uint256[]", internalType: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGameState",
    inputs: [],
    outputs: [
      {
        name: "state",
        type: "uint8",
        internalType: "enum OreProtocolView.GameState",
      },
      { name: "blocksRemaining", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLastRoundWinners",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint64", internalType: "uint64" },
      { name: "winningSquare", type: "uint8", internalType: "uint8" },
      {
        name: "participantList",
        type: "tuple[]",
        internalType: "struct OreProtocol.SquareParticipant[]",
        components: [
          { name: "participant", type: "address", internalType: "address" },
          { name: "amount", type: "uint96", internalType: "uint96" },
        ],
      },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMinerRoundInfo",
    inputs: [
      { name: "roundId", type: "uint64", internalType: "uint64" },
      { name: "miner", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "checkpointed", type: "bool", internalType: "bool" },
      { name: "hasParticipation", type: "bool", internalType: "bool" },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
      { name: "ethReward", type: "uint256", internalType: "uint256" },
      { name: "oreShares", type: "uint256", internalType: "uint256" },
      { name: "oreBonus", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMinerSquares",
    inputs: [
      { name: "roundId", type: "uint64", internalType: "uint64" },
      { name: "miner", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "mask", type: "uint256", internalType: "uint256" },
      { name: "squares", type: "uint8[]", internalType: "uint8[]" },
      { name: "amounts", type: "uint256[]", internalType: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRoundData",
    inputs: [{ name: "roundId", type: "uint64", internalType: "uint64" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct OreProtocol.RoundData",
        components: [
          { name: "id", type: "uint64", internalType: "uint64" },
          { name: "startBlock", type: "uint64", internalType: "uint64" },
          { name: "endBlock", type: "uint64", internalType: "uint64" },
          {
            name: "intermissionEndBlock",
            type: "uint64",
            internalType: "uint64",
          },
          { name: "totalDeployed", type: "uint256", internalType: "uint256" },
          { name: "winningsPool", type: "uint256", internalType: "uint256" },
          { name: "vaultShare", type: "uint256", internalType: "uint256" },
          { name: "winningSquare", type: "uint8", internalType: "uint8" },
          { name: "oreReward", type: "uint256", internalType: "uint256" },
          { name: "topMinerReward", type: "uint256", internalType: "uint256" },
          { name: "topMinerSample", type: "uint256", internalType: "uint256" },
          {
            name: "motherlodePayout",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "topMiner", type: "address", internalType: "address" },
          { name: "randomnessRequested", type: "bool", internalType: "bool" },
          { name: "randomnessFulfilled", type: "bool", internalType: "bool" },
          { name: "splitReward", type: "bool", internalType: "bool" },
          { name: "motherlode", type: "bool", internalType: "bool" },
          { name: "topMinerClaimed", type: "bool", internalType: "bool" },
          { name: "claimedRewards", type: "uint256", internalType: "uint256" },
          {
            name: "deployedPerSquare",
            type: "uint256[25]",
            internalType: "uint256[25]",
          },
          {
            name: "minersPerSquare",
            type: "uint256[25]",
            internalType: "uint256[25]",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRoundSquareStats",
    inputs: [{ name: "roundId", type: "uint64", internalType: "uint64" }],
    outputs: [
      {
        name: "squareAmounts",
        type: "uint256[25]",
        internalType: "uint256[25]",
      },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSquareParticipants",
    inputs: [
      { name: "roundId", type: "uint64", internalType: "uint64" },
      { name: "squareId", type: "uint8", internalType: "uint8" },
    ],
    outputs: [
      {
        name: "participantList",
        type: "tuple[]",
        internalType: "struct OreProtocol.SquareParticipant[]",
        components: [
          { name: "participant", type: "address", internalType: "address" },
          { name: "amount", type: "uint96", internalType: "uint96" },
        ],
      },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStakeInfo",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "stakedAmount", type: "uint256", internalType: "uint256" },
      { name: "pendingRewards", type: "uint256", internalType: "uint256" },
      { name: "rewardDebt", type: "uint256", internalType: "uint256" },
      { name: "updatedAt", type: "uint48", internalType: "uint48" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTreasuryState",
    inputs: [],
    outputs: [
      { name: "totalStaked", type: "uint256", internalType: "uint256" },
      { name: "stakeRewardsFactor", type: "uint256", internalType: "uint256" },
      { name: "totalOreShares", type: "uint256", internalType: "uint256" },
      { name: "minerRewardsFactor", type: "uint256", internalType: "uint256" },
      { name: "vaultEth", type: "uint256", internalType: "uint256" },
      { name: "motherlodeOre", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserRewards",
    inputs: [{ name: "miner", type: "address", internalType: "address" }],
    outputs: [
      { name: "ethAmount", type: "uint256", internalType: "uint256" },
      { name: "oriDirect", type: "uint256", internalType: "uint256" },
      { name: "oriRefined", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWinningSquareParticipants",
    inputs: [{ name: "roundId", type: "uint64", internalType: "uint64" }],
    outputs: [
      { name: "winningSquare", type: "uint8", internalType: "uint8" },
      {
        name: "participantList",
        type: "tuple[]",
        internalType: "struct OreProtocol.SquareParticipant[]",
        components: [
          { name: "participant", type: "address", internalType: "address" },
          { name: "amount", type: "uint96", internalType: "uint96" },
        ],
      },
      { name: "totalDeployed", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocol",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract OreProtocol" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "roundWindow",
    inputs: [{ name: "roundId", type: "uint64", internalType: "uint64" }],
    outputs: [
      { name: "startBlock", type: "uint64", internalType: "uint64" },
      { name: "endBlock", type: "uint64", internalType: "uint64" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "treasuryVault",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyBalance",
    inputs: [],
    outputs: [
      { name: "isBalanced", type: "bool", internalType: "bool" },
      { name: "diff", type: "int256", internalType: "int256" },
      { name: "contractBalance", type: "uint256", internalType: "uint256" },
      { name: "expectedBalance", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;
