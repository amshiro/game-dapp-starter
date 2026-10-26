# API 规范

## 目标与适用范围

本文定义 **game-dapp-starter** 的 API、HTTP 与 Backend integration 边界。目标是在尊重真实 Backend Contract 的前提下，让 API 层吸收必要的服务差异，使 Domain、Feature、State 与 UI 获得清晰、可诊断且稳定的语义。

本文适用于 Next.js App Router、React 19、TypeScript、Web Fetch API、TanStack Query、Privy、Wagmi / Viem、Cloudflare Workers 与既定的 Domain + Feature + Shared 架构。旧项目只能作为生产经验和技术债证据，不得作为新项目的目录、request wrapper、认证、错误处理或缓存实现模板。

API 层优先保证：

- Contract 正确、类型可审查且不靠猜测补全；
- Auth、Secret、Server / Client Runtime 边界正确；
- 金额、时间和状态字段不丢失业务语义；
- 错误可以诊断，而非被伪装成正常空数据；
- owner 清晰，不重复维护状态或隐藏副作用；
- 在真实业务出现前不制造无价值的抽象。

本文不锁定具体 API client 形态、ApiError class、schema library、鉴权格式、缓存参数或测试框架；这些实现须在真实 Contract 和 Runtime 条件明确后决定。

## 实施前检查与核心原则

接入 API 前必须检查当前 package、source、config、环境变量、Backend Contract 与 Runtime 条件。不得因本文存在而假设业务 API、Backend Auth、service config、API client 或某种缓存策略已经存在。

远端数据不因来自 API 就必须进入 TanStack Query：

~~~text
Server-only Remote Data
  → Server Component / framework data flow

Client-managed Server State
  → TanStack Query
~~~

API owner、State owner 与 UI owner 是不同概念。API 层定义如何请求、解析、映射和报告 Contract；State 层决定生命周期、缓存、重新获取与失效；UI 层决定用户可见的 loading、error、empty state 与恢复交互。

推荐调用链：

~~~text
Server Component
或 TanStack Query / Feature workflow
        ↓
Domain / Feature API
        ↓
Frontend input → Request DTO
        ↓
shared/api transport
        ↓
Backend
        ↓
Response DTO
        ↓
必要时 mapper / normalization
        ↓
Domain / Feature Model
        ↓
Consumer
~~~

并非每个接口都需要完整经过全部层级。Backend shape 与 Frontend 语义稳定一致时，可以直接使用 DTO；只有隔离价值真实存在时才增加 mapper。不得为了形式堆叠 DTO、Entity、Model、ViewModel 与 Adapter。

## API 架构与 owner

### 推荐目录与依赖边界

以下只是概念性示例。仅在真实模块出现时创建目录，具体 API function 仍必须靠近 owner：

~~~text
src/
  shared/
    api/                  # generic transport、generic error infrastructure
    config/               # project API service config

  domains/
    token/
      api/                # 稳定 Token 资源
    user/
      api/                # 稳定 User 资源

  features/
    swap/
      api/                # quote、submit 等 workflow API
~~~

