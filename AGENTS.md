# Codex 仓库执行规范

## 定位

`AGENTS.md` 是 Codex 在本仓库工作的统一执行入口。它规定任务开始时应读取的规范、任务判断方式、可直接执行的范围、必须暂停汇报的情况、验证要求和最终汇报方式。

详细工程规则由 `docs/` 下的专项规范维护。本文件不复制专项规范的完整实现细节。

## 规范规则与项目事实

### 规范性规则的优先级

按以下优先级处理规范性要求：

1. 用户当前明确指令；
2. `AGENTS.md`；
3. 对应的 `docs/*.md` 工程规范；
4. 一般技术惯例。

如果用户当前明确指令与已有工程规范冲突，不得静默绕过规范。必须先说明冲突、涉及的规范和潜在影响，再等待用户决定是修改规范还是将当前任务作为明确例外执行。不得因为实现更简单而自行违反规范。

### 当前项目事实来源

source code、`package.json`、lockfile、config 与 Git working tree 是当前项目真实状态的事实来源。

工程规范描述“应该怎样”，实际代码与配置描述“现在实际上怎样”。二者不一致时，不得静默假设其中一方正确；必须判断规范是否过时或实现是否偏离规范。在可能影响任务结果时向用户报告，不得为了符合旧文档而伪造不存在的当前状态。

一般技术惯例仅作为最低级的补充参考，不得覆盖用户指令或工程规范。

## 任务开始前

### 所有开发任务

开始任何开发任务前，至少读取：

- `AGENTS.md`；
- `docs/architecture.md`；
- `docs/tech-stack.md`；
- 当前任务相关的实际代码、配置与 `package.json`。

不得只根据文档猜测当前项目状态。

### 按任务类型读取专项规范

| 任务类型 | 必须额外读取 |
| --- | --- |
| React、Component、页面开发 | `docs/frontend-rules.md` |
| Figma、UI 还原、Design System | `docs/design-system.md`、`docs/figma-workflow.md` |
| State | `docs/state-management.md` |
| API | `docs/api.md` |
| Web3、Wallet、Contract、Chain | `docs/web3.md` |
| i18n、Locale、Translation、语言切换、多语言 UI、格式化本地化 | `docs/i18n.md` |
| Cloudflare、Runtime、Env、Deploy | `docs/cloudflare.md` |
| Testing、QA | `docs/qa.md` |

如果专项规范尚未创建或只有标题，不得假设其中已存在规则。应遵守现有规范和用户当前指令，并在必要时说明该专项规则尚未定义。

如果任务同时涉及多个领域，必须读取所有相关专项规范，而不是只选择一个主要分类。例如，Figma Swap 页面同时涉及 React、Figma、State、API 和 Web3 时，对应专项规范必须取并集读取。

### read-only task

用户要求检查、审查、review、分析、评估、调研、“看看有没有问题”或“有没有遗漏”时，默认属于 read-only task。

除非用户同时明确授权修改、修复、更新或创建，否则只允许读取文件、检查 Git、运行非破坏性检查，以及报告问题和建议。不得因发现问题而自行修改文件、配置、dependency 或 lockfile。

### 任务判断

执行前必须确认：

1. 任务属于 `app` composition、Domain、Feature、Shared、infrastructure、documentation 或 config 的哪一类；
2. 修改的 owner 是谁；
3. 是否需要新增 dependency、Domain、Feature、Shared module、Provider、environment variable 或 config；
4. 是否会触碰已上线 Feature、Authentication、Wallet、Contract、Funds / Token amount、Production deployment、Secrets 或 Runtime compatibility。

如果架构归属明显不确定，不得为了尽快完成而随意选择目录。必须按 `docs/architecture.md` 判断并在必要时先向用户说明。

### 可直接执行与必须暂停的情况

在用户已明确授权的任务范围内，可直接执行只读检查、任务必要的局部修改、现有脚本验证和 Git 状态检查。

出现以下情况必须暂停并向用户汇报：

- 用户指令与工程规范冲突；
- 高风险的已上线 Feature 结构迁移；
- 架构 owner 无法合理判断；
- 需要未经授权的 deploy、配置 Production Secret、选择 Cloudflare Account 或其他外部账户；
- 需要 commit、push、merge、rebase、force push 或创建 tag，且用户尚未明确授权；
- 发现真实 secret、敏感凭据或疑似泄露风险；
- 验证失败且无法在已授权范围内安全修复。

不得要求用户在聊天中提供密码、API Token、private key 或其他 secret。

## 修改范围与架构边界

Codex 必须：

