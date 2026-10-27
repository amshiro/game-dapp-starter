# ORI Web3 Facts

新版 ORI 必须遵循的链、合约、钱包与交易事实。全局规则（精度、交易语义、owner、Fail-closed）见 `docs/web3.md`；本文件只记录 ORI 项目事实及来源。

来源说明：合约地址与 ABI 来自 ori.supply 源码 `ori-website`（`config/chains.ts`、`constant/*.json`），并与线上公开 bundle 逐项核对一致；产品规则取自线上 About 文案。详见 [legacy-runtime-audit.md](./legacy-runtime-audit.md)。

## Chain

| 项 | 值 | Status | Source |
| --- | --- | --- | --- |
| 目标运行时 | EVM / BNB Smart Chain | **Confirmed** | User Confirmed；`ori-website` 源码；线上 |
| 生产链 | BNB Smart Chain，chainId **56**，原生资产 BNB（18 位） | **Confirmed** | User Confirmed；`ori-website` 源码；线上 bundle |
| 开发链 | BSC Testnet，chainId **97**（tBNB） | **Confirmed**（开发、联调与测试交易默认链） | User Confirmed |
| 区块浏览器 | `https://bscscan.com` / `https://testnet.bscscan.com` | Confirmed | 线上 bundle |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` | Confirmed | 线上 bundle |
| RPC | 按环境配置，见下方 Environment Matrix | 开发 Confirmed；生产 TBD | User Confirmed |

Figma 中的 SOL 图标、SOL 文案与 Solana 叙述是**设计占位**，不得驱动任何运行时实现。

## Environment Matrix

| Environment | Chain | Chain ID | Privy App | RPC | Contracts | Backend |
| --- | --- | ---: | --- | --- | --- | --- |
| Development | BSC Testnet | 97 | Dev App `cmkw81a5y00onkw0czubpy4hj` | BNB Chain 公开测试网 RPC `https://data-seed-prebsc-1-s1.bnbchain.org:8545` | 下表 BSC 97 列 | 开发后端配置（host 待确认，Q-11） |
| Production | BSC Mainnet | 56 | Production App（线上证据为 `cmi70qts3005hl90c27u5uc75`；新项目是否沿用见 Q-04） | **TBD** 专用 RPC（Q-14） | 下表 BSC 56 列 | 生产后端配置 |

规则（User Confirmed，[ADR-001](./decisions/ADR-001-runtime-environments.md)）：

- 环境整体一致，禁止混用：Dev Privy + 主网合约、测试网 RPC + 主网链、Production Privy + 测试网合约。
- RPC endpoint 是环境配置，不得硬编码在 Feature / 业务代码中；由 Starter 配置层提供。开发 RPC 未来可替换为专用 provider。
- 旧项目（`origin-website`、`ori-website`、线上 bundle）中的 QuickNode RPC URL 与凭据已泄露，**不得迁移或复用**。
- 本文件记录事实，不代表 Provider、链注册表或 `.env` 已实现。

## Contracts

