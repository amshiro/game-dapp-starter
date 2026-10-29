# UI Behavior

每条行为标注 **Confirmed**、**Inferred** 或 **Unknown**，编号对应 [requirements.md](./requirements.md) 与 [open-questions.md](./open-questions.md)。重点记录 Figma 静态画面无法表达、但实现必须知道的行为。

新版 UI、交互与 Feature Scope 按用户明确确认和当前 Figma；旧实现默认仅恢复技术证据；Mine 已获授权恢复 Historical Functional Baseline，但历史行为不自动成为新版需求。Mine 固定优先级与本次裁决见 [需求对齐](./mine-requirements-reconciliation.md)。见 [Source of Truth](./README.md#source-of-truth-优先级)。

## Navigation

- **User Confirmed（PC 布局修正）**：Header 全宽，PC 左右 padding 120px；Main / Bottom Navigation 保持 max-500 居中；Modal backdrop 全屏，PC 内容面板 400px。
- **Confirmed**：底部导航 Mine · Points · Stake · Explore · About；当前项白色，其余 `#606164`（C-20）。线上第 2 项为 "起源"（Q-01）。
- **Inferred**：Header 与底部导航在所有主视图中固定；sticky / fixed 为实现决策。

## Wallet

- **Confirmed**：仅钱包登录（Privy，Binance / OKX / MetaMask），无嵌入式钱包（C-04）。
- **Inferred**：`Connect` / `Connect wallet` 打开 Privy 钱包登录；已连接后 Header 显示缩短地址，点击打开 Wallet Sheet（I-10）。
- **Inferred**：Sheet 内复制图标复制完整地址；退出图标断开连接；断开后回到未连接状态。复制成功反馈未设计。
- **User Confirmed（余额修正）**：Wallet 单行余额改为目标 BSC 链 native BNB，设计稿 ORE 标注错误。弹层打开且 SDK identity / current chain 均 ready 时用 Wagmi useBalance（eth_getBalance）读取；错链/未连接显示 — BNB，不展示旧缓存；加载/失败有本地化状态，重开自动 refetch。bigint + formatUnits18，显示最多6位小数并保留 exact/raw；不读取旧 mining fund。
- **User Confirmed（当前修正）**：external wallet 同时隐藏 Export / Receive。仅 Privy embedded wallet 才有这两项能力；当前 embedded off，不能创建新钱包来补按钮，不调用 key export / funding / deposit API。余额 owner 已按本轮人工确认；未来 embedded 模型仍需 Gate。
- Sheet 显示 SDK 当前身份；同步/不可用时不保留旧地址动作；wrong/unknown network 与 target-ready 分开。复制有成功/失败反馈，断开委托 Privy logout，失败可重试，不承诺撤销扩展站点权限。

## Modal / Sheet

| 项 | Wallet Sheet（唯一弹层） |
| --- | --- |
| Figma | `2003:2487` / `2003:2490` |
| H5 呈现 | 底部 Sheet，宽 100%，顶部圆角 16 |
| PC 呈现 | **User Confirmed（Shared Modal 修正）**：垂直居中 Modal，面板宽 400px，水平居中；backdrop 覆盖整个页面。覆盖此前 PC 同形贴底方案 |
| 遮罩 | `#000000` 65% |
| 关闭 | ✕（Confirmed）；点遮罩默认关闭，传 `closeOnBackdrop={false}` 禁止（User Confirmed）；ESC（可访问性要求） |
| 拖拽关闭 | **无证据，不实现** |
| 实现 | Shared `Modal` 的原生 `<dialog>.showModal()`（top layer、ESC、焦点隔离/恢复、`aria-modal`）；打开状态归 Wallet Feature 本地 |

交易确认弹窗、结果弹窗、滑点设置弹窗均未在新版设计中出现（Q-12）。

## Mine

### 数据卡

- **Confirmed**：Motherlode、剩余时间、总部署、你的部署；点击切换美金值 / 轮次（C-45）。
- **Confirmed**：等待开始时显示 Waiting（线上 "等待中…"）。
- **Correction**：Figma 1037 说明点击数据块切换 USD / Round，不能证明四卡必须同时切换。保持逐卡本地展示状态；USD 缺 quote owner 时为 —。
- **Unknown**：母矿卡是否显示 `ORI + 起源` 双资产（Q-31）。

### Block cell states

来源：Figma `2003:1038` 设计师标注（Confirmed，C-43）。

| 状态 | 视觉 |
| --- | --- |
| 正常 | 2px `#25262A` 边框，底 `#0D0F13` |
| 参与人数 > 1000 | 人数缩写为 `1.2K` |
| 选中 | 2px 白色边框，底色略亮 |
| 已部署 | 显示用户金额（单态样例为金色，其他稿为绿色，Q-18） |
| 已部署 + 选中 | 白色边框 + 绿色用户金额 |
| 自动模式选中 | 2px 绿色 `#2ED075` 边框 + 绿色金额；另有半透明变体（含义 Q-18） |
| 中奖 | 3px 金色边框 + 暗金底 `#23211C` |
| 未中奖 | 约 25% 透明度 |
| 等待开始 | 人数 0，无金额 |

### 方块选择

- **Human approved**：首次 Manual 提交前可 select / deselect / multi-select；成功后本轮不允许第二次提交。
- **Confirmed**：选择结果编码为 25 位 `mask`（web3.md）。
- **Human approved**：断连、错链或暂不可提交时允许纯 UI 预选，禁止 submit。全七稿未发现全选/清空入口，不继承旧按钮；新轮草稿视觉保留与成功后纯视觉点击仍 OPEN（Q-19），不得自动提交。

### 结果动画（Confirmed，C-44）

```text
Step1  未中奖方块 opacity 100% → 25%，每块 0.15s，随机顺序（24 × 0.15s = 3.6s）
Step2  获胜方块点亮（颜色变化 0.15s）
Step3  获胜方块保持点亮 10s
```

- **Technical evidence**：协议使用 VRF；Protocol/View 为可信结果候选。历史 round.reset 仅作 freshness signal；当前 WS payload 未验证，winners API 的 list 不能代替 canonical winning square。
- **M9 current**：动画只展示同一实际round的verified winner；重复刷新不重播，真实新round优先。initial fulfilled/reduced-motion直接显示终局；观察到fulfillment变化才按C-44播放。10s后保留静态终局，不能据动画时间建立下一round或改变交易资格，见[实现记录](./mine-result-implementation.md)。
- **Human approved countdown**：当前继续Waiting / —，等backend提供deadline。不显示“剩余区块”或估算秒数，不用timestamp+60；当前显示策略已CLOSED。

### 部署面板 — Manual（Confirmed，C-46）

```text
未连接钱包            → "Connect wallet"
已连接 · 未选方块      → "Deploy" 不可用
已连接 · 余额不足      → "Bal:" 变红 #FF3C4C，按钮不可用（文案 "Insufficient BNB"，Figma 中 SOL 为占位）
已连接 · 可部署        → 白色 "Deploy {total} BNB"
```

- **Confirmed**：总额 = 每方块金额 × 方块数；所有方块金额相同（C-32）。
- **User Confirmed**：每账户每个实际 operation round 最多一次成功 Manual Deploy；首笔可多选格子，一次提交最终 mask。已有任意格的本轮部署即禁用本轮 Manual action，即使另一格的合约 simulation 可通过也不开放第二次交易（C-34）。链上 deployed visual 保留；Human approved：成功后仍可点击/取消/多选和修改每格金额，计数/总额继续计算；最终按钮 disabled，文案“本轮已部署”，不增加独立同类提示。已部署后输入值保持 text-primary 白色，包括取消全部选择后；不得因最终按钮禁用而将输入值置灰，空 placeholder 仍用原样式。草稿修改不得使 action 再次可提交。
- `hasDeployedThisRound` 来自按 deployment/round/account 隔离的链上 `getMinerRoundInfo` / `getMinerSquares`。真实新轮重新读取、不继承旧轮锁；未确认的数据不能当作“尚未部署”。旧草稿不得自动提交，新交易必须重新 read / validate / simulate。
- **Human approved**：Manual shortcuts 使用当前 Figma1715 的 +0.5 / +1 / +2，点击将每格输入直接替换为字符串0.5 / 1 / 2 BNB，不累加、不改所选格子；total=每格金额×格数。断连/错链/已部署均可编辑本地草稿；仅既有 transaction busy 时禁用。已部署最终按钮继续disabled、文案“本轮已部署”，不能发起第二次交易。历史0.02/0.05/0.1不采用，I-24旧推断/disabled裁决废弃。
- **Human approved**：BNB 输入最多18位，以 decimal string → parseEther → bigint；value=amountPerSquare×count，不额外加1%。提交前 fresh read/simulation/余额含gas检查。1 wei simulation 不构成产品 minimum；正式 min/max 仍 OPEN。MustCheckpointPreviousRound 仅提示/刷新，不自动 checkpoint（Q-43）。

**M3 implementation**：正式97 Manual已接选择/每格金额与transaction owner；成功后仅本轮最终Deploy action禁用，格子与金额草稿保持可编辑，换账户/已知round变化清空local selection，未知资料不当作新轮。hash不是成功；matching DeployEvent决定operationRound，receipt+1confirmation后刷新原账户与公共Queries；refresh-failed只能Retry Refresh。Auto继续disabled；Manual shortcuts按上述人工决定启用。用户最终人工验收已确认Chain97真实Manual Deploy PASS，见 [实现记录](./mine-manual-implementation-plan.md)。

### 部署面板 — Auto

- **Confirmed**：轮数默认 1（C-47）；BNB 预先收取；可选方块或随机方块（C-33）。
- **Human approved**：输入为每格金额；有选择用fixed位图，无选择用random格数；页面每轮/总计/按钮仅显示本金。实际value=(每格金额×格数+executorFee)×rounds，余额需覆盖value与gas，允许最小执行费说明行。
- **Human approved override**：Figma 4格/.02/3轮的 .02/.06 不采用；每轮本金 .08、3轮本金 .24 BNB。当前97注册参数/stop/refund已模拟；产品层已closed：rounds=1–9999是前端限制，非contract maximum。仅当前版本execution扣费路径仍需[M4 Gate](./mine-auto-transaction-gate.md)，人工已批准Development Core实现，execution实际扣费RUNTIME QA PENDING，不阻塞实现。

### Autominer（运行中）

- **Human approved**：链上active=true时整个Manual/Auto form不渲染，替换Running Card，无模式切换/全选/二次注册。显示fixed/random/格数、每轮本金与Stop；剩余回合直接展示POST /ori/automation/user的extend_data.round_remaining，由backend计算；缺失留空，不补—，不从链上balance或executorFee推导。
- Stop固定self；当前97非持久化模拟已验证合约退回余额/清除配置。receipt+1confirmation+matching event+reads后才成功；confirmed+refresh失败不resend。active owner为P.getAutomation(account)，API仅enrichment、非空样本未验证；本轮已接M4 Core但无真实Auto交易验收，见[M4 Gate](./mine-auto-transaction-gate.md)。

### Rewards

- **Human Confirmed**：Protocol getUserRewards(account) 的 ethAmount→BNB、oriDirect→未精炼ORI、oriRefined→已精炼ORI；三项全零不渲染整个Rewards区域。历史非零行显隐规则保留；ORI任一>0显示领取（claimAll），BNB>0显示仅领取BNB（claimEth），BNB-only只有后者。Q-25 / I-30 CLOSED。
- **M5 implemented**：Development97的三项raw bigint read，18 decimals exact展示；账户/链隔离、loading/error/重试。两个入口只读disabled，未启用M6交易；Rewards独立于active Auto，不要求当前Auto运行。
- **M6 Unknown**：收款地址、税/时限与写入完成验证；Q-42仍OPEN，不在M5推算expiry或净可领取值。详见 [M5](./mine-rewards-implementation.md)。

### Miners 列表

- **Figma confirmed**：Miners 有 Round、地址与金额 row。旧站 state=4 使用 winners；不能据此把新版定为全部参与者或本轮中奖者，撤回旧 C-49 的 dataset 推断。
- **OPEN**：dataset、operation/result round、双金额资产/单位、稳定 row identity、本人行、排序和条数。见需求对齐中的 Miners Data Contract；不继承旧 Rank API/排序。

## Stake

- **Confirmed**：质押资产 ORI；Deposit / Withdraw；25 / 50 / 100%；Summary（C-50–C-52）。
- **Confirmed**：Deposit 需要先对 OreProtocol `approve` ORI（web3.md）。
- **Confirmed（本轮用户低风险 UI 授权）**：正式 `/stake` 交付当前 Figma `2003:1949/1961/2078` 的 Core UI。Deposit 初始选中（当前主稿），Withdraw 只切换本地展示与按钮标签；原生 button/tablist/tab/tabpanel 支持鼠标、Enter/Space、方向键与 Home/End，不触发业务操作。
- **Implementation decision**：当前金额只读为空、placeholder `—`，Bal 与 Summary 只填已确认数据，其余 `—`；25/50/100% 和主按钮 native disabled，并提示 Actions unavailable / Data unavailable。不建立金额草稿或百分比公式。后续已授权的 97 principal read 见下一项；无 API 或 write。营销副标题本轮不加入，SOL 图标不使用，资产名遵循已确认 ORI；保持图标槽等待 Q-03。
- **Unknown**：Account / Yield / Claim 是否进入新版（Q-26）；Info 说明内容（Q-24）。Info 仅当前原始装饰图标，无可点击控件/自编 tooltip。APR、TVL、rewards 的来源/单位/语义仍需 Data Gate，未确认值不补零。

- **Confirmed（S1 Development 97 Read 授权）**：Deposit Bal = ORI balanceOf，Withdraw Bal = View stakedAmount，Summary Total deposit = View totalStaked；均按已验证 ORI 18 decimals 展示。未连接不读个人值，错误/未知链隐藏全部 read 值；loading/error 不补零，提供仅 refetch 的 Refresh。金额输入和所有资金按钮继续禁用，奖励/APR/TVL 不推导。

## Points

- **Unknown**：规则（Figma 与线上文案冲突）与数据接口（Q-20）。在确认前只实现静态结构。

## Explore

- **Confirmed**：挖矿、母矿、回购记录与分页（C-60）。
- **Inferred**：H5 表格横向滚动（I-31）。
- **Confirmed（E1 Core UI Human Gate）**：正式 `/explore` 只交付当前四张统计卡、Mining/Motherlodes/Buybacks 三表及分页结构，无旧版多分支。未接数据时统计值为 `—`，表格没有数据行，显示中性 `Data unavailable`。
- **Implementation decision**：Feature typed display model 支持 loading/empty/error/unavailable/populated；已确认空列表与尚无数据源分别显示 No records / Data unavailable。无真实分页 metadata 不显示 current page/total/count，prev/next 使用原生 disabled；未来数据 owner 提供 currentPage/hasPrevious/hasNext 与受控回调，当前页可识别，不建本地假页数。
- **Unknown**：完整数据范围、Buybacks 类型与 Q-11 字段/单位/ID；保持 Q-27，未接 API/Realtime。Figma 营销副标题本轮不进入正式文案；SOL Spent 按已锁链事实显示 BNB Spent，不导入 SOL 资产。

## About

- **Confirmed（A1 Human Gate）**：正式页面复用已审核 Accordion UI/Interaction；最多一项展开，打开另一项关闭上一项。当前 Figma 无初始默认项证据，runtime 默认全部 collapsed；展开稿不是默认状态事实（C-86）。
- 使用 heading 内原生 button、aria-expanded/controls、关联的 region；隐藏 panel 不参与可见/键盘内容。Enter/Space 使用按钮原生行为，不实现无设计依据的额外快捷键。
- 长内容使用自然文档流，允许长词换行；不固定展开高度、不增加内部滚动容器。继续由 App Shell 负责底栏避让。
- **Confirmed（本轮限定例外）**：正式 /about 使用当前源码实际引用的对应正文与链接，视觉仍为 Figma 五项。Q-41 合约口径、Q-30 生产发布审定保留；不继承旧 UI/额外栏目。

- **Human-approved interaction override**：用户明确要求并已人工验收 240ms expand/collapse、180ms content fade 与 arrow transition；这是允许的交互覆盖，不是 blocker，不移除。reduced-motion 保留即时切换。

## Loading / Error / Disabled / Success

- **Confirmed**：不可用按钮样式；余额不足错误色。
- **Unknown**：加载、空状态、网络 / RPC 错误、交易 pending / 成功 / 失败视觉（Q-12）。不得自造视觉；需设计补充或用户批准的最小方案。
- 链上错误到 UI 文案的映射由 Feature 负责（`docs/web3.md`），错误列表见 web3.md。

## Responsive

- **Confirmed**：H5 100%，PC 500px 居中，结构不变（C-10–C-12）。
- **Implementation decision**：边距固定、网格列宽随容器伸缩；Main / Bottom Navigation 保持 500px 居中，Header 按当前 User Confirmed 全宽 / PC padding 120px。

## Language switch

User Confirmed：钱包入口右侧提供单个 32×32 `中` / `EN` 切换按钮；显示当前语言，点击切换另一语言。13px / 400，radius 8px、2px border、项目背景色。支持 `en` / `zh-CN`；保留 EN 默认值，显式选择优先，不检测浏览器语言。

`app_locale` cookie（Path=/、SameSite=Lax、1 年；HTTPS 下 Secure）是服务端可见偏好。`app/request-locale.ts` 每请求统一解析；RootLayout 将同一 locale 交给 html lang、App Shell 与 LocaleProvider。切换写 cookie 后 `router.refresh()` 刷新 RSC，不 reload，不 key/remount Wallet Provider，不修改钱包、链或查询 identity。资源按 App Shell / Feature / Shared owner 存放；Client 使用 Context 中的同一 resolved locale，无 localStorage / Zustand locale 镜像。现有 Stake、Explore、Wallet 与占位标题可切换；正式 About 正文、Points 规则、Privy SDK 自有弹窗文案不在此资源中推造。

## Latest Human Decision — Manual / Auto interaction

Manual→Auto允许：hasDeployedThisRound仅影响Manual最终action，不影响Auto配置/eligibility。Active Auto→Manual不允许：chain active整体替换Trade Card，移除两个form/tabs/注册入口；Stop确认并刷新inactive后恢复Trade，独立Manual单轮一次限制仍生效。Auto普通Register/Stop失败用户侧只显示“操作失败，请重试。”；decoded error仅留内部分类。输入校验仍可提供明确字段提示；confirmation unknown和confirmed后verify/refresh失败保留专用安全提示，只读Retry，不resend。
