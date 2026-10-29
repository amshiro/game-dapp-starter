# ORI 需求

本文件是 ORI 项目需求的 Source of Truth。

- **Confirmed**：区分新版需求与技术/历史事实；新版需求须由用户或当前 Figma 明确表达，旧运行/源码只确认对应技术或历史行为。
- **Inferred**：从状态稿、按钮、数值或代码调用推断。实现可以作为工作假设，但相关行为必须易于修改。
- **Unknown**：没有足够证据。实现被阻塞或必须留空，不得自行补默认值。详见 [open-questions.md](./open-questions.md)。

## 来源优先级

新版需求以用户明确确认 → 当前 `ORI-AI测试` 为准。旧 ORI 源码/UI/线上文案仅提供历史或技术证据，不能自动形成新版 Scope；Figma 未设计且用户未确认时保持 OPEN。只有已确定需要某项能力时才从旧源码恢复 API、ABI、address 等技术事实，详见 [README](./README.md#source-of-truth-优先级)。

Mine限定补充：按用户 → 当前Figma → 已审核docs → Mine Historical Functional Baseline → runtime可行性证据排序，完整范围见 [Mine Reconciliation](./mine-requirements-reconciliation.md)。下方 Live/Source 的秒数、母矿概率、reward比例等仍为 **Historical behavior — not yet adopted**，不能仅因列在表内就按新版规则实现。

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
| C-83 | Wallet 单行余额为当前目标 BSC 链的 native BNB，使用 eth_getBalance(account)，18 decimals | User Confirmed：人工修正设计稿资产名 | Figma ORE 标注错误；不使用示例48.60，不增加多资产；97为测试网原生币 |
| C-84 | Export（Privy 私钥导出）与 Receive（Privy 二维码入口）仅属于 Privy embedded wallet；external wallet 两个按钮都隐藏 | User Confirmed（本次修正覆盖旧 Export inert UI 决策）；Figma `2003:2526–2529` 两入口已复核 | 当前仍 external-only / embedded off，不创建钱包或调用导出/充值接口 |
| C-85 | 当前 external Wallet 保留身份、地址复制、断开及 BNB 余额；不显示 Export / Receive，不引入旧 mining fund | User Confirmed | 若未来启用 embedded，需单独通过身份/资产归属 Gate，不能仅为按钮改模型 |
| C-86 | A1 UI 子集：最多一项展开，打开另一项关闭上一项；无初始默认项证据则全部 collapsed，展开稿仅证明状态视觉 | User Confirmed；Figma 2003:2235 / 2359 无 prototype 起点 | 不预开 Intro；正文/外链已获本轮恢复授权，Q-41/Q-30 生产 Gate 保留；240ms 展开收起、180ms fade、箭头过渡为已验收 Human-approved interaction override |

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
| C-21 | Header：Logo + ORI 价格；未连接 `Connect`；已连接显示缩短地址。PC 全宽、左右 padding 120px，H5 保持现有 inset | Figma；Live；PC 布局 User Confirmed | |
| C-22 | My Wallet 使用 Shared Modal 默认：H5 bottom sheet，PC center；内容面板 PC 400px 居中，backdrop 覆盖整个页面；圆角 16、关闭与 safe-area。当前用户明确决定覆盖旧 PC bottom 工程方案 | User Confirmed；Figma `2003:2487` | 不做 PC redesign，无拖拽关闭 |

### Mine（方块游戏）

线上对应 `/mine` → "ORI 挖矿"。下列旧业务证据仅供已确定的新版能力核对技术，不自动决定保留；Scope 以用户/当前 Figma 为准。

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-30 | 新版保留5×5共25格、BNB多格部署。历史文案“每轮1分钟”不作为当前精确时钟 | Human approved/Figma（board）；Historical Live About（60s） | 合约roundLength以blocks配置；seconds deadline待M9 Gate；全25格可编码不代表新增全选入口 |
| C-31 | Manual 一轮；Auto 多轮且 BNB 预先收取 | Live About；`registerAutomation` payable | |
| C-32 | Human approved：Manual / Auto 输入均为每格金额；Manual 本金=每格金额×格数，Auto 每轮本金=每格金额×格数，多轮本金再×轮数 | Live bundle；`deployManual(mask, amountPerSquare)`；`DifferentAmountPerSquareNotSupported` | Manual 与 Figma `0.42 × 2 = 0.84` 一致；Auto `.02/.06` 漏乘格数的样例不采用；页面本金不含执行费；实际 value=(每轮本金+executorFee)×rounds，余额另需gas；Human approved，当前执行扣费RUNTIME QA PENDING，人工允许Development实现，见M4 Gate |
| C-33 | Human approved：有board selection用fixed位图；无selection用random格数；Blocks是每轮格数，Rounds是资助轮数。active automation替换整个Manual/Auto form，不显示切换/全选/第二次注册 | 当前用户M4规则；Figma1832/1413；[M4 Gate](./mine-auto-transaction-gate.md) | 当前97 fixed位图/random count编码已验证；提交count1–25；rounds产品限制1–9999，非合约maximum；remaining原样使用backend extend_data.round_remaining，缺失留空、不计算/不补—；M4 Core已获本轮实现授权；execution扣费仅待真实QA，不声称VERIFIED |
| C-34 | 一个账户每个实际 operation round 最多成功完成一次 Manual Deploy；第一次可一次选择多个格子并合并为一个 mask。成功后本轮 Manual action 禁用，不开放任何异格追加交易。最新Human Decision为非对称关系：本轮已Manual Deploy不阻塞Auto Register；仅active Auto整体替换Trade Card，禁止Manual/Auto配置入口 | User Confirmed：Mine Manual Requirement Correction；Mine Historical Functional Baseline；链上 participation/squares reads | Contract capability ≠ product behavior；当前 97 runtime 可接受异格追加，不构成产品许可。新一轮使用对应 round/account 的新 reads，不沿用旧轮锁 |
| C-35 | 历史平台费1%；97已读feeBps=100配置；Manual value不额外加1% | Historical Live About；97 Gate；Human approved value公式 | 内部扣费时点/完整分配仍Q-41，不能从配置推导Claim费率或Auto预付公式 |
| C-36 | Historical behavior — not yet adopted： 开奖由链上随机数（Chainlink VRF）决定获胜方块；无人参与或获胜方块无人部署则本轮作废 | Live About；OreProtocol（VRF、`ResetEvent`） | |
| C-37 | Historical behavior — not yet adopted： 未中奖：部署的 BNB 全部损失 | Live About | |
| C-38 | Historical behavior — not yet adopted： 中奖：获得本轮奖池 BNB 的 90%，按获胜方块部署比例分配；产生 1 ORI（50% 给随机一人，50% 按比例） | Live About | |
| C-39 | Motherlode历史文案有每轮+0.2 ORI、1/625概率；旧Game locale又有每3–6轮触发 | Historical behavior — not yet adopted | 当前Figma单卡；treasury.motherlodeOre原始字段存在不证明节奏、双资产或payout；Q-31已确认单卡仅ORI treasury.motherlodeOre（18 decimals）；节奏与payout仍OPEN |
| C-40 | Historical behavior — not yet adopted： 精炼：领取 ORI 挖矿奖励收 10% 精炼费，分配给仍未领取者；精炼池中的 ORI 领取免费 | Live About；`ClaimOre(tax, redistributed)`；`getUserRewards`（`oriDirect`、`oriRefined`） | |
| C-41 | 新版Rewards有三行与Claim / Claim only两个入口；历史为全部领取与仅BNB | Figma1413；Historical claimAll/claimEth ABI与调用 | 人工已确认 ethAmount=BNB、oriDirect=未精炼ORI、oriRefined=已精炼ORI；任一ORI>0显示领取→claimAll；BNB>0显示仅领取BNB→claimEth；全零隐藏整卡。后续人工授权Development97 Claim：recipient=currentAccount，fresh read+simulation，1确认与对应交易/event+相关reads成功；不推算税/时限或最终净到账额；Origin奖励领取已人工排除（OUT OF SCOPE） |
| C-42 | Historical behavior — not yet adopted： 奖励领取有时限 | OreProtocol `ClaimWindowPassed`、`ExpiredRewardsClaimed` | 时限值未知，见 Q-42 |
| C-43 | 区块状态：正常、选中、已部署、已部署 + 选中、自动选中、中奖、未中奖、等待开始；人数 > 1000 缩写 | Figma `2003:1038` 标注 | |
| C-44 | 结果动画：未中奖方块 100%→25% 透明度每块 0.15s 随机依次（3.6s）；获胜方块点亮 0.15s；保持 10s | Figma `2003:1405`–`2003:1408` 标注 | 线上动画未验证 |
| C-45 | 数据卡：Motherlode、剩余时间（等待中显示 Waiting / 等待中…）、总部署、你的部署；点击切换美金值 / 轮次 | Figma 标注 `2003:1037`；Live | |
| C-46 | Manual 按钮状态：未连接 → Connect wallet；未选方块 → Deploy 不可用；余额不足 → 余额变红且按钮不可用；可部署 → `Deploy {total} BNB` | Figma 标注 `2003:1715`（文案中 SOL 为占位） | |
| C-47 | Auto 轮数步进器默认1，输入产品限制1–9999 | Figma标注2003:1947；当前Human Decision | 不是已验证contract maximum |
| C-48 | Human approved：Stop=stopAutomation(currentAccount)，receipt success+1confirmation+matching event+相关reads；确认inactive后恢复form；退款由合约处理 | Figma Stop；当前用户M4规则；当前97虚拟register/stop/refund证据 | 前端不另发退款；confirmed+refresh-failed只retry reads、不resend；不自动赋予同轮Manual提交资格，见[M4 Gate](./mine-auto-transaction-gate.md) |
| C-49 | Miners 列表有 Round、地址与金额行；dataset 未签收 | Figma `2003:508` | 线上数据源见 api.md |

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
| C-61 | 本轮允许正式 /about 完整 UI，从当前旧源码恢复对应正文和链接 | User Confirmed：Complete About + Points UI 限定例外 | 视觉按 Figma 五项；不继承旧布局/额外栏目，不认证文案费率 |
| C-62 | 当前 About 链接：`https://ori.supply`、X `https://x.com/refinORI`、Telegram `https://t.me/refinORI`、白皮书 `https://whitepaper.ori.supply` | 当前源码实际引用；本轮用户授权 | 置于 Figma Links 项；英文白皮书 /en，中文根路径 |
| C-63 | 当前 About 文案称 ORI 最大供应 4,200,000；无预挖、无团队分配 | 当前源码实际引用；本轮用户授权 | 允许作为恢复 copy 展示，不据此改变合约/资产事实 |

### 多语言

| ID | Requirement | Source | Notes |
| --- | --- | --- | --- |
| C-70 | 当前 UI 支持 `en` / `zh-CN`，Header 钱包右侧 32×32 中/EN 切换按钮（13px/400、radius 8、2px border、项目背景色） | User Confirmed | 保留既有 EN 技术默认值；显式偏好写 server-visible cookie，生产默认语言审定仍 Q-30 |

## Inferred Requirements

| ID | Requirement | Evidence | Notes |
| --- | --- | --- | --- |
| I-01 | 新版 Figma 的 Points 替换线上 "起源" 导航项 | Figma 导航；线上 i18n 已有 `Header.points` 与完整 Points 文案；`/points` 线上 404 | 起源 / 交易挖矿是否在新版中下线，见 Q-01 |
| I-02 | 新版 Mine 只包含方块游戏，不包含 "ORI 游戏"（交易挖矿）标签 | Figma Mine 无该标签 | 见 Q-02 |
| I-10 | 点击 Header 地址打开 Wallet Sheet；Sheet 内复制地址、断开连接 | Figma | `导出` / `接收` 含义见 Q-22 |
| I-11 | Wallet Sheet 点遮罩或 ✕ 关闭；无拖拽关闭 | Figma（无拖拽手柄） | |
| I-20 | 方块可多选、再次点击取消 | Figma；Live（`全选`） | |
| I-21 | 原输入含义推断已由 Human approved 取代：输入为每格金额，每轮本金=输入×格数，多轮本金=每轮本金×轮数 | 用户明确确认，覆盖 Figma 未乘格数示例 | 人工已签收含费value与本金分离；Q-15仅保留当前implementation execution扣费路径的技术补证，产品层全部closed；不把本金合计当含费预付 |
| I-22 | 已部署金额以绿色显示 | Figma 多数状态稿 | 单态样例为金色，见 Q-18 |
| I-23 | 余额不足 = 总额 > 钱包 BNB 余额 | Figma；Live bundle 余额比较 | 是否预留 gas 见 Q-17 |
| I-24 | 已由 Human approved 取代：Manual shortcuts +0.5/+1/+2 直接替换每格输入为0.5/1/2 BNB，非累加；count不变，total重算 | 当前 Figma1715 + 用户明确签收 | 断连/错链/已部署可编辑；busy仍禁用；单轮一次提交防线不变，不继承旧快捷数值 |
| I-25 | 原“可能自动结算”推断撤回；Manual 遇 MustCheckpointPreviousRound 仅提示并刷新 | Human approved；错误及 bot batchCheckpoint 是技术证据 | 不自动追加 checkpoint write，Q-43 其他流程另 Gate |
| I-30 | 人工确认：三项raw reward全零隐藏整个Rewards区域；非零行显示；任一ORI>0显示领取，BNB>0显示仅领取BNB，BNB-only不显示全领 | Figma "有奖金" 稿、当前人工签收、historical rewards.tsx | M5读取失败不等于零，Claim写入属于M6 |
| I-31 | Explore 表格在 H5 横向滚动 | Figma 列溢出 | |
| I-40 | 轮次开始与开奖由实时频道推送 | Live（`round.new_round`、`round.reset`） | 见 api.md |

## Unknown

见 [open-questions.md](./open-questions.md)。主要包括：起源与交易挖矿在新版中的去留、Points 规则冲突、Logo 与代币图标确认、合约版本与 ABI 来源、RPC、后端 Contract 差异、交易状态 UX、加载 / 空 / 错误状态、Wallet `导出` / `接收`、默认语言。

### M10 Human-confirmed winners

当前开奖轮中奖者（不等于所有参与者）；/ori/round_winners/round + round_id + optional winner_address；10秒查询。list backend顺序原样保留，仅首行本人用「你」/白色/下虚线，空list整区隐藏。ore_reward>0→ORI数量+；eth_reward→BNB始终显示，两者API8 decimals、最多6位截断。current result round由contract snapshot提供，不+/-1；不从投入字段推奖励。

### Human Confirmed — Origin Rewards excluded

新版ORI不实现「起源奖励领取」。M11 = OUT OF SCOPE（明确排除，不是DEFERRED或等待Human Gate）。不新增起源奖励卡、领取入口/确认流程，不接origin_info作为该功能的数据owner，不实现AssetManager.deposit(..., "claim", ...)的BNB付款/后台发放工作流。现有BNB/ORI Rewards Read/Claim保持已签收规则；本决定不自动关闭起源交易挖矿等其他独立未决范围，也不删除共享Registry/ABI的技术事实。


### Human Confirmed — Mine 数据卡与页面修正

母矿只显示 View.getTreasuryState().motherlodeOre，ORI 18 decimals，不混入起源或推导可领取奖励。我的部署复用当前展示 round/account 的 getMinerRoundInfo.totalDeployed（BNB18），错误/断连不补零。部署两卡用左侧 BNB 图标+右侧数值；移除页面顶部额外轮次/刷新和棋盘上方正常等待提示。初次棋盘加载显示小转圈，读取失败保留错误/重试。投注金额输入不显示边框高亮。所有页面 PC 内容左右无外层 padding，H5 继续14px；秒级deadline策略不由这次UI修改改变。