不得建立或恢复横向的 **src/api/**、**src/services/**、**src/requests/** 或 **src/http/business-api/** 作为业务 API 垃圾桶。

### shared/api

**shared/api/** 只放不含产品业务语义的 transport infrastructure，例如：

- Fetch transport 与 URL resolution；
- 通用 headers、请求 metadata 与 body serialization；
- JSON 或非 JSON response parsing；
- HTTP status 处理；
- AbortSignal 传递；
- generic transport error 与通用 error normalization；
- 经验证的 auth attachment / signing adapter 接入点。

**shared/api/** 不得知道 Token、Swap、Points、Mining、Reward、User Profile、Claim 或 Create Token 等业务概念，也不得包含资源 endpoint。

generic request primitive 可以存在，但只能作为 Domain / Feature API 的内部基础能力。业务 Component、route 或 workflow 不得以 apiRequest("/whatever") 作为长期最终接口。

### Domain API 与 Feature API

稳定业务资源归属于对应 Domain；用户动作与工作流归属于对应 Feature。API function 必须表达 Frontend 业务语义，例如 getTokenDetail、getMyMiningRecords、getSwapQuote、submitSwap。不得向业务调用方暴露 request、post、callApi、fetchData 等无语义名字。

同一 Backend endpoint 可在 Frontend 中拥有多个语义化 API function：当不同请求体、消费者或返回 Contract 实际代表不同业务行为时，可以由多个函数复用底层 endpoint caller。不得为了复用 URL 创建带大量可选参数的万能函数。

### API function 的纯度

底层 API function 必须是普通 TypeScript function，只负责：

~~~text
input
→ request
→ parse
→ validate / normalize
→ typed return / typed error
~~~

不得直接调用 React Hook、修改 React state 或 Zustand、使 Query 失效、调用 Toast、导航、触发 Privy logout 或编排 Feature workflow。React Query Hook 属于 React / State integration 层；业务副作用和 UI 恢复策略属于各自 owner。

业务 Component 默认不得直接 fetch 完整业务 URL，也不得自行签名、拼接认证信息、解析共用 Backend envelope 或决定统一错误语义。即使是一次性 public resource，也必须先确定其 API owner。

## URL 与 service 配置

API URL 采用三层模型：

~~~text
Environment Host
  + Service / Project Namespace
  + Endpoint Path
~~~

### Environment Host

Host 用公开环境配置表达，例如 NEXT_PUBLIC_API_BASE_URL。它用于 development、staging、production 切换，且不得散落在 Component、Domain、Feature 或 endpoint function 中。业务代码不得硬编码环境 Host。

是否由 Browser-direct API 和 Server-only API 共用同一环境变量，须根据实际 Backend、CORS、cookie、Secret 与 Cloudflare Runtime Contract 决定；本文不预设。

### Service / Project Namespace

API version、service 或项目 namespace 具有项目级语义，例如 /v1/project、/v2/trade 或 /api/v1。它不得被写死为 shared/api transport 的永久知识。

namespace 应由明确的项目 API service config 管理，具体文件名和物理位置不在本文锁定，但必须符合架构的 config owner 规则。项目切换 namespace 时，不应要求修改通用 transport。

### Endpoint Path

endpoint path 由其 Domain 或 Feature owner 管理并靠近语义化 API function。不得建立全项目巨型 endpoints.ts 注册所有业务路由。

新项目只使用一种清晰的 URL composition model。不得复制旧项目中 BaseUrl / BaseUrlV2 与“Host + 已包含版本和 namespace 的 path”并存的模式。

### URL 参数与敏感信息

path parameter 与 query parameter 必须通过安全、明确且可审查的 URL 构造方式生成。需要进入 URL 的动态 path segment 必须正确编码；query 必须使用稳定的序列化方式构造。不得在业务代码中大量手工拼接 URL，并因此遗漏 encoding，例如：

~~~ts
`/users/${userInput}?name=${name}&filter=${filter}`
~~~

具体 URL helper 或 library 不在本文锁定，但 path、query 的编码与序列化规则必须靠近其 API owner，并服从真实 Backend Contract。

以下敏感信息不得放入 URL path 或 query：

- Authorization credential；
- access token、refresh token、session credential 或 Cookie；
- Secret；
- private signing material；
- 任何等价的敏感认证材料。

URL 可能进入 browser history、日志、proxy / gateway logs、analytics、referrer 以及 copy / share surface。若第三方或 legacy Backend Contract 明确要求在 URL 中传递敏感信息，必须作为安全风险单独评估，不得作为 starter 默认模式。

## Transport 与 Backend Contract

### HTTP Contract 优先

HTTP method、path、query、body 与 headers 都是 Backend Contract。不得为了追求 REST 形式自行将已确认的 POST 查询改为 GET，或将已有 body 改写为 query。

同样：

~~~text
POST ≠ Mutation
GET ≠ 自动 Query
~~~

TanStack Query 的 Query / Mutation 判断以是否读取远端状态、是否造成 Server side effect、是否改变业务事实为准，而不是 HTTP method。

### Request body 与 Content-Type

generic transport 不得假设所有请求都使用 Content-Type: application/json。request body 的编码方式和 Content-Type 都属于真实 Backend Contract。

未来接口可能使用 JSON、URL encoded form、FormData / multipart、text 或其他明确格式。transport 可以提供相应的基础能力，但不得覆盖 endpoint 的真实 Contract。

使用 FormData 时，不得为了统一封装而手工写死 multipart boundary；应交由运行时按实际 body 生成。本文不因此设计 upload framework 或新增 dependency。

### Request、Response 与 envelope

Request DTO 必须准确表达真实 Backend Contract。Response DTO 必须忠实表达服务返回的字段、nullable、单位和状态语义；不得为了 TypeScript 外观而虚构字段或错误收窄类型。

Backend Contract 与 Frontend Model 不同。API boundary 可将 Frontend input 映射为 Request DTO，并在必要时将 Response DTO 映射为 Frontend Model：

~~~text
Frontend input → Request DTO
Response DTO → Frontend Model
~~~

不得引入全局 recursive snake_case / camelCase converter。signature payload、第三方对象、metadata、dynamic key 或 opaque data 可能必须原样保留。映射应由 owner-local、显式、可审查的 pure mapper 完成。

mapper 必须 deterministic，且不得执行 network、Store mutation、Toast、navigation 或 React lifecycle。若 DTO 与 Frontend Model 已稳定一致，则不得为了架构感创建 mapper。

generic transport 只处理 HTTP 与 payload，不得永久假设所有服务都返回同一种 { data, common } envelope。某个 Backend service 经确认使用稳定 envelope 后，才可在该 service contract boundary 建立专属 envelope type 与显式解包规则。

同一 service / owner 内应保持返回策略一致。不得让不同 Component 猜测使用 response、response.data 或 response.data.data。

### HTTP status 与 response parsing

HTTP status 与 response body parsing 是两个独立维度。对于非成功响应，即使 body 非 JSON、JSON malformed 或为空，transport 仍必须保留原始 HTTP status、statusText 与可安全保留的诊断信息。

例如 HTTP 500 携带 HTML、malformed JSON 或空 body 时，最终错误不得只被标记为 Parse Error 而丢失 HTTP 500。必要时错误可同时包含 HTTP 与 parse 维度，但 HTTP 事实必须保留。

对于真实 Contract 中无 body 的成功响应，例如 204 No Content、205 Reset Content、HEAD 或其他明确无 response body 的情况，不得机械调用 JSON parser 并将正常响应识别为 Parse Error。本文不锁定具体 parser helper 实现。

### HTTP Redirect Contract

API redirect 必须服从真实 Backend Contract。不得将 3xx redirect 天然视为普通成功路径，尤其不得让以下流程被误认为正常 JSON API success：

~~~text
API request
  → redirect
  → HTML login page
  → final HTTP 200
~~~

若 endpoint Contract 不包含 redirect，unexpected redirect 必须作为可诊断事实保留；它可能表示 Auth anomaly、Contract mismatch、integration error 或 gateway / environment issue。Transport 与 API boundary 应避免因自动 follow redirect 而完全丢失 Contract 异常，并应关注 redirect 后的 final origin、response content type 与预期 payload Contract。

本文不锁定 redirect: "manual" 或其他具体实现。只有真实 endpoint 明确规定 redirect 是合法协议的一部分时，才按该 Contract 处理。

### Runtime validation 与 Contract drift

TypeScript 不能验证真实 Backend response。对于 Auth、金额、高风险数据、频繁变化的 Contract 或重要 union，runtime validation 可能有价值。

本文不锁定 schema validation library。不得因编写本规范而新增 Zod、Valibot、Yup、io-ts 或其他依赖；实际需求出现时按技术栈的 dependency rule 评估。

以下 Contract 未明确时，必须标记为 **Contract ambiguity / TBD**，不得按惯例猜测：

- auth header、token 格式或 refresh flow；
- Backend error body 与 business code；
- 金额表达、decimal 与单位；
- timestamp 单位、timezone 与语义；
- nullable、enum、pagination；
- retry 与 idempotency 语义。

Backend Contract 改变时，优先调整 Request DTO、Response DTO、mapper 或 endpoint adapter，避免让 Backend 字段变化扩散到大量 Component。不得以 any、大量 optional 字段或 as assertion 掩盖 breaking change。

## Error model 与 HTTP status

API 层必须产生稳定、可诊断的 Frontend error 语义。实现可以采用 union、object 或 class，但至少应能区分：

- Network Error；
- HTTP Error；
- Backend Auth Error；
- Backend Business Error；
- Contract / Parse Error；
- Abort / Cancellation；
- Unknown Error。

错误可保留 kind、httpStatus、backendCode、安全的 message、cause 与 retryable 等信息；不得在 transport 中丢弃 status 与可审查的错误上下文。

禁止吞掉错误或伪造成功数据：

~~~ts
catch {
  return [];
}
~~~

~~~ts
catch {
  return undefined;
}
~~~

HTTP error、错误 endpoint 或 Contract mismatch 必须可诊断，不能自动伪装为 Empty State。

### 已确认的 HTTP 403 与 404

已确认的公司 Backend 事实是：某些 service / endpoint 的 Backend token 错误或 Backend login / session 过期会返回 HTTP 403；API route / endpoint 不存在会返回 HTTP 404。

~~~text
已明确 credential 无效、token 失效或 Backend session 过期的 endpoint
  → HTTP 403

API route / endpoint 不存在
  → HTTP 404
~~~

当真实 Backend Contract 已明确某个 403 表示 credential 无效、token 失效或 Backend session 过期时，normalization 应将其识别为 Backend Auth Error。generic transport 不得仅依据 HTTP 403 就永久假定所有 service、endpoint 或未来项目的 session 一定失效。

若某个 endpoint 明确规定 403 表示“已认证但无权限”或 permission denied，必须保留该 Authorization 语义。无论 403 的具体 Contract 如何，它都不等于 Privy logout，也不等于 Wallet disconnect。transport 只报告 typed error；真正的 Auth owner 根据实际 Contract 决定 refresh、重新获取凭据、重建 Backend session、提示登录或 logout。

404 默认是 HTTP / Contract integration failure，不得自动映射为 null、空数组或 Empty State。只有某个 endpoint 明确规定“404 表示资源不存在”时，该 owner 才可映射为业务语义。

除已确认的 403 与 404 外，本文不为 401、400、409、422、429、500 或其他 status 编造固定业务含义。HTTP status 与 Backend business error code 是两个维度，不得只依赖 message string 判断错误。

## Authentication 与安全边界

必须保持以下事实分离：

~~~text
Privy Authentication
≠ Backend Authentication
≠ Wallet Connection
~~~

Privy 负责认证与其提供的钱包事实；Wallet provider 负责连接 account 与 chain；Backend session 属于 Backend Contract。任何一方失败不得默认自动修改另两方的事实。

目前不锁定 Backend Auth 的具体方式。不得把旧项目的“Privy login → backend token / secret → localStorage → browser signing”当成 starter 默认方案。auth attachment 必须集中管理，但 Bearer token、cookie、nonce、signed request、Privy access token、refresh token 与存储方式均须等待真实 Contract 确认。

若未来 Backend 要求 request signing，应将其实现为独立的 Auth / Request Signing Adapter 接入 transport。不得将特定签名算法焊死进通用 request client。若设计要求浏览器持有真正 server secret，必须重新评估安全模型，不能直接实现。

不得默认将 backend secret、auth secret、sensitive credential、Authentication truth 或 Privy session 副本写入 localStorage、Zustand persistence 或 Git。

任何 Server Secret、private credential、private RPC 或 signing material 不得进入 Client bundle、NEXT_PUBLIC_*、source、文档、example 或 log。公开 API Host 可以使用 NEXT_PUBLIC_*，但“公开可见”不等于可存放 credential。

credentials: "include" 不是 generic transport 的永久默认值。若真实 Backend 使用 cookie，必须根据实际 Contract 同时评估 SameSite、Secure、Origin、CORS、CSRF 与 Cloudflare routing；相关部署细节由 docs/cloudflare.md 规定。

### CORS 边界

Browser-direct Backend request 遇到 CORS 时，禁止通过 mode: "no-cors" 作为默认“修复”。不得为了让请求表面上不报错而隐藏真实的 CORS、Origin 或 credential 问题。

应重新检查 Backend CORS configuration、Origin、cookie / credential policy、Browser-direct 是否合理、是否存在真实 Server proxy / BFF 必要，以及 Cloudflare routing。具体 CORS deployment configuration 仍由 docs/cloudflare.md 负责；本文只规定不得使用错误的浏览器模式掩盖问题。

不得为了封装 API 自动添加 Browser → Next Route Handler → Backend 的 BFF / proxy。只有 Server Secret、cookie boundary、CORS、request signing、Backend aggregation 或安全隔离等真实理由存在时，才可单独设计。

## 数值、时间与字段语义

### 金额与精度

价值敏感 raw integer 不得默认使用 JavaScript number：

~~~text
token raw amount
wei
balance
allowance
reward
fee
supply
on-chain integer
exact large identifier
~~~

新 Backend Contract 应优先将精确整数作为 decimal string 返回，例如：

~~~json
{ "amount": "1300000000000000000" }
~~~

API boundary 再按真实语义转换为 bigint 或安全 decimal representation。若 Backend 已将超过 Number.MAX_SAFE_INTEGER 的精确整数作为 JSON number 返回，response.json() 时可能已经丢失精度；之后使用 BigInt、BigNumber 或 String 都无法恢复原值。这属于 Backend Contract precision risk，legacy API 必须明确标记并尽量推动改为 string。

price、percentage、ratio、USD value、PnL 等需要精度的业务十进制计算遵守 docs/tech-stack.md，使用 bignumber.js。不得用 Number()、parseFloat() 或 amount / 10 ** decimals 承担价值敏感计算。

当 Contract 使用 system_decimal、token_decimal 或其他精度字段时，必须明确 raw unit、各 decimal 的含义及 display conversion；不得仅根据字段名猜测转换关系。Web3 单位和交易语义由 docs/web3.md 定义。

### 时间、enum、nullable 与分页

时间字段必须在 API boundary 明确其单位、timezone 与业务含义。seconds Unix timestamp、milliseconds Unix timestamp、ISO UTC string 与 timezone-unknown datetime string 不可混用。不得通过位数猜测秒或毫秒，也不得无条件使用 new Date(timestamp)。

Backend 的 0 / 1、boolean、event code 或状态码可合法存在，但稳定业务语义不应扩散到 UI。必要时在 owner boundary 映射为 boolean、semantic union 或 named constant；不得让 Component 到处判断 value === 1 或 magic number。

null、undefined、空字符串、0 与 false 不等价。normalization 必须保留真实语义，禁止用 value || "" 或 value || 0 无差别覆盖。

只有某个 Backend service 已确认稳定分页协议时，才建立该 service-level pagination type。不得因旧项目常见 page / page_size / list / total 就创建全 starter 的万能 Pagination Contract。

## API、Query 与状态边界

纯 API function 只负责 Contract，不拥有 cache。禁止在 shared/api 中建立隐藏的 global Map、user cache、token cache 或 response cache，以免与 Next framework cache、TanStack Query 与 Web3 cache 形成多套 truth。

在启用 HTTP cache、Next / framework cache、Worker / Edge cache 或 Cloudflare / CDN shared cache 前，必须先判断响应是 public，还是 user-scoped、wallet-scoped、account-scoped、session-scoped 或 authorization-scoped。用户、钱包、账户、session 或权限相关响应，不得进入没有正确 identity isolation 的共享缓存，必须防止 User A 的响应被 User B 命中。

本文只定义该数据安全原则，不锁定 Cache-Control、Next fetch cache、revalidate、Cloudflare cache key 或 CDN configuration；具体实现由 docs/cloudflare.md 与真实 Runtime / Contract 决定。

Client-managed Server State 使用 TanStack Query，但 Server-only Remote Data 保持在 Server Component / framework data flow。API 文档不锁定 fetch cache、revalidate、QueryClient、dehydration、staleTime、gcTime 或 retry 数值。

依赖 user、address、chain、token、contract 或其他身份上下文的请求，只有在必要 context ready 且 current 时才能启动。不得用 undefined、空字符串、0、zero address 或旧 address 作为 user-scoped request 的 placeholder，除非 Backend Contract 已明确其业务语义。

Query data 不得经 useEffect 复制到 Zustand 或 local state 成为第二套 cache。API 层不得直接 invalidate Query；失效、draft reset 和 mutation lifecycle 由 State / Feature owner 根据真实数据关系处理。

## Server / Client Runtime 边界

同一个不依赖私有能力的纯 API function，若 Runtime-compatible，可以被 Server Component / framework data flow 或 Client-managed Query 调用；不得仅因调用位置不同复制两套完全相同的 server-api/ 与 client-api/。

如果实现依赖 Server Secret、Worker Binding、private credential、server-only cookie 或只有 Workers / Server Runtime 可用的能力，必须建立明确的 server-only boundary。Client Component 不得 import server-only implementation。

生产执行 Runtime 是 Cloudflare Workers，不是完整 Node.js。任何 Server / Worker API dependency 或实现都必须验证 Workers compatibility；不得因本地 Node.js 可运行便假定部署后可运行。

### Outbound request 与 SSRF 边界

Server Component、Route Handler、Server layer 或 Cloudflare Worker 发起 outbound request 时，请求目标必须来自 trusted application configuration、已知 Backend service、明确允许的 service / host，或经过严格验证的业务目标。

不得直接将用户可控输入作为完整 outbound URL，例如：

~~~ts
fetch(searchParams.url)
~~~

同样不得默认信任 URL params、form input、Backend response 或 third-party metadata 中的任意完整 URL，再由 Server / Worker 直接请求。确有动态远程资源需求时，必须明确其必要性、allowed protocol、allowed host / origin、internal / private network access 风险，以及 redirect 是否会改变最终目标。本文只定义 SSRF 与 trusted-destination 边界，不锁定 allowlist helper、URL validation library 或 Cloudflare-specific implementation。

## Cancellation、timeout、retry、idempotency 与 polling

generic transport 应允许将 AbortSignal 传递给底层 Fetch。搜索、route / identity change、Query cancellation、polling、long request 与用户取消都应由正确 owner 管理，不能让每个 Feature 发明一套 cancellation infrastructure。

API infrastructure 应支持 timeout policy，但不得全局写死同一秒数。普通 query、upload、aggregation 与 long-running operation 的需求可能不同；具体阈值由真实 Backend SLA 与验证结果决定。

retry 必须根据业务语义、idempotency 与 error kind 决定，不能按 GET / POST 机械判断。读取型 POST 可能可 retry；资金类或会产生 side effect 的 mutation 默认不得自动 retry。

若 Backend 提供 idempotency key、request id、nonce 或 unique operation id，Frontend 必须按真实 Contract 使用。若 Backend 未提供，不得自创 Header 并假设服务端会去重。不可重复动作仍必须由 UI / Feature 提供重复提交保护。

Polling 必须有明确 owner、stop condition、route / account / chain lifecycle、cancellation 与 stale-result protection。Client-managed server polling 优先评估 TanStack Query；不得以递归 setTimeout 作为无生命周期约束的默认实现，也不得在本文预设 polling interval。

## Logging、禁止模式与专项边界

API logging 不得记录 Authorization、Cookie、token、secret、request signature、signing material 或私有 user payload。开发调试同样应脱敏。Production observability、日志平台与测试策略由 docs/cloudflare.md、docs/qa.md 后续定义。

以下模式默认禁止：

~~~text
Component → full business URL fetch
transport → Toast / navigation / Privy logout / Wallet disconnect / Zustand
Backend DTO → 散落整个 UI
API result → useEffect → Zustand cache
unsafe JSON number → BigNumber → 假装恢复精度
timestamp → 猜单位
所有 POST → Mutation
HTTP error → [] 或 undefined
403 → 自动 Privy logout
404 → 自动 Empty State
NEXT_PUBLIC_* → 真正 Secret
~~~

本文负责 API ownership、URL composition、transport、Backend Contract、DTO / mapper、response handling、HTTP / API error、Backend Auth transport boundary、精度、字段语义、cancellation、timeout、retry、idempotency 与 Server / Client API Runtime boundary。

以下主题由其他专项规范负责：

| 主题 | 负责文档 |
| --- | --- |
| Query cache lifecycle、Query identity、Zustand、stale state、Server → Client handoff | docs/state-management.md |
| Wallet、chain、contract、RPC、signature、transaction lifecycle、Web3 cache | docs/web3.md |
| env、Secrets、Bindings、CORS deployment、Worker routing、Runtime configuration | docs/cloudflare.md |
| Toast、error、loading、Empty State 的呈现 | docs/design-system.md |
| mock、contract test、integration test、error-path testing、observability strategy | docs/qa.md |

明确保留为 TBD 的内容包括：除 Web Fetch API 外是否需要额外 HTTP client library（包括 Axios）、schema validation library、OpenAPI codegen、generated client、最终 ApiError implementation、QueryClient config、timeout / retry 数值、Authorization 格式、credential storage、cookie auth、refresh flow、request signing algorithm、BFF / proxy、Server Action、Route Handler、fetch cache、revalidate 与 mock library。

## 实施检查清单

新增或修改 API 前，至少确认：

1. API owner 是谁；是否应归 Domain、Feature 或 shared/api？
2. Host、namespace、endpoint path 是否各由正确 owner 管理？
3. 是否完全遵守已确认的 method、path、query、body 与 header Contract？
4. Query / Mutation 是否按副作用，而非 HTTP method 判断？
5. Request DTO 与 Response DTO 是否准确表达真实 Contract？
6. 是否确有 mapper 价值；Backend DTO 是否将泄漏到大量 UI？
7. 是否存在 unsafe integer；amount、decimal、unit 是否明确？
8. timestamp unit、timezone、enum、boolean 与 nullable 是否明确？
9. HTTP error 是否被保留为可诊断错误，而非吞掉或伪造为空数据？
10. 403 是否按真实 Contract 区分 Backend Auth Error 与 permission / authorization failure，并且未在 transport 中直接退出 Privy？
11. 404 是否被错误映射为空状态？
12. Auth attachment 是否集中；是否存在 Client Secret 或敏感 credential 泄漏？
13. retry 是否安全、符合 idempotency；cancellation、timeout 与 polling 是否属于正确 owner？
14. 是否错误新建 API cache，或把 API / Query data 复制到 Zustand？
15. request context 是否 ready 且 current；Server / Client Runtime boundary 是否正确？
16. Contract 不明确之处是否已标记 TBD，而不是根据惯例猜测？
