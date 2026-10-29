# Mine Requirement Reconciliation

> 后续状态：用户已另行授权 M3 Manual Core 实现，现已接线并通过用户最终人工验收（Chain97真实Manual Deploy PASS），见 [实现记录](./mine-manual-implementation-plan.md)。本文以下“本轮不实现/暂停草稿”保留为 reconciliation 阶段历史，不代表当前仍未实现。

## 1. 结论、来源与范围

**MINE REQUIREMENTS RECONCILED — MANUAL READY**，仅表示限定 Development 97 Manual Core 的需求足够开工，不表示实现、真实交易或完整 Mine 数据已验收。本轮不改业务代码、不签名、不发交易、不开始 Auto/Rewards。

来源优先级固定为：用户明确确认 → 当前 ORI-AI测试 Figma → 已审核 repository requirements/docs → Mine Historical Functional Baseline → Chain 97 runtime/ABI 技术可行性。**Runtime capability != product requirement**。历史稿/源码不能覆盖当前人工 single-deploy 规则或新版视觉。

- Human approved：每账户每个实际 operation round 最多一次成功 Manual Deploy；首次可多选格子；断连/错链/temporarily non-deployable 可预选但不能提交；其他人的公共部署不禁选本人首次投注。
- Human approved：ABI 不传 roundId，以 matching receipt DeployEvent 确定实际 operationRound；不预测 storedRound+1。1 confirmation + successful receipt + matching event + reads refresh 才算业务成功；验证/刷新失败只 retry reads/verification，不 resend。
- 已审核交付：正式 `/mine` 的 Full Mine read-only UI、四卡结构和 25-cell 97 公共读取。Motherlode、个人部署、USD、countdown、Miners rows 尚未完整接真实数据；不能把结构完成写成这些数据已完成。
- 当前工作区有暂停的 Manual account-query / transaction 草稿，未接入正式 route。它们不是已完成/已验收实现；本轮保留代码原状。
- Stake Real Tx QA = **DEFERRED — TEST ORI REQUIRED**，不阻塞 Mine 主线。Production 56、奖励与实时服务各自保留 Gate。

### Evidence index

- 当前 Figma：file `M6P7gqrEDANm28YSfvOm93` / page `2003:178`。本轮完整重读下述七个 frame 的 design context 与 screenshot；不是只读主 frame。
- 当前源码：`src/features/mine/read/mine-read-query.ts`、`model/mine-presentation.ts`、`components/mine-metrics.tsx`；Contract Registry 与 Protocol/View ABI；[M1 原始证据](./mine-read-data-gate.md)、[Manual 计划](./mine-manual-implementation-plan.md)。
- Historical Functional Baseline：当前 `ori-website` 源文件（HEAD 参考 `adcc99b`）：`pages/mine/index.tsx`；`components/trade.tsx`、`auto.tsx`、`matrix.tsx`、`overview.tsx`、`rank.tsx`、`rewards.tsx`、`points.tsx`、`OriginClaimCard.tsx`；`providers/balanceProvider.tsx`、`service/api.js`、`public/locales/en/common.json`。旧项目未修改。
- 本轮六个 Development 只读 API smoke 见第 10 节；没有新增合约 write/simulation 或 WS 验证。下述 Chain 97 simulation 为前次 Gate 已取得的证据，不冒充本轮真实交易。

## 2. Mine Figma State Inventory

这些都是同一个 `/mine` 的局部/整页状态，不是七个 route。

