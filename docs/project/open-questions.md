# Open Questions

看到这里的问题时**停止猜测**：不要自行选择默认值、合约版本、假 API 或假文案。问题被确认后，把答案写进 `requirements.md`（注明来源）并从这里删除。

优先级：**P0** 阻塞项目壳层或第一批实现；**P1** 阻塞对应 Feature；**P2** 上线前确认。

已解决（不再列出）：Q-21（User Confirmed：H5 bottom / PC center Modal（当前用户修正旧 PC bottom 决定），面板 PC 400px 居中，backdrop 全屏，见 requirements C-22）；Q-13 / Q-44（ORI 没有后端登录 / 会话流程，没有任何接口需要 `BACKEND_APP_SECRET`）；Q-46（`NEXT_PUBLIC_BACKEND_APP_ID` / `BACKEND_APP_SECRET` 保留为 Starter capability，在 ORI 中不启用，人工决策）——Backend owner Confirmed，见 [api.md](./api.md#authentication--signing)。另见 requirements C-01、C-02、C-08、C-09：目标运行时（EVM / BSC）；开发链（BSC Testnet 97）；生产链（BSC Mainnet 56）；Privy Dev App（`cmkw81a5y00onkw0czubpy4hj`）；开发 RPC（BNB Chain 公开测试网 RPC）；Figma SOL / Solana 为占位。HarmonyOS Sans SC 现使用用户提供的本地 Variable WOFF2（由用户 TTF 完整转换）；本仓库接入已授权，许可发布条件审定仍见 Q-05。

R0 逐项结论与来源见 [r0-evidence-audit.md](./r0-evidence-audit.md)。`PARTIALLY CONFIRMED` 仅确认列明的事实，不代表新版产品范围或完整 Feature 已解锁。

## P0

| # | Question | Why it matters | Current evidence | Blocked |
| --- | --- | --- | --- | --- |
| Q-01 | 新版是否下线 "起源" 导航与起源交易挖矿，由 Points 取代？ | 决定导航、路由与是否需要起源 swap / 采矿基金 | PARTIALLY CONFIRMED：当前 Figma 与已审核 shell 导航一致；旧 navbar 的起源指向 `/`，旧首页确有交易/矿池；缺少新版入口不等于批准删除业务 | 起源去留 / Points 范围；不再阻塞已锁定 F9 路由 |
| Q-02 | 新版 Mine 是否去掉 "ORI 游戏"（交易挖矿）标签？ | `oriSwap` 与 6 个 `ori_game` 接口是否还需要 | PARTIALLY CONFIRMED：当前 Mine 只有方块 Manual/Auto；旧 Mine 的 mining/game 分支与 OriTrade 组合仍存在，不能据此决定新版保留 | 新版 trade-to-mine 范围 / G-P |
| Q-03 | Logo：确认使用线上金色 "轨道圆" 标志 + ORI 字标？品牌页 `确认` 中的像素 O 币是否专用于起源代币？ | Header 与代币图标 | PARTIALLY CONFIRMED：当前 Header 使用 `2003:3110` / `2003:3112`；品牌确认区并存多组资产，无最终用途映射，详见 R0 | 最终品牌 / 代币角色；已审核可替换 Header 不受阻 |
| Q-04 | Production Privy App：是否沿用线上 App（`cmi70qts3005hl90c27u5uc75`）？新项目登录方式是否保持仅钱包（Binance / OKX / MetaMask）？Dev / Production App 的 Allowed Origins | 生产 Provider 配置与登录体验 | 开发 App 已确认（C-08）；线上配置已从源码恢复。Dev App 本地 Allowed Origins 已为 `http://localhost:3000`、`http://localhost:5199`（F5.1 验证通过）；Dev App 中仍有旧 `origin-website` Vercel 预览域，是否保留待确认 | 生产 Wallet / Provider |
| Q-05 | 归档当前用户提供字体的官方 Web / Starter 模板再分发许可 | 生产与模板发布的字体授权边界 | 用户授权本仓库接入；本地 HarmonyOS Sans SC 2.040 variable，metadata 有 copyright / fsType=8，但没有内嵌完整 license 文本或 URL；用户现已补回 `LICENSE-update.txt` 并原样保留；不再复制线上字体 | 许可条款审定 / 发布；不阻塞已授权的本地全局接入 |

## P1

| # | Question | Why it matters | Current evidence | Blocked |
| --- | --- | --- | --- | --- |
| Q-10 | 当前部署基线已从 `ori-website` master 恢复、与线上一致，ABI 已原样复制并记录 sha256（F4）。仍未确认：各 UUPS 代理的**链上当前实现**是否与这些 ABI 一致（F4 不读链，F5 后可验证）；是否有合约仓库 / 已验证 ABI 及长期的部署 / 版本发布 owner；`AssetManager.deposit(…, "claim" \| "claim_bnb", …)` 的业务语义；BSC 97 缺少 WBNB 地址（仅影响测试网 BNB 价格查询） | 链上读写的最终正确性与长期维护 | PARTIALLY CONFIRMED：R0 复核五份 ABI 数组与旧 artifact 相等、记录 hash 一致；R0 当时未读链；后续 S1 runtime verification 已确认 97 三合约有 code、ORI decimals=18、View→Protocol→Token linkage 与三条本金 read，见 web3.md；56 未配置 RPC 未验证。M1 另验证 97 Mine 原始读/25 格 amount 与 count、逐格参与者两格及空账户结构；当前/下一轮语义、完整 proxy/ABI version、fee 与 reward accounting 仍未确认，见 [M1](./mine-read-data-gate.md) | 链上读写最终验证、AssetManager 功能 |
| Q-11 | 后端正式 Contract 已提供（`api-reference/`），Development 测试后端可用（F6.1）。仍未确认：Production host；Contract 未列出的 `round`（Mine 当前轮次）与 `swap/*`（起源 swap）由什么接口替代；失败 envelope 与 code 表；与运行时不一致的字段（`chain_asset_config.is_inner` / `price` 类型、`explore` 字段集）；`round_winners/round` 与 `round_started/round` 名称是否对调；`points/user` 在 Development 返回 `error_code 500` | 所有数据视图 | CONTRADICTORY：保留 F6.1 差异；R0 另确认 latest/events 的 max 层级与旧读取不同，旧 Rank 传未列的 winner_address 且读 list；M1 新 runtime 确认 latest flat、started 对象、winners list envelope（空 list）；sample round 1654 start block hash 匹配 97，不能推广全部链契约；log_unique_id 已是不安全 number。当前存储轮已 fulfilled 但 canDeploy=true、下一轮未初始化，UI canonical round/状态映射仍需签收，见 [M1](./mine-read-data-gate.md)；不自动交换 endpoint | Read APIs、canonical round、Production 配置 / G-D |
| Q-47 | Realtime：Development Pusher 路由（`<WS host>/app/<key>`）在 F7 验证中返回 Cloudflare 502（上游不可达，本轮未复测），需要后端启动实时服务；Production WS host 与公开 app key；两个事件的正式 payload schema（是否 `{ data: <JSON string> }` 双层）；轮次内（部署量变化）是否会有推送事件；本机 `NEXT_PUBLIC_REFERRAL_CODE` 中的值是否就是该 Pusher key（已由用户配置到 `NEXT_PUBLIC_PUSHER_APP_KEY`，待服务恢复后验证）。服务恢复后补一次真实 smoke | 实时新鲜度与 polling 间隔 | PARTIALLY CONFIRMED：旧监听解包 eventData.data 并读取 timestamp/winning_square；ABI 与 API 可对照字段，仍无实际 WS 样本。502 是 F7 记录，本轮未复测 | Mine 实时 / schema / Production 配置 / G-R |
| Q-12 | 交易 UX：签名中、已提交、确认中、成功、失败、取消的视觉？成功是否需要等待后端索引？ | 设计无交易状态 | CONTRADICTORY：旧 Manual/Stake 在 receipt 前提示成功，Auto/Rewards 等 wait 后提示；没有统一 backend completion 契约，见 R0 顺序表 | 所有交易 / G-T、G-P、G-V |
| Q-14 | Production RPC：专用 provider / endpoint 与凭据边界（凭据不得进入前端）；生产读取是否部分走后端？ | 旧 QuickNode 凭据已泄露、不得复用 | 开发 RPC 已确认（C-08） | 生产 Web3 读写 |
| Q-15 | Auto当前implementation execution扣费路径技术补证（产品层closed） | Auto预算与运行卡 | M4人工已签每格金额、fixed/random编码、principal-only显示与含费value、active整体换卡、self Stop；当前97 register/getter/stop/refund已模拟，config=10^12，历史执行每次扣fee但implementation关联未证。rounds产品限制1–9999（非contract maximum）；remaining使用backend extend_data.round_remaining原样展示、缺失留空，不估算/不补—；API populated未验证不重开产品Gate，见[M4 Gate](./mine-auto-transaction-gate.md) | M4 Development implementation已人工放行；execution deduction=RUNTIME QA PENDING |
| Q-16 | Manual 快捷值与行为已 Human approved；Stake 百分比既有签收保留 | 表单 | CONFIRMED（Manual）：当前Figma +0.5/+1/+2，直接替换每格BNB输入，非累加；断连/错链/已部署可编辑，count不变/total重算，busy保持原锁。旧0.02/0.05/0.1不继承；不解锁Auto | Manual不再有此blocker，transaction单轮一次不变 |
| Q-17 | 最小 / 最大部署金额、小数位、是否预留 gas、100% 如何计算 | 输入校验 | Human approved：18位 bigint，fresh simulation/余额含gas；97 1wei 可调用不是产品 minimum。未知 min/max 不造限制；不以旧6位取代18位 | 表单校验；未知 cap 不阻塞 Core |
| Q-18 | 已部署金额颜色（绿 / 金）；自动选中半透明变体含义 | 方块视觉 | PARTIALLY CONFIRMED：M1 重读 1078 独立已投注金额金色、823 选中+部署绿色/白边；不同状态不能直接视为同态冲突，完整映射及其他稿差异仍未签收，见 M1 | BlockCell |
| Q-19 | 七稿无全选/清空入口，不继承旧按钮；成功后草稿编辑已 Human approved（选择/取消/多选/金额/总额均可用，仅Deploy禁用）；换轮草稿最终视觉保留仍 OPEN | selection 与链上部署是不同 owner | Manual 单轮一次成功 Deploy 已由用户签收（C-34），不再是开放问题；断连/错链/暂不可提交时允许纯 UI 预选、禁止 submit，其他账户部署不禁选。成功后不得再次提交；真实新轮重新校验且不自动提交旧草稿。尚未签收的视觉细节仍按 Figma/新版规则核对，见 [Manual 计划](./mine-manual-implementation-plan.md) | Mine selection presentation；不改变单次 Deploy 规则 |
| Q-20 | Points 规则：Figma "每 1 USD 下注得 1 积分" vs 线上文案 "每 10 分钟按未中奖用户投入比例分配 1000 积分"？Points 数据接口？是否包含起源池、起源回购记录（线上 Points 文案包含）？ | 两种规则完全不同 | CONTRADICTORY：Figma `2003:2121` 的 1 USD/point 与旧未使用的 Points.subtitle 的 10 分钟/1000 分分配不同；points wrappers 无页面调用，Contract 示例不定义规则 | Points / G-P、G-D |
| Q-22 | Wallet 余额资产 / 数据 owner；未来 embedded 功能 | BNB余额已确认 | User Confirmed：设计稿 ORE 错误；余额为目标 BSC 链 native BNB，Wagmi eth_getBalance(account)、18 decimals。external 隐藏 Export / Receive，embedded off | 余额范围已解决；未来 embedded 模型仍需独立 Gate |
| Q-23 | 旧 Header 来源已确认；新版 ORI 价格在 BSC 97 的数据集、报价单位/时效及多行/缺价策略是什么？ | Header | PARTIALLY CONFIRMED：旧 Header price 来自 getPrice → query/chain_asset_config，以 ORI aux_contract_addr 匹配；不是 origin_info。97 数据集、单位/时效、重复行处理仍未知 | Header price / G-D、G-V |
| Q-24 | Info 图标说明内容（线上 i18n 有 Stake 各项说明） | Tooltip | Live i18n `Stake.*Desc` | InfoHint |
| Q-25 | CLOSED — Human Confirmed：ethAmount→BNB；oriDirect→未精炼ORI；oriRefined→已精炼ORI；三项全零隐藏整区；ORI任一>0显示领取→claimAll；BNB>0显示仅领取BNB→claimEth，BNB-only只有后者 | 映射/入口显隐已确认，不等于授权Claim交易 | 当前人工签收；historical rewards.tsx；97 getUserRewards runtime | M5 read/UI及后续人工授权97 Claim已实现；self recipient与相关reads完成已签收；真实Claim QA PENDING，56独立 |
| Q-26 | Stake 是否需要线上的 Account / Yield / Claim / Claim and deposit？ | Figma 只画了表单与 Summary | PARTIALLY CONFIRMED：旧 Stake 实际有 Account/Yield/Claim，调用 claimStakeYield；claimAndDeposit 仅见 locale，无页面动作绑定或对应原子 ABI 方法 | Stake 扩展 Scope / G-P、G-T |
| Q-27 | Explore 新版是否保留线上的多标签统计（ORI / ORI 游戏 / 起源挖矿 / 起源游戏）与两张回购表？ | Figma 简化为 4 卡 + 3 表 | PARTIALLY CONFIRMED：现稿四卡/三表；旧 Explore 四分支，两类回购 table/type 尚不能映射到新版单表；F6.1 缺 circulating_supply | Explore scope / G-P、G-D |

## P2

| # | Question | Why it matters | Current evidence | Blocked |
| --- | --- | --- | --- | --- |
| Q-30 | Production 默认语言与正式业务正文的双语审定 | 发布文案策略 | 用户本轮已授权当前 UI 中/EN 切换：en / zh-CN、cookie 偏好、保留现有 EN 技术默认；不自动批准 About 正文、费率或历史翻译 | Production 默认与正式业务文案；不阻塞当前 UI 切换 |
| Q-31 | 母矿卡显示 `ORI + 起源` 双资产还是只显示 ORI？ | 数据卡 | Live 显示双资产；Figma 单值 | 数据卡 |
| Q-32 | 页脚是否显示 | Frame 外文本 | Figma | App Shell |
| Q-33（Resolved） | 用户确认 Mine 使用 `/mine`，`/` 跳转到 `/mine`；其余为 `/points`、`/stake`、`/explore`、`/about` | F9 shell URL | User Confirmed；起源后续入口仍见 Q-01 | — |
| Q-34 | Production domain（是否仍为 `ori.supply`）与各环境 | 部署、Privy Origins | Live | 部署 |
| Q-35 | 地区限制（旧项目限制 CN）是否保留？在 Cloudflare 上如何实现？ | 合规 | Legacy middleware | 部署 |
| Q-36（工程范围已处理） | 结果动画prefers-reduced-motion | 可访问性 | Fast Mode明确由AI负责accessibility；M9直接呈现静态结果、清理后台timer，不改变winner/交易资格 | 非产品blocker |
| Q-41 | 费率口径：About 的 1% 平台费、90% 奖池、6% / 10% / 4% 回购表述，与合约 `feeBps`、`vaultBps`、`claimFeeBps` 的对应关系；展示文案以哪个为准 | 文案与合约一致性 | CONTRADICTORY：旧 About 实际引用 en/zh 的 1%、90%、6%/10%/4% 与 50/10/40 文案；6+4=10 不能独自解释分母/扣费与再分配，Figma 仍有占位文案 | About 正式正文 / 费率口径 / G-P、G-D |
| Q-42 | 奖励领取时限是多久？UI 是否提示即将过期？ | `ClaimWindowPassed` | OreProtocol | Rewards |
| Q-43 | 上一轮结算（checkpoint）由 bot 完成，还是前端需要在部署前触发？ | `MustCheckpointPreviousRound` | OreProtocol | Deploy |
| Q-45 | 新版 ORI 是否需要 IPFS 上传（`IPFS_JWT`）？ | 已确认为真实 Secret；**ori.supply 无上传在用（F6）**：`utils/ipfs.ts`、`utils/pinata.ts` 无任何 import，其余仅为公开 gateway 图片读取 | `ori-website` 源码 | IPFS 上传边界 |

## 安全（需要人工处理，非开发问题）

| # | Item |
| --- | --- |
| S-01 | 轮换 `origin-website` 已提交 `.env` 中的全部 secret，并决定是否重写历史 / 设为私有 |
| S-02 | 将 `origin-website` 历史中出现过的私钥视为泄露 |
| S-03 | 轮换 QuickNode BSC 主网 / 测试网 RPC token（出现在 `origin-website`、`ori-website` 源码与线上 bundle） |
| S-04 | 轮换曾写在 `api-reference/user-api.md` 中的后台管理系统凭据（已从文档移除，backend / admin owner 负责） |
| S-05 | Backend currently exposes internal stack traces for some error paths; backend owner should disable detailed exception output outside controlled debugging |
| S-06 | 轮换曾在对话中暴露的 `BACKEND_APP_SECRET` 值（属于其他带登录能力的项目，由该项目 backend / admin owner 负责；ORI 不使用，仓库不存储任何值） |

## Stake 97 Transaction Slice 1 人工签收（不关闭其他范围）

- Q-10：Approve 与 Withdraw 正向 simulation、Deposit 的 `ERC20InsufficientAllowance(P,0,1)` runtime path 已由人工接受为当前 97 实现依据，不再要求额外寻找公开成功 Deposit。完整 implementation/artifact 一致性与 Production 56 仍未验证；Deposit 正向交易待用户实际验收。
- Q-12：Stake 97 限定策略已确认：exact approval to Registry Protocol proxy；withdraw recipient=self；1 confirmation + receipt success + 相关个人 reads 重读成功。refresh failure 保留 chain confirmed，只 retry reads、不重发；Mine Manual/Auto按已签收票据执行，后续人工另批准Mine Rewards97 currentAccount领取、1确认+交易/event+相关reads完成，真实Claim QA PENDING；生产范围继续OPEN。
- Q-16：当前 Stake Figma 的 25% / 50% / 100% 按钮保留，100%=Max，bigint helper 同时支持 75%；不修改 Mine 金额规则。Claim / reward semantics 继续 BLOCKED。
- Stake Tx implementation 已完成。用户确认测试账户 ORI 为 0，Real Tx QA = **DEFERRED — TEST ORI REQUIRED**；允许 implementation checkpoint，不阻塞当前 Development 主线。实现与人工真实交易验收边界见 [Stake Transaction Slice 1](./stake-transaction-slice-1.md)。以上签收不声称真实 Approve / Deposit / Withdraw 已通过，Production 56 / Claim Gate 不变。

## About + Points UI 本轮限定授权（不关闭生产问题）

- Q-20 / Q-01 / Q-11：仍阻塞真实 Points 规则与接口。当前 /points 按用户批准的 Figma static demo 完整呈现；旧源码的 PointsRewards 是起源奖励，OriPointsTable 是游戏记录，不映射成新版积分。未调用 points wrappers。
- Q-41：当前 About 对应文案由用户明确授权从实际挂载源码恢复。Staking 的 6% 与 Tokenomics 的 10%/50/10/40 等历史口径原样保留；不据此推导合约、交易或修改既有 read owner。
- Q-30：沿用 en / zh-CN 和当前语言切换。恢复的双语 copy 可用于本工程演示，生产发布语言和费率真实性不因此被认证。
- 当前 UI 不等待这些生产 Gate；来源与 frame/state 覆盖见 [inventory](./about-points-ui-inventory.md)。

## Mine reconciliation — 2026-10-29：不扩大已签收范围

见 [正式需求对齐](./mine-requirements-reconciliation.md)。固定优先级：用户产品规则 → 当前 Figma → 已审核 docs → Mine Historical Functional Baseline → runtime 可行性。

- Manual 一轮一次成功、首笔多格、18位、value/mask、operationRound 和 receipt/event/refresh 已 Human approved；限定 Core 可开始下一阶段，但本轮不实现。Q-16 Manual shortcuts已签收当前Figma值与替换行为、无新全选，不让后续奖励/名单阻塞 Core。
- Auto当前人工规则与技术补证以[M4 Gate](./mine-auto-transaction-gate.md)为准；输入、fixed/random、fees/value显示策略与self Stop已签收，不继续标OPEN。1–9999产品输入限制与backend remaining直出/缺失留空已签；仅当前implementation execution实际扣费技术证据保留；不新增Auto implementation授权。
- Lifecycle/countdown：Figma 需要时间/Waiting/结果 UI；block 配置不是精确60秒，latest.timestamp+60 和历史 enum 不自动采用。候选 UI state 不是协议枚举。
- Motherlode：ORI treasury 字段仅证明原始读；Origin 双资产、3–6轮与其他旧文案节奏均 Historical behavior — not yet adopted，payout OPEN。Q-25 的资产/label/方法入口与全零显隐已人工CLOSED；Q-42窗口时长仍未知，不推算净额/到期；后续人工已批准97 Claim/currentAccount与receipt+相关reads完成策略，真实Claim QA PENDING，不阻塞Development主线。
- Miners/M10 Human Confirmed：当前开奖轮winners、/round_winners/round、round_id/viewer、10秒、后端顺序、只首行You+白字虚线、ore_reward/eth_reward 8位/截断6位、空整区隐藏均CLOSED。nonempty runtime QA PENDING；正式reference错位仍Q-11，不重开产品Gate。Origin为M11 FUTURE GATE。
- Q-11：本轮六个历史只读端点 HTTP200，/ori/round 也可达；空 winners / null automation 不证明非空契约，large IDs、单位与 endpoint 命名冲突保留。Q-47 本轮未重测，旧502/真实 payload unknown 保留。
- M7/M8 后置；交易前 fresh reads/simulation、receipt 后局部 refetch 属 Manual correctness，不等待持续 polling/realtime。

## M4 Auto Transaction Gate — 2026-10-29

当前P.getAutomation七字段与View六字段已验证，ABI中的automations(address)却直接revert（code3、空revert data），Q-10仅关闭已列路径，不认证整份ABI/implementation。Q-11 automation/user三个HTTP200/null样本仍为PARTIAL — populated contract unverified。Q-12 Auto沿用receipt+1confirmation+matching AutomationUpdated+原账户相关reads，confirmed+refresh-failed只retry reads、不resend；注册成功不等于bot已下注。当前版本execution的RoundNotLive与历史版本存储missing trie node是最小技术补证边界；不升级为生产验收。

M4 Human Decisions现已全部CLOSED：rounds输入1–9999只是前端产品限制；剩余回合原样展示POST /ori/automation/user的extend_data.round_remaining，backend负责计算，字段缺失留空，不补—、不从链上balance/fee计算。HUMAN DECISIONS REQUIRED=NONE。当前定点复核block139572425，同一implementation执行仍RoundNotLive、虚拟balance未变；runtime path technically unresolved已人工接受为Development非阻塞项，execution实际扣费待真实QA，见[M4 Gate](./mine-auto-transaction-gate.md)。

## M9 countdown — Human confirmed

正式页面继续Waiting / —，等待backend deadline；不展示剩余区块或估算秒数。该显示选择CLOSED，不因当前缺真实live-round样本重新开Product Gate。M9 live result transition=RUNTIME QA PENDING，工程动画/去重/cleanup/reduced-motion由Agent自主完成，见[记录](./mine-result-implementation.md)。

- M7/M8最新限定实现：已有Query的有界freshness与F7 signal-only adapter已完成；不读取任何payload字段。Q-47真实订阅/payload/resync仍RUNTIME QA PENDING；不能因开发工具WebSocket有frame而认定Pusher业务可用。M11起源最新人工确认继续后置（DEFERRED — FUTURE GATE），不纳入当前Mine主线；不是等待本轮Scope决定，也不阻塞已完成模块。
