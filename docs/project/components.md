# Component Inventory

```text
Figma Concept → Component Candidate → Ownership → Reuse Strategy
```

归属规则遵守 `docs/architecture.md` 与 `docs/design-system.md`：视觉相似不等于语义相同；只有去掉业务语义后仍是稳定 UI primitive，且属于明确的 Starter primitive 或被真实使用证明跨业务复用，才进入 `shared/ui`。**本文件不授权提前创建代码**，组件在第一个真实使用它的 Feature 实现时创建。

Figma 中没有 Component，以下候选全部从重复视觉中识别。

## Shared UI 候选（`src/shared/ui`）

| Component | Figma source | Variants / States | 复用证据 | 备注 |
| --- | --- | --- | --- | --- |
| Button | `2003:481`、`2003:1982`、Rewards `Claim`、Wallet `2003:2526` | primary / primary-disabled / secondary（`#303135`）/ outline-accent / small；尺寸 44 / 32 / 31 | Mine、Stake、Rewards、Wallet、Header | 全部 pill；loading 状态未设计 |
| SegmentedControl | `2003:465`、`2003:1966` | 2 项，选中 / 未选中 | Mine（Manual / Auto）、Stake（Deposit / Withdraw） | 用 accessible tablist / radio 语义 |
| AmountInput | `2003:462`、`2003:1963` | 空（`0.00` 占位）/ 有值；代币图标 + 名称 | Mine、Stake | 金额精度遵守 `docs/tech-stack.md`，不用 float；代币图标作为 prop 传入 |
| PresetChip | `2003:474`–`2003:476`、`2003:1975`–`2003:1977` | 默认（按下态未设计） | Mine（Figma `+0.5/+1/+2`，线上 `+0.02/+0.05/+0.1`，Q-16）、Stake（`25/50/100%`） | 只共享视觉；"累加"与"按比例"的语义留在各 Feature |
| StatCard | `2003:485` 等、`2003:2659` 等 | 默认 / 强调（金色，Motherlode） | Mine 数据卡、Explore 统计卡 | 点击切换显示模式只属于 Mine |
| KeyValueRow | 部署面板 Blocks / Total、Stake Summary、Rewards 行、Autominer 行 | 带 / 不带 info 图标 | Mine、Stake、Rewards | |
| DataTable | Points Records、Explore 三表 | 横向滚动；表头 / 行 | Points、Explore | 列定义由 Feature 提供 |
| Pagination（‹ ›） | `2003:2883` 等 | 首页只有下一页 | Explore（Points 未画分页） | 圆形 28px 按钮 |
| Sheet / Dialog primitive | `2003:2490` | H5 bottom / PC center，面板 PC 400px 居中，全屏 backdrop | 目前只有 Wallet | `shared/ui/modal` 原生 dialog 提供 top layer、ESC、遮罩点击、焦点隔离/恢复与 scroll lock；默认视觉、标题栏与关闭资产由 Shared 提供；Wallet 仅注入业务内容/标题与关闭通知，无拖拽关闭 |
| InfoHint（ⓘ） | `2003:1988` 等 | — | Stake Summary、Rewards | 说明内容与交互（tooltip / popover）未设计，暂时只渲染图标或等待确认 |
| AboutAccordion | About 行 `2003:2245` 等 | 默认全收起、单项展开/再点可收起 | `features/about/components` | 局部 React state + 原生 button/ARIA，调用方注入标题/内容，无新 dependency 或 Shared abstraction |

## Project App Shell

| Component | Figma source | Ownership | 备注 |
| --- | --- | --- | --- |
| AppContainer（H5 100% / PC 500 居中） | User Confirmed | 项目壳层（`app/` 组合或项目 shell 模块） | ORI 专属规则，不进入 Starter 全局 |
| Header | `2003:190`、`2003:990` | 项目壳层 | Logo 资产待确认（Q-03）；钱包插槽依赖 Wallet Feature |
| BottomNavigation | `2003:2921`、`2003:584` | 项目壳层 | 5 项，`next/link`；图标为 Figma 资产 |
| PageHeading（标题 + 副标题） | Points / Stake / Explore / About | 项目壳层或 shared/ui | 4 个页面复用，无业务语义 |

## Wallet Feature（`features/wallet`）

| Component | Figma source | 说明 |
| --- | --- | --- |
| ConnectButton | Header `Connect`、部署面板 `Connect wallet` | 两处样式不同，共享连接行为 |
| WalletButton（缩短地址） | `2003:999` | 打开 WalletSheet |
| WalletSheet | `2003:2490` | native BNB balance、external-only：隐藏 Export / Receive、地址复制/断开；SDK 身份唯一 owner；Receive 排除；余额 owner 为 Wagmi eth_getBalance，见 Q-22；未来 embedded 另过 Gate |
| AddressDisplay + Copy | Wallet Sheet、Miners 列表、Explore 表格 | 缩短规则：设计为 `0x12…3456` / `0xAB…CDEF`（EVM 地址）；格式化 primitive 可放 `shared/web3`，复制交互可共享 |

## Mining Feature（`features/mining`）

业务行为对应线上 OreProtocol（[web3.md](./web3.md)）；线上另有 `全选` 按钮（Q-19）与 "ORI 游戏" 交易挖矿标签（Q-02），新版 Figma 均未包含。

