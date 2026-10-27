# Component Inventory

```text
Figma Concept → Component Candidate → Ownership → Reuse Strategy
```

归属规则遵守 `docs/architecture.md` 与 `docs/design-system.md`：视觉相似不等于语义相同；只有去掉业务语义后仍是稳定 UI primitive，且被真实设计证明复用，才进入 `shared/ui`。**本文件不授权提前创建代码**，组件在第一个真实使用它的 Feature 实现时创建。

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
| Sheet / Dialog primitive | `2003:2490` | H5 底部 Sheet；PC 呈现未定（Q-21） | 目前只有 Wallet | 使用 Radix Dialog 或等价 accessible primitive（Portal、ESC、焦点管理、`aria-modal`）。无拖拽关闭证据，不实现 |
| InfoHint（ⓘ） | `2003:1988` 等 | — | Stake Summary、Rewards | 说明内容与交互（tooltip / popover）未设计，暂时只渲染图标或等待确认 |
| Accordion primitive | About 行 `2003:2245` 等 | 展开 / 收起 | 目前只有 About | 可用 Radix Accordion 提供行为，视觉保留在 About 页面局部 |

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
| WalletSheet | `2003:2490` | 余额、导出、接收、地址复制、断开；依赖 Privy 钱包（web3.md）；导出 / 接收见 Q-22 |
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
| About（页面局部） | AboutAccordion 内容 | `2003:2235`、`2003:2359`；内容以线上 About 为准（C-61） |

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
| PC 居中 Dialog | PC 呈现未确认（Q-21） |
