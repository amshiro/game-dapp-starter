# ORI Web3 Facts

新版 ORI 必须遵循的链、合约、钱包与交易事实。全局规则（精度、交易语义、owner、Fail-closed）见 `docs/web3.md`；本文件只记录 ORI 项目事实及来源。

来源说明：合约地址与 ABI 来自 ori.supply 源码 `ori-website`（`config/chains.ts`、`constant/*.json`），并与线上公开 bundle 逐项核对一致；线上 About 仅为历史对外说明，不是新版需求；新版 Scope 以用户/当前 Figma 为准。详见 [legacy-runtime-audit.md](./legacy-runtime-audit.md)。

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

### Chain ownership

| Fact | Owner |
| --- | --- |
| 支持的链（仅 56 / 97）、名称、原生币、区块浏览器、testnet 标记 | Chain Registry（`shared/config`） |
| Environment → Business Target Chain（development → 97，production → 56，无默认链，未知环境 fail closed） | Chain Registry |
| 当前环境声明的 chainId | `NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID`，须与 Registry 映射一致 |
| Runtime RPC | `NEXT_PUBLIC_EVM_RPC_URL`（Registry 不保存 RPC） |
| 合约地址 / ABI | Contract Registry（F4），不属于 Chain Registry |
| Wallet 当前链 | Privy / Wagmi（F5），不得建立全局 currentChain store |

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
- 环境变量名称、分类与 Secret 边界见 [environment.md](./environment.md)。

## Contracts

