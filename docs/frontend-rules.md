# 前端开发规范

## 目标与边界

本文规定使用 Next.js App Router、React、TypeScript 与 Tailwind CSS 开发页面和组件时的编码规则。目标是在不增加不必要仪式性流程的前提下，得到清晰、可维护、易审查且适合长期协作与 Codex 开发的前端代码。

旧项目可作为生产经验的查漏来源，但不是本规范的设计前提。不得仅因旧项目存在某种实现，就将其视为新项目的默认做法。

本文负责：

- React 与 Next.js 页面、组件和 Hook 的编码边界；
- Server Component 与 Client Component 边界；
- 页面组合、Props、事件、浏览器 API 与 Provider 的前端规则；
- Tailwind、`className`、响应式布局与 UI 状态呈现原则；
- import、模块 Public API、deep import、文件与代码命名；
- 图片在 React 代码中的使用，以及基础可访问性；
- 防止 giant component、giant hook 与 giant provider。

本文不重复定义以下专项内容：

| 主题 | 规范来源 |
| --- | --- |
| Domain、Feature、Shared 的目录与依赖架构 | `docs/architecture.md` |
| 技术选型、依赖与 Runtime | `docs/tech-stack.md` |
| Zustand 与 TanStack Query 的详细用法 | `docs/state-management.md` |
| HTTP、API 协议与数据层 | `docs/api.md` |
| Wallet、Contract、Chain 与 Web3 交互 | `docs/web3.md` |
| 字体、颜色 Token、Design Token 与 Modal 视觉规范 | `docs/design-system.md` |
| Figma 读取与资源导出 | `docs/figma-workflow.md` |
| Cloudflare Runtime、环境变量与 Bindings | `docs/cloudflare.md` |
| 测试策略 | `docs/qa.md` |

当专项规范尚未建立时，不得擅自把其详细规则复制到本文或假定其已经生效。

## Server Component 与 Client Component

### Server Component 优先

项目使用 Next.js App Router。未声明 `"use client"` 的组件默认按 Server Component 设计。

只有确实需要客户端 React 能力时，才将最小必要组件声明为 Client Component。典型原因包括：

- 使用 `useState`、`useEffect`、`useRef` 或 `useReducer`；
- 处理浏览器事件与交互；
- 使用浏览器 API、DOM 测量、动画或手势；
- 使用 Privy、Wagmi 等 Client-side hooks；
- 组合 Client-side Provider；
- 依赖只能在浏览器运行的库。

不得因为实现方便、不了解 Server Component，或某个后代组件需要交互，就将整个页面、路由段或 Feature 根节点声明为 `"use client"`。

应将 Client boundary 下沉到真正需要交互的组件：

```text
Server Page
  ↓
Server composition
  ↓
Client interactive component
```

而不是：

```text
page.tsx
  "use client"
  ↓
整个路由树都在客户端执行
```

### Client boundary 约束

Client Component 可以导入 Client-compatible 代码，但不得：

- 导入 server-only module；
- 读取 Server Secret、Cloudflare Server-only Binding 或服务端私有配置；
- 直接依赖只能在 Workers 或 Server Runtime 中运行的实现；
- 向浏览器传递服务端句柄、私有对象或其他不符合 React Server Components 传递要求的值。

如果一段能力同时需要 Server 与 Client，应拆分边界：Server 侧保留私有读取、鉴权或 Runtime 相关逻辑，Client 侧只接收完成页面渲染或交互所必需的公开数据。不得为复用建立混合 browser API、Secret、server fetch 与 wallet state 的万能模块。

Client Component 不得定义为 `async` React Component。客户端异步数据、动作状态与交互应通过合适的客户端机制处理，而不是将组件本身变为异步函数。

### Hydration 一致性

Server Render 与 Client 首次 Render 的可见输出必须保持可确定且一致。不得在会参与 SSR / hydration 的初始 render 中直接使用可能导致输出不一致的数据，例如：

