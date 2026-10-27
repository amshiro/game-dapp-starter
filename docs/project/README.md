# ORI 项目文档入口

本目录记录 **ORI 项目专属事实**：需求、设计规范、页面与状态、组件归属、资产、交互和未决问题。

```text
docs/project/*  → 项目事实（ORI 是什么、长什么样、做什么）
docs/*.md       → Starter 全局工程规范（如何实现）
```

两者冲突时：项目视觉、布局、业务规则以本目录为准；架构、依赖、安全、精度、Runtime 规则仍以全局 `docs/*.md` 为准。不得把本目录的 ORI 颜色、500px 等事实写回全局规范。

## Figma

- 文件：[ORI 、BURY](https://www.figma.com/design/M6P7gqrEDANm28YSfvOm93/ORI-%E3%80%81BURY)（fileKey `M6P7gqrEDANm28YSfvOm93`）
- Node 链接格式：`https://www.figma.com/design/M6P7gqrEDANm28YSfvOm93/ORI-%E3%80%81BURY?node-id=<id 中的 : 换成 ->`

| Page | Page ID | 角色 |
| --- | --- | --- |
| ORI-AI测试 | `2003:178` | **当前业务 UI Source of Truth**。页面、状态、表单、弹层均从这里读取。 |
| ORI · Design Specification | `2007:146` | 上一轮整理出的规范页。**含已知错误**（见下文），不得高于真实业务稿和用户确认事实。 |
| 颜色规范、Logo | `1:4529` | 品牌资产参考。`确认` frame `1:4544` 为确认资产，`废弃` frame `1:4625` 为废弃资产。 |
| BURY | `0:1` | 历史设计 / 旧稿。默认不纳入实现，包括其中的 1440px PC 双栏稿。 |

### 已知 Figma 问题

- `ORI · Design Specification` 节点 `2007:254` 写着 `PC: center at 375 px`。用户已决定不修改 Figma；实现以 [design-system.md](./design-system.md#layout) 的 PC 500px 居中规则为准。
- 同页 error 色板写的 `#FF3D3D` 与真实设计不符，真实值为 `#FF3C4C`。
- 同页 variable collection `ORI / Primitives`、`ORI / Tokens` 与 4 个 `ORI / Documentation / *` text style 是上一轮 Agent 为文档创建的，**没有绑定任何业务节点**，不是设计师事实。
- `ORI-AI测试` 中的 SOL 图标 / 文案、Solana 叙述与部分代币图片是**设计占位**（User Confirmed），实现时替换为 BNB、ORI、起源的真实资产与文案。

## 线上产品与旧代码

| 来源 | 角色 |
| --- | --- |
| `https://ori.supply`（线上） | 当前线上产品：真实业务行为、合约、API、实时、About 规则的最高运行证据 |
| `/Users/shiro/Documents/git-project/ori-website`（`master`） | **ori.supply 的源码**：链配置、ABI 文件、合约调用、API 定义 |
| `/Users/shiro/Documents/git-project/origin-website` | 前代产品 **Origin.fun** 的源码（共享后端、Privy App 与起源代币），**不是** ori.supply 的源码 |

调查结论见 [legacy-runtime-audit.md](./legacy-runtime-audit.md)。

## Source of Truth 优先级

冲突时按顺序，低优先级不得覆盖高优先级：

1. 用户明确确认
2. 当前线上真实行为（`ori.supply`）
3. ori.supply 源码 `ori-website`（Runtime 与业务逻辑证据）
4. `ORI-AI测试` Figma（当前视觉设计）
5. 线上 About 对外说明
6. `颜色规范、Logo`（品牌 / 资产参考，需与线上品牌核对）
7. `ORI · Design Specification`
8. `BURY` 历史稿；`origin-website`（前代 Origin.fun，仅历史证据）
9. Agent 推断

分领域：视觉冲突以新版 Figma 为准；链、合约、API、Runtime 冲突以线上运行与代码为准；产品文案与玩法解释以线上 About 为重要证据。

## 文档结构

| 文件 | 内容 |
| --- | --- |
| [overview.md](./overview.md) | 项目是什么、结构、主流程、命名情况 |
| [requirements.md](./requirements.md) | 需求 Source of Truth：Confirmed / Inferred / Unknown |
| [design-system.md](./design-system.md) | 颜色、字体、布局、圆角、组件视觉规则、H5 / PC |
| [figma-inventory.md](./figma-inventory.md) | 全部 Frame / 状态稿与 node ID |
| [routes.md](./routes.md) | Frame → Route / View / State / Sheet 映射 |
| [components.md](./components.md) | 组件候选与 ownership |
| [ui-behavior.md](./ui-behavior.md) | 交互与状态行为 |
| [assets.md](./assets.md) | Logo、Token、图标等真实资产 |
| [web3.md](./web3.md) | BSC、合约地址与 ABI 事实、钱包模型、交易概念 |
| [api.md](./api.md) | 后端 API 的前端结论：envelope、端点对照、差异、地址与数值策略、实时频道 |
| [api-reference/](./api-reference/README.md) | **后端正式 API Contract**（`user-api.md`、`activity-api.md`），后端原文 |
| [legacy-runtime-audit.md](./legacy-runtime-audit.md) | 线上与旧代码的历史证据（不是实现规范） |
| [environment.md](./environment.md) | Environment Contract V1：变量分类、Dev / Prod 矩阵、Secret 边界 |
| [decisions/](./decisions/) | 架构决策记录（ADR），例如 [ADR-001 Runtime Environments](./decisions/ADR-001-runtime-environments.md) |
| [open-questions.md](./open-questions.md) | 未确认问题：看到 Unknown 时停止猜测 |
| [implementation-plan.md](./implementation-plan.md) | Foundation 阶段状态与范围索引 |
| [feature-task-graph.md](./feature-task-graph.md) | F10 Feature Tickets、依赖、Ready/Blocked、人工 Gate 与下一张任务 |
| [r0-evidence-audit.md](./r0-evidence-audit.md) | 后续 Feature 的静态证据、冲突与未解锁项；不代表新 API/RPC/WS 验证 |

## Agent 推荐阅读顺序

```text
AGENTS.md
→ docs/project/README.md
→ docs/project/overview.md
→ docs/project/requirements.md
→ docs/project/environment.md
→ docs/project/design-system.md
→ docs/project/web3.md
→ docs/project/api.md
→ docs/project/api-reference/（实现具体端点时读取对应接口原文）
→ docs/project/ui-behavior.md
→ 当前 Feature 对应的项目文档（routes / components / assets / figma-inventory / decisions）
→ docs/project/open-questions.md（确认要做的事没有被 Unknown 阻塞）
→ docs/project/implementation-plan.md（确认 Foundation 状态）
→ docs/project/feature-task-graph.md（选择当前 Feature Ticket，确认依赖、Scope、QA 与人工 Gate）
→ 对应的全局 docs/*.md
```

实现具体 UI 前，仍须用 Figma MCP 按 `figma-inventory.md` 中的 node ID 读取精确设计值，本目录只是索引和规则，不替代 Figma 节点数据。

## 文档维护规则

- 记录稳定事实，不记录工作日志、commit、一次性 QA 结果。
- 重要事实带来源：`User Confirmed`、`Figma: <page> / <node>`、`Inferred`。
- 设计变化时更新事实本身，不追加历史描述。
- 问题被确认后，从 `open-questions.md` 移到 `requirements.md` 并注明来源。