- 只修改完成当前任务必要的文件；
- 不做与任务无关的重构；
- 不因顺手而格式化整个项目；
- 不因旧代码“不够漂亮”而主动大规模重写；
- 不创建推测性的 Domain、Feature、Shared module 或占位目录；
- 不为了未来可能复用而提前抽象；
- 不将少量局部代码强行提升为 Shared。

不得创建新的顶层 catch-all 目录：

```text
src/utils
src/hooks
src/types
src/stores
src/api
```

模块归属、依赖方向、Domain-to-Domain 与 Feature-to-Feature 规则必须遵守 `docs/architecture.md`。

### 已上线 Feature 保护

如果任务会修改已上线或稳定运行的 Feature，不得仅为重构、提取公共代码、整理目录、复用类型或架构一致性而直接迁移生产代码。

在进行高风险结构迁移前，必须向用户说明：

1. 修改原因；
2. 目标位置；
3. 受影响文件；
4. 行为是否可能变化；
5. 是否存在更低风险方案。

取得用户明确同意前，不执行该迁移。

## 依赖与 Runtime

### 依赖管理

新增 dependency 前必须遵守 `docs/tech-stack.md`。不得因为熟悉、旧项目使用过、npm 流行、实现方便或“以后可能会用”而增加依赖。

新增 dependency 前必须说明：

- 要解决的问题；
- 为什么当前技术栈不能合理解决；
- Core、Baseline、Optional、Domain、Feature 或 project-specific 分类；
- Client / Server 影响；
- bundle 影响；
- Cloudflare Workers compatibility；
- 是否要求 dependency build script。

如果现有技术栈已经能合理解决问题，不得增加功能重叠库。涉及 install、postinstall 或 build script 时，必须遵守 `pnpm` dependency build-script 审批规则；不得为消除 warning 批量允许未知 package 执行脚本。

### Runtime 边界

```text
Local development / build
= Node.js

Production execution
= Cloudflare Workers
```

不得因为代码可在本地 Node.js 运行，就假设它可在 Cloudflare Workers 中运行。任何 Server / Worker dependency 都必须验证 Workers Runtime compatibility；不得因为存在 Node.js compatibility 就假设生产环境拥有完整 Node.js Runtime。

具体 compatibility date、flags、Bindings 和部署配置遵守 `docs/cloudflare.md`。

## Client / Server 与敏感信息

Secret、API key、private credential、backend-only token、private RPC、Cloudflare Binding 和 server-only configuration 不得进入 Client bundle。

不得将敏感值放入 `NEXT_PUBLIC_*`，不得输出、提交、复制真实 secret。

任务需要新环境变量时，必须先判断其属于 Client-visible、Server-only 还是 Worker Binding / Secret。具体环境变量、配置与 API 规则遵守 `docs/cloudflare.md` 和 `docs/api.md`。

## Web3 与金额安全

涉及 Token amount、price、quote、balance、contract integer、decimals、wei、percentage 或 PnL 时，必须遵守 `docs/tech-stack.md` 的精度规则。不得为方便而用 JavaScript floating point 处理价值敏感计算。

Web3 技术选择与职责必须遵守 Privy、Wagmi、Viem 与 `@solana/kit` 的既定边界。不得自行重新引入已明确为非默认方案的重叠技术。

任何真实链上 contract write、Token / native asset transfer、Funds movement 或不可逆外部系统写操作，都不得作为普通 smoke test 或验证步骤自动执行。必须获得用户对该类操作的明确授权，并确认目标 environment。具体 Web3 transaction 规则由 `docs/web3.md` 定义。

## Figma 与 UI

任务涉及 Figma、页面还原、UI component、Design System 或视觉资产时，必须先读取：

- `docs/design-system.md`；
- `docs/figma-workflow.md`。

不得脱离 Figma 数据凭经验猜测 spacing、font size、font weight、color、radius、asset 或 responsive behavior。Figma asset 获取、图片导出规格等细则仅维护在 `docs/figma-workflow.md`，不在本文件重复定义。

如果专项规范未建立，不得自行发明长期设计规范；必须说明缺少的规则，并在当前任务范围内遵守用户明确要求。

## 外部 MCP 工具

相关官方 MCP 可用时，按任务职责优先使用：

- Figma tooling：设计事实、Variables、Component context 与 assets；
- Privy Docs：当前 Privy SDK、Authentication 与 Wallet 官方资料；
- Solana Developer：当前 Solana protocol 与 SDK 官方开发资料；
- Alchemy / QuickNode：任务授权范围内的只读 chain data、RPC 与 infrastructure diagnostics。

MCP 是 Agent tooling，不是应用 Runtime dependency，也不能替代 Viem / `@solana/kit`。项目架构与执行规则以 `AGENTS.md` / `docs` 为准，上游产品事实参考官方资料，仓库现状以 source / package / config 为准；工具输出不得自行覆盖项目规则。

