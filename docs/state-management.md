# 状态管理规范

## 目标与适用范围

本文规定状态的 owner、唯一 source of truth 与存放位置。它解决的核心问题是：一个值属于谁、为什么需要保存、由哪个机制维护，以及谁可以修改它。

目标是避免将所有数据放入 Zustand、将 Server State 或 Privy / Wallet facts 复制为第二套 Store、用 `useEffect` 同步多份状态，或让全局 Store 成为 Feature 之间的隐式耦合点。

本文适用于 Next.js App Router、React 19、TanStack Query、Zustand、Privy、Wagmi / Viem、Solana 与 Cloudflare Workers 的既定技术方向，但不重新定义这些技术的选型。技术选型由 `docs/tech-stack.md` 负责；目录 owner 与依赖方向由 `docs/architecture.md` 负责；Component、Hook、effect 与 Client boundary 的编码规则由 `docs/frontend-rules.md` 负责。

## 实施前检查

接入状态能力前必须检查当前 package、source、config、Provider 与 Runtime 验证记录。本文列出的 TanStack Query、Zustand、Privy、Wagmi / Viem 与 Solana 技术方向，不表示相应 dependency、Store、Provider、dehydration、persistence 或 Query 配置已经存在或已经验证。

不得因本文存在而创建占位 Store、空 Provider、推测性 Domain / Feature 或虚假的默认配置。

## 最高原则：一个事实，一个权威来源

同一个事实只能有一个 authoritative source of truth。其他模块可以读取、derive、cache 或 display 该事实，但不得再创建一份需要持续同步的“真相”。

```text
Privy
  → authenticated / user / wallet facts

Backend / remote data
  → Server Component / framework data flow
  → 或 Client-managed Server State 的 TanStack Query cache

amount + price
  → totalValue（derive，不存）
```

以下模式默认禁止：

```text
Privy authenticated
  → useEffect
  → Zustand isLoggedIn

TanStack Query
  → useEffect
  → Zustand tokens

amount + price
  → useEffect
  → totalValue state
```

当看似需要同步两个状态时，应先重新判断：它们是否其实是同一事实、其中一个是否可以 derive、是否应归 URL、Query Cache、Privy / Wallet provider，或是否已经变为独立 editable draft。

## 状态选择决策树

新增状态前，按以下顺序判断：

```text
这个值能从已有数据计算吗？
├─ Yes → derive，不存
└─ No
   ↓
它来自远端 / external source 吗？
├─ Yes
│  ↓
│  它是否需要 Client-managed server-state lifecycle？
│  ├─ Yes → TanStack Query
│  └─ No  → Server Component / framework data flow
│           （Web3 remote state 的具体 owner 遵守 `docs/web3.md`）
└─ No
   ↓
它是 Authentication / Wallet fact 吗？
├─ Yes → Privy / Wallet provider
└─ No
   ↓
它应体现在 URL，支持分享、刷新或前进后退吗？
├─ Yes → route / params / searchParams
└─ No
   ↓
它只属于当前 Component 或 Feature subtree 吗？
├─ Yes → React local state / reducer
└─ No
   ↓
它是真正跨树或跨 route 的 Client State 吗？
├─ Yes → 考虑 Zustand
└─ No → 重新检查 owner 与组件边界
```

这棵决策树是状态选择的默认入口。远端数据并不自动等于 Client-managed Server State；先判断事实归属和生命周期，再决定使用的技术。“多个地方需要读取”本身不等于“全局状态”。

## 状态分类与默认归属

| 状态类别 | 默认 owner 与存放位置 | 典型示例 |
| --- | --- | --- |
| Derived State | 不存储，直接 derive | `canSubmit`、`totalValue`、`isSameToken` |
| Local UI State | Component 或 Feature subtree 的 React `useState` / `useReducer` | input value、active tab、局部 Modal、当前步骤 |
| URL / Navigation State | route segment、`params`、`searchParams` | filter、sort、pagination、详情 ID、referral code |
| Server-only Remote Data | Server Component / framework data flow | 仅参与服务端渲染的页面数据 |
| Client-managed Server State | TanStack Query | 需要 Client cache、refetch、mutation 或共享生命周期的 token list、profile、quote、后端业务资源 |
| Shared Client State | 所属 Domain / Feature 的 Zustand Store | 跨 route 的 Client workflow、真实共享偏好 |
| Auth / Identity / Wallet Facts | Privy、Wagmi 或其他真实 Wallet provider | authenticated、address、chain、wallet session |

