# Web3 工程规范

## 目标与适用范围

本文定义 `game-dapp-starter` 中 Wallet、Account、Chain、Contract、交易、Backend reconciliation、精度与 Web3 安全边界的工程规则。目标是在 EVM、Solana、PC 与 H5 DApp 中保持事实来源清晰、交易语义可靠、架构可维护，并让 AI / Codex 能够在明确 owner 下实现和审查 Web3 功能。

本文不复制旧项目的 SDK 组合、Store、合约工具文件或交易状态模型。旧项目仅证明以下真实生产需求存在：钱包连接、链切换、合约读写、授权、交易标识符、链上确认、Backend index / business processing，以及交易后的业务数据刷新。

实施 Web3 能力前必须检查当前 package、source、config、Provider、chain / Contract configuration 与 Runtime 验证记录。本文定义的技术方向不表示相应 dependency、Provider、Chain 配置或 Web3 业务已经存在；不得因本文存在而创建占位目录、空 Provider、空 Store 或虚假的默认配置。

技术选型、依赖新增与 Cloudflare Workers Runtime 兼容性遵守 [技术栈规范](./tech-stack.md)。目录 owner 和依赖方向遵守 [架构规范](./architecture.md)。状态 owner、Query identity、stale result 与 persistence 遵守 [状态管理规范](./state-management.md)。

## 核心 Web3 模型

Web3 功能必须同时区分三组独立事实：

| 事实类别 | 描述 | 不能推导为 |
| --- | --- | --- |
| Wallet / Submission | 用户是否准备、是否确认签名、是否已提交，以及是否取得 transaction identifier | 链上已成功或业务已完成 |
| On-chain Transaction | 交易在对应链上的 pending、confirmed、reverted / failed 等事实 | Backend 已完成业务处理 |
| Backend Business Reconciliation | Backend / indexer 是否已观察、索引或完成该 Feature 所需的业务处理 | 链上一定已确认 |

因此始终成立：

```text
txHash obtained
≠ on-chain confirmed
≠ Backend business completed
```

同一 Feature 可以同时依赖链上确认与 Backend business completion，也可以只依赖其中一项。每个 Feature 必须定义自己的 completion contract，不能假设所有交易都共享一种全局 success 定义。

```text
Feature completion contract
= chain completion requirement
+ Backend reconciliation requirement
+ 必要的业务数据 readiness
```

本文不锁定最终 transaction state enum、confirmation 数量、receipt timeout、Backend polling interval、max attempts、retry 次数或全局 transaction manager。

## Ownership、目录与依赖边界

Web3 代码继续遵守以下依赖方向：

```text
app      -> features, domains, shared
features -> domains, shared
domains  -> shared
```

### `shared/web3/`

`shared/web3/` 只包含不带具体产品业务语义的基础能力。真实需求出现时，概念上可使用：

```text
shared/web3/
  evm/
  solana/
```

可包含：

- EVM 或 Solana 通用 client、RPC 与 wallet adapter；
- Chain primitive；
- address、transaction hash / signature 的校验 primitive；
- 通用 read / write、receipt / confirmation primitive；
- 单位转换 primitive；
- 通用 Web3 error normalization；
- 不含业务完成条件的 transaction lifecycle 基础能力。

不得包含 Swap、Borrow、Repay、Deposit、Create Token、Claim Reward、Pool、Position、Mining 等业务动作，也不得硬编码具体 Backend endpoint。

### Domain 与 Feature

稳定业务概念的 Contract 地址、ABI、金额语义与展示规则归其 Domain；用户动作及其完整交易 workflow 归其 Feature。

```text
features/swap/
  # quote、allowance policy、swap write、completion contract、后续刷新

features/deposit/
  # deposit write、Backend reconciliation、deposit-specific completion contract

domains/token/
  # token address、decimals、Token amount semantics、Token-specific ABI（若确有稳定归属）
```

Feature 负责编排：前置校验、read、approval、simulation、wallet submission、receipt、Backend reconciliation、完成后的受影响资源刷新。`shared/web3` 只提供通用 primitive。

不得创建巨型 `contracts.ts`、全局 `web3Store`、`chainStore` 或 `transactionStore` 来容纳所有业务。一个固定 address 也不因此自动属于 Shared。

## Wallet、Account、Chain 与 Backend Identity