- `Date.now()`；
- 由 `new Date()` 产生的当前时间展示；
- `Math.random()`；
- 随机 ID；
- Client timezone；
- viewport width；
- 由 `window` 或 `navigator` 派生的信息；
- 仅存在于客户端的 storage value。

如果 UI 确实依赖客户端环境，应建立正确的 Client boundary、在 hydration 后处理客户端差异，或使用框架 / React 提供的稳定机制。不得使用整页 `mounted` guard 隐藏本可 Server Render 的页面，作为通用 hydration 修复方案。

## 路由与页面组合

`app/` 的职责由 `docs/architecture.md` 定义：它负责 route 与 composition。

例如 `app/swap/page.tsx` 可以负责：

- `params` 与 `searchParams`；
- metadata；
- 路由级 Server-side concerns；
- Feature 与 Domain 的组合；
- 路由级 `loading`、`error` 与 `not-found` 呈现。

路由文件不得成为以下内容的主要存放位置：

- 巨型业务组件；
- API client 集合；
- contract interaction；
- Zustand store；
- 大型表单实现；
- 巨型 UI implementation。

当路由逻辑复杂时，应将实现放回对应 Feature 或 Domain，再由 route 文件组合。页面不能为了减少文件数量而吞并其拥有模块的业务逻辑。

### 站内与外部导航

Next.js App Router 内部页面跳转优先使用 `next/link` 或 Next.js navigation API。不得为了普通站内跳转使用 `window.location.href`，以免产生不必要的完整页面刷新。

外部网站、下载链接、页面锚点、非 Next.js 页面资源和浏览器原生协议链接可以使用原生 `<a>`。使用 `target="_blank"` 打开外部页面时，必须保证 opener 隔离，例如使用安全的 `rel="noopener"`。

`noreferrer` 不作为无条件默认要求；仅当产品、安全或隐私策略要求不发送 referrer 时使用。不得将 API endpoint 当作页面导航。

## 组件设计

### 按职责拆分

不要将一个 Figma Frame 机械地映射为一个 React Component，也不要将整页所有内容都写在单个组件中。

组件拆分依据是独立职责、交互、状态、复用价值、业务语义与维护成本，而不是单纯的视觉层级或文件行数。一个组件应有一个能清楚说明的主要责任。

当一个组件同时包含 API fetching、大量业务计算、多个 Modal、复杂 Form、wallet interaction、多块独立 UI 或大量条件分支时，应重新判断拆分边界。优先将独立的业务行为、状态机与可独立理解的 UI 区域分离。

不设置机械的行数上限。审查时应关注职责数量、代码可读性、修改影响范围与 owner 是否清晰。

### 避免过度组件化

不应为了缩短文件而制造没有独立责任的组件，例如 `HeaderLeft`、`HeaderRight`、`CardTop` 或 `CardBottom`。只使用一次、没有独立行为、拆出后只能转发大量 Props，或无法表达清晰语义的简单 JSX 可以保留在父组件内。

组件拆分服务于理解和维护，不服务于组件数量。

### Shared UI、Domain Component 与 Feature Component

`shared/ui/` 只放不带产品业务语义的 Design System 基础组件，例如 Button、Input、Modal、Tooltip、Skeleton、Tabs 与基础 Form primitive。

表达稳定产品概念的组件属于 Domain，例如 `TokenAvatar`、`TokenAmount`、`PositionCard`。表达用户动作或工作流的组件属于 Feature，例如 `SwapForm`、`ClaimRewardModal`、`CreateTokenForm`。

业务组件即使出现在多个页面，也不得仅因复用次数而直接提升到 `shared/ui/`。归属必须遵守 `docs/architecture.md` 的 Domain、Feature 与 Shared 判断标准。

## Props、事件与数据不可变性

### Props 设计

Props 必须具有明确类型，并且只表达组件真正需要的输入。避免将大型 object 无差别下传、为假设中的未来需求预留大量 optional prop，或通过不断叠加 boolean prop 改变组件语义。

当多个 boolean 实际表达明确变体时，优先考虑 `variant`、`size`、`placement` 或 `intent` 等语义化属性。不要为了形式强行创建 Variant System；基础组件的具体 variant 机制由 `docs/design-system.md` 定义。

