# UI Behavior

每条行为标注 **Confirmed**、**Inferred** 或 **Unknown**，编号对应 [requirements.md](./requirements.md) 与 [open-questions.md](./open-questions.md)。重点记录 Figma 静态画面无法表达、但实现必须知道的行为。

新版 UI、交互与 Feature Scope 按用户明确确认和当前 Figma；旧实现仅在已确定能力需要时恢复技术证据，不自动继承业务。见 [Source of Truth](./README.md#source-of-truth-优先级)。

## Navigation

- **Confirmed**：底部导航 Mine · Points · Stake · Explore · About；当前项白色，其余 `#606164`（C-20）。线上第 2 项为 "起源"（Q-01）。
- **Inferred**：Header 与底部导航在所有主视图中固定；sticky / fixed 为实现决策。

## Wallet

- **Confirmed**：仅钱包登录（Privy，Binance / OKX / MetaMask），无嵌入式钱包（C-04）。
- **Inferred**：`Connect` / `Connect wallet` 打开 Privy 钱包登录；已连接后 Header 显示缩短地址，点击打开 Wallet Sheet（I-10）。
- **Inferred**：Sheet 内复制图标复制完整地址；退出图标断开连接；断开后回到未连接状态。复制成功反馈未设计。
- **Confirmed（W2 Human Gate）**：ORE visual slot 暂无数据 owner，显示 `— ORE` 并声明 unavailable；不请求余额 API/contract，不替换 BNB 或加入旧 mining fund。
- **Confirmed（W2）**：Export 保留 Figma 按钮位置/样式，`aria-disabled` 并声明不可用，不绑定业务动作。Receive 明确排除，不渲染按钮/QR，不调用 fundWallet。余额 owner 和 Export 行为继续 Q-22。
- Sheet 显示 SDK 当前身份；同步/不可用时不保留旧地址动作；wrong/unknown network 与 target-ready 分开。复制有成功/失败反馈，断开委托 Privy logout，失败可重试，不承诺撤销扩展站点权限。

## Modal / Sheet

| 项 | Wallet Sheet（唯一弹层） |
| --- | --- |
| Figma | `2003:2487` / `2003:2490` |
| H5 呈现 | 底部 Sheet，宽 100%，顶部圆角 16 |
| PC 呈现 | **Confirmed**：同一底部 Sheet，最大 500px，与 ORI viewport 对齐；backdrop 也限制在该 viewport |
| 遮罩 | `#000000` 65% |
| 关闭 | ✕（Confirmed）；点遮罩（Inferred，I-11）；ESC（可访问性要求） |
| 拖拽关闭 | **无证据，不实现** |
| 实现 | Wallet-local 原生 `<dialog>.showModal()`（top layer、ESC、焦点隔离/恢复、`aria-modal`）；打开状态归 Wallet Feature 本地 |

交易确认弹窗、结果弹窗、滑点设置弹窗均未在新版设计中出现（Q-12）。

## Mine

### 数据卡

- **Confirmed**：Motherlode、剩余时间、总部署、你的部署；点击切换美金值 / 轮次（C-45）。
- **Confirmed**：等待开始时显示 Waiting（线上 "等待中…"）。
- **Inferred**：4 张卡同时切换；本地 UI 状态，不持久化。
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
| 中奖 | 2px 金色边框 + 暗金底 `#23211C` |
| 未中奖 | 约 25% 透明度 |
| 等待开始 | 人数 0，无金额 |

### 方块选择

- **Inferred**：点击切换选中、可多选（I-20）。
- **Confirmed**：选择结果编码为 25 位 `mask`（web3.md）。
- **Unknown**：线上 `全选` 是否保留（Q-19）；开奖等待期间能否选择。

### 结果动画（Confirmed，C-44）

```text
Step1  未中奖方块 opacity 100% → 25%，每块 0.15s，随机顺序（24 × 0.15s = 3.6s）
Step2  获胜方块点亮（颜色变化 0.15s）
Step3  获胜方块保持点亮 10s
```

- **Confirmed**：开奖结果来自 VRF；线上通过实时频道 `round.reset` 推送，并可从链上 / `/ori/round_winners/round` 读取（api.md）。
- **Unknown**：动画结束后的状态衔接；轮次 1 分钟与动画 3.6s + 10s 的时间关系（intermission 区块数决定）。

### 部署面板 — Manual（Confirmed，C-46）

```text
未连接钱包            → "Connect wallet"
已连接 · 未选方块      → "Deploy" 不可用
已连接 · 余额不足      → "Bal:" 变红 #FF3C4C，按钮不可用（文案 "Insufficient BNB"，Figma 中 SOL 为占位）
已连接 · 可部署        → 白色 "Deploy {total} BNB"
```

- **Confirmed**：总额 = 每方块金额 × 方块数；所有方块金额相同（C-32）。
- **Confirmed**：同一轮已部署后不能再次部署；已开启 Auto 时不能 Manual 部署（C-34）。
- **Inferred**：快捷按钮为累加（I-24）；数值待定（Q-16）。
- **Unknown**：金额最小 / 最大值、小数位、gas 预留（Q-17）；上一轮未结算时的处理（Q-43）。

### 部署面板 — Auto

- **Confirmed**：轮数默认 1（C-47）；BNB 预先收取；可选方块或随机方块（C-33）。
- **Inferred**：总额 = 每轮金额 × 轮数（I-21）。
- **Unknown**：Figma "Total per round" 未乘方块数的含义；执行器费用展示；最大轮数（Q-15）。

### Autominer（运行中）

- **Confirmed**：显示方块、剩余轮数、每轮金额与 `Stop autominer`；停止后退款（C-48）。

### Rewards

- **Confirmed**：奖励构成为 BNB、直接 ORI、精炼 ORI；领取方式为全部领取或仅领取 BNB（C-40、C-41）；领取有时限（C-42）。
- **Inferred**：有可领取奖励时显示（I-30）。
- **Unknown**：Figma 文案与命名（Q-25）；时限长度（Q-42）。

### Miners 列表

- **Confirmed**：显示本轮参与者地址与金额（C-49）。
- **Unknown**：排序、条数、实时更新方式。

## Stake

- **Confirmed**：质押资产 ORI；Deposit / Withdraw；25 / 50 / 100%；Summary（C-50–C-52）。
- **Confirmed**：Deposit 需要先对 OreProtocol `approve` ORI（web3.md）。
- **Unknown**：Account / Yield / Claim 是否进入新版（Q-26）；Info 说明内容（Q-24）。

## Points

- **Unknown**：规则（Figma 与线上文案冲突）与数据接口（Q-20）。在确认前只实现静态结构。

## Explore

- **Confirmed**：挖矿、母矿、回购记录与分页（C-60）。
- **Inferred**：H5 表格横向滚动（I-31）。
- **Unknown**：新版范围（Q-27）。

## About

- **Confirmed**：内容以线上 About 为准（C-61、C-62）。
- **Inferred**：单项展开、默认展开第一项（I-32）。
- **Unknown**：费率口径一致性（Q-41）。

## Loading / Error / Disabled / Success

- **Confirmed**：不可用按钮样式；余额不足错误色。
- **Unknown**：加载、空状态、网络 / RPC 错误、交易 pending / 成功 / 失败视觉（Q-12）。不得自造视觉；需设计补充或用户批准的最小方案。
- 链上错误到 UI 文案的映射由 Feature 负责（`docs/web3.md`），错误列表见 web3.md。

## Responsive

- **Confirmed**：H5 100%，PC 500px 居中，结构不变（C-10–C-12）。
- **Implementation decision**：边距固定、网格列宽随容器伸缩；PC 时 Header 与底部导航同宽居中。
