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

## Variables

| Variable | Classification | Browser visible | Dev / Prod 不同 | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | Public | 是 | 是 | `development` \| `production`，与 `NODE_ENV` 无关 |
| `NEXT_PUBLIC_SITE_URL` | Public | 是 | 是 | 站点完整 origin（不带结尾 `/`），用于重定向、回调、绝对链接、分享 |
| `NEXT_PUBLIC_API_BASE_URL` | Public | 是 | 是 | ORI 后端 API Base URL |
| `NEXT_PUBLIC_BACKEND_APP_ID` | Public | 是 | 可能 | 后端要求的公开应用标识（≠ Privy App ID） |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Public | 是 | 是 | Privy App ID（≠ App Secret） |
| `NEXT_PUBLIC_WS_URL` | Public | 是 | 是 | 实时 / WebSocket 客户端 endpoint，仅限浏览器安全地址 |
| `NEXT_PUBLIC_REFERRAL_CODE` | Public | 是 | 可能 | 公开邀请 / 长链接标识；若具备认证权限须重新分类 |
| `NEXT_PUBLIC_IPFS_GATEWAY_URL` | Public | 是 | 可能 | 公开 IPFS Gateway Base URL |
| `NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID` | Public | 是 | 是 | 97（Dev）/ 56（Prod） |
| `NEXT_PUBLIC_EVM_RPC_URL` | Public | 是 | 是 | 浏览器安全 RPC，须与 chainId 同一网络 |
| `NEXT_PUBLIC_ENABLE_VCONSOLE` | Public | 是 | 否 | `true` / `false`，默认 false |
| `RESTRICTED_COUNTRIES` | Server / Policy | 否 | 否 | 逗号分隔 ISO 3166-1 alpha-2，当前 `CN` |
| `BACKEND_APP_SECRET` | Server Secret | **否** | 是 | 后端签名 / 鉴权 Secret |
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

## Secret Boundary

```text
Browser must never receive:
BACKEND_APP_SECRET
IPFS_JWT
CLOUDFLARE_API_TOKEN
```

Secret 只能在 Next / Worker Server Boundary 中读取。未来流程（本阶段不实现）：

```text
Backend:  Browser → Server / Worker → BACKEND_APP_SECRET → Backend
IPFS:     Browser → Server / Worker → IPFS_JWT → IPFS Provider
```

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
| WebSocket | 开发 / 测试（待填） | 生产（待填） |
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

## Follow-ups（Runtime Foundation）

| Task | Note |
| --- | --- |
| Public config parser 对齐契约 | 当前 `parse-public-config.ts` 仍读取契约外的 `NEXT_PUBLIC_EVM_CONTRACT_ADDRESS`、`NEXT_PUBLIC_SOLANA_RPC_URL`，未解析 `SITE_URL`、`BACKEND_APP_ID`、`WS_URL`、`REFERRAL_CODE`、`IPFS_GATEWAY_URL`；`APP_ENV` 仍接受 `staging`。README 中 "matching `.env.example`" 描述需同步 |
| Server config reader | 为 `RESTRICTED_COUNTRIES`、`BACKEND_APP_SECRET`、`IPFS_JWT` 建立 Server-only 读取边界 |
| `pnpm env:check` | 校验必填项、URL、chainId、Dev / Prod 一致性（Production 不得用测试网，Development 不得用主网合约）、Secret 不带 `NEXT_PUBLIC_`、Public 变量不含已知 Secret 类别；只输出变量名 + PASS / FAIL，永不输出值 |
