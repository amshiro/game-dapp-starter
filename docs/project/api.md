# ORI Backend API Facts

线上 ORI 前端使用的后端接口与实时通道事实。传输层、错误语义与 owner 规则见全局 `docs/api.md`；本文件只记录 ORI 事实。

来源：ori.supply 源码 `ori-website/service/api.js`（26 个端点定义）与线上网络请求（23 个实际调用）。**请求 / 响应 DTO 未完整恢复**，实现每个端点前需要后端提供 Contract。

## Host

| 项 | 值 | Status |
| --- | --- | --- |
| API base | `https://gate.game.com/v1`（公开配置）；新项目变量 `NEXT_PUBLIC_API_BASE_URL` | 线上生产值；新项目是否沿用待确认（Q-11） |
| 方法 | 全部 `POST` | Confirmed（线上） |
| 鉴权 | **无登录会话**；用户相关请求以钱包地址作为参数；源码中签名 `_post` 调用 0 次 | Confirmed（源码 + 线上）；是否安全、是否需要新鉴权待确认（Q-13） |
| 实时 | Pusher 协议 WebSocket：`wss://gate.game.com/app/<public app key>`（key 为公开客户端 key，不记录）；新项目变量 `NEXT_PUBLIC_WS_URL` | Confirmed（线上） |
| 后端 Secret | `BACKEND_APP_SECRET` 仅在 Server / Worker 使用（见 [environment.md](./environment.md#secret-boundary)） | User Confirmed |

同一后端还服务 Origin.fun 的 `/v1/originfun/*`（Legacy only）。

## Endpoints（`/v1/ori/*`）

| Feature | Endpoint | 线上调用名 | 用途（由调用位置推断） |
| --- | --- | --- | --- |
| 全局 | `/ori/query/chain_asset_config` | `getPrice` 类 | 链资产配置 / 价格（每页都会调用） |
| 全局 | `/ori/activity/origin_info` | — | 起源信息（Header 价格等） |
| Mine | `/ori/round` | `getRoundInfo` | 当前轮次 |
| Mine | `/ori/round_winners/round` | `getRoundWinInfo` | 某轮中奖者 |
| Mine | `/ori/latest/events` | `getEventInfo` | 最新事件 |
| Mine | `/ori/automation/user` | `getAutomation` | 用户自动挖矿状态 |
| Mine（ORI 游戏，Figma 无） | `/ori/ori_game/info`、`/ori/ori_game/trade_records`、`/ori/ori_game/record_list`、`/ori/ori_game/stats` | — | 交易挖矿信息与记录 |
| 起源（Figma 无） | `/ori/mining_game/info`、`/ori/mining_game/swap_record`、`/ori/mining_game/record_list` | `getMiningGameInfo`、`getMiningGameRecords` | 起源交易挖矿 |
| 起源（Figma 无） | `/ori/swap/price`、`/ori/swap/quote`、`/ori/swap/nonce`、`/ori/swap/submit` | `getSwapPrice`、`getSwapNonce`、`submitSwap` | 后端代执行的签名 swap（EIP-712 typed data，含 `bytes32 nonce`） |
| Stake | `/ori/summary` | `getSummary` | 质押概要 |
| Explore | `/ori/explore` | `getExploreInfo` | 统计 |
| Explore | `/ori/activity/bury_point_events`、`/ori/bury_event/list`、`/ori/reset_event/list` | `getResetEventList` 等 | 回购埋藏、开奖事件列表 |
| Wallet / 资产 | `/ori/activity/user_asset_events` | `userAssetEvents` | 用户资产事件 |

源码另定义 3 个线上未调用的端点：`/ori/points/list`（`getPointsList`）、`/ori/points/user`（`getUserPoints`）、`/ori/ori_game/swap_record`（`getOriGameSwapRecords`）。Points 端点**在所有分支中均无调用**，Points 功能未实现（Q-20）。

## Realtime

| Channel | Event | 含义 | 类型 |
| --- | --- | --- | --- |
| `round.new_round` | `.round.data.started` | 新一轮开始 | 公共频道 |
| `round.reset` | `.round.data.reset` | 本轮开奖（reset） | 公共频道 |

结果获取方式：实时事件推送 + 查询轮询（TanStack Query `refetchInterval`）+ 链上读取（`OreProtocolView`）。新项目中实时连接的 owner、断线重连与查询失效策略需在实现时按 `docs/state-management.md` 设计；不得复制模块级全局 Echo 单例。

## 不迁移

- axios 实例、`qs` form-urlencoded 封装、md5 签名、cookie `login_token` / `login_secret`（Origin.fun）。
- 浏览器可见的 `NEXT_PUBLIC_APP_SECRET` 签名方案。
- 401 / 403 / 404 一律"去登录"的错误处理。