| Frame | 页面区块 / visible state | 与其他稿差异 | Interaction implication | Demo / 能证明的产品规则 |
| --- | --- | --- | --- | --- |
| 1 `2003:182` | Header、四卡、25 格、Manual/Auto、Manual 初始、Miners、Bottom Nav | 全页基准；0 selected、Total 0、Deploy 灰色 | 页面顺序与 mode switch；Miners 有 Round、地址/单或双资产金额 | 数字/地址为 demo；证明模块存在，不能证明 row owner、奖励单位或初始链状态 |
| 2 `2003:629` | connected Header、本人金额、selected/combined、Manual 可投注 | #8/#14 等个人金额/白边；0.42×2=0.84 示例；截稿未重复 Miners | 证明组合视觉、多格 total；不能以该图允许同轮第二次提交 | demo；不证明同轮追加、成功后可点击/再次 submit；Human approved single-deploy 覆盖所有视觉推断 |
| 3 `2003:1009` | 四卡 alternate state，注释 `2003:1037` | Motherlode/Total/You 的美元 secondary，Time 的 Round secondary | 点击数据卡切换美元值/轮次；无需桌面 hover redesign | 金额/轮次为 demo；不定义报价 owner，也不证明四卡必须同时切换 |
| 4a `2003:1038` | 单格 default、>1000 count、selected、deployed、combined、Auto selected/muted、winning/lost、Waiting；结果动画注释 | cells `1039–1133`；Waiting `1409`；结果图 `1152`；动画 `1405–1408` | Figma 规定静态 variants 与 0.15s、3.6s、10s 视觉时序；非协议计时 | 证明视觉，不证明 enum mapping、selection 提交许可或 round 必须等待动画完成 |
| 4b `2003:1413` | board + Autominer `1667` + Rewards `1682–1714` | active Auto 替换下注表单；Random×25、Round remaining、Total per round、Stop autominer；三行 rewards 与两按钮 | 证明真实 Auto 的配置后运行/停止 UI Scope；reward 行/按钮存在 | active/reward数值为demo；后续人工明确ORE/BURY对应BNB/未精炼ORI/已精炼ORI（Q-25 CLOSED），不是起源 |
| 5 `2003:1715` | Manual 四态 `1716/1745/1776/1804` | 未登录、未选、余额不足红色、可投注白色；Blocks/Total、input、shortcuts | Connect wallet；未选/不足禁止 Deploy；可投注显示 Deploy total | `0.42`、`2.3056` 等为 demo；不定义 min/max、gas 规则或旧 quick amounts |
| 6 `2003:1832` | Auto 未选/rounds=1 与已选/rounds=3 | Blocks 数量、Rounds stepper、selected list、Total per round/Total；4 cells、input .02、显示 .02/.06 | fixed selection 与 rounds config 存在；结合 4b/历史支持 random 模式，但具体切换入口待确认 | **Human approved override**：输入是每格金额，原稿漏乘4；应为每轮本金 .08、3轮本金 .24 BNB。费用/最终 payable 另 Gate |

补充：七稿没有独立 select-all/clear-all 控件、旧 mining/game 顶部双分支或独立 Origin reward workflow。不得用旧页面的存在补入新版入口。原 [Page State Inventory](./mine-page-state-inventory.md) 的 M2 交付证据保留，本表补充功能含义。

## 3. Manual reconciliation

**Human approved — 输入金额统一语义**：Manual 与 Auto 的输入框均为 `amountPerSquare`（每格金额），不是每轮总预算。Manual 本金=输入×格数；Auto 每轮本金同样计算，多轮本金再×轮数。执行费、交易 gas 与本金分别处理；该决定没有签收 Auto 的最终含费预付公式。

| Historical item / 新版需求 | Decision | 新版正式边界 |
| --- | --- | --- |
| 5×5、多格同金额、mask、Total | KEEP | 首次 Deploy 前 select/deselect/multi-select；UI #1–#25→index 0–24；value=amountPerSquare×selectedCount，不追加 1% |
| 每账户每轮只能一次 Manual | KEEP — Human approved | 首笔成功锁住该实际 operation round 的所有后续 Manual submit，即使不同格 simulation 可成功。由当前 account/round 链上 reads 判断，不强依赖 user.total_amount API |
| 最多 6 位小数 | DROP | `trade.tsx:420` 正则实际为 6 位（旁边注释“8位”不准确）。Human approved 新输入最多 18 decimals、bigint；6 位展示截取可保留 exact，不作为交易输入限制 |
| 旧 `+0.02/+0.05/+0.1` | FIGMA OVERRIDES | 当前稿画 `+0.5/+1/+2`；**历史 handler 实际是替换输入，不是累加**（trade.tsx:65–72）。后续Human approved：+0.5/+1/+2分别直接替换每格BNB输入为0.5/1/2，非累加；Manual已启用本地draft操作，旧值不采用，原Core disabled裁决废弃 |
| select all / clear all | DROP（当前可见入口） | 历史 Matrix 有控件，当前七稿未见，不新增 UI。25 位 mask 仍可表达多选/全 25 格，但不能因此造按钮 |
| button wording | FIGMA OVERRIDES | Manual 四态用 Connect wallet / disabled Deploy / Insufficient BNB / Deploy total BNB；SOL 是已确认占位，不继承旧 waiting/action wording 或旧 PC 样式 |
| native balance display | KEEP | tBNB/BNB18；当前 Wagmi owner，错误/错链/未连接为 unavailable；gas 也是 tBNB，不能只检查 principal 后宣称足够 |
| Manual/Auto mode switching | KEEP | 同页切换，Auto 未解锁前仍为已审核展示态，不开启 automation 或把 Manual 的成功规则直接套为 Auto 轮次执行器 |
| 断连/错链/暂不可部署预选 | KEEP — Human approved | 纯 UI draft，无写入；submit disabled；账户/相关 round identity 变化使旧草稿失效，不能自动发送 |
| 成功后的 selection 点击 / 新轮视觉保留 | Human approved（编辑）；OPEN（换轮视觉细节） | 已部署后继续允许选择/取消/多选、每格金额输入、计数/total计算，保留链上 deployed visual。仅最终 action disabled，文案“本轮已部署”，无额外同类提示；新轮资格归新 account Query，不做本地 reset 解锁 |