以下概念可能在某些流程中具有相同值，但它们不是同一个事实：

```text
Privy Authentication
≠ Wallet Connection
≠ Wallet Account
≠ Wallet Current Chain
≠ Business Target Chain
≠ Backend Authentication
≠ Backend User Address
```

### Source of truth 与 SDK 职责

真实业务接入后的默认职责如下：

| 技术 / 系统 | 负责的事实 |
| --- | --- |
| Privy | Authentication、Embedded Wallet、External Wallet connection、wallet session 与其提供的钱包事实 |
| Wagmi | React 层的 EVM account、wallet、chain、contract read / write integration |
| Viem | EVM client、chain、ABI、encoding / decoding、contract primitive、address 工具与单位转换 |
| Backend | 后端用户、业务身份、业务资源和 Backend business processing 事实 |
| Zustand | 仅真正共享的 Client workflow / UI state，不保存 Wallet truth、Web3 remote cache 或 SDK capability object |

不得将 Privy 或 Wagmi 的 wallet、account、authenticated、session、current chain 通过 `useEffect` 复制到 Zustand，形成第二份需要持续同步的权威状态。不得把 Backend `userInfo.addr` 视为 wallet 当前 account 的 source of truth。

### Privy 与 Wagmi 的单一事实原则

Privy 与 Wagmi 可以同时暴露相互关联的钱包、account 或 chain 信息；但在同一个 workflow 中，同一个具体事实必须只有一个 authoritative owner：

```text
one fact
→ one authoritative owner
→ no manual duplicated truth
```

不得设计 `Privy state + Wagmi state + Zustand copy` 三套事实后再用 `useEffect` 手工保持一致。尤其禁止：

```text
Privy current wallet
→ effect
→ Zustand currentAddress

Wagmi account
→ effect
→ 同一个 currentAddress
```

当 Privy 与 Wagmi 都提供相关事实时，必须根据实际 SDK integration 明确哪一方是该 workflow 的 authoritative fact、哪一方只是 integration / derived view，以及如何通过官方 adapter 或 connector 组合。本文不预设所有 account 永远以 Privy 或 Wagmi 的某一方为准。

也不得额外自行监听 `window.ethereum` 来创建第三套 wallet / chain truth，除非已有明确的 SDK 能力缺口、兼容理由和生命周期 owner。

### Wallet Current Chain 与 Business Target Chain

必须区分：

```text
Wallet Current Chain
```

和：

```text
Business Target Chain
```

用户可以选择 BSC 业务，而 wallet 当前仍在 Ethereum。此时系统应表达“需要 switch chain”，而不是仅改写业务 Store 就假装 wallet 已在 BSC。

一个 Store 不得同时承担 wallet 当前链、用户业务选择链、历史 transaction 原始链和 Backend reconciliation 的查询链。每个值必须有明确 owner 和语义。

## Wallet Signing 语义与安全边界

### 签名类型与归属

以下行为即使都会产生 signature，也具有不同语义，必须分别建模和处理：

```text
Transaction Signing
≠ Plain Message Signing
≠ Typed Data Signing
≠ Backend Request Signing
```

EVM transaction、personal / message signing 与 EIP-712 typed data signing 属于用户 Wallet 的 Web3 / Feature workflow。Backend request signing 属于 [API 规范](./api.md) 中的 Backend Authentication Contract。不得因为都被称为“签名”，而共用一套 authorization、错误处理或完成语义。

某个 signature 只证明用户对该具体 payload 与协议完成了签名，不得推导为用户已经授权任意未来动作。Feature 在请求签名前必须能够说明：

- 签名的内容；
- 签名的业务目的；
- 所属 protocol / domain；
- 该 signature 实际授予的 authority。

不得要求用户对来源或用途不明确的 opaque payload 进行 blind signing。

### 具备 replay risk 的签名

login challenge、Backend authentication、off-chain authorization、permit-like authorization、order authorization 及其他具有 authentication、authorization 或 replay risk 的签名，必须按其真实协议具备明确的 domain separation 与 replay protection。协议可能包含下列字段：

```text
domain / purpose
origin / service identity
wallet / account
chainId（当语义依赖 chain）
verifying contract（当协议存在）
nonce
expiry / deadline
operation-specific fields
```

