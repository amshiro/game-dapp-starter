# ORI Backend API Facts

ORI 后端接口的前端结论。后端正式 Contract 原文见 [api-reference/](./api-reference/README.md)（`user-api.md`、`activity-api.md`）；传输层、错误语义与 owner 规则见全局 `docs/api.md`。

证据优先级：后端正式 Contract → Development 测试环境实际返回 → `ori-website` 源码 → 旧线上行为。正式 Contract 与运行时不一致处标记 **CONTRACT / RUNTIME MISMATCH**，不自行判定哪方正确。

## Service

| 项 | 事实 | Status |
| --- | --- | --- |
| API base | `NEXT_PUBLIC_API_BASE_URL` = 后端 origin（不含 `/v1`）；`/v1/ori` namespace 由 `shared/api/ori-backend.ts` 拼接 | Contract + Runtime（F6.1） |
| 环境 | Development 测试后端可用（F6.1）；Production host 待定（Q-11）。旧 `gate.game.com` 自 2026-10-27 对所有路径返回 404 | Runtime |
| 方法 | 全部 `POST` | Contract |
| 请求编码 | Contract 未声明（示例为 JSON 样式 body）。Development 同时接受 `application/x-www-form-urlencoded` 与 `application/json`；前端使用 form（与 `ori-website` 一致），参数值为字符串 | Runtime |
| 鉴权 | Contract 中无任何鉴权、签名、`app_id` 或 Secret；用户相关接口以钱包地址为参数 | Backend owner Confirmed；见 Authentication / signing（Q-13 已解决） |
| 成功 envelope | `{ data, common: { timestamp, app_name, chain_asset_config? } }`；无 `error_code` | Contract + Runtime |
| 失败 envelope | **HTTP 200** + `{ error_code: number, message: string, errors: { <field>: string[] } }`，无 `data`。观察到 `10400`（参数校验）、`500`（`points/user`） | Runtime only；**Contract 未记录** |
| 业务 code | 无 code 表；不建立 enum，只保留数字 | Unknown |
| 未知路径 | HTTP 404 + 后端调试信息（`exception`、`file`、`line`、`trace`）；前端只报告 `HttpError`，不读取 body | Runtime（后端调试模式开启，需后端关闭） |
| 分页 | 请求 `page` / `page_size`；`data = { list, total }` | Contract + Runtime |

## Endpoint inventory（Contract）

全部为 `POST /v1/ori/*`，无鉴权。Request 列出 Contract 中的参数。

| Domain | Endpoint | Request | Response `data` | Status vs F6 |
| --- | --- | --- | --- | --- |
| Asset | `query/chain_asset_config` | `symbol?`（不传返回全部） | 资产数组 | 参数 `symbol` 为新信息 |
| Points | `points/list` | `page`、`page_size`、`miner` | `{ list, total, user_points }` | 旧源码有定义但从未调用 |
| Points | `points/user` | `miner` | `{ miner, total_points }` | 同上；Development 当前返回 `error_code 500` |
| Round | `reset_event/round` | `round_id` | 单轮开奖事件 | **新增** |
| Round | `reset_event/list` | `motherlode?`、`page`、`page_size` | `{ list, total }` | Explore 已调用 |
| Round | `round_winners/round` | `round_id` | 轮次开始事件 | 名称与内容不符，见 Differences |
| Round | `round_started/round` | `round_id`、`page`、`page_size` | 中奖者列表 | **新增**；名称与内容不符 |
| Round | `latest/events` | — | `{ round_started, reset_event, max }` | 已调用 |
| Explore | `explore` | — | 统计卡 `{ value, label }` | 已调用 |
| Explore | `bury_event/list` | `page`、`page_size`、`type`（0 旧版 / 1 game 挖矿 / 2 ori 游戏） | `{ list, total }` | 已调用 |
| Explore | `activity/bury_point_events` | `page`、`page_size`、`type` | `{ list, total }` | 已调用 |
| Stake | `summary` | — | `{ staking_annual_yield }` | 已调用 |
| Automation | `automation/user` | `user` | 自动挖矿状态 | 已调用；参数名为 `user` |
| 起源 | `activity/origin_info` | `user_addr` | `{ ori_config, chain_asset_config, global, user, my_wallet }` | 已调用 |
| 起源 | `activity/user_asset_events` | `user_addr`、`event_type`（310001 中奖 / 310002 母矿中奖） | 数组（Contract 无分页） | 旧调用传 `page` / `page_size` 并读 `{ list, total }`，见 Differences |
| 起源 | `activity/wd/info` | `addr` | `{ limit_amount, chain_asset_config }` | **新增** |
| 起源 | `activity/wd/query_signature` | `signature` | 提现记录 | **新增**；示例为 Solana 数据 |
| 起源（挖矿游戏） | `mining_game/info`、`mining_game/record_list`、`mining_game/swap_record`、`mining_game/deposit_records` | 见 Contract | — | `deposit_records` **新增**；`record_list` 按参数分「全局 / 母矿」与「我的」两种响应 |
| ORI 游戏 | `ori_game/info`、`ori_game/record_list`、`ori_game/trade_records`、`ori_game/stats` | 见 Contract | — | 已调用 |