`hasDeployedThisRound` 的 confirmed 数据按 chain+Protocol/View+round+account 隔离：hasParticipation、totalDeployed>0、mask!=0 的本人 evidence；未知不当 false。新相关 round 的读取不沿用旧轮锁。已 fulfilled 的 stored round 与将由合约决定的 deployment round 分开，不构造 next round id。

Manual Core 开工边界：一次多格、手动 decimal input、single-deploy flag、fresh preflight/gas/simulation、receipt event + refresh；Manual shortcuts已由后续人工批准按当前Figma值替换输入，不加入全选入口，不接开奖/收益/名单/精准倒计时。该边界不是完整 M3 已实现，仍需完整自动/browser/人工 testnet QA。

## 4. Auto Scope（只规划）

Figma Auto **代表真实自动挖矿功能 Scope**，不只是永久静态展示：配置页、active card、Stop 均有设计，历史前端有 register/stop 调用。但 Scope 存在不等于允许立即实现资金公式。

| 能力 | Figma + baseline + ABI 对照 | 结论 |
| --- | --- | --- |
| 注册 / 停止 | 6 Deploy；4b Stop；payable register / stop(to) | M4 Human approved：stop recipient=self，receipt/event/read完成；当前97虚拟register/duplicate/stop/refund已验证；不代表真实Auto TX或bot验收 |
| Blocks | 6 的 Blocks 数量/selected list；4b Random×25 | 是 cell 数量/选择集合，不是区块高度或回合长度 |
| fixed / random | 历史selected位图/无selected随机count；4b Random、6固定列表 | M4 Human approved：有selected用fixed mask，无selected用random count；当前97 register编码验证通过，不再OPEN；不是本轮实现授权 |
| Rounds | 6 stepper 1/3；历史 roundsToFund | 计划资助/运行轮数；不是 roundId。UI default1；当前人工确认1–9999为前端产品限制，不描述为已验证contract maximum |
| active presentation | 4b Autominer替换Trade；历史backend id换卡 | M4 Human approved：active=true整体替换Manual/Auto form，无tabs/全选/二次register；当前97 P.getAutomation为owner，不能用backend id或balance>0替代active |
| active 可否修改 | active 稿只显示摘要/Stop；历史替换后不再有 Trade config | KEEP 不提供运行中原地编辑；最新Human Decision：active时整个Trade不可见；Stop刷新inactive后恢复Trade，Manual仍由独立单轮一次资格判断；已Manual部署不阻塞Auto注册 |
| per-round total / total prepaid | 历史提交 `(perSquare×cells + executorFee)×rounds`；旧 UI total 又漏 fee；Figma 4 cells/.02/3 rounds 显示 .02/.06 | M4 Human approved：页面每轮/总计/按钮只显示本金，4格/.02/3轮=.08/.24 BNB；实际value=(perSquare×cells+executorFee)×rounds，余额加gas。当前exact/±1均接受；当前版本执行扣款补证仍PARTIAL，不把已签产品公式继续标OPEN |
| executorFee / botFee | P.config index8；P.getAutomation七字段/View六字段 | 当前97 config=10^12 wei，register覆盖botFee为该值，六字段投影匹配；历史execution每次额外扣fee证据与当前implementation关联未证；remaining显示已人工锁定backend extend_data.round_remaining原样展示、缺失留空 |
| prepaid BNB | Figma Total/按钮；历史payable预存 | 人工已签本金与含fee value分离、gas能力、退款属合约；remaining由backend字段直出、缺失留空；仅current implementation execution扣费补证仍是技术Gate |

M4 Gate的当前证据与人工决定见[Auto Transaction Gate](./mine-auto-transaction-gate.md)。canonical account owner已确认Protocol `getAutomation(account)`，config为新注册fee来源；backend仅enrichment，三个null样本不能证明非空contract。链上无remainingRounds直接字段；当前人工锁定Running Card使用POST /ori/automation/user的extend_data.round_remaining原样显示、缺失留空，禁止balance/fee预算估算。rounds输入1–9999是产品限制；10000预算被接受不改变该限制。产品层全部closed；人工已批准M4 Development实现；execution实际扣费=RUNTIME QA PENDING（待真实QA），不再BLOCK implementation，不影响M3已完成状态。

## 5. Round lifecycle 与 countdown

候选 UI 模型（**engineering candidate，不是已批准 enum mapping**）：`waiting → live → resolving → revealed → next-round`，并允许 `unavailable`。真实 round eligibility 与 UI presentation 分为两个轴：revealed stored round 可以同时 canDeploy=true，不能强行塞进单一线性 enum。