工具可用不等于获准执行外部 mutation。创建钱包、签名、广播交易、修改 endpoint / security / billing 或生产基础设施，必须依据明确任务授权与目标环境执行；不得作为普通 tooling smoke test。

## 代码质量与文档同步

默认要求：

- TypeScript 类型明确，避免无意义的 `any`；
- 不吞掉 error，不保留无用代码或未使用 dependency；
- 不复制既有基础能力；
- 不创建无边界的巨型文件或循环依赖；
- 不使用 Feature-to-Feature deep import；
- 不使用 Domain-to-Domain direct dependency，除非已有明确架构例外；
- 不以减少代码行数为理由牺牲 readability、ownership、type safety 或 Runtime safety。

如果代码变更会使现有规范失真，必须说明涉及的文档与是否需要同步修改。用户当前明确要求不修改文档时，不得擅自修改文档，只能在最终报告中列出待同步项。发现规范已过时时，先报告，不得为了符合旧文档而强行采用明显不适用的实现。

## 验证与 Git

### 验证

完成修改后，必须按修改范围执行必要验证，并优先读取 `package.json` 中真实存在的 scripts。不得假设项目已经配置 `lint`、`test` 或 `typecheck`。

可按任务实际情况执行：

- `pnpm run build`；
- 相关开发验证；
- Workers test deploy；
- 当前已存在的测试命令。

不得每次无条件部署 Production。若某项验证无法执行，必须说明未执行内容、原因与剩余风险。完整 QA 命令矩阵由 `docs/qa.md` 定义。

### Deploy 授权与验证

Production deploy 只有在用户当前任务明确授权时才能执行，不得自动执行。

Test / staging deploy 仅在以下情况可以执行：

- 用户当前任务明确授权；
- 或 `docs/qa.md` / `docs/cloudflare.md` 已定义该任务必须执行此类验证，且目标环境已经明确且不会影响 Production。

否则先向用户汇报。用户已明确授权某次 deploy，且目标环境与 Account 已明确时，不得为同一次操作重复要求确认。

以下情况仍必须暂停：需要选择或切换 Cloudflare Account、Production target 不明确、需要创建或修改 Production Secret，或可能影响已有 Production Worker / resource。

### Git 与工作区

除非用户明确要求，不得自行 commit、push、merge、rebase、force push 或创建 tag。

任何会修改文件的任务，在开始修改前必须检查 Git working tree 状态，至少确认当前有哪些 modified / untracked files，以及哪些修改在任务开始前已经存在。如果本次目标文件已有未提交修改，必须先检查该文件现有 diff，避免覆盖用户原有工作。

任务完成后必须再次检查 diff，只汇报本次实际修改。不得恢复、覆盖或删除任务开始前已有修改。read-only task 不要求为形式而执行全部 Git 检查，应按实际需要检查即可。

不得提交 `.DS_Store`、本地 secret、`.env`、build output 或临时调试文件。若发现这些文件未被 `.gitignore` 正确覆盖，先报告；不得在未授权时顺手修改无关配置。

## 完成任务后的汇报

完成后必须简洁说明：

1. 修改了什么；
2. 修改了哪些文件；
3. 做了哪些验证；
4. 验证结果；
5. 未解决问题、风险、待验证项或文档同步需求。

即使没有修改代码，也必须明确说明。

## 禁止行为

Codex 不得：

- 为最快完成而绕过工程规范；
- 擅自安装替代技术栈；
- 擅自修改生产架构或迁移已上线 Feature；
- 擅自暴露 Secret；
- 擅自将 Server State 放进 Zustand；
- 擅自建立全局巨型 Store、`contracts.ts` 巨型模块或通用 `utils.ts` 垃圾桶；
- 擅自复制旧项目历史技术债；
- 擅自 commit、push 或 deploy；
- 因 Figma 信息获取困难而猜测设计值；
- 为消除 `pnpm` warning 批准未知 dependency build scripts；
- 因本地 Node.js 可运行就默认 Workers 可运行。

## 与专项规范的关系

本文件负责“什么时候读取、什么时候遵守、什么时候停止”，不重复详细业务规则。

详细规则由以下文件维护：

- `docs/architecture.md`；
- `docs/tech-stack.md`；
- `docs/frontend-rules.md`；
- `docs/state-management.md`；
- `docs/api.md`；
- `docs/web3.md`；
- `docs/design-system.md`；
- `docs/figma-workflow.md`；
- `docs/cloudflare.md`；
- `docs/i18n.md`；
- `docs/qa.md`。

后续专项文档完成后，`AGENTS.md` 仍保持统一入口，不复制各文档全文。
