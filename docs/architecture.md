# 架构规范

## 目标

`game-dapp-starter` 采用轻量的 **Next.js App Router + Domain + Feature + Shared** 架构。

该架构的目的是让 DApp 代码靠近其所属的业务上下文，同时明确跨领域基础能力的边界。它应当既适用于小型项目，也能够扩展到同时支持 PC、H5、EVM 与 Solana 的产品。

本规范不是完整的 Feature-Sliced Design、Domain-Driven Design 或 Clean Architecture 实现。除非先明确修订本文档，否则不得引入这些架构的额外分层、命名约定或仪式性流程。

架构遵循以下目标：

- 明确业务代码的归属；
- 让 route 文件专注于组合；
- 防止通用目录演变为无限增长的代码堆放处；
- 让维护者与 AI 辅助开发都能预测模块依赖；
- 在出现真实复用或稳定模型之前，避免过早抽象。

## 顶层结构

Next.js `app/` 目录保留在仓库根目录。除非项目通过明确的架构决策，否则不得迁移到 `src/app/`。

```text
app/                         # Next.js routing and route composition
  globals.css
  layout.tsx
  providers.tsx
  page.tsx
  swap/
  token/

src/
  domains/
  features/
  shared/
  styles/
```

目录仅在包含实际代码时创建。不得将空目录作为未来可能出现的 Feature 或 Domain 占位符。

## `app/globals.css` 与 `src/styles/`：全局样式基础设施

```text
app/
  globals.css            # 唯一全局样式加载入口

src/
  styles/                # 全局样式模块组织目录
```

`app/globals.css` 是 Next.js 唯一的全局样式加载入口，且必须由 `app/layout.tsx` 引入。它可以统一 import `src/styles/` 中的全局样式模块，但不得再建立第二套独立的全局样式入口。

`src/styles/` 用于组织真正的全局样式基础设施，例如：

- CSS reset；
- font definitions；
- global design tokens；
- 全局 CSS Variables；
- Tailwind 相关全局样式；
- 全局通用 animation 与 utility styles。

未来可按实际需要创建如下模块：

```text
src/styles/
  reset.css
  fonts.css
  tokens.css
  utilities.css
```

不得为了占位提前创建空文件或空目录。不得将 Swap、Token、Feature、Domain 或页面级业务专属样式集中放入 `src/styles/`；此类样式必须靠近所属 Feature 或 Domain。

`app/globals.css` 是全局样式入口，`src/styles/` 是全局样式模块组织目录；二者不是重复关系。

## `app/`：路由与组合

`app/` 是框架边界，可包含：

- 路由段与 route handler；
- `layout`、`template`、`loading`、`error`、`not-found` 文件；
- 路由 metadata；
- Domain 与 Feature 的路由级组合；
- 明确的 Server Component 与 Client Component 边界；
- 全局 Provider 入口。

路由文件不得成为业务规则、合约调用、资源 API 或大型有状态 UI 流程的主要存放位置。此类代码应提取至所属 Feature 或 Domain，并由路由进行组合。

路由可以导入 `features`、`domains` 与 `shared` 中的模块，也可以向组合模块传递路由参数、服务端获取的数据及路由专属配置。

## `domains/`：稳定的产品概念

Domain 表示稳定的产品概念，而不是用户动作。典型示例包括：

```text
domains/
  token/
  user/
  pool/
  position/
  order/
```

仅当一个概念具有稳定业务含义，并且满足以下至少一项时，才创建 `domains/<name>`：

- 多个 Feature 独立使用该概念；
- 该概念具有稳定的数据模型、标识符、地址或生命周期；
- 该概念具有独立的查询、展示或业务规则。

满足上述任一标准即可创建 Domain。多个独立 Feature 使用同一概念是常见触发条件之一，但不是创建 Domain 的必要前提。

例如，Token 可作为 Domain，因为其模型、地址、decimals、展示和查询在单一流程之外仍有意义。

不得预先创建推测性的 Domain。尤其是，以下内容默认不是 Domain：

- `swap` 与 `create-token`，它们是用户工作流；
- `wallet`，它通常是 Shared Web3 集成，加上认证或应用组合；
- `chain`，它通常是稳定的 Shared 配置，加上当前会话状态；
- `transaction`，除非它未来成为可持久化、可独立查询与展示的产品记录。

Domain 只包含实际需要的目录，例如 `api/`、`components/`、`lib/` 与 `model/`。Domain 不得依赖 Feature。

## `features/`：用户动作与工作流

Feature 表示用户目标、动作或工作流。示例包括：

```text
features/
  auth/
  swap/
  create-token/
  claim-reward/
  add-liquidity/
```

Feature 拥有其行为专属的代码。它可以包含 `components/`、`hooks/`、`api/`、`model/` 和 `lib/`，但不要求每个 Feature 都具备完整的子目录模板。

例如：

