# Legacy & Live Runtime Audit

历史证据文档：记录 ORI 线上运行事实与旧代码库中发现的事实，以及它们的来源。它**不是**新项目实现规范；新项目必须遵循的 Web3 与 API 事实分别整理在 [web3.md](./web3.md) 与 [api.md](./api.md)。

## 证据来源与可信度

| 来源 | 是什么 | 用途 |
| --- | --- | --- |
| `https://ori.supply`（线上） | 当前线上 ORI 前端 | **最高运行证据**：页面、路由、网络请求、公开 bundle |
| `https://ori.supply/locales/{en,zh}/common.json` | 线上公开 i18n 资源 | 产品规则（About）、术语 |
| `/Users/shiro/Documents/git-project/ori-website`（`master`） | **ori.supply 的源码**（User Confirmed） | 链配置、ABI 文件、合约调用、API 定义、组件行为 |
| `/Users/shiro/Documents/git-project/origin-website` | 前代产品 **Origin.fun** 的源码 | 共享后端、Privy App、`起源` 代币的历史证据；功能为 Legacy only |

重要结论：

- `ori-website` 是线上源码：`master`、`test`、`test-local` 三个分支都包含线上实际调用的全部 23 个端点（另多 3 个未在线上调用），主网 `oreContract` 等合约地址与线上 bundle 一致。`master` 为提交最多、与线上一致的分支。
- `ori-website` 本地与仓库中都**没有 `.env` 文件**；运行时配置来自部署环境变量。
- `origin-website` 不是 ORI 源码，两者共享同一后端（`gate.game.com`）、同一 Privy App、同一起源代币合约与品牌色。
- 线上观察方式：未登录、未连接钱包、未签名、未发送交易；只点击了页面内的 UI 标签切换。线上 bundle 推断出的事实已由 `ori-website` 源码逐项核对一致。

## ORI 源码（`ori-website`）概况

| 项 | 事实 |
| --- | --- |
| 页面 | `pages/index.tsx`（起源交易挖矿，路由 `/`）、`pages/mine`、`pages/stake`、`pages/explore`、`pages/about`；**没有** `pages/points` |
| 技术栈 | Next.js Pages Router、Privy、wagmi、ethers v6、TanStack Query、Zustand、HeroUI、bignumber.js、Laravel Echo、i18next（与 Origin.fun 同一脚手架） |
| 环境变量（名称） | `NEXT_PUBLIC_APP_ENV`、`NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_PRIVY_ID`、`NEXT_PUBLIC_WS`、`NEXT_PUBLIC_REFERRAL_CODE`（实为 Pusher key）、`NEXT_PUBLIC_IPFS_DOMAIN`、`NEXT_PUBLIC_RESTRICTED_COUNTRIES`；另有 Origin.fun 遗留的 `NEXT_PUBLIC_APP_ID`、`NEXT_PUBLIC_APP_SECRET`、`NEXT_PUBLIC_JWT_KEY` |
| 后端鉴权 | `service/tool.js` 中的签名 `_post` 已定义但**调用 0 次**；全部 API 走未签名的 `post` |
| ABI 文件 | `constant/OreProtocol.json`（`src/OreProtocol.sol`）、`OreProtocolView.json`、`OreToken.json`、`AssetManager.json`（`src/AssetManager.sol`，即 `claimContract`）、`OriSwapRouterV2.json`（`src/OriSwapRouterV2.sol`，即 `oriSwap`） |
| 组件 → 合约 | `trade.tsx` / `auto.tsx` / `rewards.tsx` / `oriRewards.tsx` / stake 页 → OreProtocol；mine / explore / stake 页 → OreProtocolView；`access.tsx` / `OriginClaimCard.tsx` → AssetManager；`oriTrade.tsx` → OriSwapRouterV2 + OreToken |
| Points | 端点 `/ori/points/list`、`/ori/points/user` 已定义，**所有分支均未调用**；名为 `points*` / `PointsRecords*` 的组件实际实现的是起源奖励卡与记录表；i18n `Points.*` 键主要用于起源 UI |
| RPC | `config/chains.ts` 中以带凭据的 QuickNode URL 跟踪在源码中（值不记录） |

## Origin.fun（`origin-website`）概况