### 事件命名

组件内部处理函数使用 `handle` 前缀，对外 callback prop 使用 `on` 前缀，并表达真实业务动作：

```ts
function handleSubmit() {}
function handleSelectToken() {}

type SwapFormProps = {
  onSubmit: () => void;
  onSelectToken: (tokenId: string) => void;
};
```

不得使用 `clickFn`、`doIt`、`submitFun`、`handle1` 或 `callback2` 等无法说明意图的名称。

### Boolean 命名

Boolean 应使用 `is`、`has`、`can` 或 `should` 前缀，例如 `isLoading`、`hasBalance`、`canSubmit`、`shouldShowWarning`。不得用 `flag`、`open1`、`show2` 等模糊名称表达状态。

`status`、`type` 并非天然禁止；当它们确实表示有穷状态或分类时，应使用明确的 union、enum 或可读名称，而不是伪装为 Boolean。

### 输入不可变性

Component 与 Hook 不得直接 mutation 外部传入的 Props、query data、config 或 Domain model。需要派生结果时应创建新值；需要更新远端或共享状态时必须使用其正式的更新入口。

### React 19 的 `ref` 与 imperative API

当前项目使用 React 19。新的 Function Component 可以直接将 `ref` 作为 prop 接收；新代码不得因为旧 React 习惯而机械使用 `forwardRef`。

```ts
type TextInputProps = React.ComponentPropsWithRef<"input">;

function TextInput({ ref, ...props }: TextInputProps) {
  return <input ref={ref} {...props} />;
}
```

`forwardRef` 只在第三方兼容、legacy integration 或其他明确兼容需求下保留，并必须说明原因。不得为了方便暴露大量 imperative component API。

`ref` 主要用于确实需要的 imperative behavior，例如 focus、scroll、DOM measurement 或第三方 imperative integration。能通过普通 Props 与 state 表达的交互，优先采用 declarative API；`useImperativeHandle` 同样不得作为普通组件控制方式滥用。

## TypeScript 与列表渲染

TypeScript 应用于明确边界，而不是用类型标注掩盖不确定性。Component Props、对外暴露的函数、可复用 Hook 的返回值、状态机与关键业务输入必须具有可理解的类型；简单局部值可依赖 TypeScript 的正确推导。

不得把 `any` 作为开发捷径。外部输入、未知 error、第三方返回值或未验证的 JSON 应先使用 `unknown`，经校验或收窄后再使用。不得通过不加说明的类型断言、`as any` 或非空断言绕过真实的空值、边界或兼容性问题。

渲染列表时必须提供稳定且反映数据身份的 `key`。数据会插入、删除、排序或过滤时，不得使用数组下标作为 `key`；不能将随机值作为 `key`。

## Hook 与 React 状态

### Hook 的职责

自定义 Hook 应解决一个清楚的问题，例如可复用的 React behavior、Client lifecycle、结合 React state 的 Feature logic，或对基础 Web3 / API 能力的 React 层组合。

Hook 不是无处安放逻辑的容器。若一个 Hook 同时编排 API、wallet、Modal、notification、calculation、navigation、Form 与 transaction，应先按职责拆分，明确哪个逻辑属于 Feature、Domain、Shared、组件事件或纯函数。

纯函数不应仅为命名一致性而包装为 Hook：

```ts
// 正确：不依赖 React。
formatAmount(value);
calculatePrice(amount, price);
normalizeAddress(address);
```

只有确实依赖 React lifecycle、state 或其他 Hook 的逻辑才使用 `useXxx`。

### Render purity 与外部副作用

React Component 的 render 阶段与 Custom Hook 的执行必须保持 purity。不得在函数执行期间直接产生外部副作用，包括：

- 写入 `localStorage` 或 `sessionStorage`；
- 修改外部可变对象或模块级状态；
- API mutation；
- contract write 或 transaction；
- Toast；
- imperative navigation；
- DOM mutation；
- analytics / tracking SDK side effect；
- subscription registration。

