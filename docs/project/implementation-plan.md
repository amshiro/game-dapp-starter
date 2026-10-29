# Implementation Plan

根据 Figma、线上运行事实与依赖关系排定的顺序。每阶段开始前检查 [open-questions.md](./open-questions.md)；**不要假装 Unknown 已解决**。

## Project status

| Phase | Status |
| --- | --- |
| Real Project Intake | COMPLETE |
| Product & Runtime Reconstruction | COMPLETE |
| Environment Contract V1（[environment.md](./environment.md)） | COMPLETE |
| Project Knowledge Lock | COMPLETE（对应 Feature Unknown 继续保留） |
| Implementation Foundation | F1–F10 COMPLETE；W1/W2、A1 Accordion 子集、Typography 已审核并 push；A1/Points 完整工程演示 UI 本轮实现待审核，生产 Gate 保留 |

## Implementation Foundation task graph

基础任务状态如下；后续可执行票据、依赖、状态与人工 Gate 统一见 [Feature Task Graph](./feature-task-graph.md)。旧 Stage 0–13 保留为范围索引，不再作为自动顺序执行指令；具体依赖与阻塞以 Feature Task Graph 和当前 Project facts 为准。

| # | Task | Depends on | Verifiable outcome |
| --- | --- | --- | --- |
| F1 | Environment Parser Alignment + `env:check` — **COMPLETE** | Environment Contract V1 | public config parser 只读取契约变量；`APP_ENV` 仅 development / production；`pnpm env:check` / `env:check:production` 只输出变量名 + PASS / FAIL / SKIP |
| F2 | （并入 F1） | — | — |
| F3 | BSC Chain Registry — **COMPLETE** | F1 | 97 / 56 链定义与浏览器信息由注册表提供，不来自 env；environment → chain 映射只有注册表一个代码 owner |
| F4 | Contract Registry / ABI integration — **COMPLETE** | F3；Q-10 | `chainId → address + ABI`，ABI 原样来自 `ori-website/constant/*.json`；56 / 97 合约集完整，BSC 97 缺 WBNB 价格查询地址 |
| F5 | Privy + Wagmi + Viem Runtime Foundation（含 F5.1 Runtime Stabilization）— **COMPLETE** | F1、F3 | Provider 组合与单链 Wagmi / Privy config；EVM capability 校验 Registry 链与环境一致；连接 / 断开 UI 属后续 Wallet 任务 |
| F6 | API Transport（含 F6.1 Contract Reconciliation、F6.1a App ID audit、F6.2 Security Cleanup）— **COMPLETE** | F1；Q-11 | `Browser → ORI API transport → Backend`；ORI 无后端登录 / 签名 / Secret；正式 Contract 对照与差异；Token 价格 DTO；Development 测试后端验证 |
| F7 | Realtime Foundation — **COMPLETE** | F1、F6；Q-47 | Pusher 协议客户端（`pusher-js`，懒加载）；`NEXT_PUBLIC_WS_URL` + `NEXT_PUBLIC_PUSHER_APP_KEY`；按需连接、引用计数订阅、去重、重连后 `resync`、空闲释放、payload 边界；realtime 只触发 Query invalidation，polling 保留（[api.md](./api.md#realtime)）；Development 实时服务 502，真实事件未观察到 |
| F8 | Design Foundation — **COMPLETE** | Q-05 继续保留许可条款审定/发布边界 | Semantic tokens、global styles、ORI viewport；Typography Foundation 已接入用户提供的 HarmonyOS Sans SC variable，全局单一字体 owner，CSS 400/500/700，fallback 保留 |
| F9 | App Shell — **COMPLETE** | F8 | ORI viewport、sticky Header、fixed Bottom Navigation、safe-area、pathname active state；五个标题占位页，用户确认 URL 映射与根路径跳转见 routes.md；Wallet / Header price data 待后续接入 |
| F10 | Feature Task Graph — **COMPLETE** | F1–F9 | [逐票据 Scope、READY / PARTIALLY BLOCKED / BLOCKED、依赖与 Human Gates](./feature-task-graph.md)；W1 已审核并 push；[R0 静态证据审计](./r0-evidence-audit.md) 已完成，W2 已审核并 push；A1 Accordion 子集已审核并 push，本轮已授权恢复对应当前源码正文/链接，生产文案 Gate 保留；E1 Core UI 已完成并通过人工审核，数据 Gate 未通过 |

Typography Foundation 已完成、审核并 push：Starter 单一 HarmonyOS Sans SC Variable WOFF2，完整 wght 40–900，许可文件保留。E1 Core UI 只交付正式 /explore 的展示结构，真实数据接入仍为 PARTIALLY BLOCKED（Q-27/Q-11）。

Stake UI = COMPLETE。Development 97 Read = VERIFIED：ORI balanceOf、View stakedAmount / totalStaked 已通过最终人工验收；详见 web3.md 的 S1 read evidence。Stake Tx implementation = COMPLETE：97 的 exact Approve / Deposit / Withdraw、金额与百分比输入、Feature-local transaction owner、自动及受控浏览器 QA 已完成。Stake Real Tx QA = **DEFERRED — TEST ORI REQUIRED**：用户确认测试账户 ORI 为 0，批准 implementation checkpoint，不阻塞 Development 主线；不记作真实交易已验证。无 API；APR/TVL/reward semantics 保持未确认，Claim = BLOCKED / LATER，Production 56 = RELEASE GATE。详见 [Stake Transaction Slice 1](./stake-transaction-slice-1.md)。

用户本轮 UI 修正：external Wallet 隐藏 Export / Receive；当前 UI 接入 en / zh-CN Header 切换，request-cookie / SSR / Client 使用同一 locale。embedded 钱包未启用，正式 About / 费率 / Production 默认语言仍需审定。

M1 Read/Data Gate 证据审计已完成并通过人工审核，完整数据 Gate 结论仍为 **BLOCKED**：97 原始 round/25 格部署与人数等读路径有 runtime evidence；当前/下一轮与状态语义、Miners 列表和 selection 规则尚未签收，API Contract 与新 runtime 仍冲突。详见 [Mine Read/Data Gate](./mine-read-data-gate.md)。完整 M1 Gate 仍未通过。用户随后已批准限定 M2 Read-only Board：此前已提交的 /mine 与 public snapshot Query 仅覆盖棋盘，不代表整页完成；用户已要求 Full Mine UI correction，完整 1–6 扫描见 [Mine Page State Inventory](./mine-page-state-inventory.md)，整页 read-only UI 已完成并通过人工审核；不代表完整 M1/M2 数据/业务完成，polling/realtime、selection interaction 与交易均未开始。

每个任务单独实现、单独 QA，不跨任务顺手实现。

原则：

- 视觉以新版 Figma 为准；链、合约、API 以线上运行事实为准（[web3.md](./web3.md)、[api.md](./api.md)）。
- 不迁移旧代码；只复用事实。
- 不创建假 API、假合约、假数据；没有数据源的视图不进入生产路径。
- 共享组件在第一个真实使用它的 Feature 中实现，归属见 [components.md](./components.md)。
- QA 遵守 `docs/qa.md`；视觉验证覆盖 375px、常见手机宽度与 PC 500px。

## Stage 0 — 产品决策（非代码）

| 项 | 内容 |
| --- | --- |
| Scope | P0：起源 / 交易挖矿去留（Q-01、Q-02）、Logo 与代币图标（Q-03）、生产 Privy App 与登录方式（Q-04）、字体授权（Q-05）；以及 Q-10、Q-11 的负责人与时间 |
| Output | 确认结果写入 requirements.md |

Stage 1–2 可以在 Stage 0 未完成时开始，但导航项与 Logo 位置先按可替换方式实现。

## Stage 1 — Project Foundation

| 项 | 内容 |
| --- | --- |
| Scope | 项目 Token（`src/styles/tokens.css`）、HarmonyOS Sans SC 字体、全局背景；i18n 资源结构（en / zh 两套，默认语言见 Q-30） |
| Required facts | design-system.md；requirements C-70 |
| Blockers | Q-05（HarmonyOS Sans SC 字体资产授权仍 TBD；不阻塞 tokens、fallback 与全局样式） |
| QA | typecheck、lint、format、test、build；颜色对照 Figma |

## Stage 2 — UI Shell

| 项 | 内容 |
| --- | --- |
| Scope | AppContainer（H5 100% / PC 500 居中）、Header（Logo、价格位、钱包按钮位）、Bottom Navigation、safe-area、主视图路由、PageHeading |
| Required facts | C-10–C-12、C-20、C-21；routes.md |
| Blockers | 导航第 2 项（Q-01）、Logo（Q-03）可先留可替换实现；Q-33 已确认 Mine `/mine`、`/` 跳转到 `/mine` |
| QA | 多宽度截图；键盘可访问；无 hydration 警告 |

## Stage 3 — Privy + BSC Runtime（Phase 4A.2）

| 项 | 内容 |
| --- | --- |
| Scope | Privy Provider（仅钱包登录、EVM 外部钱包）+ Wagmi + Viem，BSC 56 / 97；Connect 按钮；Header 地址；Wallet Sheet 中复制地址与断开 |
| Required facts | web3.md Chain / Wallet model；Starter Phase 4A.1 EVM capability gating 已就绪 |
| Environment | 开发：BSC Testnet 97 + Privy Dev App `cmkw81a5y00onkw0czubpy4hj` + 公开测试网 RPC + 97 合约（C-08）；不配置生产运行时 |
| Blockers | Q-04（生产 Privy App、登录方式、Origins，不阻塞开发）、Q-14（生产 RPC，不阻塞开发）、Q-22（导出 / 接收）、Q-21（PC Sheet） |
| Dependency note | 新增 Privy / Wagmi / Viem 依赖需按 `docs/tech-stack.md` 申请 |
| QA | 连接 / 断开 / 刷新；网络错误时 chain gating fail-closed；不把钱包状态复制进 Zustand |

## Stage 4 — Backend Auth

| 项 | 内容 |
| --- | --- |
| Scope | 根据后端 Contract 决定是否需要鉴权以及方式 |
| Required facts | requirements C-82；Q-13 已解决 |
| Note | **当前不需要**：ORI 没有后端登录体系，接口不需要登录参数或签名（Backend owner Confirmed）。不得复制 Origin.fun 的 md5 签名方案。若产品未来需要后端登录，作为新架构变更重新设计（见 requirements C-82） |

## Stage 5 — Read APIs 与链上读取

| 项 | 内容 |
| --- | --- |
| Scope | Mine 所需读取：当前轮次、方块统计、我的部署、奖励、自动挖矿状态、母矿、价格；实时频道 `round.new_round` / `round.reset` |
| Required facts | api.md；web3.md（OreProtocolView） |
| Blockers | Q-10（合约版本与 ABI 权威来源）、Q-11（API Contract 与环境） |
| QA | Query identity 含账户与链；账户切换后无旧数据；实时断线重连 |

## Stage 6 — Mine UI + State

| 项 | 内容 |
| --- | --- |
| Scope | 数据卡（含切换）、5×5 方块（全部状态）、方块选择、Manual / Auto 表单、按钮状态机、总额计算、结果动画、Miners、Rewards 显示 |
| Required facts | C-30–C-49 |
| Blockers | Q-15（Auto 规则）、Q-16（快捷按钮）、Q-17（金额规则）、Q-18（颜色）、Q-19（全选）、Q-25（Rewards 命名）、Q-31（母矿双资产） |
| QA | 总额与状态机单元测试（`bigint`，不用 float）；动画时序 |

## Stage 7 — Mine Transactions

| 项 | 内容 |
| --- | --- |
| Scope | `deployManual`、`registerAutomation`、`stopAutomation`、`claimAll`、`claimEth`；错误映射（`AlreadyDeployedThisRound` 等） |
| Required facts | web3.md Transaction concepts；`docs/web3.md` completion contract |
| Blockers | Q-12（交易状态 UX）、Q-43（checkpoint）、Q-42（领取时限） |
| QA | 拒签、失败、pending、成功路径；只在用户授权的测试网环境做真实交易 |

## Stage 8 — Stake

| 项 | 内容 |
| --- | --- |
| Scope | ORI 质押：approve → `depositStake`、`withdrawStake`、Summary（`/ori/summary`）；收益领取视 Q-26 |
| Blockers | Q-26、Q-24（说明文案） |

## Stage 9 — Points

| 项 | 内容 |
| --- | --- |
| Scope | 我的积分、记录 |
| Blockers | Q-20/Q-11 继续阻塞真实积分；用户授权 Figma static demo，正式 /points 完整 UI 本轮已实现待审核 |

## Stage 10 — Explore

| 项 | 内容 |
| --- | --- |
| Scope | 统计卡、Mining / Motherlodes / Buybacks 表、分页、横向滚动 |
| Blockers | Q-27（新版范围）、Q-11（DTO） |

## Stage 11 — About

| 项 | 内容 |
| --- | --- |
| Scope | 手风琴；内容使用线上 About 的 en / zh 文案 |
| Blockers | Q-41/Q-30 保留为生产 Gate；本轮用户授权恢复当前源码对应正文和链接，正式 /about 完整 UI 已实现待审核 |
| Note | 无链、无后端依赖，如需更早验证壳层与 i18n，可提前到 Stage 2 之后 |

## Stage 12 — Wallet Sheet 完整功能

| 项 | 内容 |
| --- | --- |
| Scope | 余额、`导出`、`接收`（视 Q-22） |

## Stage 13 — Visual QA 与发布准备

| 项 | 内容 |
| --- | --- |
| Scope | 全视图视觉验证（375 / 常见手机 / PC 500）；长数字、长地址；Workers 部署验证；Privy Allowed Origins；地区限制（Q-35） |

## 当前页面优先级

About + Points 完整 UI 本轮已通过人工审核；M7 polling/freshness 暂缓，不随页面开发实现。来源与全部设计状态见 [About / Points inventory](./about-points-ui-inventory.md)。