| 项 | 事实 |
| --- | --- |
| 产品 | `Origin.fun`，"一个 Meme 的诞生"：Meme 代币创建、bonding curve 买卖、开盘后 Swap、我的资产 |
| 页面 | `/`（代币列表）、`/create`、`/token/[addr]`、`/swap/[[...addr]]`、`/search`、`/me`、`/rules` |
| 技术栈 | Next.js 16（Pages Router）、React 19、HeroUI、Tailwind 4、Privy `@privy-io/react-auth` ^3.2.1、wagmi ^2.18、ethers ^6.15、TanStack Query 5、Zustand 5（persist）、axios、bignumber.js、Laravel Echo + pusher-js、i18next |
| 链 | BSC：生产 56，测试 97（`NEXT_PUBLIC_APP_ENV === "production"` 时为 56） |
| 合约 | TokenFactory、SwapRouter、AssetManager、LightFactory、`起源` 代币、OriginFunDepositContract（预售存款 / 退款） |
| 合约调用 | `buyToken` / `sellToken` / `tryBuy` / `trySell`、`swapMemeForFixedToken` / `swapFixedTokenForMeme`、`getAmountOut`、`deposit` / `withdraw` / `getUserDeposit`、ERC20 `approve` / `allowance` / `balanceOf` |
| API | `POST {NEXT_PUBLIC_API_URL}/v1/originfun/*`（15 个），form-urlencoded |
| 后端鉴权 | `_post`：`sign = md5(baseString + NEXT_PUBLIC_APP_SECRET + cookie login_secret)`，携带 `cookie login_token`；"secret" 以 `NEXT_PUBLIC_` 打进浏览器，不构成真正的保密 |
| 地区限制 | `middleware.ts` 依据 Vercel `x-vercel-ip-country` 拒绝 `NEXT_PUBLIC_RESTRICTED_COUNTRIES`（值为 `CN`）地区 |
| 状态 | 钱包地址、登录态、用户信息存于 Zustand persist（localStorage） |

Origin.fun 的功能（Meme 发射、bonding curve、代币详情页、搜索、创建代币）**全部为 Legacy only**，不进入新版 ORI。

## ORI 线上运行事实（`ori.supply`）

### 页面与路由

| 线上路由 | 线上导航 | 内容 |
| --- | --- | --- |
| `/mine` | 挖矿 | 两个标签：**ORI 挖矿**（5×5 方块游戏，对应 Figma Mine）与 **ORI 游戏**（交易挖矿） |
| `/` | 起源 | 起源交易挖矿：BNB ↔ 起源，采矿基金存取，挖矿奖励（未精炼 / 精炼起源） |
| `/stake` | 质押 | 质押 ORI：存入 / 取出、25 / 50 / 100%、概要（总存款 / 年化 / 总锁仓价值） |
| `/explore` | 探索 | ORI / ORI 游戏 / 起源挖矿 / 起源游戏 统计；挖矿、母矿、回购表格（分页） |
| `/about` | 关于 | 产品介绍、规则、代币经济、链接（`whitepaper.ori.supply`、X / Telegram `refinORI`） |
| `/points` | — | **404**。但线上 i18n 已有完整 `Points` 文案 |

### 运行时

| 项 | 事实 |
| --- | --- |
| 链 | BSC 56（交易链接指向 `bscscan.com`；读合约走 BSC 主网 RPC） |
| RPC | QuickNode BSC 主网 endpoint，**token 嵌在 URL 路径中并打包进公开 JS**（值不记录） |
| 钱包 | Privy，`loginMethods: ["wallet"]`，`walletChainType: "ethereum-only"`，钱包列表 Binance / OKX / MetaMask，嵌入式钱包关闭 |
| 合约交互 | ethers v6（`BrowserProvider(privyWallet.getEthereumProvider())`）用于写操作；wagmi `useReadContracts` 用于部分读；`JsonRpcProvider(rpcUrl)` 用于无钱包读 |
| API | `POST https://gate.game.com/v1/ori/*`，23 个端点，**无登录会话**，钱包地址作为参数 |
| 实时 | Pusher 协议 WebSocket（`wss://gate.game.com/app/<public app key>`），公共频道 `round.new_round` / `round.reset` |
| 多语言 | `en`、`zh`（`/locales/{lng}/common.json`），线上默认显示中文 |
| 字体 | HarmonyOS Sans SC Regular / Medium / Bold，由站点自身 `_next/static/media` 提供 |
| 资金精度 | 交易值以 `parseEther` / `parseUnits(…, 18)` 得到 `bigint`；余额比较与展示用 `bignumber.js`（`dp(6, ROUND_DOWN)`）；部分地方用 `parseFloat` 做输入判断；起源链下余额 8 位小数 |
| 活跃度 | 观察时最近若干挖矿回合参与人数为 0，最近回购记录停在 2026-02 |

### 两套挖矿系统

| 系统 | 线上位置 | 机制 | 链上 / 链下 |
| --- | --- | --- | --- |
| **ORI 挖矿**（方块游戏） | `/mine` → ORI 挖矿 | 1 分钟一轮，BNB 部署到 5×5 方块，VRF 随机选出获胜方块 | 链上：`OreProtocol` |
| **ORI 游戏 / 起源**（交易挖矿） | `/mine` → ORI 游戏、`/` | 按本回合交易量占比分配未精炼奖励；母矿每 3–6 轮随机触发 | ORI 游戏：链上 `oriSwap`；起源：后端代执行的签名 swap + `CLAIM_CONTRACT` 存取 |