### Derived State

可由 Props、local state、Query data、Privy / Wallet facts 或 Zustand state 计算出的值，默认不保存。例如 `isEmpty`、`displayAmount`、`hasEnoughBalance` 与 `isConnected` 应在使用处 derive。

只有计算成本确实高，且存在明确的性能收益时才考虑 memoization；不得为了保存 derived state 建立同步 effect。通用 React 编码规则继续遵守 `docs/frontend-rules.md`。

### Local UI State

仅影响当前 Component 或 Feature subtree 的临时交互状态，默认使用 React `useState` 或 `useReducer`，例如输入值、当前 Tab、展开状态、局部 Modal、hover 状态、表单步骤和 Feature 内部选择。

不得因未来可能复用或想避免一两层 Props 就过早提升到 Zustand。复杂但仍局部的状态可以使用 reducer；不应仅因状态多就创建全局 Store。

### URL / Navigation State

需要被 bookmark、share、refresh 后保留、通过 browser back / forward 恢复，或可通过 URL 直接打开的状态，应优先放入 route segment、`params` 或 `searchParams`。

常见示例包括具有产品意义的当前 Tab、filter、sort、pagination、selected token symbol / ID、referral code 与详情 identifier。纯视觉或短生命周期状态不应强行放入 URL。

### 状态所有权优先于“全局使用”

多个 Feature 都展示 Token，不代表 Token 数据属于全局 Store；它通常是 Token Domain 的 remote data，并应按是否需要 Client-managed lifecycle 选择 Server / framework data flow 或 TanStack Query。多个地方读取 Wallet，不代表应创建 wallet store；它们应读取 Privy / Wagmi 的事实。多个地方使用 profile，也不改变其作为 user Domain remote data 的归属。

必须先问“这个事实属于谁”，再问“用什么存储”。全局使用不等于 Shared，也不等于 Zustand。

## Remote Data：Server-only 与 Client-managed Server State

### Server-only Remote Data

若远端数据只参与 Server Component / route 的服务端渲染，且不需要 Client-side cache、Client refetch、Client mutation lifecycle 或多个 Client consumer 共享远端生命周期，应保持在 Next.js Server / framework data flow 中。不得仅因数据来自 API / Server，就强制引入 TanStack Query。

本文不锁死 fetch cache、revalidate、Server Action、Route Handler 或 RSC prefetch 的具体策略；这些选择须结合 route、API 与 Runtime 的真实需求确定。

链上 remote state 的具体 Query / cache owner，例如 balance、allowance、contract read 与 transaction receipt，由 `docs/web3.md` 定义。不得在本文提前规定所有链上读取都额外包装 TanStack Query；也不得将 Wagmi / Web3 provider 已管理的 remote state 再复制进 Zustand 作为第二套 cache。

### Client-managed Server State 与 TanStack Query

TanStack Query 是需要在 Client Component 中缓存、重新获取、共享、mutation 或管理远端生命周期的 Server State 默认方案。它负责 cache、loading、error、refetch、stale data、mutation lifecycle、invalidation 与 request deduplication 等 server-state concerns。

是否将远端数据交给 TanStack Query，应结合是否需要 Client Component 消费、Client cache、refetch、stale lifecycle、mutation、invalidation 或多个 Client consumer 共享远端生命周期判断。HTTP transport、鉴权、响应结构和 API error model 属于 `docs/api.md`。

### Client Query 的 Context Readiness

对于 user-scoped、wallet-scoped、chain-scoped 或其他依赖运行时身份上下文的 Client Query，只有影响 Query identity 的必要上下文已明确且稳定时，才能启动请求。

若 Query 依赖 user ID、wallet address、chain ID、network、contract address、token address 或其他 identifier，这些必需维度尚未 ready、正在切换、已失效或为空时，不得以 placeholder、旧值或不完整 context 发起请求。例如不得以 `address = undefined` 发起 user-scoped Query；account 从 A 切换到 B 时，也不得继续使用 A 的 context 为当前页面发起新请求。

