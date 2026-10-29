# ORI Environment Contract V1

`.env.example` 是变量契约本身；本文件说明分类、环境矩阵、Secret 边界与后续任务。全局 Config / Secret 规则见 `docs/cloudflare.md`、`docs/api.md`；运行时环境决策见 [ADR-001](./decisions/ADR-001-runtime-environments.md)。

## 文件

| File | Git | 作用 |
| --- | --- | --- |
| `.env.example` | tracked | 契约：全部变量名、分类与说明，不含真实值 |
| `.env.development.local` | ignored | 本机 Development 运行配置；`vite dev`（mode `development`）读取 |
| `.env.production.local` | ignored | 本机 Production 构建配置；`vite build`（mode `production`）读取 |
| `.env` | ignored | 本地工具与 Cloudflare 部署凭据 |

加载顺序（vinext，Next.js 兼容）：`process.env` > `.env.<mode>.local` > `.env.local` > `.env.<mode>` > `.env`。只有 `NEXT_PUBLIC_*` 会通过 `define` 内联进浏览器代码。

`.env.production.local` 只服务本机构建与预览；生产 Worker 运行时的 Secret 必须通过 Cloudflare Secret 提供，不能依赖本地文件。

### Cloudflare 责任边界

| 类别 | 何时生效 | 生产来源 |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | **构建时**内联进浏览器代码；修改后必须重新构建 | 生产构建环境（本机 `.env.production.local` 或 CI 环境变量）。不能用 Worker 运行时变量修改 |
| Server / Policy（`RESTRICTED_COUNTRIES`） | Worker 运行时读取 | Cloudflare Worker 普通变量（非 Secret） |
| Server Secret（`BACKEND_APP_SECRET`、`IPFS_JWT`） | Worker 运行时读取 | Cloudflare Secret |
| Deploy（`CLOUDFLARE_*`） | 仅部署工具 | 本机 `.env` 或 CI Secret，不进入 Worker |

具体 Binding / 变量声明方式以 `cloudflare.config.ts` 与 `docs/cloudflare.md` 为准，实现时确定。

## Demo Deployment

User Confirmed：当前 ORI 仅部署 Development / Demo，保持 `NEXT_PUBLIC_APP_ENV=development` 与 BSC Testnet Chain 97。Vite 的优化构建不等于业务 Production 环境；默认 `pnpm build` 会选用 production mode，因此 Demo 必须显式指定 development：

```sh
pnpm env:check
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build --mode development
git diff --check
pnpm deploy --env development --skip-build
```

`--skip-build` 仅可用于已通过检查且没有后续源码变更的同一 development 构建。现有 workflow 为 `vinext-cloudflare deploy`，目标来自 `cloudflare.config.ts` 的 `game-dapp-starter` Worker；本项目 Demo 使用该 Worker 的 `workers.dev` 站点，不配置生产域名或切换主网。部署后必须验证真实 URL、刷新路由、静态资源、Privy、API / RPC 和 Chain 97；未完成的真实钱包或交易验收仍记为 RUNTIME QA PENDING。

Privy Dev App 的 Allowed origins 必须包含 Demo 的完整 origin；本地预览也必须使用已允许的端口（如 `http://localhost:3000`）。该配置控制 iframe 的 `frame-ancestors`，缺失时可能出现 iframe 初始化超时，即使连接弹窗仍能打开。新增 origin 属于认证权限变更，需要人工明确授权，不能通过关闭安全限制或改用 Production App 绕过。

User Confirmed：Demo origin 为 `https://game-dapp-starter.gamecom.workers.dev`，已追加至现有 Privy Dev App `cmkw81a5y00onkw0czubpy4hj` 的 Allowed origins，保留全部原有条目；不添加 `www`、通配符或其他域名。

本机 `.env` 中的 `CLOUDFLARE_API_TOKEN` 仅供部署 CLI 认证，不能加入 `NEXT_PUBLIC_*`、Worker bindings 或应用代码。`.env*` 被 Git 忽略，只有不含值的 `.env.example` 契约可提交。

## Variables