具体字段必须服从真实协议。普通 message signing 不因本规则被机械要求包含 nonce 或 expiry；只有其语义存在认证、授权或重放风险时，才必须定义相应保护。

如果 Feature 使用 EIP-712，必须验证实际 typed data 的 `domain`、`chainId`、`verifyingContract`、`primaryType` 与 `message` 均符合当前业务 Contract。不得因“签名成功”而忽略 domain mismatch。本文不锁定 EIP-712 helper 或 schema。

## Chain、Contract、ABI 与配置归属

全局 Chain metadata 属于 `shared/config`，包括：

- chain ID、chain name；
- public RPC / provider configuration；
- explorer；
- native currency；
- supported chains 等稳定基础元数据。

Contract address、ABI 和协议配置必须按业务 owner 放置：

| 内容 | 默认归属 |
| --- | --- |
| 真正无产品语义的通用协议基础能力 | `shared/web3`，且须有可验证的业务中立性 |
| 稳定业务概念的 Contract、ABI、amount semantics | 对应 Domain |
| 某个用户动作专属的 Contract interaction、ABI、地址 | 对应 Feature |

禁止将 chain metadata、Token 地址、产品 Contract、Feature address、ABI 和临时环境配置混入一份全局 giant config。也不得因 address 固定就把它移动到 Shared。

### Contract Config 来源、版本与 Fail-Closed

每个实际使用的 Contract 配置必须能建立下列信息之间的可追溯关系：

```text
environment
chainId
contract address
ABI
protocol / deployment version
```

本文不要求现在创建 deployment manifest，但不得让这些信息成为彼此无关的散落常量。

如果当前 chain、environment、Contract 或 ABI 未经过明确配置，或该组合不受支持，Feature 必须停止对应操作并暴露明确的 unsupported / configuration error。不得使用 zero address、placeholder address、其他 chain 的 fallback address 或猜测的 Contract 继续执行 write。

同名 Contract 在不同 chain 上不保证拥有相同 address、ABI 或 deployment version。Feature 必须使用与 transaction origin chain 对应的配置；不得以当前 selected chain 的地址替换已冻结 transaction context 中的 Contract。

如果真实业务使用 proxy / upgradeable Contract，Frontend 不得仅因 proxy address 未变就永久假定 implementation semantics 不变。当 Backend 或 deployment process 明确 protocol / implementation version 已升级时，必须重新验证 ABI compatibility、预期 methods / events、Frontend assumptions 与 deployment config。本文不规定 proxy detection、链上 implementation inspection 或 deployment tooling。

EVM `Address`、transaction hash 与 `chainId` 必须使用 Viem 的类型能力或经过明确校验的结构。不得将任意 string 当作 Address 或 txHash，不得用 zero address 表示“尚未准备好”，也不得让 chain ID 在 string 与 number 间无规则漂移。无需为此提前创建复杂的 branded-type framework。

## Contract Read 与链上 Remote State

### Client React Runtime 与 Server / non-React Runtime

React Client Component 中需要 wallet、account、chain integration、reactive contract read 或 Client-managed chain state 时，优先使用 Wagmi 的 React integration，并由其底层 Viem 能力完成 EVM interaction。

Server Component、Worker / server-side workflow 或普通 non-React TypeScript function 不得为了复用而调用 Wagmi React Hook。它们应使用 Viem 或其他已经确认与目标 Runtime 兼容的 EVM primitive 完成对应 read。Wagmi 是 React-facing EVM integration；Viem 是在 Runtime-compatible 前提下可脱离 React 使用的底层 EVM primitive。

这不是复制两套业务 Contract logic 的理由。业务 owner、ABI、address 与 amount semantics 仍按既定 Domain / Feature owner 放置；本文也不锁定 PublicClient singleton、RPC client factory、Server cache 或具体实现方式。

### Server-side Wallet Identity Boundary

Server Component、Worker 或 server-side function 不能自行拥有或猜测浏览器当前 Wallet state，必须区分 explicit public address lookup 与 current authenticated user's wallet-scoped operation。

若业务语义是查询任意公开 address 的余额或 Contract state，可以接受经过校验的显式 address；该值只表示 requested public resource identity，不能自动解释为 current authenticated user's wallet。