这些操作必须按实际语义放在 event handler、mutation callback、framework lifecycle，或确实用于同步外部系统的 `useEffect` 中。

不得为了绕开 purity 将业务动作随意放入 `useEffect`；`useEffect` 仍只用于下文定义的外部系统同步场景。

### Local State 与 Derived State

局部 UI 状态优先使用 React local state，例如输入值、当前 Tab、展开状态和仅影响当前组件树的 Modal 开关。Server State 不得复制进入 Zustand；认证和钱包事实不得复制为另一套 Privy 权威状态。具体状态管理规则由 `docs/state-management.md` 定义。

能从现有 Props 或 state 推导的值，默认不再保存第二份 state。例如 `canSubmit`、`totalValue`、`isEmpty` 与 `displayAmount` 应优先在 render 中推导。不得为了同步派生值而建立 effect chain：

```ts
// 应避免：B 可以直接由 A 推导。
useEffect(() => {
  setB(calculateFromA(a));
}, [a]);
```

只有当该值具有独立、可持久或可被用户改变的状态语义时，才保存为独立 state。

### `useEffect`

`useEffect` 用于将 React 与外部系统同步，例如 DOM、browser API、subscription、imperative SDK 或外部 lifecycle。它不是通用业务流程、数据派生或事件编排工具。

能在 render、事件处理函数、派生值、TanStack Query 或框架生命周期中完成的逻辑，不应无理由放入 `useEffect`。应避免：

```text
state A
  → effect
  → state B
  → effect
  → API
  → effect
  → state C
```

每个 effect 必须有清晰的同步对象、依赖与 cleanup 需求。订阅、定时器、事件监听器和 DOM 副作用必须在需要时正确清理。

Effect 的 setup 与 cleanup 必须能够安全地重复执行。不得假设某个 Effect 在组件生命周期中只会执行一次。

不得使用 `useEffect(() => { ... }, [])` 自动触发一次性业务动作，例如自动提交表单、API mutation、contract write、transaction、资产转移、Toast 业务结果、持久化业务写入，或具有业务副作用的 analytics 操作。真正由用户行为触发的动作应优先放在 event handler、mutation lifecycle 等明确入口。

Effect 仍只用于外部系统同步；不得为了绕开 render purity 将业务动作随意塞入 `useEffect`。

### `useMemo`、`useCallback` 与 `memo`

不得机械地将每个值或 handler 包装为 `useMemo`、`useCallback` 或 `memo`。仅在存在明确收益时使用，例如昂贵计算、必须稳定的引用、第三方 API 要求，或已经定位的 render 性能问题。

优化代码应保留其必要性；不能以增加依赖数组和阅读成本为代价换取假设中的性能提升。

## Browser API 与本地持久化

使用 `window`、`document`、`localStorage`、`sessionStorage`、`navigator` 或 DOM API 前，必须确认代码位于正确的 Client boundary。

不得在模块顶层或服务端可执行的 render 路径直接访问 browser-only API。不要将 `typeof window !== "undefined"` 作为把 Server 与 Client 代码混在同一模块中的万能补丁；逻辑本质属于浏览器时，应建立正确的 Client boundary。

不得为了方便将业务数据全部写入 `localStorage`。严禁持久化 Secret、private key、Authentication truth 或 backend credential。确有 persistence 需求时，必须明确数据用途、生命周期、敏感性，以及 version 与 migration 风险；具体 persistence 机制遵守 `docs/state-management.md`。

### 不可信 HTML 与 XSS 边界

业务代码默认禁止直接使用 `dangerouslySetInnerHTML`。只有内容来源被明确确认可信，或已经经过项目认可的安全净化流程时才允许使用，并必须说明原因。

Token metadata、链上 description / metadata、Backend 返回的富文本、URL param / searchParam、用户输入和第三方 API 文案等外部数据不得直接作为 HTML 注入。外部字符串默认作为普通文本渲染。

本文不指定 sanitizer dependency。未来存在真实富文本需求时，必须按 `docs/tech-stack.md` 的 dependency rule 评估。

