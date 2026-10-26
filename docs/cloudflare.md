# Cloudflare Workers 工程规范

## 目标与适用范围

本文定义 `game-dapp-starter` 在 Cloudflare Workers 上运行、配置、部署和审查时的工程边界。目标是维护 Next.js App Router + vinext + Vite + Workers 的既定链路，并明确 Runtime、环境、Secret、Binding、缓存与部署安全。

本文不定义 Backend API Contract、Web3 transaction workflow、状态实现、测试框架或 UI 行为；这些分别由 `docs/api.md`、`docs/web3.md`、`docs/state-management.md`、`docs/qa.md` 与 `docs/frontend-rules.md` 负责。

Backend integration、Privy、Wallet、RPC、Binding、缓存与 observability 只在真实需求出现后建立。本文为这些能力设定边界，不得据此创建占位 Binding、Secret、BFF、缓存或环境配置。

## Runtime 与工具链

标准运行与部署链路为：

```text
Next.js App Router
→ vinext
→ Vite
→ @cloudflare/vite-plugin
→ Cloudflare Workers
```

具体 Worker name、compatibility date、flags、assets 与 Binding 必须以当前 `cloudflare.config.ts` 为事实来源；本文不将这些可变配置值写成永久规范。

vinext、Cloudflare Vite Plugin 的 `rsc` / `ssr` 环境与 `@vinext/cloudflare` 图片集成属于既定 Runtime 链路；具体配置仍必须以实际 Vite 与 Cloudflare config 为准。

| 工具 | 职责 |
| --- | --- |
| vinext | 提供 Next.js App Router 在 Vite 体系中的兼容与构建能力。 |
| Vite | 提供 `dev`、`build` 与 `preview` pipeline。 |
| `@cloudflare/vite-plugin` | 提供 Cloudflare Workers Runtime 的 Vite integration。 |
| `@vinext/cloudflare` | 提供 vinext 的 Cloudflare deployment 与图片集成。 |
| `cf` | 提供 Cloudflare config API、Workers type generation 等 tooling。 |
| workerd | Cloudflare 本地 Runtime 基础，由工具链依赖。 |

### Workers 是唯一默认部署目标

```text
Cloudflare Workers
≠ Cloudflare Pages
```

不得创建 Pages adapter、Pages config 或 Pages deployment instructions，也不得因旧教程切回 Pages。Workers tooling 与配置必须以当前 `cloudflare.config.ts`、`package.json` scripts 与相关 CLI dependency 为事实来源。

### Local preview 与 preview environment

local preview 指本地运行构建产物以检查行为的过程；具体命令必须从当前 `package.json` 读取。

preview environment 指远端的非 Production 部署环境。它不是 local preview 的同义词，必须拥有与 Production 隔离且内部一致的 Backend、chain、Contract、RPC、Secret、Binding、domain 与 Worker 组合。

## Runtime 边界

### Workers 不等于完整 Node.js

本地开发和构建使用 Node.js；生产执行 Runtime 是 Cloudflare Workers。即使启用了 `nodejs_compat`：

```text
nodejs_compat
≠ full Node.js runtime
```

新增任何 Server Component、Route Handler、Worker 或其他 server-side dependency 前，必须验证其真实 Workers compatibility，尤其是 Node built-in、native module、filesystem、`process`、长驻进程与进程级状态假设。不得因为本地 Node.js 可以运行，就推导 Worker 可以运行。

`compatibilityDate` 与 `compatibilityFlags` 属于 Worker Runtime contract。修改它们应视为 Runtime behavior change，并重新完成 build、相关 Runtime 验证与 regression / smoke verification。本文不预设新的 compatibility flag 或升级周期。

### Client / Server Runtime

Client Component 只能读取公开配置，不得导入 server-only module、Worker Binding、Secret、私有 RPC 或服务端 credential。

Server Component、Route Handler、Worker 与其他 server-side workflow 可以使用明确配置的 Runtime Config、Secret 与 Binding，但 user、wallet、session 与 chain 必须 request-scoped。不得使用 module-level mutable `currentUser`、`currentWallet`、`currentChain` 或 `currentSession` 跨 request 保存事实。

Route Handler 或 smoke route 不等于 starter 默认 BFF architecture。实际 smoke path 必须从项目现有 route 与功能中确定。

## Configuration 与 Secret

每项配置必须先明确归属，不能笼统称为“env”。

| 类别 | 用途 | 是否可进入 Client bundle |
| --- | --- | --- |
| Public Client Config | 可公开、可由终端用户看到的浏览器配置 | 可以 |
| Server / Worker Runtime Config | 仅供 Server / Worker 使用的非公开运行配置 | 不可以 |
| Secret | 凭据、私钥或高价值认证材料 | 不可以 |
| Worker Binding | Cloudflare Runtime 提供的资源能力 | 不可以 |
| Deployment Credential / CLI Config | 本地或 CI deploy tooling 使用 | 不可以 |