如果 Server-side read 的语义是“当前用户”“当前用户钱包”或“当前 session 对应 wallet”，则必须存在可信、request-scoped 的 identity context。其来源由未来真实的 authenticated session、Backend identity 或 verified request context 决定。不得将 `searchParams.address`、未经身份绑定验证的 form input 或其他任意客户端字符串声称为 authenticated user's wallet。具体 Server Auth Contract 继续由 [API 规范](./api.md) 与真实认证实现定义。

Server-side wallet-scoped read 同时遵守 [状态管理规范](./state-management.md) 的 request isolation 规则。不得使用 module-level mutable `currentWallet`、`currentAccount` 或 `currentChain` 在多个 Server request 之间共享用户 identity。

Contract read 的默认关系为：

```text
Feature / Domain consumer
        ↓
Domain / Feature read API or hook
        ↓
Client React Runtime: Wagmi → Viem → RPC
Server / non-React Runtime: Viem / server-compatible primitive → RPC
```

读取结果的 owner 由其生命周期决定：

- 仅服务于 Server render 的数据遵守 framework data flow；
- 需要 Client cache、refetch、invalidation 或多个 Client consumer 的 remote state，使用 Wagmi 自身 Query integration 或 TanStack Query；
- 只影响当前组件树的一次性展示，可由局部 owner 管理。

不得将余额、allowance、token data、pool、position、contract state 等 RPC 结果经 `useEffect` 复制进 Zustand，形成第二套 cache。不得以 Provider 代替 Query / Feature state 而创建 `BalanceProvider`、`TransactionProvider` 或 `BusinessDataProvider`。

所有依赖 account、chain、contract、token 或 wallet 的 read 都必须以实际影响结果的维度建立 identity，并且仅在这些上下文 ready 且稳定时启动。具体 Query key、cache、context readiness 和 stale-result 规则由 [状态管理规范](./state-management.md) 定义。

## Contract Write、Simulation 与 Allowance

### Wallet Capability Preflight

```text
Wallet connected
≠ Wallet supports every operation
```

Feature 在执行需要 Wallet participation 的操作前，除确认 account、chain、Contract 与 transaction context 外，还必须确认当前 Wallet、connector 与 account type 支持该操作所需的 capability。真实业务可能依赖 chain switching、transaction signing、message signing、typed-data signing、特定 chain support 或 smart-account behavior；embedded wallet、external wallet、smart account 与 connector 的能力或限制可能不同。

不得仅因 `isConnected === true` 就假设所有 Web3 operation 都可执行。Capability 判断应优先来自真实 SDK / connector 提供的能力、明确的 wallet integration Contract 或经过验证的 Feature capability detection；不得维护一份未经验证的 `walletName → capabilities` 静态表作为永久真相。本文不锁定 capability API、adapter 或 wallet matrix。

### Feature-owned Contract Write

swap、sell、borrow、repay、deposit、create token、claim 等用户动作都是 Feature workflow。它们不能被塞进通用合约 utility，也不能由 Provider 或 global Store 编排。

Feature 应在明确用户事件中执行 write。React render 和 `useEffect` 不得自动发起 contract write、资产转移或其他不可逆操作。真实链上 write、Token / native asset transfer 必须取得用户针对该类操作的明确授权并确认目标 environment，详见 `AGENTS.md`。

### Simulation / Preflight

对于支持 simulation 的 EVM write，应优先评估：

```text
simulate / preflight
→ wallet signature
→ broadcast
```

simulation 不是所有协议都必须共享同一种 helper 的理由。simulation failure、wallet rejection、broadcast failure 与 on-chain revert 必须保留不同语义，不能统一压缩为“交易失败”。

### Approve / Allowance

ERC20 workflow 如需 allowance，必须将其视为多个独立 chain operation：

```text
check allowance
↓
allowance insufficient 时发起 approval
↓
approval receipt / Feature 要求的确认
↓
main transaction
```

不得用单一 `isLoading` 掩盖 approval pending、approval confirmed、main transaction awaiting wallet、main transaction submitted 等不同阶段。approval txHash、错误和确认状态应能被所属 Feature 清楚表达。

exact amount、max approval、unlimited approval 与 zero-first policy 属于产品、安全与 Feature policy；generic Web3 层不得写死。

## Transaction Lifecycle、Context Snapshot 与 Completion Contract

### 生命周期事实