## Tailwind 与样式

### 基本原则

Tailwind 是默认样式实现方式。普通布局和静态视觉样式应优先使用 Tailwind utility classes，不得在业务页面大量使用 `style={{ ... }}`。

inline style 仅适用于动态运行时值、CSS Variable 或第三方组件的必要接口。若复杂视觉效果无法清晰表达为 utility class，可以使用靠近所属组件的局部样式；不得将业务样式堆放到全局样式目录，具体边界遵守 `docs/architecture.md`。

### Design Token 与 arbitrary value

当颜色、spacing、radius、font 或其他值已经在 Design System 中注册时，必须使用相应 Token 或 Tailwind semantic class，例如 `text-primary`、`bg-surface`、`border-border`、`text-positive`、`text-negative`。

不得在业务页面反复使用 `text-[#AEF31F]`、`bg-[#151515]`、`border-[#292929]` 等具体值替代已存在的语义 Token。若设计值尚未被定义为 Token，不得为了消除 hardcode 擅自制造假 global token；应判断它是一次性局部值，还是值得由 Design System 收录的稳定语义。

Tailwind arbitrary value（如 `w-[327px]`、`mt-[13px]`、`text-[17px]`）不是禁止项。Figma 精确还原或确有局部需求时可以使用；但当同一值重复出现、具有明确设计语义或已有 Token 时，必须改用合适的 Token 或 class。不得为了让 className 看似统一而用 arbitrary value 替代已经存在的语义表达。

### 动态 Tailwind class

不得依赖运行时字符串拼接生成 Tailwind class，例如：

```ts
`bg-${color}`;
`text-${variant}`;
`grid-cols-${count}`;
```

这类 class 可能无法被 Tailwind 的静态分析稳定发现。动态视觉需求优先使用显式静态 mapping、已定义的 component variant、semantic Design Token、CSS Variable 或完整且静态可扫描的 class 名：

```ts
const colorClass = {
  positive: "text-positive",
  negative: "text-negative",
}[status];
```

本规则不禁止 Tailwind arbitrary value；其使用继续遵守本节已有规则。

### `className` 可读性

`className` 应按布局、尺寸、视觉、状态与响应式等稳定顺序组织，并在条件分支复杂时提取局部可读变量或组件变体。不要为了压缩行数把难以审查的条件字符串堆成一行。

简单条件 class 可以直接表达。只有项目已按依赖规则引入并确定统一方式后，才使用相应的 class 合并工具；不得为一次条件拼接新增依赖或自行引入第二套 class 合并策略。

## 响应式与 UI 状态呈现

### Responsive

页面默认采用 mobile-first。纯布局、间距、展示或隐藏差异优先通过 Tailwind 响应式 class 实现。不得仅为根据 viewport 改变布局而将整页改为 Client Component。

只有 PC 与 H5 的交互结构、焦点行为或组件形态确实不同，例如 desktop Modal 与 mobile Drawer，才使用媒体查询 Hook 或不同组件分支。具体断点、容器宽度和视觉尺寸由 Design System 决定；不得复制旧项目的断点作为隐含固定标准。

### Loading、Empty、Error 与 Success

异步资源与用户动作必须有清晰的 UI 状态。根据场景处理 loading、empty、error 与成功状态，避免只渲染成功数据或只显示 spinner。

路由级资源状态优先使用 App Router 的 `loading.tsx`、`error.tsx`、`not-found.tsx` 等框架边界；Feature 内的局部交互状态由所属组件或模块呈现。不得用全页 `mounted` guard 隐藏本可正确 Server Render 的页面。

Toast 与 Modal 的视觉、错误归一化和实现细节由后续专项规范定义。前端代码不得自行新增第二套全局 Toast 或通用 Modal 基础设施，也不得将底层 Toast 调用散落为无统一错误语义的临时方案。

### Expected Error 与 Error Boundary

可预期的业务错误，例如 API 业务失败、validation error、quote unavailable、insufficient balance、wallet rejected 或用户输入错误，应由所属 Feature / Component 显式处理并提供可恢复 UI。不得故意 throw 给 route error boundary 作为普通业务流程。