| Contract（线上配置键） | 作用 | BSC 56 | BSC 97 | ABI 来源 | Confidence |
| --- | --- | --- | --- | --- | --- |
| `oreContract` — **OreProtocol** | 方块挖矿主合约：部署、自动挖矿、领奖、质押、回购埋藏；UUPS 代理 | `0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f` | `0x8Cc12430C18187cE40002c9a67f803fc5591344a` | `ori-website/constant/OreProtocol.json`（`src/OreProtocol.sol`） | 高：源码 + 线上一致 |
| `readOreContract` — **OreProtocolView** | 只读聚合视图 | `0x9BdAc803A7e2b83821dFc58651B73d3f983DEdD3` | `0xF2db01A5Ef364a55C9aCBDC2223711fB6Ea334A4` | `ori-website/constant/OreProtocolView.json` | 高 |
| `ori` — **ORI token** | ERC20，`MAX_SUPPLY` / `cap`，`mint` / `burn` 受角色控制 | `0xBBF7cc1c4e3A0ed3F0b05C3700322D36ba210101` | `0x65Ca17cd1F049F54b40A3A2E622Fd67380Cb0101` | `ori-website/constant/OreToken.json` | 高 |
| `origin` — **起源 token** | 起源代币（与 Origin.fun 相同合约） | `0xe75B8CF742Bb13342688d740C271368412664444` | `0x7048FaCAee7Dd8198AC4F7A390d3333741D8aA19` | 标准 ERC20（`OreToken.json` 中的 ERC20 部分适用于读取）；`origin-website` 同一合约 | 高 |
| `claimContract` — **AssetManager**（存取 / 埋藏） | `depositETH`、`deposit(…, "claim" \| "claim_bnb", …)`、`withdraw2`、`withdrawETH`、`bury`、`oriPointToken`；UUPS 代理 | `0x641fD5502c4bE2c4Bd7aA7aCaca0548cbAB319eA` | `0xb1D5F44E94Ab9428E6217c3517355c173F3544D0` | `ori-website/constant/AssetManager.json`（`src/AssetManager.sol`） | 高（`claim` / `claim_bnb` 语义见 Q-10） |
| `oriSwap` | ORI 游戏交易挖矿：`buyOri`（payable）、`sellOri`、`amountOut`、`TradeVolume` 事件 | `0x6050c41Fa3395494feb87798CEaBB8840a8D0b67` | `0x7623c9d6385bae0c8bc24da6862e202bfdddec72` | `ori-website/constant/OriSwapRouterV2.json`（`src/OriSwapRouterV2.sol`） | 高；**新版 Figma 不含该功能** |
| `bnb` | WBNB | `0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | （空） | `ori-website/config/chains.ts` | 高 |

ABI 文件尚未进入本仓库。实现时以 `ori-website/constant/*.json`（带 `contractName` / `sourceName` 的编译产物）为当前事实来源，按 owner 放置（`docs/architecture.md`）；如有合约仓库或 BscScan 已验证 ABI，应优先核对。地址均为 UUPS 代理，代理当前实现版本需在实现前复核（Q-10）。

## Mine（方块游戏）协议事实

### 规则（线上 About，Confirmed as public product rules）

- 每轮 **1 分钟**；**5 × 5** 共 25 个方块；用户将 **BNB** 部署到任意方块（单个、多个或全部）。
- **Manual**：一轮；**Auto**：多轮，BNB 预先收取。
- 平台费 **1%**。
- 每分钟自动开奖，由**链上随机数**决定获胜方块；若无人参与或无人部署获胜方块，本轮作废、不分配、不铸币。
- 未中奖：部署的 BNB 全部损失。
- 中奖：获得本轮奖池 BNB 的 **90%**，按获胜方块上的部署比例分配；同时产生 **1 ORI**：50% 概率给一位随机中奖者，50% 概率按比例分给全部中奖者。
- Motherlode：每轮额外铸 **0.2 ORI** 进入母矿池；触发概率 **1/625**；未触发则累积。
- 精炼：领取未领取的 ORI 挖矿奖励收取 **10%** 精炼费，按未领取 ORI 比例分配给仍未领取的矿工；来自精炼池的 ORI 领取时不再收费。
- 起源池：每轮结束后**未中奖**用户获得起源奖励（每轮 2 起源；母矿起源池每轮累积 1 起源，1/625 触发后全部分给未中奖用户）；领取起源收取 10% 精炼费。
- 代币：ORI 最大供应 **4,200,000**；无预挖、无团队分配。

### 合约实现（OreProtocol，Confirmed from live ABI）

| 产品概念 | 合约 |
| --- | --- |
| 轮次参数 | `board()` → `currentRoundId`、`roundLength`、`intermission`（**以区块计**）、`feeBps`、`vaultBps`、`claimFeeBps`、`live` |
| 当前轮 | View `getCurrentRoundInfo()` → `roundId`、`startBlock`、`endBlock`、`totalDeployed`、`canDeploy`、`canReset`、`randomnessRequested` |
| 方块统计 | View `getCurrentRoundSquareStats()` → `uint256[25] squareAmounts`、`totalDeployed` |
| 我的部署 | View `getCurrentRoundSquares(miner)` / `getMinerSquares(roundId, miner)` → `mask`、`squares`、`amounts` |
| **Manual 部署** | `deployManual(uint256 mask, uint256 amountPerSquare)` **payable**；`mask` 为 25 位位图（`mask \|= 1 << index`）；`msg.value = amountPerSquare × 选中数` |
| **Auto** | `registerAutomation({owner, balance, mask, amountPerSquare, randomizeMask, active, botFee})` **payable**；链下执行器调用 `executeAutomation` 并收取 `executorFee`；`stopAutomation(to)` 停止并退款；`getAutomation(user)` |
| 开奖 | `resetRound()` 请求 Chainlink VRF → `rawFulfillRandomWords` → `ResetEvent(roundId, winningSquare, …, motherlode, topMiner, numWinners, motherlodePayout, oreReward)` |
| 结算 | `checkpoint(roundId, miner)` / `batchCheckpoint`；部署前须已结算上一轮（`MustCheckpointPreviousRound`） |
| 奖励查询 | `getUserRewards(miner)` → `ethAmount`（BNB）、`oriDirect`、`oriRefined` |
| **领取** | `claimAll(to)` → BNB + ORI；`claimEth(to)` → 仅 BNB；领取有时限（`ClaimWindowPassed`、`ExpiredRewardsClaimed`） |
| 质押 | `depositStake(amount)`（**ORI**，需 approve）、`withdrawStake(amount, to)`、`claimStakeYield(to)`；`getStakeInfo(user)`；`getTreasuryState()` → `totalStaked`、`vaultEth`、`motherlodeOre` 等 |
| 回购埋藏 | `buryOriPoint`、`getSwapProgram()`；事件 `BuryEvent`、`BuryOriPointEvent` |
| 关键错误 | `AlreadyDeployedThisRound`、`DifferentAmountPerSquareNotSupported`、`InvalidMask`、`InvalidAmount`、`RoundNotLive`、`RandomnessPending`、`PleaseWaitForVRF`、`AutomationAlreadyActive`、`AutomationConflictWithManualBet`、`InsufficientAutomationBalance`、`NothingToClaim`、`ClaimWindowPassed` |

**About ≠ 实现需确认**：About 写"每轮 1 分钟"，合约以 `roundLength` 区块数配置；About 写"1% 平台费"，合约另有 `vaultBps` 与 `claimFeeBps`；About 中回购比例出现 6% / 10% / 4% 三种表述。数值以合约读取为准，展示文案需产品确认（Q-41）。

## Wallet model

| 项 | 事实 | Status |
| --- | --- | --- |
| 方案 | Privy，仅钱包登录（`loginMethods: ["wallet"]`），`walletChainType: "ethereum-only"` | Confirmed（线上） |
| 钱包列表 | Binance、OKX、MetaMask；`showWalletLoginFirst` | Confirmed（线上） |
| 嵌入式钱包 | 关闭（Ethereum 与 Solana 均 `createOnLogin: "off"`） | Confirmed（线上） |
| Privy App ID | 开发：`cmkw81a5y00onkw0czubpy4hj`（Dev App，User Confirmed）；生产：线上证据为 `cmi70qts3005hl90c27u5uc75`，新项目是否沿用待确认（Q-04）。二者均为公开客户端配置，不是 App Secret | 开发 Confirmed |
| 签名者 | Privy `useWallets()` 中的外部钱包 → EIP-1193 provider | Confirmed（线上） |
| 后端身份 | 无后端登录会话；钱包地址作为请求参数 | Confirmed（线上） |

新项目按 Starter 规范：Privy 负责认证与钱包事实，Wagmi / Viem 负责 EVM 交互；不得复制线上 Zustand 地址副本、ethers 封装或 `estimateGas × 1.2` 约定。

## Transaction concepts

| Feature | Write | Value | Approval | Completion |
| --- | --- | --- | --- | --- |
| Manual 部署 | `OreProtocol.deployManual` | BNB = 每格金额 × 格数 | — | 交易确认；部署结果在链上与 `/ori/round` 中可见 |
| Auto 开始 | `OreProtocol.registerAutomation` | BNB 预付 | — | 交易确认；`getAutomation` 显示 active |
| Auto 停止 | `OreProtocol.stopAutomation` | — | — | 交易确认；余额退回 |
| 领取全部 | `OreProtocol.claimAll` | — | — | 交易确认；奖励刷新 |
| 仅领取 BNB | `OreProtocol.claimEth` | — | — | 同上 |
| 质押存入 | `OreProtocol.depositStake` | ORI | ORI `approve(OreProtocol)` | 交易确认 |
| 质押取出 | `OreProtocol.withdrawStake` | — | — | 交易确认 |
| 领取质押收益 | `OreProtocol.claimStakeYield` | — | — | 交易确认 |

Backend reconciliation：线上 UI 在交易确认后刷新查询（`invalidateQueries`），并通过实时频道 `round.new_round` / `round.reset` 接收轮次变化。是否需要等待后端索引完成后再显示完成，属于 Feature completion contract（`docs/web3.md`），待确认（Q-12）。

## Precision

- 链上金额：`bigint`（BNB / ORI 18 位小数，ORI `decimals()` 实现前需读链确认）。
- 后端起源金额：线上按 8 位小数格式化（`formatUnits(amount, 8)`）。
- 不得使用 JS `number` / `parseFloat` 计算金额；展示格式化与业务计算分离（`docs/tech-stack.md`）。