Transaction workflow 至少需要保留以下事实层次，而不是只暴露 `isLoading`、`isSuccess` 或 `isPending`：

| 层次 | 至少可表达的语义 |
| --- | --- |
| Submission | preparing、awaiting wallet、user rejected、submission failed、identifier obtained |
| On-chain | pending、confirmed、reverted / failed、receipt / confirmation error |
| Backend business | not required、pending / observing、completed、failed、unresolved / timeout、cancelled |

这些词用于表达需要，不是最终必须导出的 enum 名称。具体 state shape 必须匹配 Feature 的真实 completion contract，且不得假设整个 App 同时只有一笔交易。

取得 txHash 仅表示 transaction 已提交并获得 EVM transaction identifier。它不是 Toast success、不是 on-chain confirmation，也不是 Backend business completion。

### Transaction Context Snapshot

Feature 开始不可逆 write 前，必须先捕获或冻结该 operation 的稳定 transaction context。不得等拿到 txHash 后才第一次记录 transaction 的原始 identity。初始 snapshot 只包含该 workflow 所需的最小上下文，例如：

```text
originating chain
originating account
wallet identity
contract
operation / Feature identity
必要业务 identity
Backend reconciliation identity
```

在真正提交 write 前，Feature 必须确认这些 required context 仍然 current 且 valid。概念流程如下：

```text
Feature starts transaction
↓
capture operation context
↓
validate account / chain / contract
↓
simulation / preflight（如适用）
↓
wallet submission
↓
txHash / chain-specific identifier obtained
↓
attach identifier to the same transaction context
↓
receipt observation
↓
Backend reconciliation
```

拿到 txHash 后，应将它或 chain-specific identifier 追加到同一笔 transaction identity。后续 receipt observation、Backend reconciliation、polling、状态映射与 completion 判断必须继续使用该 transaction context，不得重新读取“当前 account”“当前 wallet chain”或“当前 selected chain”来代替历史事实。

Transaction A 属于 Account A、Chain A 与其 identifier。即使用户随后切换至 Account B、Chain B，Transaction A 的 receipt 和 Backend reconciliation 也不得变成 B 的 context。

### Stale result 与多个 transaction

旧 transaction 可以继续被后台观察，但其 late result 不得无条件：

- 改写当前 Account B 的 Feature state；
- 为 B 当前页面显示 A 的成功 / 失败 Toast；
- 覆盖新的 workflow instance；
- 关闭新打开的 Modal 或重置新表单；
- 写入当前 chain Store；
- invalidate 与其 identity 不匹配的 Query。

Feature 必须在应用结果前判断 transaction context、workflow instance、account、chain、route 和 component lifecycle 是否仍匹配。Transaction state 默认归发起交易的 Feature owner；不得建立默认的全局 `transactionStore` 或 `global currentTxHash`。

如果未来需要跨页面 transaction center 或刷新后继续观察 pending transaction，必须基于可恢复 identity（至少 chain、account、identifier 与 operation）重新建立 observation。不得依赖内存中的 boolean，也不得在尚无真实需求时预设 persistence。

### Replacement、Dropped Transaction 与 Reorg

Business Operation Identity 不等于永远固定的单个 txHash。EVM transaction 在 pending 期间可能发生 speed up、cancel 或其他 wallet replacement；同一 Feature operation 可以关联 original transaction identifier 与 replacement transaction identifier。operation identity 应保持稳定，实际 chain attempt identifier 可以变化，本文不锁定最终数据结构。

发生 replacement 时，original hash 未确认不得被简单判断为 business operation failed。Feature 必须根据 replacement reason、chain result 与自身 completion contract 判断语义：speed-up 可以继续追踪 replacement transaction；cancel 或 replacement-to-cancel 则可能表示用户取消。不得将所有 replacement 强制视为同一种成功 continuation。

如果 Backend reconciliation 使用 transaction hash，Feature 必须以实际 Backend Contract 明确其接受 replacement hash、original hash、operation id 或其他 identity。若 replacement 需要新的 Backend reconciliation identity，也必须继续绑定同一个 Feature operation context，不得创建无关的当前页面 transaction。

长期 pending、RPC 暂时查不到或 transaction 未进入区块，不得直接等同于 on-chain reverted。Feature 应能够保留 pending、unresolved、dropped / not found（仅当真实 provider / protocol 可确认）或 timeout 等真实语义；具体 timeout 与 dropped 判定策略保持 TBD。