新版 Figma 的 Mine 只对应 **ORI 挖矿（方块游戏）**；Figma 中没有交易挖矿与起源页面。

## Current Figma vs Live / Legacy

| Feature | Current Figma | Live (`ori.supply`) | Legacy (`origin-website`) | 分类 |
| --- | --- | --- | --- | --- |
| 导航 | Mine · Points · Stake · Explore · About | 挖矿 · 起源 · 质押 · 探索 · 关于；i18n 中另有 首页 / 积分 | Home · Swap · Mechanism · Create · Me | **Conflict**（起源 ↔ Points） |
| Mine 方块游戏 | 5×5、Manual / Auto、Rewards、Autominer、Miners | 同结构；`OreProtocol` | 无 | **Visual Redesign Only**（行为保留） |
| 部署资产 | SOL 图标与文案 | **BNB** | — | Figma 占位，**以 BNB 为准** |
| 金额快捷按钮 | `+0.5 / +1 / +2` | `+0.02 / +0.05 / +0.1` | — | **Conflict**（Figma 数值随 SOL 占位） |
| 全选 | 无 | `全选` | — | **Legacy/Live only** |
| 母矿卡 | 单一金额 | `ORI + 起源` 双资产 | — | **Behavior Changed?**（需确认） |
| Rewards | ORE / Unrefined BURY / Refined BURY；Claim / Claim only ORE | `getUserRewards` → BNB、直接 ORI、精炼 ORI；`claimAll` / `claimEth` | — | Visual Redesign；**命名需按线上** |
| 交易挖矿（ORI 游戏） | 无 | 有 | 雏形（Swap） | **Live only** |
| 起源页 | 无 | `/` | 起源代币 | **Live only** |
| Points | 有；"1 USD bet = 1 point" | 页面未上线；文案："每 10 分钟按未中奖用户投入比例分配 1000 积分" | 无 | **New Figma Only + Conflict（规则）** |
| Stake | Deposit / Withdraw、SOL、Summary | 质押 **ORI**、Summary 相同 | 无 | Visual Redesign；**资产为 ORI** |
| Explore | 4 统计卡 + 3 表 | 多标签统计 + 挖矿 / 母矿 / 回购（起源、ORI 两张）表 | 无 | **Behavior Changed**（Figma 简化） |
| About | 手风琴，占位文案 | 完整规则 + 白皮书式长文 | `/rules` | Visual Redesign；**文案以线上为准** |
| Wallet | 底部 Sheet：余额、导出、接收、复制、断开 | 需连接钱包，**未验证** | 钱包下拉 / `/me` | Unknown |
| 语言 | Figma 英文 | 线上 en / zh，默认中文 | en / zh | Conflict（默认语言待定） |

## Legacy technical debt（不迁移）

- 全局 Zustand persist 保存登录态、地址、用户信息（`auth-storage`、`user-storage`）。
- 钱包身份由 Zustand 地址与 Privy `useWallets` 匹配得出，存在两套事实。
- `NEXT_PUBLIC_APP_SECRET` 参与请求签名：浏览器可见的 "secret"。
- RPC 带凭据 URL 硬编码并打包进前端。
- `isMounted` 整页挂载门控（首屏只有 loading 图）。
- 金额在 `Number`、`toFixed`、`parseFloat` 与 bignumber.js 之间混用。
- gas limit 统一 `estimateGas × 1.2`，toast 驱动的交易反馈，无统一交易状态模型。
- `useEchoChannel` 在模块级创建全局 Echo 单例。
- HeroUI、next-themes、nprogress、axios、qs、md5 等前代依赖。

## Credential exposure（只记录存在与位置）

| Credential | Location | Purpose | Action |
| --- | --- | --- | --- |
| `.env` 已提交并推送 | `origin-website` 首个提交起；`origin/HEAD` | 含 `NEXT_PUBLIC_APP_SECRET`、`AUTH_SECRET`、`AUTH_TWITTER_SECRET`、`NEXT_PUBLIC_JWT_KEY` 等 | 轮换 |
| 私钥字面量 | `origin-website` 历史中已删除的 `scripts/buyToken.js`（多次提交） | BSC 测试网脚本签名 | 视为泄露，转移资产 |
| QuickNode BSC 主网 / 测试网 RPC token | `origin-website/config/chains.ts`；`ori-website/config/chains.ts`；**线上 ori.supply 公开 bundle** | 链读写 RPC | 轮换；新项目改为不暴露凭据的方案 |

新项目不得复制上述任何值或模式。