- `features/swap` 负责 quote 获取、swap 表单状态、授权与提交流程，以及 swap 专属的合约交互；
- `features/create-token` 负责创建向导、校验、部署流程及创建专属的 ABI 交互；
- `features/auth` 负责围绕 Privy 的产品登录流程；Privy 仍是认证与钱包事实的来源。

Feature 私有代码默认保留在 Feature 内。Feature 可以依赖 Domain 与 Shared，但不得依赖另一个 Feature 的内部实现。

当一个 Feature 需要使用另一个 Feature 中的 Type、API、组件或工具函数时，必须依次判断：

1. 若它描述稳定的业务概念，应移动到所属 Domain；
2. 若它完全不含业务语义，才可移动到 Shared；
3. 若关系是明确且仅属于特定路由的，应在 `app/` 中组合两个 Feature。

不得仅因复用方便而创建 Feature-to-Feature 的直接依赖。

## `shared/`：无业务语义的基础能力

`shared/` 存放不含具体产品业务语义的可复用能力。

```text
shared/
  api/
  ui/
  lib/
  config/
  web3/
  i18n/
```

Shared 代码不得导入 `domains` 或 `features`。其公开名称与内容必须保持业务中立。出现 `swap`、`tokenLaunch`、`claimReward`、`poolPosition` 等名称，通常意味着代码应归属到其他层级。

`shared/lib`、`shared/ui` 以及任何 Shared 类型模块都必须严格控制。添加模块前，应明确其实际调用方，并确认其行为不含业务语义。普通模块仅被一个 Feature 使用时应留在该 Feature 内；明确成立的 Starter / Design System UI primitive 是例外，不要求等第二个 Feature。去掉业务内容后仍完整成立、其他业务可直接复用，才符合该例外。

## 依赖规则

默认允许的依赖方向如下：

```text
app      -> features, domains, shared
features -> domains, shared
domains  -> shared
```

以下依赖被禁止：

```text
shared  -> domains
shared  -> features
domains -> features
domains -> domains
```

默认禁止 Feature-to-Feature 直接依赖，且禁止一个 Feature deep import 另一个 Feature 的内部文件。在考虑此类依赖前，必须优先判断共享代码是否实际属于 Domain 或 Shared。

未来若存在真实业务上的 Feature 组合关系，必须通过明确的公开入口建立依赖，并记录依赖原因；它不是默认复用方式。本规范不要求现在建立 `index.ts` 或 barrel export，模块 Public API 的具体实现方式由后续前端开发规范决定。

默认禁止 Domain-to-Domain 直接依赖，且禁止形成 Domain 之间的循环依赖。若 Domain A 需要 Domain B 中的模型、规则或能力，必须依次判断：

1. 是否是不含业务语义的基础能力，应下沉到 Shared；
2. 是否属于更高层的 Feature，由 Feature 组合多个 Domain；
3. 是否属于 route 或 application composition，由 `app/` 负责组合。

不得仅为了复用方便形成 `domains/a -> domains/b`。未来若确实存在合理的 Domain-to-Domain 依赖例外，必须作为明确的架构决策记录原因；它不是默认模式。

## 提升规则：先局部，后提升

对类型、hook、API、组件和工具函数采用以下提升规则：

1. 优先将代码保留在当前拥有它的 Feature 中；
2. 当代码满足 Domain 创建标准时，提升至其所属 Domain；多个相互独立的 Feature 需要同一稳定业务模型或规则，是常见但非必要的触发条件；
3. 仅当代码完全不含业务语义时，提升至 Shared。

Shared UI Reuse Audit 按语义而不是单纯次数判断：

1. 明确的 Starter / Design System primitive：即使只使用一次也可直接进入 `src/shared/ui`。
2. 业务无关且跨 Feature 复用：进入 Shared。
3. 仅同 Feature 内重复：保持 Feature-local component。
4. 含业务内容、数据或流程语义：保持所属 Feature / Domain；跨 Feature 重复也不自动变成 Shared。

Modal / Overlay Shell 是已认可的基础 primitive：持有 backdrop、positioning、header/title/close slots、ESC、overlay click、focus/accessibility、scroll lock 和 responsive/safe-area 的通用能力；业务内容以 children 注入。默认设计从已验收 canonical implementation 提取，由全局 Design System tokens 与 Shared 持有；调用方仅覆盖特殊视觉，不重复传默认 Header/close icon。Shared 不识别 Wallet、余额或 Export。

Resilient / Fallback Image 也是允许的内容图片 primitive，适用于 game/project/activity/list 内容图，可管理 loading/error、网站默认 fallback、object-fit/sizing；retry 仅在实际需要时添加。它不是全站图片强制替代，不默认用于 Avatar、Logo、Token、导航图标或装饰 SVG。必须先有明确 fallback 资产/配置和真实使用范围，不凭空选默认图片。

该例外不授权预建 Card、Table、Section、Badge、Accordion、StatCard 或业务行。它们仍须有跨业务成立、Design System 明确认可或 Starter 长期实际需要的依据。不得为了假设中的未来复用而批量提取代码。

## API 归属