receipt / confirmation 也不是脱离 chain finality 的绝对永久事实。若目标 chain 存在 reorg 风险，Feature 的 completion contract 必须服从该链与业务实际需要的 confirmation / finality policy。不得因刚观察到一次 receipt 就永久声明 business completed；本文不锁定 confirmation count 或 finality depth。

## On-chain Confirmation 与 Backend Reconciliation

### 独立的确认系统

On-chain confirmation 与 Backend business reconciliation 是两个独立状态系统：

```text
on-chain confirmed
≠ Backend business completed

Backend temporarily unresolved
≠ on-chain transaction failed
```

Backend reconciliation 可能表示 indexer 已观察交易、Backend 已处理交易、业务记录已创建、order / deposit 已生成、reward 已入账，或某个 Feature workflow 已完成。其精确语义必须由实际 Backend Contract 定义；无法确认时必须标记为 **Contract ambiguity / TBD**，不得猜测。

Backend 返回记录也不能自动伪造链上 confirmation，除非 Backend Contract 明确提供了可信的 on-chain confirmation 事实，并且 Feature 明确以此作为其 completion contract 的一部分。

### Feature orchestration 与 API 边界

正确的责任关系如下：

```text
Feature workflow
  ├─ Web3 submission / receipt lifecycle
  └─ Backend reconciliation API
```

`docs/web3.md` 规定 txHash、receipt、chain confirmation、transaction context、Web3 error 与 reconciliation 在 workflow 中的位置。`docs/api.md` 规定 Backend endpoint、DTO、HTTP transport、response、Backend status Contract 和轮询请求 transport。

`shared/web3` 不得直接调用 `/v1/.../query_signature` 或任何具体业务 reconciliation endpoint。若 Backend status 需要 Client-managed remote lifecycle，可由 Feature 评估 TanStack Query；否则保持在 Feature-owned workflow。不得让通用 Web3 infrastructure 知道具体 Backend API。

### 历史生产证据

旧项目审计确认公司已有以下真实模式：

```text
Pattern A: write → txHash → Backend reconciliation
Pattern B: write → receipt → business completion
Pattern C: write → receipt → Backend reconciliation → business completion
```

这证明不同 Feature 的 completion contract 不同，不证明旧代码结构、SDK 组合或成功条件可直接继承。

旧项目存在 `txHash → query_signature → Backend polling` 的流程，并发现历史 transaction 在链切换后可能按“当前 chain”查询的 context bug。历史描述曾出现约每 2 秒、最多约 30 次的轮询；审计时观察到的旧项目默认值则为每 2 秒、最多 60 次。两者仅作为 production behavior evidence，绝不是 starter 的全局常量。

## Polling、Cancellation 与交易后刷新

必须区分：

```text
on-chain receipt polling
```

与：

```text
Backend business reconciliation polling
```

它们不能被表示为同一种状态或由同一默认机制承担。

Backend polling 必须拥有：

- 明确 owner；
- transaction context snapshot；
- success、failure 与 stop condition；
- cancellation / lifecycle 规则；
- timeout 或 attempt policy；
- stale-result protection；
- 由真实 Feature / Backend Contract 决定的 interval 与 retry policy。

不得把递归 `setTimeout`、动态读取当前 chain、没有 cancellation 的 polling 当作默认架构。也不得在 Shared 中写死 polling interval、attempt、timeout 或 Backend status code。

Backend timeout / unresolved 必须能与 on-chain failure 同时存在。例如：

```text
chain confirmed
+ Backend reconciliation unresolved
```

不得改写为“Transaction failed”。反向亦然：Backend response 非空也不得自动声明链上 confirmed。

达到 Feature 的 completion contract 后，Toast、关闭 Modal、重置表单、导航、Query invalidation 与局部刷新都由 Feature 决定。generic Web3 transport 不得自动产生这些 UI side effect。

只刷新实际受影响的资源。不得 `invalidate everything`，也不得同时执行 `set Zustand + refetch + invalidate + local copy` 来维持多条同步路径。具体 Query invalidation 与资源 identity 遵守 [状态管理规范](./state-management.md)。

## Web3 Error Model