未预期的 render exception、invariant violation 或无法正常恢复的程序错误，应交给合理的 React / Next.js error boundary，例如 route `error.tsx`。

不得 catch 后完全吞掉 error、返回空白 UI，或将所有 error 一律 Toast 后继续运行。

## Form 与重复提交保护

表单语义优先使用 `<form>`，submit 行为使用正确的 `onSubmit`。Button 必须明确 `type="submit"`、`type="button"` 或其他适当语义，避免默认行为造成误提交。

提交期间必须防止重复提交或重复触发同一不可重复动作。validation error 必须对用户可见，并满足已有 accessibility 规则；不得只通过 Toast 表达所有字段级校验错误。

对于 API mutation、Wallet signature、contract write 等操作，前端交互必须避免用户在 pending / submitting 阶段重复触发同一动作。具体 Mutation 与 Web3 lifecycle 分别由 `docs/state-management.md`、`docs/api.md` 与 `docs/web3.md` 定义；本文只规定交互保护原则。

## Import、模块 Public API 与 deep import

### Import 规则

import 应按清晰、稳定的顺序组织：React 与 Next.js、第三方依赖、项目别名模块、相对模块、类型导入。仅用作类型的导入使用 `import type`。

跨模块引用优先使用已配置的项目 alias，避免难以维护的多层相对路径。模块内部的局部文件可以使用相对路径。

不得保留未使用 import、为方便绕过 owner 的循环 import，或通过 import 副作用隐式完成业务初始化。

### Public API 与 deep import

Feature、Domain 与 Shared 模块内部文件默认是私有实现。跨模块使用时必须依赖 owner 明确提供的 Public API；Public API 的具体形式可以是明确导出的文件或后续约定的入口文件。

当前不强制为每个模块预先建立 `index.ts` 或 barrel export。只有出现真实跨模块使用需求时，才建立最小、明确且可审查的公开入口。

禁止 deep import 另一个 Feature 的内部文件。Feature-to-Feature 依赖默认禁止，并遵守 `docs/architecture.md` 中的例外与记录要求。Domain-to-Domain 直接依赖同样默认禁止。遇到复用需求时，应先判断代码是否属于 Domain、Shared，或应由 Feature / route 组合。

## 命名与文件规则

代码名称必须表达 owner 与意图，不得使用无法搜索和审查的泛化名称。

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| React Component | PascalCase | `SwapForm` |
| Component 文件 | PascalCase `.tsx` | `SwapForm.tsx` |
| Hook | `use` + camelCase | `useSwapForm` |
| Hook 文件 | kebab-case | `use-swap-form.ts` |
| 普通函数与变量 | camelCase | `formatAmount` |
| 类型、interface、enum | PascalCase | `SwapQuote`、`SwapFormProps` |
| 常量 | 有语义的 camelCase 或全大写常量 | `defaultSlippage`、`MAX_RETRY_COUNT` |
| 布尔值 | `is`、`has`、`can`、`should` 前缀 | `isSubmitting` |
| 非组件模块文件 | kebab-case | `format-token-amount.ts` |

同一模块内应保持命名风格一致。不得使用无语义的 `common`、`helper`、`data`、`new`、`final`、`temp` 或数字后缀作为长期文件和导出名。路由约定文件如 `page.tsx`、`layout.tsx`、`loading.tsx` 与 `error.tsx` 例外，必须保持 Next.js 的固定命名。

文件归属和目录层级继续遵守 `docs/architecture.md`；本文不允许借命名规则重新引入顶层 `src/hooks`、`src/utils`、`src/types`、`src/stores` 或 `src/api`。

## Provider

全局 Client Provider 集中在 `app/providers.tsx`，并由根 `app/layout.tsx` 引入。根 `layout.tsx` 应尽可能保持 Server Component。

新增 Provider 前必须确认：