```text
context not ready / unstable
  → 不启动依赖该 context 的 Query

context ready and current
  → 才允许进入 Client-managed remote lifecycle
```

本文不锁死 TanStack Query 的具体 API 写法；只规定 Query 启动必须绑定 ready 且 current 的上下文。

### Server → Client Resource Handoff

同一 remote resource 若先由 Server Component / route 获取、后续又进入 Client-managed lifecycle，必须明确唯一的 Client-side source of truth。不得长期并行维护 Server Props、local state copy 与 TanStack Query cache 三套可变副本。

Server 获取的数据可以作为 initial snapshot、initial render data 或 Client-managed state 的初始化来源；但该资源一旦进入 Client-side cache、refetch 或 mutation lifecycle，后续生命周期必须由对应 Client state owner 管理。不得通过 `useEffect` 将 Server Props、local state 与 Query Cache 互相同步。

本文不锁死具体的 Server / Client 数据交接实现；相关集成方式仍须在真实 App Router、vinext 与 Workers 环境中验证。

### Query owner 与 Query Key

Query 应靠近资源或工作流的 owner：

```text
domains/token/
  # token list、token detail、token metadata

features/swap/
  # swap quote、swap preview
```

不得建立顶层 `src/queries/` 作为全项目 Query 垃圾桶。

Query Key 必须稳定、可序列化、能完整表达影响响应结果的输入，并拥有明确 owner。它不得使用随机值或依赖偶然变化的对象引用。

```ts
["token", "detail", chainId, address]
```

同一资源不得由不同页面随意拼出不同 Key。owner 可以在自己的模块中提供最小的 Query Key helper；不得为了尚未存在的 Domain 提前建立巨大统一 Query Key Registry。

### Query 的 Account / Chain Context 隔离

任何 Query 的响应若取决于 user ID、wallet address、chain ID、network、token / contract address 或其他业务 identifier，这些实际影响结果的维度必须进入对应的 Query identity / Query Key。例如余额同时取决于 chain、wallet 与 token 时，identity 必须能区分三者：

```ts
["balance", chainId, walletAddress, tokenAddress]
```

不得让旧 account 或 chain 的 cache 在新 account 或 chain 下被当作当前事实展示。此规则尤其适用于由 Query 管理的 balance、allowance、portfolio、position、order、transaction history、claimable reward 与其他 user-scoped resource。

当 account change、wallet disconnect、login、logout 或 chain change 发生时，必须按数据语义决定 refetch、invalidate、remove、reset draft，或保留与身份无关的数据。具体操作机制仍由 `docs/web3.md` 与真实 TanStack Query 集成决定；原则是不同身份 / 链上下文的数据不得错误共享同一个状态身份。

### Query data、draft 与 mutation

Query data 不得复制到 Zustand 或 local state 作为第二套 cache：

```text
useQuery()
  → useEffect()
  → setTokens(query.data)
```

组件应直接消费 Query Cache，或从中 derive 展示数据。用户开始编辑 Server Data 时可以创建 local draft，因为此时它是独立的 UI / Form 状态；必须清楚区分原始 server snapshot 与可编辑 draft。

Server mutation 使用 TanStack Query mutation lifecycle。成功后应根据真实数据关系选择 invalidate 受影响的 Query、更新可靠的 cache，或采用 server 返回的新数据。不得形成“mutation success → 改 Zustand → 改 local state → 再 refetch”的多条同步路径。

### Invalidation 与 optimistic update

不得把“mutation 完成后 invalidate everything”作为默认策略。只使真正受影响的 resource 失效，并在简单可靠、cache precision 与 network cost 之间权衡。

不得为了追求零 refetch 建立复杂脆弱的手工 cache patch。optimistic update 仅在 UX 收益明确、rollback 清晰、Server 冲突可处理且数据语义稳定时使用。

资金、Token balance、链上 transaction 或其他不可逆操作不得通过 optimistic state 向用户伪造“已经完成”的事实。交易阶段、确认与失败的详细状态机由 `docs/web3.md` 定义。

## Auth、Identity 与 Wallet Facts