| Variable | Classification | Browser visible | Dev / Prod 不同 | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | Public | 是 | 是 | `development` \| `production`，与 `NODE_ENV` 无关 |
| `NEXT_PUBLIC_SITE_URL` | Public | 是 | 是 | 站点完整 origin（不带结尾 `/`），用于重定向、回调、绝对链接、分享 |
| `NEXT_PUBLIC_API_BASE_URL` | Public | 是 | 是 | ORI 后端 origin（不含 `/v1`；`/v1/ori` 由 API 层拼接） |
| `NEXT_PUBLIC_BACKEND_APP_ID` | Public | 是 | 可能 | **Starter capability — inactive in current ORI**：带后端登录 / 签名项目的公开应用标识（≠ Privy App ID）；可选，ORI transport 不发送 |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Public | 是 | 是 | Privy App ID（≠ App Secret） |
| `NEXT_PUBLIC_WS_URL` | Public | 是 | 是 | 实时服务（Pusher 协议）地址：`ws` / `wss` + host[:port]，可带路径前缀，不含 `/app/<key>`、query、fragment；可选，见 [api.md](./api.md#realtime) |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | Public | 是 | 可能 | Pusher 协议公开 app key（≠ app secret，secret 不进入前端）；与 `WS_URL` 同时设置才启用实时 |
| `NEXT_PUBLIC_REFERRAL_CODE` | Public | 是 | 可能 | 公开邀请 / 长链接标识（Starter capability，当前 ORI 未使用）；旧 `ori-website` 将 Pusher key 误放在此变量，ORI 实时不读取；若具备认证权限须重新分类 |
| `NEXT_PUBLIC_IPFS_GATEWAY_URL` | Public | 是 | 可能 | 公开 IPFS Gateway Base URL |
| `NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID` | Public | 是 | 是 | 97（Dev）/ 56（Prod） |
| `NEXT_PUBLIC_EVM_RPC_URL` | Public | 是 | 是 | 浏览器安全 RPC，须与 chainId 同一网络 |
| `NEXT_PUBLIC_ENABLE_VCONSOLE` | Public | 是 | 否 | `true` / `false`，默认 false |
| `RESTRICTED_COUNTRIES` | Server / Policy | 否 | 否 | 逗号分隔 ISO 3166-1 alpha-2，当前 `CN` |
| `BACKEND_APP_SECRET` | Server Secret | **否** | 是 | **Starter capability — inactive in current ORI**：带后端登录项目的签名 / 鉴权 Secret；可选，ORI 不读取、无 signer |
| `IPFS_JWT` | Server Secret | **否** | 是 | IPFS 服务授权 |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy | 否 | — | 部署目标账户 |
| `CLOUDFLARE_API_TOKEN` | Deploy Secret | **否** | — | 部署工具凭据 |

合约地址、区块浏览器、WBNB 等可由链 / 部署注册表得出的值**不放环境变量**（下一阶段：`chainId → typed deployment registry → address + ABI`）。不预留无证据的变量（analytics、Sentry、CDN、feature flag 等）。

## Renames（Legacy → Canonical）

| Legacy / Ambiguous | Canonical | Note |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `NEXT_PUBLIC_SITE_URL` | |
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE_URL` | |
| `NEXT_PUBLIC_PRIVY_ID` | `NEXT_PUBLIC_PRIVY_APP_ID` | |
| `NEXT_PUBLIC_WS` | `NEXT_PUBLIC_WS_URL` | |
| `NEXT_PUBLIC_IPFS_DOMAIN` | `NEXT_PUBLIC_IPFS_GATEWAY_URL` | |
| `NEXT_PUBLIC_APP_ID` | `NEXT_PUBLIC_BACKEND_APP_ID` | |
| `NEXT_PUBLIC_APP_SECRET` | `BACKEND_APP_SECRET` | **User Confirmed：真实 Secret** |
| `NEXT_PUBLIC_JWT_KEY` | `IPFS_JWT` | **User Confirmed：真实 Secret** |
| `NEXT_PUBLIC_RESTRICTED_COUNTRIES` | `RESTRICTED_COUNTRIES` | 改为 Server / Policy |

左列名称只允许出现在历史证据文档中，不得作为新项目运行时契约。旧项目以 `NEXT_PUBLIC_` 暴露 `APP_SECRET` / `JWT_KEY` 属于 Legacy Security Debt，不为兼容而延续。

## Starter capability — inactive in current ORI

`NEXT_PUBLIC_BACKEND_APP_ID` 与 `BACKEND_APP_SECRET` 是 `game-dapp-starter` 的跨项目能力，供带后端登录 / 请求签名的项目使用。ORI 没有后端登录体系，所有接口都不需要登录相关公共参数或签名参数（Backend owner Confirmed），因此在 ORI 中：

- 两者都是**可选**，不是 ORI 必填配置；
- ORI API transport 不发送 `NEXT_PUBLIC_BACKEND_APP_ID`；
- `BACKEND_APP_SECRET` 仅限 Server / Worker，ORI 当前不读取，也不创建 signer 或 Server secret reader；
- 启用它们的项目需作为新的架构变更设计 Server 边界。

## Secret Boundary

```text
Browser must never receive:
BACKEND_APP_SECRET
IPFS_JWT
CLOUDFLARE_API_TOKEN
```

Secret 只能在 Next / Worker Server Boundary 中读取。ORI 后端 API 不经过 Server：`Browser → ORI API transport → Backend`（无 Secret、无签名）。未来 IPFS 上传若确认（Q-45，本阶段不实现）：

```text
IPFS:     Browser → Server / Worker → IPFS_JWT → IPFS Provider
```

`BACKEND_APP_SECRET` 在 ORI 中不启用（见 Starter capability）；若 ORI 未来新增后端登录体系，作为新的架构变更设计其 Server 边界。

规则：

- Secret 变量永远不带 `NEXT_PUBLIC_` 前缀，不在 Client Component 中读取，不进入 bundle。
- Production Secret 通过 Cloudflare Secret 提供；`.env.example` 中 Secret 只保留空变量名。
- 生产 RPC 若需要私密 key，不得写入 `NEXT_PUBLIC_EVM_RPC_URL`，应采用域名限制的公开 endpoint 或 Worker / Server RPC 代理。
- 旧项目泄露的 QuickNode RPC URL / 凭据永远不得迁移。

## Environment Matrix

| Concern | Development | Production |
| --- | --- | --- |
| App Env | `development` | `production` |
| Site URL | 本地 / 开发站点（待填） | 生产站点（待填） |
| Privy | Dev App `cmkw81a5y00onkw0czubpy4hj` | Production App（待定，Q-04） |
| Chain | BSC Testnet | BSC Mainnet |
| Chain ID | 97 | 56 |
| RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` | TBD（Q-14） |
| Contracts | 测试网注册表（web3.md BSC 97 列） | 生产注册表（web3.md BSC 56 列） |
| Backend | 开发 / 测试后端（待填，Q-11） | 生产后端（待填） |
| Realtime（WS URL + Pusher key） | 开发 / 测试已配置 host；Pusher 路由当前返回 502（Q-47） | 生产（待填，Q-47） |
| IPFS Gateway | 开发 / 测试（待填） | 生产（待填） |
| Restricted Countries | `CN` | `CN` |
| Backend Secret | 本机开发 Secret | Cloudflare Secret |
| IPFS JWT | 本机开发 Secret | Cloudflare Secret |

## Environment Consistency

```text
Development = Dev Site + Privy Dev + Dev Backend + Dev WS + BSC 97 + Testnet Contracts + Testnet RPC + Dev Secrets
Production  = Prod Site + Privy Production + Prod Backend + Prod WS + BSC 56 + Production Contracts + Production RPC + Prod Secrets
```

禁止任何跨环境混用（requirements C-80）。

## Validation

Public config parser（`src/shared/config/parse-public-config.ts`）只解析上表 11 个 Public 变量，不读取 Server / Secret / Deploy 变量。

```text
pnpm env:check              # 检查 development（.env < .env.local < .env.development < .env.development.local < process.env）
pnpm env:check:production   # 检查 production
```

`env:check` 只输出变量名与 `PASS` / `FAIL` / `SKIP`，**永不输出值**；存在 `FAIL` 时退出码为 1。当前阶段规则：

| 规则 | 说明 |
| --- | --- |
| 必填 | `NEXT_PUBLIC_APP_ENV`、`NEXT_PUBLIC_PRIVY_APP_ID`、`NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID`、`NEXT_PUBLIC_EVM_RPC_URL`、`NEXT_PUBLIC_API_BASE_URL`（F6.1：主要视图依赖后端）；其余 Public 变量缺失为 `SKIP`。Production 后端 host 未定前，`env:check:production` 预期因此失败，不填假值 |
| 格式 | 与 parser 相同：`APP_ENV` 仅 development / production；URL 为 HTTP(S)（`SITE_URL` 仅 origin；`WS_URL` 仅 ws / wss）；chainId 为正安全整数；布尔严格 true / false；`RESTRICTED_COUNTRIES` 为 ISO alpha-2 列表 |
| 一致性 | `APP_ENV` 必须等于所检查的 mode；development ⇒ 97，production ⇒ 56（映射来自 Chain Registry）；production 的 RPC 主机不得是测试网 |
| 命名 | 旧名称（含 `NEXT_PUBLIC_APP_SECRET`、`NEXT_PUBLIC_JWT_KEY`）、带 Secret 类别的 `NEXT_PUBLIC_*`、契约外的 `NEXT_PUBLIC_*` 一律 `FAIL` |
| Secret | `BACKEND_APP_SECRET`、`IPFS_JWT`、`CLOUDFLARE_*` 只报告是否设置 |

必填项会随 Foundation 推进（例如后端、实时接入时）在 `src/shared/config/check-environment.ts` 中更新。

## Follow-ups

| Task | Note |
| --- | --- |
| Server config reader | 只在出现真实调用方时建立：`IPFS_JWT`（Q-45）、`RESTRICTED_COUNTRIES`（Q-35） |
| Contract coherence | Development 不得使用主网合约：合约来自部署注册表（F4），由注册表按 chainId 保证，届时补充校验 |