- 它是否真正需要全局存在；
- 它的 owner 与消费者范围；
- 它为何不能留在更小的 Feature 或 Domain 边界；
- 它是否必须是 Client Provider；
- 它与既有 Provider 的依赖顺序。

Provider 只负责提供跨树能力。不得把页面级 API fetching、业务交易、巨型状态机、Modal 管理或无关初始化代码不断塞入 `app/providers.tsx`。Provider 数量、嵌套和初始化成本增加时，应审查是否存在不应全局化的能力。

## 图片与静态资源

图片选择应根据资源来源、尺寸稳定性、渲染性能与当前 Runtime 配置决定。需要 Next Image 能力且已满足相关配置时，优先使用 `next/image`；静态装饰、SVG 或不适合该能力的资源可以使用原生 `<img>` 或适当的资源形式。

无论选择何种渲染方式：

- 有内容意义的图片必须提供准确 `alt`；纯装饰图片使用空 `alt`，并避免被无意义地朗读；
- 应提供可预期的尺寸、`sizes` 或布局约束，避免布局抖动；
- 不得将大型 base64 资源、难以维护的远程 URL 或重复路径字符串散落在业务组件中；
- 图片 URL、优化策略、远程来源许可与缓存配置遵守 `docs/cloudflare.md` 与 `docs/design-system.md`。

本文不定义 Figma 的节点、导出倍率或图片制作要求。

## 基础可访问性

每个页面和组件必须满足以下最低要求：

- 优先使用语义化 HTML；
- 可点击行为使用 `button`、`a` 或正确的交互 primitive，不用 `div` 伪造按钮；
- 仅用图标表达的可操作控件必须有可访问名称；
- 表单控件具有关联的 label、可理解的错误文本和必要的 `aria-describedby`；
- 键盘用户可以访问、操作并看到焦点；
- Modal、Drawer、Menu、Tooltip 等复杂交互优先使用符合可访问性要求的基础 primitive；
- 状态变化和错误反馈不能只依赖颜色或短暂动画表达。

不得以叠加大量 ARIA 属性代替正确的原生语义和交互行为。

## 用户可见文案

i18n 是正式业务页面开发前必须具备的 Core 能力，具体资源结构和 Server / Client 策略由后续专项规范定义。用户可见的产品文案、错误提示和操作反馈不得在业务组件中散落为不可管理的硬编码字符串。

在 i18n 正式接入前，不得以临时硬编码方式继续扩展用户可见业务页面；应先完成对应基础能力的最小集成验证，规则遵守 `docs/tech-stack.md`。

## 防止巨型模块与审查重点

以下情况应在开发或 Code Review 中重新评估拆分，而不是继续向同一文件堆叠逻辑：

- Component 同时拥有多个独立流程、状态机和 UI 区域；
- Hook 同时协调数据、表单、导航、反馈、钱包与交易；
- Provider 同时负责全局依赖、页面数据、业务动作和 UI 状态；
- `className`、条件渲染或 Props 已无法在局部上下文中快速理解；
- 为复用跨越 owner 边界并开始出现 deep import、循环依赖或大范围转发 Props。

审查不以文件行数作为唯一指标。应确认职责是否单一、状态来源是否清楚、Client boundary 是否最小、模块 owner 是否明确，以及修改是否会扩大无关代码的影响范围。

## 实施检查清单

实现页面或组件前，至少确认：

1. 此代码是否必须是 Client Component；
2. route、Domain、Feature 与 Shared 的 owner 是否符合 `docs/architecture.md`；
3. Props、状态与事件名称是否表达真实意图；
4. 是否能用派生值或事件处理替代额外 state 与 `useEffect`；
5. 是否误将 Server State、Privy facts 或临时 UI 状态复制到错误位置；
6. 是否使用了现有 Design Token，并保持响应式和 loading / empty / error 状态完整；
7. 是否存在不必要的 deep import、未使用 import、`any`、browser API 越界或无障碍缺口；
8. 新增 Provider、Hook、组件或样式是否有清晰的最小 owner。

若某项需要突破本文规则，必须先说明原因、影响范围与替代方案；不得以局部实现方便为由静默例外。