| UI candidate | Contract raw evidence | Backend historical event | 仍需确认 |
| --- | --- | --- | --- |
| waiting | current round 未初始化或数据不完整；live/canDeploy 单独保留 | latest/events 或恢复时重读 | 初始/轮间/服务不可用不能混为一种协议状态 |
| live | canonical round start/endBlock、最新 canDeploy + transaction simulation | round.new_round / round.data.started 是刷新信号 | enum→状态、deployable round 的显示名称、起止边界 |
| resolving | endBlock/请求随机数、randomnessRequested/fulfilled | 旧 drawing + round.reset 接收前后 | reset/VRF/keeper 的真实状态映射，不能自行调用 reset 或指定随机数 |
| revealed | 实际 round.randomnessFulfilled、winningSquare；事件 identity 经校验后重读 | round.reset / round.data.reset | 展示哪个已结算 round、未中奖/淘汰动画与新轮交接 |
| next-round | 新 canonical round 实际出现/合约执行时决定 | started 触发重读 | 不 storedRound+1，不用动画计时器创建 round |

历史 enum=1/3/4 的前端判断、`latest/reset id + 1` 不采用。当前 97 evidence 中 stored1654 fulfilled、gameState=1、blocksRemaining=0、canDeploy=true；前次虚拟 deploy 的 RoundStarted/DeployEvent 才给出1655。这证明“存储轮 != 一定部署轮”，不批准任何通用 enum 命名或真实新轮已开始。

Countdown classification：

| 项 | 决定 |
| --- | --- |
| Required UI | CONFIRMED：1/2 的 Time remaining / 00:48、3 的 Round alternate、4a Waiting。应做真实可驱动的 countdown，不使用固定示例 |
| Current owner | 当前没有已签收的 seconds-deadline owner；链上 adapter 只确认 start/end/intermission **block height**，不能把 block number 当 Unix time |
| Historical owner | Overview 的 `eventInfoData.timestamp + 60 - local clock`（data.timestamp）；common.timestamp 是 envelope 元数据，不是轮次开始。每秒 UI tick 不是每秒请求 API 的授权 |
| Backend availability | 本轮 latest/events HTTP200，有 data.timestamp，但不证明它绑定当前可部署 round、deadline恒为60s或抗本地时钟偏移；Contract/runtime shape 冲突仍在 |
| Fallback possibility | startBlock 的真实 block timestamp + 经确认的 duration，或明确标注的 block-based estimate；都需字段/时钟/产品策略签收。暂可沿用已审核 Waiting/—，不能以本地60秒归零决定可否交易 |
| OPEN blocker | 当前部署 duration 的 seconds 契约、server/chain time offset、旧轮/延迟响应绑定、结束/VRF阶段切换；仅阻塞 M9，不阻塞 fresh simulation 驱动的 Manual Core |

历史 60 sec、开奖展示约3.6s + 下一轮前5s，不成为新协议时钟。当前链配置 roundLength=134/intermission=20 是 blocks；历史样本134 blocks约60s不是未来保证。Figma动画为24×0.15s淘汰、最后获胜0.15s、保持10s；与旧5s不同，视觉按 Figma，但不得延长/阻止实际新轮或把动画当开奖。恢复/乱序/跳过动画/reduced-motion 另属 M9 验收。

## 6. 正式 Board Model 与四卡

一个 Mine adapter 将 contract/raw API 边界整理为 typed display model，UI 不同时直接消费 contract DTO + old API DTO + local store。server/chain facts 由 Query 持有，selection/动画/卡片 alternate 为 Feature-local UI state，不建 round/wallet Zustand。

| Board field | Owner / raw type / unit | 状态 |
| --- | --- | --- |
| identity | chain + Protocol/View deployment + 实际 stored/operation round；uint64 bigint/string | 97 已确认；stored 与 operationRound 明确区分 |
| cell number | index 0–24，UI #index+1 | static config；25 项一致性验证 |
| global miner count | round.minersPerSquare[index] bigint | 已有97公共读取；是每格 participation count，不能求和称 unique miners |
| global deployed amount | round.deployedPerSquare[index] bigint，BNB18 | 已有97公共读取；不是本人的投入 |
| own deployed amount / mask | getMinerRoundInfo / getMinerSquares(round,account)，BNB18/raw mask | 已有 ABI/空与非零 read、前次虚拟部署后读取证据；正式 account owner 未完成/未接线 |
| local selected | local draft index set → bigint mask | Human approved；与本人链上部署状态分离，不因公共投入禁用 |
| current-user deployed | 本 round/account 的 participation/principal/mask evidence | Human approved once-per-round；任意本人已部署即禁用第二次 action，不仅判断所选格重叠 |
| selected / deployed / combined | adapter 明确声明 global/own/draft 各事实；combined 可为公共已有部署+local selected | 视觉具备；combined 不提供第二次提交许可，不拿 draft amount 假装链上 own amount |
| winning / eliminated | verified fulfilled round + winningSquare；淘汰顺序仅本地 presentation | 技术字段可读，M9 映射/时序未签收；不能随机生成真实 winner/count |
| waiting / result | lifecycle presentation + 所属 round identity | 候选模型待 M9；不覆盖 protocol canDeploy 或资金状态 |