| Contract（线上配置键） | 作用 | BSC 56 | BSC 97 | ABI 来源 | Confidence |
| --- | --- | --- | --- | --- | --- |
| `oreContract` — **OreProtocol** | 方块挖矿主合约：部署、自动挖矿、领奖、质押、回购埋藏；UUPS 代理 | `0xA1634f0B4417c753944239ea1a6bA5A97Ce0156f` | `0x8Cc12430C18187cE40002c9a67f803fc5591344a` | `ori-website/constant/OreProtocol.json`（`src/OreProtocol.sol`） | 高：源码 + 线上一致 |
| `readOreContract` — **OreProtocolView** | 只读聚合视图 | `0x9BdAc803A7e2b83821dFc58651B73d3f983DEdD3` | `0xF2db01A5Ef364a55C9aCBDC2223711fB6Ea334A4` | `ori-website/constant/OreProtocolView.json` | 高 |
| `ori` — **ORI token** | ERC20，`MAX_SUPPLY` / `cap`，`mint` / `burn` 受角色控制 | `0xBBF7cc1c4e3A0ed3F0b05C3700322D36ba210101` | `0x65Ca17cd1F049F54b40A3A2E622Fd67380Cb0101` | `ori-website/constant/OreToken.json`（`src/token/OreToken.sol`，完整 ABI，非精简 ERC20） | 高 |
| `origin` — **起源 token** | 起源代币（与 Origin.fun 相同合约）；ORI 运行时**只用作价格查询的地址标识**（匹配后端 `chain_asset_config` 的 `aux_contract_addr`），无链上调用 | `0xe75B8CF742Bb13342688d740C271368412664444` | `0x7048FaCAee7Dd8198AC4F7A390d3333741D8aA19` | 无（不需要 ABI） | 高 |
| `claimContract` — **AssetManager**（存取 / 埋藏） | `depositETH`、`deposit(…, "claim" \| "claim_bnb", …)`、`withdraw2`、`withdrawETH`、`bury`、`oriPointToken`；UUPS 代理 | `0x641fD5502c4bE2c4Bd7aA7aCaca0548cbAB319eA` | `0xb1D5F44E94Ab9428E6217c3517355c173F3544D0` | `ori-website/constant/AssetManager.json`（`src/AssetManager.sol`） | 高（`claim` / `claim_bnb` 语义见 Q-10） |
| `oriSwap` | ORI 游戏交易挖矿：`buyOri`（payable）、`sellOri`、`amountOut`、`TradeVolume` 事件 | `0x6050c41Fa3395494feb87798CEaBB8840a8D0b67` | `0x7623c9d6385bae0c8bc24da6862e202bfdddec72` | `ori-website/constant/OriSwapRouterV2.json`（`src/OriSwapRouterV2.sol`） | 高；**新版 Figma 不含该功能** |
| `bnb` | WBNB；ORI 运行时**只用作 BNB 价格查询的地址标识**，无链上调用 | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`（源码大小写不符合 EIP-55，已改为标准 checksum，地址相同） | **缺失**（源码为空字符串） | 无（不需要 ABI） | 高 |

### Contract Registry（F4）

- 部署事实与 ABI 由 `shared/config` 中的 Contract Registry 持有（跨 Mine / Stake / Rewards / Explore 共享的公共合约配置，见 `docs/architecture.md`）；Chain Registry 只持有链身份。
- `chainId → deployment set`：56 与 97 各自独立；不支持的链、未知合约名、缺失的地址一律 fail closed，无默认地址或跨链 fallback。
- **Contracts**（带 ABI）：`oreProtocol`、`oreProtocolView`、`oriToken`、`assetManager`、`oriSwap`。ABI 从 `ori-website/constant/*.json`（master）**原样复制**（仅 `abi` 数组，不含 bytecode），记录来源与 sha256，测试校验内容未被修改；不提供精简或共享的 ERC20 ABI，ORI token 使用完整 `OreToken` ABI。
- **Assets**（仅地址标识，无 ABI）：`originToken`、`wbnb`。
- 合约地址不属于环境变量；`APP_ENV → Chain Registry → Contract Registry` 决定部署。
- 地址校验使用 Viem `isAddress(…, { strict: true })`（混合大小写时校验 EIP-55 checksum）、非零、跨链不复用（F5.1）。地址均为 UUPS 代理，代理当前实现版本见 Q-10。
- **已知缺口**：BSC 97 无 WBNB 地址（仅影响测试网 BNB 价格查询，不影响合约交互）。

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

新项目沿用该钱包模型（EVM 外部钱包、仅钱包登录、嵌入式钱包关闭）。

### EVM Runtime Foundation（F5）

- 链路：`APP_ENV` + `NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID` → EVM capability（Chain Registry 校验：受支持且与环境一致）→ Viem chain（由 Registry 派生，RPC = `NEXT_PUBLIC_EVM_RPC_URL`）→ Privy config + Wagmi config。
- Provider：`app/providers.tsx` 中 `PrivyProvider → QueryClientProvider（既有 QueryClient owner）→ WagmiProvider`；`createConfig` 与 `WagmiProvider` 来自 `@privy-io/wagmi`。EVM capability 不可用时只挂 `QueryClientProvider`（Web3 关闭，fail closed）。
- 当前运行时只有一条链（Business Target Chain）；Privy `supportedChains` / `defaultChain` 与 Wagmi `chains` 均只含该链。
- Wallet connection 唯一 owner 为 Privy：`@privy-io/wagmi` 的 `createConfig` 移除非 mock connector 并关闭 injected provider discovery；不配置 Wagmi connectors。
- Privy config：`loginMethods: ["wallet"]`、`walletChainType: "ethereum-only"`、`walletList: ["binance", "okx_wallet", "metamask"]`、`showWalletLoginFirst`、Ethereum / Solana embedded wallet `createOnLogin: "off"`；不配置主题与弹窗样式。
- 以下事实分别由 Privy / Wagmi 提供，不合成全局 `isWeb3Ready`，不复制进 Zustand：Privy `ready`、`authenticated`、wallet connected、wallet address、wallet current chain；Business Target Chain 来自 Chain Registry。
- Wagmi config 按 Provider tree 创建（Server 每次请求独立、浏览器稳定），不在模块顶层创建。
- Dev 兼容（F5.1）：vinext 1.3.1 把 Next 的 server-external 默认列表也加入 client `optimizeDeps.exclude`，导致 Privy → `@walletconnect/logger` 的 `import "pino"` 在 `pnpm dev` 中无法解析；`vite.config.ts` 只把 `pino` 从 client exclude 中移除（与 production build 一致，打包 pino 的 browser 版本）。vinext 修复后可删除。
- 本地 Privy Allowed Origins：`http://localhost:3000`、`http://localhost:5199`。
- W1 已接入 Header 钱包登录：`features/wallet` 直接读取 Privy ready/authenticated/wallets 与 Wagmi `useConnection`；以当前 Wagmi address 匹配已连接 Privy wallet，不用 linked account 或数组首项替代当前身份。仅局部保存取消/失败提示，不保存认证、地址或链副本。
- Runtime target context 仅传递已校验的 Business Target Chain 配置；capability 不可用时不挂载 SDK hooks。钱包 current chain 与目标链分开判断，链未知/桥接不同步不显示正确链；W1 不提供切链 UX。
- SDK logout 由独立测试验证；产品断开入口仍属 W2，logout 不承诺撤销扩展钱包站点权限。
- W1 真实 Development 钱包连接、正确链 97 和取消重试已验证；稳定 OKX / clean profile 的刷新恢复由用户人工确认连续 5/5，约 1 秒恢复。账户切换已由用户验收：已有授权及新授权账户均约 1 秒更新，无需刷新；未批准新账户连接时仍显示网站已获授权的旧账户，符合授权语义。错误链验收已通过：用户在 localhost 连接详情切换实际 EVM 网络后出现 Wrong network，切回 BSC Testnet 97 后约 1 秒内恢复正常，无需刷新。钱包资产页网络筛选不作为网站连接切链的验收证据。
- W2：Header identity 打开局部原生 dialog Sheet；复制直接使用当前 SDK address，断开委托 Privy logout。复制反馈按 identity/chain 边界重置；不镜像 wallet/auth/address。ORE 仅 unavailable visual slot，无余额 API/RPC owner；Export UI 不调用 SDK export，Receive 排除。
- 尚未实现：真实余额数据、Export 行为、合约读写、交易。

### W1 Acceptance evidence（2026-10-27）

| Check | Evidence / Result |
| --- | --- |
| Connect / identity | PASS：真实 OKX Development 钱包登录，目标链 97；身份来自 Privy/Wagmi，无额外钱包 store |
| Refresh | PASS（用户人工）：稳定 OKX profile 连续 5/5，约 1 秒恢复；无扩展对照正常 |
| Account switch | PASS（用户人工）：已有/新授权账户约 1 秒更新，无需刷新；未批准账户连接不替代当前已授权账户 |
| Wrong chain → 97 | PASS（用户人工）：连接详情中的实际 EVM 切链显示 Wrong network，切回 97 约 1 秒恢复；无需刷新，无交易 |
| Cancel / retry | PASS（真实 SDK 浏览器）：键盘启动、关闭弹窗、Connect 恢复可用，再次点击可重新打开 |
| Recoverable provider error | PASS（受控 SDK mock）：非取消错误 -32002 不崩溃，仍可重试，成功后由新 SDK 事实收敛；原始错误不展示。未人为制造真实钱包服务故障 |
| Header 375 / 500（W1 历史验收） | PASS：当时 375px 全宽、PC 500px 居中；Header 56px、控件 32px，无横向溢出。当前用户已改为 PC Header 全宽/左右 padding 120px，现行布局见 design-system.md；身份胶囊/错误状态逻辑不变 |
| SDK disconnect | PASS（独立 mock）：委托 Privy logout；产品断开入口属于 W2 |
| Final QA | PASS：env:check、typecheck、lint、format:check、test（22 files / 321 tests）、build、git diff --check |

本次验收仅覆盖 W1，等待人工审核 / Git checkpoint；不授权后续 Feature、交易、Production 配置或 deploy。

### Development browser profile issue / non-application blocker

2026-10-27 人工审核结论：当前证据支持 browser profile / environment issue，不支持 ORI Provider、Privy/Wagmi bridge 或 W1 业务代码存在需要修复的问题；原 Chrome profile A 不再作为 W1 阻塞，停止调查其隐私设置、扩展、缓存及 site data。

证据摘要：A 一轮约 58.8 秒恢复（iframe 资源加载约 56.9 秒），另两轮超过 60 秒未 ready；iframe ready 到达后约 50ms 内钱包与 Wagmi 恢复。无扩展对照三轮约 2.73 / 0.88 / 0.68 秒 ready；独立 OKX profile 由用户确认连续 5/5、约 1 秒恢复。Provider/config 没有观察到异常重建。独立 iframe 的 `pending` 文案不等于网络阻塞，已撤回该推断；确切浏览器子原因未定位，不将扩展注入警告当作根因。

临时诊断和对照 route 已移除；不修改 Provider、不增加 timeout、钱包 localStorage 镜像或 reconnect workaround，不升级依赖。

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

## S1 Development Stake Read Integration

用户本轮限定授权：只接 Development / BSC Testnet 97 的本金读取。Production 56 的 RPC 未配置、未执行 runtime 验证；继续 Release / Production Gate，不自动寻找替代 RPC。此授权不解锁任何签名或资金操作。

| 展示位置 | Canonical source | 单位 / 范围 |
| --- | --- | --- |
| Deposit Bal / Available ORI | Registry `oriToken.balanceOf(account)` | 97 runtime-confirmed ORI，18 decimals |
| Withdraw Bal / User Staked | Registry `oreProtocolView.getStakeInfo(account).stakedAmount`（tuple index 0） | 97 runtime-confirmed ORI，18 decimals |
| Summary Total deposit | Registry `oreProtocolView.getTreasuryState().totalStaked`（tuple index 0） | 97 runtime-confirmed ORI，18 decimals；公共读取，不依赖 account |

Runtime evidence（前置只读验证，block 139267238）：97 的 ORI / View / Protocol 均有 bytecode；`symbol() = ORI`、`decimals() = 18`，View `protocol()` 与 Registry Protocol 一致，Protocol `ORI_TOKEN()` 与 Registry Token 一致。三条本金读取均成功；公共 totalStaked 原始值 `1000999800000000000000`，格式化为 `1000.9998 ORI`。不据此宣称五份完整 ABI 或所有 proxy 当前实现均已验证。公开 Protocol 地址仅作为前置验证的 account input，正式页面始终使用 W1 SDK 当前身份。

Read owner：`features/stake/read`；`app/stake` 组合 W1 SDK 身份与 Stake props，不建立 wallet/auth/address store，也不让 Stake 依赖 Wallet Feature。金额缓存保存 bigint，使用 Viem `formatUnits`；视觉最多截取 6 位小数，非零微量显示 `<0.000001`，完整 decimal string 通过 title / accessible label 保留。原始 bigint / exact string 同时保留在 display model，不使用 floating point。

Query key 包含目标链、token/View 部署地址及个人 account；无 previous-account placeholder。身份恢复中不读个人数据，断开后个人值立即隐藏；wrong/unknown chain 隐藏全部三项并禁用读取；切回正确链、账户变化由 Query 生命周期收敛。实际 RPC chain ID 在每次读取前校验。取消过时 query 时不接纳迟到结果。每项独立 loading/error，error 不回显旧值；Query staleTime 30s、retry 1，无 interval polling，支持窗口重新聚焦、Refresh 与 `stakeReadKeys.all` invalidation。

Rewards 继续 **PARTIALLY CONFIRMED**：`pendingRewards` 可读不等于已证明 immediately claimable ORI；`rewardDebt`、`stakeRewardsFactor` 单位 UNKNOWN，不作为本金或 ORI amount。当前页面没有新增 Claimable Rewards slot；APR / TVL 维持 `—`，无 API 或价格推导。native BNB 仅 gas，与 Stake principal balance 无关。Q-24、Q-26、Q-12、金额与 allowance / completion gate 均未关闭；Deposit / Withdraw / percentage 保持禁用。

User Confirmed：Development 97 Read Integration 已通过最终人工验收。账户切换、wrong chain → 97、断开、刷新恢复均 PASS；Deposit Balance / Withdraw Staked Balance / Total deposit 正常恢复，无旧账户缓存残留。此结论仅覆盖当前限定 Development Read Scope，不关闭 Production 56、Reward Semantics 或任何交易 Gate。
