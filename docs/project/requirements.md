# ORI 需求

本文件是 ORI 项目需求的 Source of Truth。

- **Confirmed**：区分新版需求与技术/历史事实；新版需求须由用户或当前 Figma 明确表达，旧运行/源码只确认对应技术或历史行为。
- **Inferred**：从状态稿、按钮、数值或代码调用推断。实现可以作为工作假设，但相关行为必须易于修改。
- **Unknown**：没有足够证据。实现被阻塞或必须留空，不得自行补默认值。详见 [open-questions.md](./open-questions.md)。

## 来源优先级

新版需求以用户明确确认 → 当前 `ORI-AI测试` 为准。旧 ORI 源码/UI/线上文案仅提供历史或技术证据，不能自动形成新版 Scope；Figma 未设计且用户未确认时保持 OPEN。只有已确定需要某项能力时才从旧源码恢复 API、ABI、address 等技术事实，详见 [README](./README.md#source-of-truth-优先级)。

下表来自 Live/Source 的历史事实不自动授权新版功能；具体交付范围以当前用户决策、Figma 和对应 Feature Ticket 为准。

来源缩写：`Live` = ori.supply 运行观察；`Live bundle` = 线上公开 JS；`Live About` = 线上 About / i18n 文案；`Source` = ori.supply 源码 `ori-website`；`Figma` = `ORI-AI测试`（`2003:178`）节点；`Legacy` = `origin-website`。详见 [legacy-runtime-audit.md](./legacy-runtime-audit.md)。

## Confirmed Requirements

### 平台与运行时

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-01 | 目标运行时为 **EVM / BNB Smart Chain** | User Confirmed；Source；Live | 见 [web3.md](./web3.md) |
| C-02 | Figma SOL assets were non-authoritative placeholders：Figma 中的 SOL 图标、SOL 文案、Solana 叙述与临时代币图片不得驱动链类型、资产或运行时实现 | User Confirmed | 实现时替换为真实资产（BNB、ORI、起源） |
| C-03 | 部署 / 下注资产为原生 **BNB** | Live；Live bundle（`deployManual` payable）；Live About | |
| C-04 | 钱包通过 Privy；线上为仅钱包登录、EVM 外部钱包（Binance / OKX / MetaMask）、无嵌入式钱包 | Source；Live | 新项目登录方式是否保持一致见 Q-04 |
| C-05 | `ORI-AI测试` 是新版视觉 Source of Truth；`BURY` 为历史稿，不纳入实现 | User Confirmed | |
| C-06 | 旧代码不迁移，只恢复事实：`ori-website`（ori.supply 源码）、`origin-website`（前代 Origin.fun）与线上 bundle | User Confirmed | |
| C-07 | 必须使用真实品牌与代币资产，不得用 emoji、Lucide 或 CSS 临摹替代 | User Confirmed | 见 [assets.md](./assets.md) |
| C-08 | **Development environment**：BSC Testnet，chainId **97**；Privy Dev App ID `cmkw81a5y00onkw0czubpy4hj`；RPC 为 BNB Chain 官方公开测试网 RPC `https://data-seed-prebsc-1-s1.bnbchain.org:8545`；BSC 97 测试网合约地址；开发后端配置 | User Confirmed | App ID 为公开客户端配置；RPC 为环境配置而非业务事实，可替换 |
| C-09 | **Production environment**：BSC Mainnet，chainId **56**；Privy Production App；BSC 56 生产合约地址；生产后端配置；**Production RPC 待定** | User Confirmed | 不得沿用旧项目已泄露的 QuickNode URL / 凭据（Q-14） |
| C-80 | 环境必须整体一致：禁止 Dev Privy + 主网合约、测试网 RPC + 主网链、Production Privy + 测试网合约等混用 | User Confirmed | 见 [ADR-001](./decisions/ADR-001-runtime-environments.md) |
| C-81 | RPC endpoint 不得硬编码在 Feature / 业务代码中，由 Starter 配置层按环境提供 | User Confirmed | 见 ADR-001 |
| C-82 | ORI 没有后端登录 / 会话，接口不需要 App ID、Secret 或后端签名；Starter 的可选认证 capability 在 ORI 中不启用 | Backend owner Confirmed；正式 Contract / F6.1，见 [api.md](./api.md#authentication--signing) | Q-13 / Q-44 / Q-46 已解决；不建立 Backend Auth |
| C-83 | W2 保留 Figma 的单行 ORE balance visual slot；无已确认数据 owner 时显示 unavailable，不使用示例 48.60，不替换 BNB/ORI/起源或增加多资产 | User Confirmed | 真实数据 owner、资产定义与来源仍 OPEN |
| C-84 | W2 保留 Export UI/位置样式，明确不可用；行为 OPEN，不导出密钥/助记词，不解释成复制地址或历史导出 | User Confirmed；Figma `2003:2528/2529` | external EVM wallet-only，embedded off |
| C-85 | W2 不实现 Receive、QR、Privy fundWallet 或旧版 mining fund；Header identity 打开 Sheet，地址复制/断开沿用 SDK 身份 owner | User Confirmed | Receive 后续是否需要/具体语义须重新明确授权 |
| C-86 | A1 UI 子集：最多一项展开，打开另一项关闭上一项；无初始默认项证据则全部 collapsed，展开稿仅证明状态视觉 | User Confirmed；Figma 2003:2235 / 2359 无 prototype 起点 | 本轮不预开 Intro；正文/外链/Q-41/Q-30 继续 OPEN |

### Responsive

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-10 | H5：375px 是设计参考，运行宽度 100%，不得固定 375px | User Confirmed | |
| C-11 | PC：内容宽 500px，水平居中 | User Confirmed | Figma 规范页的 PC 375 文案不修改，实现以本条为准 |
| C-12 | PC 只做简单适配：不重新设计、不变多列、不改变业务顺序与信息层级 | User Confirmed | ORI 项目规则 |

### 导航与页面

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-20 | 新版底部导航 5 项：Mine · Points · Stake · Explore · About | Figma `2003:2921`；Live i18n `Header` 键 `home / points / stake / explore / about` 与之一致 | 线上当前为 挖矿 · 起源 · 质押 · 探索 · 关于，见 Q-01 |
| C-21 | Header：Logo + ORI 价格；未连接 `Connect`；已连接显示缩短地址 | Figma；Live | |
| C-22 | My Wallet 使用 Shared Modal 默认：H5 bottom sheet，PC center；max-500 对齐 ORI viewport，backdrop 仅覆盖 ORI viewport；圆角 16、关闭与 safe-area。当前用户明确决定覆盖旧 PC bottom 工程方案 | User Confirmed；Figma `2003:2487` | 不做 PC redesign，无拖拽关闭 |

### Mine（方块游戏）

线上对应 `/mine` → "ORI 挖矿"。下列旧业务证据仅供已确定的新版能力核对技术，不自动决定保留；Scope 以用户/当前 Figma 为准。

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-30 | 每轮 1 分钟；5 × 5 共 25 方块；BNB 部署到单个、多个或全部方块 | Live About；Live；OreProtocol | 合约以 `roundLength` 区块数配置 |
| C-31 | Manual 一轮；Auto 多轮且 BNB 预先收取 | Live About；`registerAutomation` payable | |
| C-32 | Manual 总额 = 每方块金额 × 方块数（每个方块金额相同） | Live bundle；`deployManual(mask, amountPerSquare)`；`DifferentAmountPerSquareNotSupported` | 与 Figma `0.42 × 2 = 0.84` 一致 |
| C-33 | Auto 可选择方块，或随机方块（`randomizeMask`） | Live bundle；`registerAutomation` | 解释了 Figma Autominer 的 `Random x 25` |
| C-34 | 同一用户不能同时进行 Manual 与 Auto；同一轮不能重复部署 | OreProtocol 错误 `AutomationConflictWithManualBet`、`AlreadyDeployedThisRound` | UI 需给出对应状态 |
| C-35 | 平台费 1% | Live About | 合约另有 `vaultBps`、`claimFeeBps`，见 Q-41 |
| C-36 | 开奖由链上随机数（Chainlink VRF）决定获胜方块；无人参与或获胜方块无人部署则本轮作废 | Live About；OreProtocol（VRF、`ResetEvent`） | |
| C-37 | 未中奖：部署的 BNB 全部损失 | Live About | |
| C-38 | 中奖：获得本轮奖池 BNB 的 90%，按获胜方块部署比例分配；产生 1 ORI（50% 给随机一人，50% 按比例） | Live About | |
| C-39 | Motherlode：每轮 +0.2 ORI 进入母矿池，触发概率 1/625，未触发累积 | Live About；`MotherlodeEvent` | 线上母矿卡同时显示 `ORI + 起源`，见 Q-31 |
| C-40 | 精炼：领取 ORI 挖矿奖励收 10% 精炼费，分配给仍未领取者；精炼池中的 ORI 领取免费 | Live About；`ClaimOre(tax, redistributed)`；`getUserRewards`（`oriDirect`、`oriRefined`） | |
| C-41 | 领取：全部领取（BNB + ORI）与仅领取 BNB 两种 | OreProtocol `claimAll`、`claimEth` | Figma `Claim` / `Claim only …` 对应此二者 |
| C-42 | 奖励领取有时限 | OreProtocol `ClaimWindowPassed`、`ExpiredRewardsClaimed` | 时限值未知，见 Q-42 |
| C-43 | 区块状态：正常、选中、已部署、已部署 + 选中、自动选中、中奖、未中奖、等待开始；人数 > 1000 缩写 | Figma `2003:1038` 标注 | |
| C-44 | 结果动画：未中奖方块 100%→25% 透明度每块 0.15s 随机依次（3.6s）；获胜方块点亮 0.15s；保持 10s | Figma `2003:1405`–`2003:1408` 标注 | 线上动画未验证 |
| C-45 | 数据卡：Motherlode、剩余时间（等待中显示 Waiting / 等待中…）、总部署、你的部署；点击切换美金值 / 轮次 | Figma 标注 `2003:1037`；Live | |
| C-46 | Manual 按钮状态：未连接 → Connect wallet；未选方块 → Deploy 不可用；余额不足 → 余额变红且按钮不可用；可部署 → `Deploy {total} BNB` | Figma 标注 `2003:1715`（文案中 SOL 为占位） | |
| C-47 | Auto 轮数步进器默认 1 | Figma 标注 `2003:1947` | |
| C-48 | Auto 运行中可停止（退款） | OreProtocol `stopAutomation`；Figma `Stop autominer` | |
| C-49 | Miners 列表显示本轮参与者地址与金额 | Figma `2003:508` | 线上数据源见 api.md |

### Stake

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-50 | 质押资产为 **ORI**（不是 BNB / SOL） | Live；`depositStake`；Live i18n `Stake` | Figma 中 SOL 为占位 |
| C-51 | Deposit / Withdraw 切换、余额、25% / 50% / 100% | Figma；Live | |
| C-52 | Summary：Total deposit（质押 ORI 总量）、APR（基于近 7 日收益估算）、TVL | Live i18n；Figma | Figma "Total deposite" 为拼写错误 |
| C-53 | 质押收益来自协议回购分配，可单独领取（`claimStakeYield`）；取出不收费 | Live About；OreProtocol | 线上 i18n 有 Claim / Claim and deposit / Yield，Figma 未画 |

### Explore / About

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-60 | Explore 展示挖矿、母矿、回购三类记录，分页 | Figma；Live | Live 字段：回合 / 玩家 / 交易量 / 总分配；回购：时间 / 已花费 BNB / 已销毁 |
| C-61 | About 正式正文、规则与链接必须另经产品审定；本轮只批准 Accordion UI/Interaction 子集 | User Confirmed：A1 Human Gate | 当前 Figma 文案是视觉占位；不复制旧 ORI copy，不替换正式 /about |
| C-62 | 历史产品链接：`https://ori.supply`、X `https://x.com/refinORI`、Telegram `https://t.me/refinORI`、白皮书 `https://whitepaper.ori.supply` | Live About | 仅历史证据，新版外部链接保持 OPEN，不自动继承 |
| C-63 | 历史 About 文案称 ORI 最大供应 4,200,000；无预挖、无团队分配 | Live About | 非新版 approved copy；本轮不填入 Accordion |

### 多语言

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-70 | 产品有英文与中文两套文案（`en`、`zh`） | Live（`/locales/{en,zh}/common.json`） | 新版默认语言见 Q-30 |

## Inferred Requirements

| ID | Requirement | Evidence | Notes |
| --- | --- | --- | --- |
| I-01 | 新版 Figma 的 Points 替换线上 "起源" 导航项 | Figma 导航；线上 i18n 已有 `Header.points` 与完整 Points 文案；`/points` 线上 404 | 起源 / 交易挖矿是否在新版中下线，见 Q-01 |
| I-02 | 新版 Mine 只包含方块游戏，不包含 "ORI 游戏"（交易挖矿）标签 | Figma Mine 无该标签 | 见 Q-02 |
| I-10 | 点击 Header 地址打开 Wallet Sheet；Sheet 内复制地址、断开连接 | Figma | `导出` / `接收` 含义见 Q-22 |
| I-11 | Wallet Sheet 点遮罩或 ✕ 关闭；无拖拽关闭 | Figma（无拖拽手柄） | |
| I-20 | 方块可多选、再次点击取消 | Figma；Live（`全选`） | |
| I-21 | Auto 总额 = 每轮金额 × 轮数 | Figma `2003:1832` | Auto "Total per round" 是否乘方块数见 Q-15 |
| I-22 | 已部署金额以绿色显示 | Figma 多数状态稿 | 单态样例为金色，见 Q-18 |
| I-23 | 余额不足 = 总额 > 钱包 BNB 余额 | Figma；Live bundle 余额比较 | 是否预留 gas 见 Q-17 |
| I-24 | 金额快捷按钮为累加 | Figma / Live 文案带 "+" | 数值见 Q-16 |
| I-25 | 部署前需结算上一轮（可能自动处理） | `MustCheckpointPreviousRound`；`batchCheckpoint` 由 bot 调用 | 前端是否需要显式处理见 Q-43 |
| I-30 | Rewards 卡在有可领取奖励时显示 | Figma "有奖金" 稿 | |
| I-31 | Explore 表格在 H5 横向滚动 | Figma 列溢出 | |
| I-40 | 轮次开始与开奖由实时频道推送 | Live（`round.new_round`、`round.reset`） | 见 api.md |

## Unknown

见 [open-questions.md](./open-questions.md)。主要包括：起源与交易挖矿在新版中的去留、Points 规则冲突、金额快捷按钮数值、Logo 与代币图标确认、合约版本与 ABI 来源、RPC、后端 Contract 差异、交易状态 UX、加载 / 空 / 错误状态、Wallet `导出` / `接收`、默认语言。