历史 Matrix 的 `/ori/round` 用于 global/user.bit_statistics、Overview total/user amount；当前 public counts/amounts 与 personal principal 已有链上来源。旧 Matrix 每秒随机增加 cellCounts 的代码属于 **DROP** 的伪造展示，不得移植。

四卡当前 Figma 与历史四类概念一致，但旧 ORI+Origin 双母矿/PC hover 不进入新版：

| Card / label | Value owner | Optional secondary / alternate | 无 owner 时 |
| --- | --- | --- | --- |
| Motherlode | User Confirmed：单卡只显示 treasury.motherlodeOre，ORI18 | 与已确认资产一致的 USD quote；不是把 ORI+Origin直接相加 | —；不导入旧双资产行 |
| Time remaining | M9 future canonical lifecycle/deadline | Round #，绑定同一被展示 round；当前仅 stored round 技术标签 | Waiting / —，不假60s |
| Total deployed | 现有 public round totalDeployed，BNB18 | USD 必须 price owner+链/资产/时效；不能从交易额推币价 | — 或明确 read error |
| You deployed | 对应展示 round/account 的 miner principal | 同资产 USD quote；disconnect为 unavailable，不残留旧账户 | 当前已接入account info owner；缺失/错误为 — |

Figma `2003:1037` 是“点击数据块切换展示美金价值、当前轮次”，不证明四卡联动。当前组件每卡独立 alternate state 与此相容；不新增全局 toggle state。美元值本轮仍无已签收报价数据，不将示例美元数作为 runtime。

## 7. Motherlode

| 项 | Classification | 边界 |
| --- | --- | --- |
| ORI motherlode | User Confirmed；Q-31 CLOSED | 单卡显示 Registry/View treasury.motherlodeOre，ORI97 decimals18；不等于个人可领取余额，不推导 payout |
| Origin motherlode | HISTORICAL ONLY | 旧 origin_info.global.mother_lodes / Overview 双母矿，当前 Figma 一张单值卡，不增加第二资产或将两资产直接求和 |
| every 3–6 rounds trigger | HISTORICAL ONLY | 当前旧 locale Game.rule5/rule8 有此说法；没有当前部署规则证明，不写成未来 cadence/倒计时 |
| payout / recipient / timing | OPEN | round.motherlodePayout、motherlode flag 是技术候选，实际收益分配、触发概率与领取路径未签收；不借此开启 Claim |

## 8. Rewards Scope（M5 read/UI已实现；M6写入独立）

| 行 / 动作 | Figma | 历史与技术候选 | 新版决定 |
| --- | --- | --- | --- |
| BNB reward | 4b 首行 ORE、token icon | getUserRewards.ethAmount；旧 Rewards 显示 BNB | Human Confirmed：ethAmount→BNB；raw>0显示此行和仅领取BNB→claimEth入口 |
| unrefined ORI | Unrefined BURY 占位 | oriDirect；旧文案称未精炼；整数不自动等于立即可提现 amount | Human Confirmed：oriDirect→未精炼ORI；raw>0显示此行及领取→claimAll入口；税/时限仍M6 |
| refined ORI | Refined BURY 占位 | oriRefined；旧使用 formatUnits18 | Human Confirmed：oriRefined→已精炼ORI；raw>0显示此行及领取→claimAll入口；不是Origin |
| claim all | Claim 按钮 | P.claimAll(to)；旧 Rewards 真有调用 | Human Confirmed：任一ORI>0显示领取→claimAll；后续人工已批准并实现97 self-recipient Claim，fresh simulation+receipt+相关reads完成；不承诺每次Deploy即有奖励 |
| claim BNB only | Claim only ORE 按钮 | P.claimEth(to)；旧 BNB-only | Human Confirmed：BNB>0显示仅领取BNB→claimEth；BNB-only仅此入口。后续人工已批准recipient=currentAccount、1确认及相关reads成功；不做fee/净额推导，真实Claim QA PENDING |
| Origin Rewards | 无可识别的独立 backend+AssetManager 新版流程 | origin_info + OriginClaimCard 的 AssetManager.deposit(orderId,'claim',...,nativeAmount)，混合链下分配与链上付款 | **OUT OF SCOPE / M11 — Human Confirmed**：新版不做起源奖励领取；历史路径仅证据，不合并至ORI claimAll，不新增卡片/付款/后台发放流程 |

人工确认三项raw全零时整区隐藏；读取失败不当作零。Development97 Protocol getUserRewards为M5唯一canonical read owner，账户/链query隔离，无polling。

Protocol/View getUserRewards 三字段的结构已有技术资料；前次公开账户 claimAll simulation 的非零返回仅证明该账户已有奖励的调用路径，不证明新参与必有奖励，更不证明完整税费/单位/时点。Stake 的 pendingRewards/claim 也是另一 Gate，不能混入 Mine Rewards。

## 9. Miners Data Contract（Human Confirmed / M10）