Authentication 与 Wallet facts 必须由真实 Provider / SDK 维护其唯一来源。

Privy 是 authenticated、user identity、login session、embedded / linked wallet information 等认证与钱包事实的 source of truth。Wagmi 或对应 Wallet provider 是连接状态、account、chain 等 Wallet facts 的 source of truth。

不得在 Zustand 创建 `isLoggedIn`、`currentPrivyUser`、`privyWallet`、`authTokenState`、`currentAddress`、`currentChainId` 或 `isWalletConnected` 作为重复事实。

必须区分真实 wallet chain 与业务选择。例如真实连接链来自 Wallet provider；用户在产品 UI 中选择准备查看的目标 chain 可能是独立 business state。字段都叫 `chainId` 不代表它们是同一事实。

业务 user profile、Token resource 与其他后端业务数据可在认证完成后获取，但它们属于相应 Domain 的 Server State，不应与 Privy Authentication Facts 混为一谈。

## Zustand：真正共享的 Client State

### 使用条件与 owner

只有一个值不属于 Server State、URL State、Privy / Wallet facts、Derived State 或局部 Component / Feature subtree，且确实需要跨多个无直接父子关系的 Component、route 或 Feature 消费时，才考虑 Zustand。

新增 Zustand Store 前必须回答：

1. 这是不是 Server State？
2. 这是不是 URL State？
3. 这是不是 Privy / Wallet 已提供的状态？
4. 这是不是可以 derive？
5. 这是不是只影响当前 Component / Feature subtree？
6. 为什么它必须是跨树或跨 route 的 Client State？

Store 应按真实 owner colocate，例如：

```text
features/swap/model/
domains/token/model/
```

不得创建顶层 `src/stores/`、`src/state/`、`useAppStore`、`useGlobalStore` 或 `useCommonStore` 作为兜底容器。若状态真正不含业务语义，才可按 `docs/architecture.md` 的规则考虑 Shared。

若确实不存在合理 Domain 的 app-wide Client State，必须明确记录其 owner、消费者范围与存放位置；不得因状态跨页面使用就创建顶层 Store 作为默认解法。

### 最小状态、selector 与 action

Store 只保存无法从现有状态推导出的最小必要事实。不得同时保存 `items`、`filteredItems`、`hasItems` 与 `itemCount`，再用 effect 保持同步；后几项应由 `items` derive。

组件订阅 Zustand 时应选择自己真正需要的最小 slice，避免无必要订阅整个 Store。不得为了形式创建大量没有额外语义的 selector wrapper。

修改 Store 必须通过清楚的 action，例如 `setSelectedToken`、`resetSwapDraft`、`openSomething`、`closeSomething`。不得向所有消费者暴露通用 `setState`，或让不同 Feature 随意修改另一个 owner 的 Store。

Store action 只负责状态 transition，不是 API layer、Web3 transaction service、navigation service、Toast service 或 giant orchestration engine。超出状态转换的业务副作用应归属 Feature、API 或 Web3 owner。

```text
禁止：Zustand action
  → fetch API
  → call contract
  → toast
  → navigate
  → 修改多个无关 state
```

### Runtime Capability Object

Zustand Store 应保存可解释的业务事实、Client workflow state、可序列化或至少具有明确状态语义的数据，以及完成明确 state transition 所需的最小状态。不得默认将运行时能力、执行句柄或 SDK / client instance 当作业务状态保存到 Store。

不得默认保存 `QueryClient`、Privy / Wallet Provider instance、Wagmi client、Viem public / wallet client、Solana client、contract client / instance、`Promise`、`AbortController`、DOM node / `HTMLElement`、React element / `ReactNode`、subscription handle、timer handle 或 SDK connection instance。

这些能力应由对应 Provider、SDK integration、module / infrastructure owner、React ref 或当前 async workflow 管理。若某个第三方库确实要求暂存特殊 runtime object，必须说明其理由与生命周期；不得将 Zustand 作为 runtime object registry。

## Form、Overlay、Loading、Error 与 Workflow State

### Form 与 Overlay