### Public Config、Secret 与 RPC

`NEXT_PUBLIC_*` 只表示该值允许被编译进 Client bundle、允许终端用户看到：

```text
NEXT_PUBLIC_*
≠ 普通 env 命名风格
≠ Secret storage
```

环境变量模板中的 App、API、Privy、chain、Contract、公开 RPC 与 vConsole 条目不代表每个后续项目都必须拥有它们。实施前必须检查实际环境变量、source 与 Runtime config，不得假设模板变量已被应用读取。

公开且不含敏感凭据的 RPC URL 可以按真实 Client Web3 需求使用。含 private API key、billable credential、private project token 或其他 server-only credential 的 RPC，只能用于 Server / Worker Runtime。Browser 与 Server 不因访问同一条 chain 而必须共用同一个 RPC URL。

Backend credential、private RPC、request-signing material、server API key 与 service credential 不得进入 `NEXT_PUBLIC_*`、Client bundle、source、Git、日志、`localStorage` 或 `sessionStorage`。`.env.example` 只能包含变量名、空值或安全示例及非敏感说明。

### Deployment Credential 与 Runtime 分离

`CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 属于 deploy tooling context，不是应用 Runtime 配置。Cloudflare API Token 只允许用于本地或 CI 的 deploy tool 认证，绝不得进入 Worker Runtime、Client env 或 application code。

## Worker Bindings

Binding 必须遵循：

```text
真实需求
→ Cloudflare config 显式声明
→ type generation
→ Server / Worker only
```

Client Component 不得直接依赖 KV、D1、R2、Worker Secret 或任何 Binding。Client 需要相关业务能力时，应通过明确的 Server boundary 获得最小能力；这不等于默认建立 generic BFF。

未来需要 KV、D1、R2、Queues、Durable Objects、Service Bindings、Hyperdrive、AI 或其他 Binding 时，必须有真实需求，明确 owner、访问范围与数据敏感性，并同步更新对应 Worker types。Binding 或 Worker Runtime contract 改变时，运行 `pnpm run cf-typegen`；不得维护会与真实 Binding 漂移的手写永久类型。

`.cloudflare/state` 内的 Miniflare 本地状态、数据库或目录只是 tooling 生成物：

```text
Miniflare local state
≠ configured production Binding
```

## Environment Isolation

一个 environment 不是单一 `APP_ENV` 字符串，而是一组必须匹配的资源：

```text
environment
= frontend + Backend + Privy + chain + Contract + RPC
+ Secret + Binding + Cloudflare Worker + domain / origin
```

`local`、`development`、preview environment / test environment 与 `production` 存在时，必须隔离并共同验证这组资源。尤其不得出现：

```text
production frontend
→ development Contract