Web3 层必须保留错误发生阶段与可恢复语义，不得将所有错误变成 `catch → Toast`。实现可以使用 union、object 或其他适合的结构，但至少应区分：

- User Rejected；
- Wallet / Provider Error；
- Unsupported Chain；
- Chain Switch Error；
- Simulation Error；
- RPC Error；
- Broadcast Error；
- On-chain Revert；
- Receipt / Confirmation Error；
- Backend Reconciliation Error；
- Timeout；
- Abort / Cancellation；
- Unknown。

User Rejected 是正常、可识别的用户选择，不是 Unknown Error，也不必然是系统异常。Web3 层提供语义；错误 Toast、pending UI、成功 UI 和视觉呈现由 Design System / Feature UI owner 定义。

HTTP、Backend Auth、response parsing 与 Backend business error 的具体定义遵守 [API 规范](./api.md)。不得因为两个概念都包含“signature”就将用户 Wallet transaction / message signing 与 Backend request signing 混成同一错误或认证机制。

## 金额、单位与精度

链上 raw integer，包括 wei、token amount、allowance、balance、gas、fee、supply 和其他合约整数，必须使用：

```text
bigint
+ Viem unit helpers
```

不得使用以下形式承担价值敏感计算：

```ts
Number(raw)
parseFloat(raw)
raw / 10 ** decimals
```

raw chain unit 与 human-readable decimal 的转换必须明确。使用 Viem 的 `parseUnits`、`formatUnits`、`parseEther` 与 `formatEther`，或等价的经过验证的通用 helper。仅在实际需要时将业务中立的单位 helper 放入 `shared/web3`；Token-specific decimals 和 amount semantics 归 Token Domain，Feature-specific calculation 归 Feature。

USD price、ratio、percentage、PnL、display calculation 等业务十进制运算遵守 [技术栈规范](./tech-stack.md)，使用 `bignumber.js`。`bigint` 用于链上整数，decimal library 用于业务十进制；二者不得被当作同一种数值模型混用。

## EVM 与 Solana

已审计的成熟生产主链路是 EVM。Solana 旧实现不完整，不能作为新 starter 的架构依据。

新 starter 可以在真实需求出现时保留以下能力方向：

```text
shared/web3/evm/
shared/web3/solana/
```

但不得为所谓“跨链统一”让 EVM txHash、Solana signature、EVM receipt 与 Solana commitment / finality 走相同 implementation。

可统一的仅是高层概念，例如：

```text
submitted
identifier
pending
confirmed
failed
```

底层钱包、签名、broadcast、confirmation、finality、error 与 RPC client 必须保持 chain-specific。Solana 的默认技术方向是 `@solana/kit`，只有真实 Solana 业务出现时才接入；不得因旧项目使用过 `@solana/web3.js`、wallet-adapter、Anchor 或 Meteora 而默认引入它们。

## Provider 与安全边界

Provider 只用于真正跨应用的 infrastructure / context，例如已验证的 Privy、Wagmi 或 Query Provider。Provider 不得承担全局业务编排、余额 cache、交易状态、Toast 或业务数据同步。

应用代码不得自行复制、持久化或放置以下内容到 `NEXT_PUBLIC_*`、Client bundle、Git、localStorage、Zustand persistence 或 logs：

- private key；
- seed phrase；
- true server signing secret；
- private credential；
- private RPC credential；
- Backend signing material；
- Privy session 副本；
- Authentication truth。

用户 Wallet 的 blockchain transaction / message signing 属于 wallet operation。Backend request signing 属于 API / Backend Authentication Contract。两者即使都被称为“signature”也必须保持分离。

Server / Worker-side Web3 dependency、RPC strategy 和 private configuration 必须额外验证 Cloudflare Workers Runtime compatibility。环境变量、Bindings、Secret、CORS 与部署配置由 `docs/cloudflare.md` 定义；不得在本文锁死具体 Binding 或 flag。

## 禁止模式

以下模式默认禁止：

```text
txHash obtained
→ transaction success
```

```text
Backend empty result / timeout
→ chain transaction failed
```

```text
current chain
→ 查询历史 transaction
```

```text
Account A transaction
→ 更新 Account B current context
```

```text
RPC result
→ useEffect
→ Zustand cache
```

```text
all Web3 business
→ giant contracts.ts
```

```text
all transaction state
→ global transactionStore
```