当前人工明确：当前开奖这一轮的中奖账户，非所有参与者、非自动current-1。开奖阶段请求`/ori/round_winners/round`，round_id为当前result round string，winner_address为当前账户/无账户留空，每10秒读取。空list整区隐藏含标题。

| 字段 / 决策 | 已签收需求 |
| --- | --- |
| dataset / round | 当前verified fulfilled result的winners；不从participants或旧API latest另造owner，不推导round+/-1 |
| order / viewer | backend list原顺序，不sort/filter/聚合；只有第一行匹配本人时显示You/你、白字、下虚线；后续本人不特殊处理，不自行置顶 |
| amounts | ore_reward>0显示ORI及+；始终显示eth_reward BNB；两者按8位API缩放、最多6小数截断，raw/exact bigint保留，非18位链上值 |
| row identity | round+address+同地址出现次数，保留重复行；不使用不安全JSON ID |
| owner | Mine feature-local TanStack Query；key含chain/deployment/backend/round/viewer。wrong-chain/非result禁用、旧请求取消，后台暂停 |
| runtime | implementation COMPLETE；当前1655未开奖不请求名单；已知1654诊断list空。nonempty runtime QA PENDING，不再把已签收产品字段标OPEN |

完整实现/属性/QA见[M10](./mine-winners-implementation.md)。正式reference中started/winners错位仍Q-11，不自动交换路径。

## 10. Backend endpoint reconciliation

A=可能需要链上不能完整提供的 enrichment；B=已有或可用的链上 canonical owner，可不依赖旧 API；C=当前无对应正式 Feature，暂不接；D=必须验证当前后端（下列仅一次 sample verification，不是永久 SLA）。分类可按字段组合，不把整个 endpoint 当唯一真相。

本轮使用项目配置的 Development backend、无签名的 form POST；账户参数为公开零地址，round样本1654。**2026-10-29 六个端点均 HTTP200 且有 data envelope**；不输出 host/凭据或后端异常细节，不宣称 Production、非空用户/所有字段已验证。

| 历史路径（实际前缀 /v1/ori） | 分类 | 本轮 availability / shape | 新架构决定 |
| --- | --- | --- | --- |
| /latest/events | B（round身份）+ A候选（链下计时metadata）+ D | data flat；有 round_id/start/end/timestamp/reset_event_round_id，round_id 为 number；common.timestamp另有 | 不作第二个 current-round owner；秒计时权威与lossless身份未签收，不能沿旧 max/+1 |
| /round | B + D | HTTP200，data={round_id:string,global,user,last_updated}；此前未登记于正式API Contract，不再表述为“已证明不可达” | 不接入：public board/account principal 使用链读；非空字段、单位及链关联仍需Contract，旧8 decimals不继承 |
| /automation/user | B（链上配置）+ A（remaining等enrichment）+ D | 零地址 data=null；正式文档有 extend_data，但本次未验证活动配置 | 先用经验证的 Protocol配置真相；当前人工已锁定extend_data.round_remaining为remaining display owner，原样显示、缺失留空，不推算；非空runtime样本未验证不改变产品决定 |
| /round_winners/round | A候选（payout/排序）+ D | data={round_id:string,total,list:[],reset_event}；非空行未验证 | 与正式API reference的endpoint内容错位问题仍在；不自动交换两个endpoint，不把投注amount当payout |
| /activity/origin_info | C（当前Origin流程）+ A + D | 有 ori_config/chain_asset_config/global/user/my_wallet | M11领取功能已人工排除；接口可达不构成新版需求或AssetManager付款许可 |
| /query/chain_asset_config | A（USD报价）+ D | data数组7行；不能据数量证明97价格可信 | 复用已存在Token price transport/mapper，未来确认asset/chain/单位/时效/缺价；97WBNB缺口仍不靠旧地址填充 |

正式 API reference 未列 /round；latest/events flat-vs-nested、started/winners错位、unsafe IDs与金额number/string/8位缩放仍 Q-11。HTTP200 不是 Data Gate PASS；本轮不写新 DTO adapter、不接 route、不创建 API fallback双 owner。

## 11. Realtime 与 polling 策略（M7/M8限定实现）

Realtime 只作为 freshness signal；Query/read owner 才是真相。现有 Foundation 是 pusher-js（不是移植 Echo singleton），最后一次 endpoint 证据为502/未取得真实payload；**本轮未重测 WS**，Q-47不关闭。

| 历史 channel / event | 未来应触发的已存在 owner |
| --- | --- |
| round.new_round / round.data.started | round/public board重读；新identity下account deployment读取；若Automation owner存在则刷新active/balance；不得从payload设置round+1或自动提交草稿 |
| round.reset / round.data.reset | settled round/result重读；board/treasury、个人部署、automation、rewards、对应round winners的相关Query invalidation；不直接写余额/中奖格 |
| resync / reconnect | 重读当前已订阅owner，恢复漏事件；重复/乱序/坏payload按identity隔离，离页清理 |