preview frontend
→ production Backend / mainnet
```

preview environment 不只是另一条 URL；其 Backend CORS、Privy Allowed Origins、Backend、chain、Contract、RPC、Secret、domain 与 Worker 必须属于同一环境组合。

### Fail-Closed 与 destination

chain、Contract、Backend、Privy project 或 private service config 缺失、不匹配或不受支持时，必须停止敏感业务。不得使用 placeholder、zero address、production fallback 或 first available environment 继续运行。

Worker naming、Cloudflare Account strategy、`workers.dev`、custom domain 与 route 不在 starter 中预设；部署 destination 必须与当前 environment 明确对应。

## Browser、Worker 与 Backend

当 Browser 可以安全直接访问 Backend 时，默认可保持：

```text
Browser → Backend
```

只有存在真实 server-side requirement 时，才引入：

```text
Browser → Worker / Route Handler → Backend
```

典型原因包括 Server Secret、request signing、cookie / credential boundary、Backend aggregation、安全隔离或真实 CORS architecture。具体业务理由、HTTP Contract、Authentication 与 request transport 由 `docs/api.md` 定义。

Browser → Backend 受浏览器 CORS enforcement；Worker → Backend 不属于同一个浏览器 CORS 场景。遇到 CORS 问题时，应确认 allowed origins、credentials、cookie、auth、公私 API 与 deployment origin。不得使用 `mode: "no-cors"` 掩盖问题，也不得未经分析就把所有请求代理到 Worker。

## Cache Security

必须区分 public cacheable data 与 user-scoped、wallet-scoped、account-scoped、session-scoped、authorization-scoped data。后者不得进入未按 identity 正确隔离的 HTTP shared cache、Next / framework cache、Worker Cache API 或 Cloudflare CDN cache。

```text
User A response
→ shared cache
→ User B
```

本文只定义缓存隔离安全边界，不锁定 `Cache-Control`、`revalidate`、cache key、TTL 或具体 cache implementation。

## Web3 Environment Safety

Cloudflare deploy 成功不等于 Web3 environment 正确。Cloudflare 环境必须与 `docs/web3.md` 中的 chain、Contract、ABI / deployment version、RPC、Backend 与 Privy project 保持一致，并且不得将私有 RPC 或 server-only provider 暴露给 Client。

Wallet、Contract、transaction、RPC usage semantics 与精度仍由 `docs/web3.md` 负责；RPC fallback、Contract config schema 与 transaction lifecycle 保持由真实业务决定。

## Build、Local preview 与 Deploy

```text
deploy
≠ validation
```

`pnpm run deploy` 本身不自动保证 typecheck、lint、tests、环境校验、Binding 校验或 Runtime smoke test。Production deploy 前必须完成项目要求的 validation gate：

```text
build validity
type safety
required checks
environment correctness
Binding completeness
Workers compatibility
security-sensitive config validation
```

具体 lint、test、integration、E2E、smoke 与 regression 命令由 `docs/qa.md` 定义。不得因当前没有某个脚本而假装其已经运行。

AI / Codex 不得自动执行 Production deploy；只有用户在当前任务中明确授权时才能部署。Test / staging deploy 同样必须遵守 `AGENTS.md` 的授权、目标环境与 Account 明确性要求。

部署后应按项目完成最小 smoke verification：Worker 可达、关键 route 可达、必要 API route 可达且 Runtime 正常启动。具体 smoke path 由项目实际 route 与风险决定。

rollback、revision 与 deployment promotion 流程在 Production 使用前，按当时 Cloudflare 官方能力和真实 Account 验证；在明确前保持 TBD。

## Logging / Observability Safety

observability vendor 保持 TBD。未来 logging / error reporting 不得记录：

```text
Authorization
Cookie
token
Secret
signing material
private RPC credential
seed phrase
private key
```

wallet address 与 transaction hash 虽通常不是 Secret，也不得无目的大量记录。

## Forbidden Patterns

```text
NEXT_PUBLIC_* → Secret
Cloudflare API Token → Worker Runtime / Client
private RPC credential → Client bundle
nodejs_compat → assume full Node.js
/api/hello exists → proxy all Backend APIs
Browser CORS failure → mode: no-cors
Browser CORS failure → proxy everything
User A response → shared cache → User B
missing environment config → production fallback
AI finished code → automatic production deploy
```

## 专项文档边界

| 主题 | 规范 owner |
| --- | --- |
| Backend API Contract、Authentication、HTTP error、request transport、业务级 Browser-direct / Server-side API 理由 | `docs/api.md` |
| Wallet、chain、Contract、RPC usage semantics、transaction、Web3 precision | `docs/web3.md` |
| request isolation、Query、Client / Server state 与 persistence | `docs/state-management.md` |
| Server Component / Client Component 编码规则与 Route UI | `docs/frontend-rules.md` |
| validation commands、tests、integration、smoke / regression strategy | `docs/qa.md` |
| AI authorization、Git 与 deploy permission | `AGENTS.md` |

## 实施检查清单

新增或修改 Cloudflare、Runtime、environment 或 deployment 相关能力前，确认：

1. 部署目标是 Workers，而不是 Pages 吗？
2. Secret、deployment credential 或 private RPC 是否进入 Client？
3. server-only config、Binding 与用户身份是否保持 Server / Worker only 且 request-scoped？
4. 新 dependency 是否真实支持 Workers Runtime，而非仅依赖 `nodejs_compat`？
5. 新 Binding 是否有真实需求、已声明并完成 type generation？
6. 是否把 Miniflare local state 误认为 production Binding？
7. frontend、Backend、Privy、chain、Contract、RPC、Secret、Binding 与 domain 是否匹配目标 environment？
8. preview 是否可能误连 production Backend、Contract 或 mainnet？
9. 缺少关键 config 时是否 fail closed？
10. Browser CORS 是否被 `no-cors` 假修，或无理由建立 BFF？
11. scoped data 是否可能进入未隔离的 shared cache？
12. Production deploy 前是否完成项目 required validation？
13. 是否具有用户对本次 Production deploy 的明确授权？
14. deploy 后是否完成项目级 smoke verification？
15. logs 是否可能暴露 Secret、credential 或不必要的敏感用户数据？

## 保持 TBD

- environment naming；
- Worker / Cloudflare Account naming strategy；
- `workers.dev`、custom domain 与 route；
- specific Binding set；
- cache policy、TTL 与 cache key；
- RPC fallback；
- observability vendor；
- Route Handler / BFF 是否真实需要；
- CI/CD；
- rollback / promotion workflow。