### Shared HTTP 基础能力

`shared/api/` 仅负责传输层关注点：

- API 客户端创建与 base URL 解析；
- 请求头与认证传输；
- 通用响应类型；
- 通用错误规范化。

其中不得存放产品资源 API 或用户动作 API。

### Domain 资源 API

稳定资源 API 属于其对应的 Domain：

```text
domains/token/api/get-token-list.ts
domains/token/api/get-token-detail.ts
```

### Feature 动作 API

用户动作或工作流相关 API 属于其对应的 Feature：

```text
features/swap/api/get-swap-quote.ts
features/swap/api/submit-swap.ts
```

该边界同样适用于响应映射：通用响应与传输处理归属 `shared/api`，资源映射归属 Domain，动作专属映射归属 Feature。

## Web3 归属

不包含具体产品业务语义和业务动作的通用 Web3 基础设施归属 `shared/web3/`：

```text
shared/web3/
  evm/
  solana/
```

其可包含：

- RPC 与客户端配置；
- wallet SDK adapter；
- 通用 transaction lifecycle 基础能力；
- 通用 contract helper；
- 通用 Web3 错误规范化；
- 单位转换基础能力。

全局 chain metadata、RPC、explorer 与 native currency 等配置归属 `shared/config/`。真正跨多个业务模块共享的公共 contract 配置也可以进入 `shared/config/`。环境变量用于选择不同环境的值，而不用于取代稳定、受源码管理的配置。

Domain 专属 contract address 与 ABI 必须靠近对应 Domain；Feature 专属 contract address、ABI 与 contract interaction 必须靠近对应 Feature。地址固定本身不是进入 Shared 的理由。

`buyToken`、`claimReward`、`createToken`、`addLiquidity` 等业务动作属于相应 Feature。不得形成全局、多用途的 `contracts.ts` 模块。

## 状态归属

选择能够代表真实来源的最小状态机制：

| 状态类别 | 默认归属 |
| --- | --- |
| 认证与钱包事实 | Privy |
| Server-only Remote Data | Server Component / framework data flow |
| Client-managed Server State、cache 与 refetch | TanStack Query |
| 局部 UI、表单与临时交互状态 | React local state |
| 真正跨组件或跨 route 共享的 Client State | Zustand |

全局使用不等于 Shared。跨 Feature 的业务状态应优先寻找其所属 Domain，并将状态归属到该 Domain。状态应归属到其业务所有者，例如：

```text
features/swap/model/
domains/token/model/
```

若确实不存在合理的 Domain，app-wide Client State 必须明确 owner、消费者范围与存放位置。不得因为状态跨页面使用，就自行创建顶层 `src/stores/` 作为兜底目录。

## 类型归属

类型应与拥有其语义的模块放在一起：

```text
domains/token/model/types.ts
features/swap/model/types.ts
shared/api/types.ts
```

不得创建或扩张全局 `src/types` 目录。只有不含产品业务含义的基础类型才可进入 Shared。

## 数值与单位处理

数值逻辑按语义归属放置：

```text
shared/lib/number/       # generic formatting and BigInt/Decimal primitives
domains/token/lib/       # token-decimal and token-amount semantics
features/swap/lib/       # quote and swap-specific calculation rules
```

不得在价值敏感的 Token 金额计算中使用 JavaScript 浮点数运算。所属模块必须在每个转换边界明确单位与 decimals。

## UI 归属

组件目录命名统一如下：

- `shared/ui/`：不带业务语义的 Design System 与基础 UI；
- `domains/<name>/components/`：Domain 组件；
- `features/<name>/components/`：Feature 组件。

不得同时使用 `domains/*/ui` 与 `domains/*/components` 两种目录命名。

`shared/ui/` 仅包含不带业务语义的 UI 组件，例如：

- `Button`;
- `Modal`;
- `Input`;
- `Tooltip`;
- `Skeleton`.

展示或操作 Token、pool、position、swap 或其他业务概念的组件，应保留在对应的 Domain 或 Feature 中。组件“可以复用”本身不足以成为将其提升到 `shared/ui` 的理由。

## 已上线 Feature 的变更保护

当现有生产 Feature 代码看起来适合提升为 Domain 或 Shared 模块时，不得仅为了架构整洁而迁移它。

在提出或执行该迁移前，Codex 必须：

1. 说明归属问题与目标位置；
2. 列出受影响文件；
3. 说明运行时行为是否可能变化；
4. 在修改已上线 Feature 前取得确认。

代码“应该共享”不意味着必须立即重构。

## 评审清单

在新增或移动模块前，确认以下问题：

- 它是稳定的产品概念、用户工作流，还是无业务语义的基础能力？
- 目标目录是否与该归属一致？
- 此次提取是否由当前调用方支持，而非源于预期中的未来复用？
- 导入方向是否仍然符合规则？
- 维护者或 Codex 是否能从模块位置找到完整的业务上下文？
- 此变更是否保持已有生产 Feature 的运行行为？