事件没有证明所有 owner 都已存在，不能为未实现模块造 queryKey；不能接收事件后 claim/deploy/checkpoint。未来 payload parse、链/round关联和真实订阅 smoke 属 M8。

历史频率是 round合约1s、latest3s、board4s、Origin5s、automation/winners/price/native balance10s、Rewards3s；Matrix每秒随机数不是新鲜度。**不复制这些 interval**。

| Owner | Required for correctness | UX freshness（M7 后置） |
| --- | --- | --- |
| round/game state | 提交前fresh read，身份一致；receipt后重读 | 页面可见/active较及时，waiting降频；后台暂停/恢复立即重读，间隔按RPC预算决定 |
| board | public snapshot同一block；receipt后invalidate/refetch | 可见时周期刷新、focus/reconnect刷新；不建立第二个round timer truth |
| account deployment | 每次提交前、operation receipt后、account/round变化重读 | 当前相关round/account可见时按需刷新，切context取消旧请求 |
| automation | register/stop前后重读active/余额，失败不自动重试write | active页面按owner预算轮询；frontend轮询不负责执行自动下注 |
| rewards | claim前及成功receipt后重读对应reward owner | 仅展开/可见且相关账户有效时按需刷新，不主动领取 |
| winners | dataset/round变更后读取真实list，保留明确empty/error | settled/result可见时刷新；不可达不伪造rows |

M7 不是 Manual 的硬前置；fresh preflight + receipt-driven refetch 必须随交易实现，不等M7。持续 polling/freshness 可在核心模块后补齐，M8在owner与真实protocol明确后接入。无WS时稳态页面新鲜度可降级，但不得放宽提交前fresh/simulation安全条件。

## 12. New Mine Feature Map / 实施顺序

为不让已审核 M1/M2/旧 M7 等票据重名，**保留 Repository ID**，不用用户示意编号覆盖历史。M9从“结果动画”扩展为lifecycle/countdown/result，新增M10名单、M11 Origin独立Gate；仅文档票据，不预建目录/Domain。

| 当前票号 | 新版交付范围 | 与本次示意对应 | 当前状态 |
| --- | --- | --- | --- |
| M1 + M2 | 已审核 read-only board +四卡/全Mine视觉结构；后续字段各自补owner | 示例M1 | READY（已交付限定Scope）；完整数据仍PARTIAL |
| M3 | Manual selection +一次真实deploy；account reads/strict transaction completion | 示例M2 | READY FOR IMPLEMENTATION，未完成实现/QA |
| M4 | Auto config、fixed/random、register/stop、active替换卡 | 示例M3 | Development Core已放行实现；产品公式已签收，execution实际扣费待真实QA |
| M9 | round lifecycle、countdown、verified result与动画 | 示例M4 | OPEN，时间/状态映射Gate |
| M5 + M6 | ORI/BNB rewards read与claim分票 | 示例M5 | M5 read/UI COMPLETE，映射/显隐人工CLOSED；M6资金Gate独立，不混Origin或Stake |
| M11 | Origin rewards read/AssetManager流程 | 示例M6 | OUT OF SCOPE — 新版不做起源奖励领取，保留编号追溯 |
| M10 | 当前开奖轮winners/read/UI | 示例M7 | Human decisions CLOSED / implementation COMPLETE，非空真实QA PENDING |
| M7 | polling/freshness | 示例M8 | known-owner调度已实现，不影响交易fresh preflight/receipt |
| M8 | realtime freshness signals | 示例M9 | DEFERRED，Q-47与owner依赖 |

最短推荐主线：**M3 Manual → M4 Auto（先通过Auto-specific资金/选择/执行器Gate）→ M9 lifecycle/countdown → M5/M6 ORI rewards → M10 Miners/winners → M7 freshness → M8 realtime**。M11 Origin领取已人工排除，Motherlode/price补充可按各自数据Gate并行规划，不让未来奖励阻塞Manual。流程顺序不是依赖全部前项交付：Miners仅依赖已确认round+dataset，Realtime不依赖任何write成功；Auto不能在执行费/最终预付 Gate 未通过时硬做。

必要依赖：M1/M2/W1→M3；M1/M2/W1+AutoGate→M4；M1/M2+LifecycleGate→M9；M1/W1+RewardGate→M5→M6；M1+MinersGate→M10；已建立owner→M7→M8。交易receipt的局部刷新由M3/M4/M6各自实现，非M7权限。Source/API/clock/Origin未决问题不被“连续开发”隐式关闭。

## 13. 下一阶段 Manual 能否开始

**可以正式开始限定 Manual Core 实现**：产品 single-deploy、mask/value、97 runtime selector/preflight、execution-time operationRound、receipt/event/reads完成契约已有足够证据和 Human approved 决定。按后续人工确认启用Manual shortcuts替换输入、不新增全选、不接USD/Countdown/Miners/Rewards，不依赖旧 /round API，未来OPEN不阻塞此Core。