普通 Form 临时状态，如 input value、validation message、selected option、current form step 与 dirty state，默认属于 Component 或 Feature subtree。只有需要跨 route 保存未提交流程、多个远离 subtree 协作，或具有长生命周期 workflow 时，才考虑提升状态。

局部 Modal / Drawer 默认由 Feature 或 Component local state 控制。不得默认创建 `modalStore`、`drawerStore` 或 `toastStore`。未来若存在真实的全局 imperative overlay orchestration，必须作为明确架构能力单独设计。

本文不引入 React Hook Form、Formik 或其他 Form dependency；真实需要时按 `docs/tech-stack.md` 的 dependency rule 评估。

### Loading 与 Error

Loading 与 Error 由其真实 owner 提供：Query 使用 Query 状态，mutation 使用 mutation 状态，局部异步交互使用 Feature local state，Web3 transaction 使用交易生命周期。不同任务不得复用模糊的全局 `isLoading`、`globalLoading` 或 `globalErrorStore`。

若存在全局 blocking loading UX，应单独定义其 UI orchestration，不得合并所有业务异步状态。API error、Query error、Form validation error、Wallet error、Transaction error、UI recoverable error 与 route error 必须按来源区分；错误的 normalize、映射与呈现分别由 `docs/api.md`、`docs/web3.md`、`docs/design-system.md` 与 `docs/qa.md` 细化。

### 明确阶段与 reset

当业务具有明显阶段时，应采用能排除非法组合的状态表示，例如 discriminated union、status union、reducer 或明确 workflow model：

```text
idle → preparing → awaiting-signature → submitting → pending → success | error
```

不要用多个可互相矛盾的 Boolean 表达同一工作流。简单流程不应为了形式增加状态机 dependency。

任何有生命周期的临时状态都必须设计 reset 时机，例如 Modal close、wallet disconnect、account switch、chain switch、Feature 完成、route leave 或 logout。reset 必须属于正确 owner；不得依赖刷新页面自然恢复，也不得建立通用 `resetEverything()` 作为常规方案。

### 异步竞争与过期结果

任何异步任务完成时，都必须确认结果仍属于其发起时绑定的有效上下文。需要考虑的上下文包括 route、user、wallet account、chain、selected resource、workflow instance，以及 Component / Feature lifecycle。

例如 Account A 发起任务、用户随后切换到 Account B 时，A 晚到的结果不得覆盖 B 的当前状态。此规则适用于非 TanStack Query async request、SDK / wallet callback、timer / delayed task、long-running workflow、polling result 与 third-party async integration。

若任务结果已经 stale，应丢弃、取消，或由 owner 按正确生命周期处理。本文不锁死 `AbortController`、request ID、cancellation / concurrency library 等实现；TanStack Query 自身的 cancellation 与 stale behavior 仍留给真实集成验证。过期异步结果不得覆盖新的上下文状态。

## Persistence、Hydration 与上下文切换

### Persistence 与 hydration

任何 Client-side persistence 都不是默认能力，包括 Zustand persistence、TanStack Query cache persistence、`localStorage`、`sessionStorage`、IndexedDB 与其他浏览器持久化。只有 reload 后保留、session 恢复或用户 preference 等真实需求存在时才考虑。

启用 persistence 前必须明确为什么 reload 后仍需保留、owner、生命周期、schema version、migration、cleanup、logout / account switch 行为、敏感性、hydration 影响与 stale data 风险。

不得默认持久化 user / wallet-scoped 的 Server State 或 Query Cache，例如 balance、portfolio、position、allowance 与用户私有业务资源。未来如确有此类需求，必须额外确认 account / user isolation 与清理策略。

继续禁止持久化 private key、seed phrase、Secret、backend credential、Authentication truth、Privy session 的重复状态、不必要的完整 User object 或可重新请求的大量 Server State。

参与 Server / Client 两侧渲染的 persisted Client State 必须考虑 hydration mismatch。不得用 `mounted = true` 后隐藏整页作为默认修复方案；应优先正确划分 Server / Client boundary、避免 SSR 依赖 browser-only state，并在真正需要 persistence 的小范围组件中处理 hydration。通用 hydration 编码规则由 `docs/frontend-rules.md` 定义。

### Account、Wallet 与 Chain 切换