旧源码定义、**不在正式 Contract 中**（不再视为 canonical）：`round`（`getRoundInfo`，Mine 每 4 秒轮询）、`swap/price`、`swap/quote`、`swap/nonce`、`swap/submit`、`ori_game/swap_record`。

## Differences

**Official contract vs old source**

- `round` 与四个 `swap/*` 端点不在 Contract 中；Mine 当前轮次数据与起源 swap 流程的后端来源需后端确认（Q-11）。
- R0 静态复核：`latest/events` 的 `data.max` 内才有 `round_started_round_id` / `reset_event_round_id`；旧 Mine 读取顶层 `data.round_id` / `data.reset_event_round_id`，不能直接视为等价。需后端锁定 canonical round 来源，不复制旧基于 gameState 数值 4 的推断。
- 旧 Rank 对 `round_winners/round` 传 `winner_address`（Contract 未列），并读 `data.list`；Contract 却给单条 started 对象。不能仅按 endpoint 名称交换 URL。字段/identity/单位边界见 [R0 证据核对](./r0-evidence-audit.md#api-字段级核对)；本轮未重测服务。
- `user_asset_events`：Contract 中 `data` 为数组、无分页参数；旧调用读取 `data.list` / `data.total`。
- `chain_asset_config`：Contract 无 `is_inner`；旧代码用它区分起源内盘 / 外盘价格。
- `automation/user` 参数为 `user`；`wd/info` 参数为 `addr`；其余用户接口为 `user_addr` 或 `miner`。

**Official contract vs previous F6 assumptions**

- 成功 envelope 是 `{ data, common }`，而非 `{ error_code?, data }`；`error_code` 只出现在失败响应中（运行时）。

**CONTRACT / RUNTIME MISMATCH**（Development，F6.1）

- `chain_asset_config`：运行时每行含 `is_inner`（0 / 1，如 `qiyuan` 有两行）；`price` 混合 JSON number 与十进制字符串（Contract 示例为 number）；`aux_contract_addr` 混合 EIP-55 与全小写。
- `explore`：运行时只有 `max_supply`（value 为 string）、`buried_7d`、`protocol_rev_7d`（value 为 number）；Contract 还有 `circulating_supply`，且全部 value 为带千分位的 string。
- `reset_event/list`：运行时多出 `total_deploy`、`send_point_token`。
- 失败 envelope（`error_code` / `message` / `errors`）未写入 Contract。

**Contract 内部问题**（需后端确认，原文未改）

- `round_winners/round` 的响应是轮次开始事件，`round_started/round` 的响应是中奖者列表，名称与内容对调。
- 多处示例不是合法 JSON（单引号、行内中文注释、`reset_event/list` 的 `list` 元素缺少 `{`）。

## Authentication / signing

- **ORI 没有后端登录体系**：所有接口都不需要登录相关公共参数或后端签名参数（Backend owner Confirmed；与正式 Contract、Development 运行时一致）。
- 架构锁定为 `Browser → ORI API transport → Backend`。不存在 Server signer，也不预留 Server secret reader；若未来新增登录体系，作为新的架构变更重新设计。
- 旧 `_post`（md5 签名 + `app_id` + Origin.fun 会话 cookie）在全部分支调用 0 次，线上 bundle 中也不存在；`NEXT_PUBLIC_BACKEND_APP_ID` 与 `BACKEND_APP_SECRET` 作为 **Starter capability — inactive in current ORI** 保留在 Environment Contract 中：均为可选，ORI transport 不发送 App ID，不读取 Secret，不创建 signer（[environment.md](./environment.md#starter-capability--inactive-in-current-ori)）。

## Address case

- `chain_asset_config` 不需要地址参数（只有可选 `symbol`）；Registry 地址从不发送给后端。前端在本地匹配：DTO mapper 接受任意大小写并转换为 EIP-55 checksum，匹配使用 Viem `isAddressEqual`（`domains/token`）。空字符串 `aux_contract_addr`（Contract 示例）映射为无地址。
- 用户地址参数（`user_addr`、`miner`、`user`、`addr`）：Contract 未声明大小写规则。Development 观察：`activity/origin_info`、`ori_game/info` 对同一地址的 checksum / 小写 / 大写 hex 返回相同数据；`points/user` 无法验证（返回 `error_code 500`）。在后端确认前，大小写不敏感只是**观察结果**，不是 Contract。
- 后端返回地址的大小写不统一（如 `ori_game/trade_records.user_address` 为小写），比较一律按 EVM 地址语义。

## Numeric fields

- Contract 中金额字段有三种形态：链上原始整数（如 `vault_share`、`amount_per_square`、`trade_records` 中带「原始单位」注释的字符串）、按 `system_decimal`（通常 8）缩放的整数（如 `origin_info.global.*`），以及已格式化的展示字符串（`explore.*.value`，如 `"28,000,000"`）。
- JSON number 可能超出安全整数范围（如 `log_unique_id: 9223372036854775807`）；这类字段在 `JSON.parse` 时已经丢失精度，不得用作身份 / 去重键，需要后端改为字符串或由 Feature 确认语义。
- 前端规则：金额保留原始表示（字符串，或无指数形式的 number 转字符串），链上原始单位转 `bigint`，不对金额 `parseFloat`。每个字段的单位与 decimals 由对应 Feature 按 Contract 确认。

## API foundation（F6 / F6.1）

- `shared/api/request-json.ts`：浏览器 / Worker 通用 JSON transport；不读环境变量、不持有凭据、不重试、支持 `AbortSignal`、意外 redirect 报错；支持 form 与 JSON body。
- `shared/api/ori-backend.ts`：ORI service contract（`/v1/ori`、form POST、envelope 解包）。非 0 `error_code` → `BackendBusinessError`（`backendCode`、`backendMessage`；`message` 不含后端文本）；无 `data` → `InvalidResponseError`。
- 错误：`NetworkError`、`AbortedError`、`HttpError`、`InvalidResponseError`、`BackendBusinessError`、`ConfigurationError`。
- DTO 边界示例：`domains/token/api/get-asset-prices.ts` → `asset-price-dto.ts`（纯 mapper）→ `model/asset-price.ts`（`symbol`、`address?`、`price` 字符串、`isInner?`）。
- 无 Server secret reader / signer：ORI 没有需要它的接口。

## Security

- `api-reference/` 只能记录可公开的接口事实（规则见其 README）。曾出现在 `user-api.md` 中的后台管理凭据已移除，需由 backend / admin owner 轮换。
- Backend currently exposes internal stack traces for some error paths（Development 未知路径 404 返回 `exception` / `file` / `line` / `trace`）；backend owner should disable detailed exception output outside controlled debugging。前端不读取、不记录这类 body。

## Realtime

### 旧 ORI（`ori-website`，全部分支相同）

| 项 | 事实 | Status |
| --- | --- | --- |
| 协议 / 库 | Pusher 协议 WebSocket（Laravel broadcasting）；`laravel-echo ^2.2.6` + `pusher-js ^8.4.0`，模块级全局 Echo 单例（`utils/echo.ts`） | Source |
| 配置 | `wsHost = NEXT_PUBLIC_WS`（仅 host），`key = NEXT_PUBLIC_REFERRAL_CODE`（**实为 Pusher app key**），`cluster: ""`，`wsPort 80` / `wssPort 443`，`forceTLS`，仅 `ws` / `wss` 传输 | Source |
| 线上 | `wss://gate.game.com/app/<public app key>`（host 与 API 相同）；该 host 自 2026-10-27 起 404 | Live |
| 订阅 | `hooks/useEchoChannel.ts`：mount 时 `channel.listen`，cleanup 时 `stopListening(event)`（移除该事件的**全部**监听，不离开频道）；只有 `pages/mine/index.tsx` 使用 | Source |
| 重连 | 无应用层处理，完全依赖 pusher-js 内建重连 / 重新订阅；断线期间漏掉的事件不补偿 | Source |

| Channel | Event（wire 名） | 旧前端读取的字段 | 旧前端动作 |
| --- | --- | --- | --- |
| `round.new_round` | `round.data.started`（Echo 写法 `.round.data.started`，前导点 = 无命名空间） | `data.timestamp`（`data` 可能是 JSON 字符串） | 清空选择 / 投注显示；invalidate `eventInfo`、`automation` |
| `round.reset` | `round.data.reset` | `data.winning_square` | invalidate `roundWinInfo`、`eventInfo`、`automation`；播放开奖动画（3.6 s + 5 s），结束后再次 invalidate |

Payload 字段只来自旧前端读取方式，**后端未提供 schema，Development 未观察到真实事件**（Q-47）。

**Development 验证状态（F7）**：`<WS host>/app/<key>` 返回 Cloudflare 502（真实 key 与无效 key 相同，上游不可达），pusher-js `connecting → unavailable`；真实频道订阅与 payload schema **尚未验证**，polling fallback 仍有效。后端恢复实时服务后需要补一次真实 smoke（连接、两个频道订阅、事件 payload shape）。

### 旧 ORI 为什么 realtime 与 polling 并存

realtime 只在**轮次边界**（开始 / 开奖）推送，并且不可补偿；Mine 页的其余新鲜度全部来自 polling：

| 数据 | 来源 | 刷新 | 有对应 realtime 事件？ |
| --- | --- | --- | --- |
| 当前轮次链上状态（`getTreasuryState` / `getGameState` / `getCurrentRoundInfo`） | 合约读 | 每 1 s | 否 |
| `latest/events`（推导当前 `roundId`） | API | 每 3 s，并被两个事件 invalidate | 间接 |
| 方块部署量（`round`，`components/matrix.tsx`） | API | **每 4 s** | **否**：轮次进行中其他用户的部署没有推送 |
| `automation/user` | API | 每 10 s，并被两个事件 invalidate | 间接 |

因此 polling 不是 realtime 的冗余：(1) 轮次内的变化没有事件；(2) 断线、页面后台、WS 不可用时 polling 是唯一来源；(3) 事件只作为"立刻刷新"的信号，数据始终重新从 API / 合约读取。新项目同样**不因 realtime 删除 polling**；具体间隔由各 Feature 按数据语义决定（`round` 端点本身不在正式 Contract 中，见 Q-11）。

### 新 foundation（F7）

| 层 | 位置 | 职责 |
| --- | --- | --- |
| Capability | `shared/config/realtime-capability.ts` | `NEXT_PUBLIC_WS_URL` + `NEXT_PUBLIC_PUSHER_APP_KEY` → endpoint；缺一即 `unavailable`（实时关闭，只靠 polling） |
| Event catalog | `shared/config/ori-realtime-events.ts` | 两个 ORI 事件的 typed channel / event 名；payload 为 `unknown`。`domains/round` 建立后迁入（components.md） |
| Client | `shared/realtime/realtime-client.ts` | 第一个监听者才连接，最后一个离开后空闲 1 s 释放频道与连接；每个频道只向 transport 订阅一次；同一 listener 去重；重连后重新确认订阅时发 `resync`；payload 由事件的 `parse` 校验，失败跳过该监听者并报告；单个 listener 抛错不影响其他 |
| Transport | `shared/realtime/pusher-transport.ts` | `pusher-js@8.6.0`（不使用 Laravel Echo）按需 `import()`；仅 WebSocket、无 stats、无鉴权（公共频道）；重连、退避、ping / pong 与重连后重新订阅由 pusher-js 负责 |
| React | `shared/realtime/realtime-provider.tsx` | `RealtimeProvider`（`app/providers.tsx`，位于 `QueryClientProvider` 内，不依赖 EVM）；`useRealtimeEvent(definition, listener)`、`useRealtimeStatus()` |

问题报告只含 kind 与 channel / event 名，不含 payload 或连接参数。

### TanStack Query integration

- realtime 只发**新鲜度信号**；server state 只在 TanStack Query 中。不建立 `roundStore`，不把事件 payload 写入 Zustand 或手工 patch cache。
- Feature 在 listener 中 `queryClient.invalidateQueries({ queryKey })`，只 invalidate 真正受影响的 owner Query；`event` 与 `resync` 通常同样处理（`resync` = 断线期间可能漏事件）。
- polling 由 Query 的 `refetchInterval` 保留；Feature 可以根据 `useRealtimeStatus()`（`connected` 时）放宽间隔，但不得在 `disabled` / `unavailable` 时停止 polling。
- 动画等纯 UI 反应（旧开奖动画）属于 Feature local state，不属于 realtime 层。

## 不迁移

- axios 实例、`qs` 封装、md5 签名、cookie `login_token` / `login_secret`（Origin.fun）。
- 浏览器可见的 `NEXT_PUBLIC_APP_SECRET` 签名方案。
- 401 / 403 / 404 一律"去登录"的错误处理。
- 模块级全局 Echo 单例、`stopListening(event)` 一次移除全部监听、`NEXT_PUBLIC_REFERRAL_CODE` 作为 Pusher key。

## M1 Mine Read/Data Gate：新增只读 runtime evidence

本轮四个登记的 Mine API 均 HTTP 200，但并不代表 Contract 一致：latest/events 返回 flat started 数据；round_started/round 返回 started 对象；round_winners/round 返回带空 list 的 envelope；多个 log_unique_id 已超过 JSON safe integer。样本 round 1654 的 started block hash 与链 97 匹配；不推广为全部接口/Production 链契约。非空 winners 行/金额单位仍未验证，不能继承旧 Rank 的 8 decimals。

字段对照、链上读证据、失败 RPC 与 Mine 数据映射统一见 [M1 Read/Data Gate](./mine-read-data-gate.md)。R0 的历史静态结论保留；当前新增样本不自动批准 adapter、API endpoint 替换或 realtime payload。M1 Gate 仍 BLOCKED；本轮没有 API 业务接入。

## Mine Historical APIs：2026-10-29 只读 smoke 补充

使用当前 Development 配置、公开 zero-address / 存储轮1654作只读参数。本轮六个端点均返回 HTTP200 成功 envelope；没有交易、签名或新增 runtime API owner。

| Endpoint | 本轮观测 | 尚不能证明 |
| --- | --- | --- |
| /ori/latest/events | data 为 flat object，round_id:number、timestamp:number；包含 block/log identity | unsafe large ID、时间/轮次契约、reset/start 映射仍需签收 |
| /ori/round | round_id:string、global、user、last_updated | 未正式登记不等于不可达；非空字段单位/精度仍未签收，不替代链上 board owner |
| /ori/automation/user | data:null | active 非空 schema、remaining、fee、链上状态一致性 |
| /ori/round_winners/round | round_id:string、total、list:[]、reset_event | 非空奖励 row、dataset、排序、单位与正式端点命名冲突 |
| /ori/activity/origin_info | ori_config、chain_asset_config、global、user、my_wallet | allocation/claim/payment；Origin 为独立 FUTURE GATE |
| /ori/query/chain_asset_config | 数组7项 | 97 price quote 覆盖、价格精度与资产映射 |

A/B/C/D 分类及新架构 owner 见 [需求对齐](./mine-requirements-reconciliation.md)。HTTP200 不关闭 Q-11，不引入旧 DTO 或 Number 大整数；本轮未重测 WS，Q-47 先前502/真实 payload unknown 继续保留。