开工不是本轮执行：当前草稿需重新审计后接线，补完整single-deploy/context/receipt/no-resend测试，375/500 property-level browser QA，人工OKX testnet验收后才讨论checkpoint。一次Manual成功不保证立即收到ORI，不为了获取Stake测试资产自动循环挖矿。

## 14. Final Reconciliation Matrix

Status 在此表指需求/数据/实施准备度：READY=限定Scope可开工或已交付，PARTIAL=Scope有证据但尚缺关键数据/策略，OPEN=定义未签收，DEFERRED=明确后置；不表示真实交易通过。

| Feature | Figma | Historical | Runtime | New Product Decision | Data Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Manual | 5四态、1/2多格、同页mode | 单轮一次、旧6位/旧quick/全选 | selector/mask/value/receipt路径与异格能力已有97证据 | Human approved一次多格，禁止第二次；18位；不继承旧quick、无新全选 | Mine Feature account+public Queries / local draft / transaction owner | READY |
| Auto | 6 config、4b active+Stop、Random | register/stop、fixed/random、预付+fee | 当前register/stop已模拟；execution扣费技术证据未齐 | M4产品层closed：每格金额/含fee value、fixed/random、1–9999产品上限、self Stop；remaining后端直出且缺失留空 | Protocol automation/config canonical；backend round_remaining为remaining唯一display owner | Core implementation获批；execution真实QA PENDING |
| Board | 25格与全variants | 旧API global/user统计+伪造随机count | 97 public量/人数已读；personal有原始证据 | 保留global/own/draft三类；不采用fake count或第二轮次owner | 现有Mine public Query + future completed account mapper | READY |
| Stats | 四卡+USD/Round alternate | 同四类，旧双母矿 | total可读，个人/母矿技术候选；USD/秒time缺owner | 保留四卡；缺owner为—；不加旧双资产/hover布局 | Mine display adapter；quote独立 | PARTIAL |
| Countdown | 00:48 / Waiting / Round | timestamp+60-localClock | block boundaries可读，未有正式seconds deadline | Required UI，真实驱动；不继承固定60s，fallback Waiting/— | future M9 lifecycle/deadline owner | OPEN |
| Round lifecycle | Waiting、winner/lost、淘汰/保持 | gameState映射、3.6s+5s、WS | storedfulfilled+canDeploy并存；execution round由event | 候选waiting/live/resolving/revealed/next-round；不命名未知enum | Protocol/View canonical snapshot，M9 adapter；WS仅信号 | OPEN |
| Motherlode | 单卡单值+USD | ORI+Origin、3–6轮/其他概率旧口径 | ORI字段可读，payout未签收 | 保留单卡，Origin/节奏仅历史，不混资产或推claim | treasury.motherlodeOre / ORI18 | 单卡资产CLOSED；payout仍OPEN |
| ORI Rewards | 三行+Claim/Claim only | ethAmount/oriDirect/oriRefined、claimAll/Eth | 结构与部分simulation，不证明完整领取语义 | 保留reward Scope candidate；asset/税/时限/claim Gate | future Mine rewards Query / mapper | PARTIAL |
| Origin Rewards | 无独立混合workflow设计 | origin_info + AssetManager deposit | ABI/接口可达不是付款许可 | Human Confirmed新版不做起源奖励领取，与ORI Claim隔离 | 不创建workflow | OUT OF SCOPE |
| Miners/Winners | Miners+Round+地址/双金额 | state4 winners/You置顶 | API winners空 | 当前人工确认当前开奖轮winners、8位双奖励、backend顺序、只首行You，空整区隐藏 | M10 Query | COMPLETE / nonempty QA PENDING |
| Polling | 无频率规定 | 1/3/4/5/10s | Query现有refetch可用 | Mandatory fresh preflight/receipt先做；持续轮询后置 | 各Feature Query的有界refetch策略 | DEFERRED |
| Realtime | 不定义protocol | Echo/Pusher两频道 | Foundation有；last WS502/真实payload未验证 | freshness-only，不patch真相、不发交易 | F7 transport →相关Query invalidation | DEFERRED |

## Latest Human Decision — asymmetric Manual / Auto

hasDeployedThisRound仅禁止本轮再次Manual Deploy，不进入Auto eligibility。Manual已部署仍可切换/配置/Register Auto；getAutomation.active=true整体替换Trade Card，无Manual/Auto tabs或第二注册入口。两者保持独立；只有正在进行的transaction阻止并发签名。Auto普通Register/Stop失败统一通用提示，内部decoded category保留；confirmed后的verify/refresh失败与confirmation unknown维持原只读重试安全语义，不resend。

最新Fast Autonomous主线：M10人工语义已closed；后续M7/M8仅对已存在owners实现有界freshness，具体budget/信号不可驱动state/QA边界见[mine-freshness-implementation](./mine-freshness-implementation.md)，不是全量协议schema已验证。