Web3 DApp 必须考虑 account change、wallet disconnect、login、logout 与 chain change。发生这些事件后，应按数据语义判断哪些 Query 需要 refetch、invalidate 或 remove，哪些 draft 需要 reset，以及哪些与身份或钱包无关的状态可以保留。

不得向新账户错误展示属于旧 address、chain 或 user 上下文的业务状态。具体 Web3 cache、Wallet subscription 与 transaction 行为由 `docs/web3.md` 定义。

## Component API 与 Context

能通过 Props、composition 或 colocated state 清晰解决的问题，不应为了避免一两层 Props 立即创建 Store；同时也不应形成极端 prop drilling。状态跨越大量无关层级时，应依次重新评估组件边界、Context、Zustand 与 owner colocate 方式。

React Context 适合稳定的 subtree dependency、Provider-based library integration，或不频繁变化且需向子树提供的能力，例如 theme infrastructure、i18n 或 SDK provider。Context 不是 Zustand 的替代品，也不是所有共享状态的默认方案。若 Context value 高频变化且消费者广泛，应重新评估 owner、Zustand、Query 或 component composition。

## 禁止模式

以下模式默认禁止：

```text
useQuery → useEffect → Zustand
Privy user → useEffect → userStore
wallet address → useEffect → globalStore
props → useEffect → local state
```

最后一种模式仅在 local state 已成为独立 editable draft 时可例外。

同样禁止：

```text
所有 Modal → modalStore
所有 Loading → globalLoadingStore
所有 Error → errorStore
所有 User / Wallet / Token / Swap → useAppStore
一个状态在多个地方保存，再靠 useEffect 保持一致
```

## 与架构及专项规范的关系

State 的物理位置必须服从 `docs/architecture.md`。不得重新建立顶层 `src/stores/`、`src/state/` 或 `src/queries/` 等横向 catch-all。状态逻辑可以在真实 owner 中出现，例如 `features/swap/model/` 或 `domains/token/model/`；Shared 仅能包含真正 business-neutral 的基础状态能力。

本文只从 State ownership 与 source of truth 角度引用 `docs/frontend-rules.md`，不重复其关于 `useEffect`、derived state、Component local state、Hook purity、Provider 与 Client boundary 的完整编码规则。

以下细节留给专项规范：

| 主题 | 负责文档 |
| --- | --- |
| HTTP transport、API error model、Server mutation 协议 | `docs/api.md` |
| Wallet subscription、Web3 cache、transaction lifecycle | `docs/web3.md` |
| Bindings、Runtime、Worker-side persistence 兼容性 | `docs/cloudflare.md` |
| 错误呈现、loading UI 与可测试性 | `docs/design-system.md`、`docs/qa.md` |

不得在本文提前锁死 TanStack Query Provider 配置、`staleTime`、`gcTime`、retry 次数、Query Devtools、persistence plugin、Zustand middleware、SSR dehydration、Query prefetch 或 React Query 与 Server Component 的集成细节。这些需要在真实 API、vinext / Workers Runtime 与项目需求明确后验证。

## 实施检查清单

实现任何新状态前，至少确认：

1. 谁是该状态的 owner？
2. 谁是唯一 source of truth？
3. 它能否 derive？
4. 它是否属于 Server-only Remote Data、Client-managed Server State、URL State、Privy / Wallet fact 或 local state？
5. 为什么必须使用 Zustand？
6. Client Query 是否只在必要 identity context ready 且 current 时启动？
7. 是否错误复制了 Query、Privy、Wallet data，或把同一 Server resource 变成多份 Client-side 可变副本？
8. 生命周期结束、login / logout、account / chain / route 改变时，哪些 Query 与 draft 必须隔离、刷新、移除或 reset？
9. 异步任务完成时，结果是否仍属于当前 route、identity 与 workflow context？
10. 是否存在多个状态通过 `useEffect` 同步？
11. 是否需要 Client-side persistence；若需要，是否明确了 owner、敏感性、migration、cleanup、身份隔离、stale data 与 hydration 影响？
12. 状态的物理位置、依赖与 Public API 是否符合 `docs/architecture.md`？

若不能清楚回答这些问题，不得为了尽快开发先创建 Store；应先重新判断 owner 与状态类型。