```text
Number(raw chain amount)
```

```text
catch
→ Toast
→ 丢弃错误阶段与语义
```

```text
Privy / Wagmi account
→ duplicate into Zustand truth
```

```text
Wallet current chain
= Business Target Chain
```

```text
Backend reconciliation endpoint
→ hardcoded in shared/web3
```

```text
recursive polling
+ no cancellation
+ dynamically reads current chain
```

```text
missing contract config
→ zero / placeholder / other-chain address
→ continue write
```

```text
Wallet connected
→ assume every signing or transaction capability
```

```text
untrusted client address
→ treat as current authenticated user's wallet on Server
```

## 专项文档边界与待决事项

本文负责 Wallet、Account、Chain、Contract ownership、Contract read / write、approval、transaction lifecycle、txHash、receipt、confirmation、Web3 error、transaction context snapshot、Backend reconciliation 的位置、EVM / Solana boundary 和 Web3 precision。

以下主题由对应专项规范负责：

| 主题 | 规范 owner |
| --- | --- |
| Backend reconciliation endpoint、HTTP Contract、DTO、HTTP error、Backend status response、request transport | `docs/api.md` |
| Query key、Query cache、Zustand、context readiness、stale result、state lifecycle owner | `docs/state-management.md` |
| RPC environment variable、Worker Binding、Secret、CORS、deploy | `docs/cloudflare.md` |
| transaction Toast、error / pending / success UI | `docs/design-system.md` |
| Web3 mock、simulation test、chain-switch race test、reconciliation test、failure-path test | `docs/qa.md` |

本文不得提前锁定：

- 最终 transaction state enum；
- global transaction manager 或 persistent transaction center；
- confirmation count、receipt timeout；
- Backend polling interval、max attempts、retry count 或 status machine；
- query_signature 的最终 Contract；
- exact approval、gas、account abstraction、smart wallet、bundler、paymaster、multicall 策略；
- Solana 最终架构；
- schema library 或全局 Web3 error class。

## 实施检查清单

新增或修改 Web3 功能前，至少确认：

1. 这是 Shared、Domain 还是 Feature responsibility？
2. 是否重复维护 Wallet、account 或 chain source of truth？
3. Wallet current chain 与 Business Target Chain 是否被混淆？
4. ABI 与 Contract address 是否归属正确 owner，并可追溯到 environment、chainId 与 deployment / protocol version？
5. chain、Contract、address 或 ABI 缺失时，是否 fail closed 而未使用 zero、placeholder 或其他 chain 的 fallback address？
6. Contract read 是否被错误复制进 Zustand？
7. Server-side read 是否将公开 address 错当成当前 authenticated user's wallet，或跨 request 共享 wallet identity？
8. Contract write 是否由所属 Feature 编排，并已完成 Wallet capability preflight？
9. Transaction、plain message、typed data 与 Backend request signing 是否按不同语义处理？
10. 具备 authentication、authorization 或 replay risk 的签名是否具有真实协议要求的 domain separation 与 replay protection？
11. 是否错误地把 txHash 当作 success？
12. 是否区分 submission、on-chain 与 Backend business state？
13. 当前 Feature 的 completion contract 是什么？
14. transaction 是否具有稳定的 operation identity，并允许 replacement attempt 使用不同 identifier？
15. transaction 是否保存 origin account / chain snapshot？
16. receipt 与 Backend reconciliation 是否使用 snapshot，而不是当前 context？
17. account / chain 切换后，旧结果是否可能污染当前 UI 或 Query？
18. polling 是否有 owner、stop condition、cancellation 与 timeout / attempt policy？
19. Backend timeout 是否被错误表示为 chain failure？
20. chain confirmed 是否被错误表示为 Backend completed？
21. approval 与主交易是否被错误合并成一个 boolean？
22. raw amount 是否保持 bigint-safe？
23. 是否存在 `Number`、`parseFloat`、`10 ** decimals` 的价值敏感计算？
24. Web3 error 是否保留真实阶段？
25. generic Web3 层是否错误包含具体 Backend endpoint？
26. Privy、Wagmi、Viem 是否职责重复？
27. EVM 与 Solana 是否被强行统一底层实现？
28. completion 后是否只刷新受影响资源？
29. Secret、signing material 或 session 是否可能进入 Client surface？