| Component | Figma source | 说明 |
| --- | --- | --- |
| MineMetrics（4 张数据卡 + 显示模式切换） | `2003:485` 等、`2003:1009` | 基于 StatCard |
| BlockGrid / BlockCell | `2003:205` 等、`2003:1038` | 9 种状态见 ui-behavior；Feature 专属，不进 shared |
| RoundResultAnimation | `2003:1405`–`2003:1408` | 动画时序是 Figma 标注事实 |
| DeployPanel（Manual / Auto） | `2003:455`、`2003:1715`、`2003:1832` | 总额计算与按钮状态机是 Feature 逻辑，需单元测试 |
| RoundsStepper | `2003:1907` | 目前只在 Auto 表单出现，保持 Feature 本地 |
| AutominerPanel | `2003:1667` | |
| RewardsCard | `2003:1683` | 命名对应 BNB / 直接 ORI / 精炼 ORI，见 Q-25 |
| MinersList | `2003:508` | |

可能的 Domain：`round` / `block` 同时出现在 Mine、Explore（Mining、Motherlodes 表中的 Round、Block 列）。等数据模型确认后再判断是否建立 `domains/round`，现在不创建。

## 其他 Feature

| Feature | Components | Figma |
| --- | --- | --- |
| `features/points` | PointsBalanceCard（金色六边形图标）、PointsRecordsTable | `2003:2113`、`2003:2123` 等 |
| `features/stake` | StakeForm（Deposit / Withdraw）、StakeSummary | `2003:1961`、`2003:2078` |
| `features/explore` | ExploreStats、MiningTable、MotherlodesTable、BuybacksTable | `2003:2534` |
| About（页面局部） | AboutAccordion 内容 | `2003:2235`、`2003:2359`；复用原 Accordion；正式 /about 对应正文/链接按本轮授权从当前源码恢复，默认全收起（C-61/C-86） |

## 需要统一行为的元素

- **TokenAmount**（代币图标 + 数值）：Mine、Stake、Explore、Miners 大量出现。数值格式化遵守精度规则；代币图标来自 Figma。是 shared/ui 还是代币 Domain，等代币命名确认后判断。
- **加载 / 空 / 错误状态**：设计中都没有（Q-12）。实现前需设计补充，不得自造视觉。

## 旧项目经验（只参考，不迁移代码）

| 经验 | 是否适用于 ORI |
| --- | --- |
| 点遮罩关闭（判断 target === currentTarget） | 适用于 Wallet Sheet（I-11）；由 Radix Dialog 提供 |
| 打开弹层时锁定滚动 | 适用；由 primitive 提供，不手写 `body.style.overflow` |
| safe-area | 适用于 Bottom Navigation 与 Sheet |
| `visualViewport` 软键盘处理 | Mine / Stake 的输入框都在页面内而不在 Sheet 中，暂不需要 |
| H5 底部 Sheet 下拉关闭 | **ORI 设计无证据，不实现** |
| PC 居中 Dialog | 采用；当前用户确认 Shared 默认 H5 bottom、PC center，覆盖旧 PC bottom 方案 |

## F9 shell implementation

`app/_shell/` owns the project shell: full-width sticky Header (PC horizontal padding 120px), semantic Main capped at 500px centered, fixed BottomNavigation capped at 500px centered. Bottom content padding reserves 52px plus the actual device bottom safe area; Header adds the actual top safe area outside its 56px row. `usePathname` drives `aria-current` directly, without a route store.

The current Figma Header artwork is replaceable pending Q-03. Header price data remains absent pending Q-23; no sample price is rendered. F9 originally reserved a disabled Connect button; W1 now composes `features/wallet/WalletHeader` for SDK login and read-only identity, including readiness, cancellation, failure and chain mismatch. The connected capsule follows `2003:999` (110×32, 14×14 icon); W2 adds the Sheet trigger and product disconnect UI; no balance data or export behavior is inferred. Navigation labels use the current Figma English names under the existing en-only locale policy; Q-30 remains open.

## M2 Read-only Board ownership

`features/mine` 持有 MinePage、MineCell、metrics/Miners composition、typed display 与单区块 public Query。25 格 amount/count 不属于 Shared GameBoard/Card/Table；本轮不新增 Shared UI。MineCell 的 default/selected/deployed/combined 是 Figma presentation capability，正式路由仅使用 default，个人部署不读、不推导。唯一新增资产为 Figma 原始 8×8 participation icon；BNB 使用明确文本单位，未确认的 Motherlode/奖励与 SOL 占位图标不导入。

## M2 Full Mine UI correction

同一 `features/mine` 内增加 MineMetrics（仅本地 secondary label 切换）、MineBettingPanel（Manual/Auto）、MineResults（typed table/rows/empty/error/unavailable）、MineAutominerState/MineRewardState（第二张4的静态展示分支）。MinePage 用 feature-local presentation union 组合这些状态；正式 read owner 只传 form 与 W1 的 disconnected/unavailable 投影，不传 running/reward/selection/results fixture。没有新 Shared primitive、API 或 transaction owner。完整状态见 [inventory](./mine-page-state-inventory.md)。
