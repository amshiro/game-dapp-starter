# Routes / Views / States

Figma Frame 不等于 Next.js Route。本文件把 Frame 分类，并给出建议的 route ownership。F9 shell URL 已由用户确认：Mine 使用 `/mine`，`/` 跳转到 `/mine`；其余导航为 `/points`、`/stake`、`/explore`、`/about`。

## 分类

| Figma Frame | Node | 分类 | 建议归属 |
| --- | --- | --- | --- |
| 1-Mine | `2003:182` | Route（主视图） | Mine route，`features/mine` 组合 |
| 2-Mine2-有我的投注 | `2003:629` | View state（已连接 + 有部署） | 同 Mine route，由钱包与数据状态驱动 |
| 3-Mine2-数据状态2 | `2003:1009` | Component state（数据卡显示模式） | Mine 数据卡的本地 UI 状态 |
| 4-区块状态 | `2003:1038` | Component state（区块状态集合 + 结果动画） | 区块组件状态，不是页面 |
| 4-区块状态（第二张） | `2003:1413` | View state（Autominer 运行中 + 有奖励） | 同 Mine route |
| 5-投注模块状态 | `2003:1715` | Form state（Manual） | 部署面板状态 |
| 6-自动投注模块 | `2003:1832` | Form state（Auto） | 部署面板状态 |
| 7-积分 | `2003:2101` | Route（主视图） | Points route |
| 8-Stake | `2003:1949` | Route（主视图） | Stake route |
| 9-Withdraw | `2003:2073` | Tab state | Stake 页内 Deposit / Withdraw 切换；是否反映到 URL 为 TBD |
| 10-Explore | `2003:2534` | Route（主视图） | Explore route |
| 11-About | `2003:2235` | Route（主视图） | About route |
| 11-About-展开 | `2003:2359` | Expanded state | About 手风琴状态，**不是路由** |
| 12-My Wallet | `2003:2487` | Sheet | 全局钱包 Sheet，从 Header 打开；**不是路由** |

## F9 路由（User Confirmed）

| 视图 | F9 路径 | 线上现状 | 状态 |
| --- | --- | --- | --- |
| Mine | `/mine` | `/mine`（"ORI 挖矿" 标签）；线上 `/` 为起源交易挖矿 | User Confirmed（Q-33） |
| Points | `/points` | 404（未上线） | User Confirmed |
| Stake | `/stake` | `/stake` | User Confirmed |
| Explore | `/explore` | `/explore` | User Confirmed |
| About | `/about` | `/about` | User Confirmed |

用户已确认 `/` 使用 App Router redirect 跳转至 `/mine`。这只锁定 F9 shell 路由，不决定起源业务的后续入口（Q-01）。

这五个都在底部导航中，适合作为独立 App Router 路由，底部导航用 `next/link` 切换。Withdraw、About 展开项、数据卡模式、Wallet Sheet 都不创建路由。

i18n 当前没有 locale 路由（Starter 现状，见 `docs/i18n.md`）。线上同样没有 locale 路由（语言由 i18n 切换）；默认语言见 Q-30。不得增加 `/en/*`、`/zh/*`。

## 页面组合

`app/` 只负责路由组合，业务实现放在 Feature 中（`docs/architecture.md`）：

```text
app/layout.tsx           → 根布局（Server Component）
app/<shell>              → Header + Bottom Navigation 的项目壳层（位置待实现时决定）
app/page.tsx             → redirect /mine
app/mine/page.tsx        → 组合 features/mine（限定只读棋盘）
app/points/page.tsx      → 组合 features/points
app/stake/page.tsx       → 组合 features/stake
app/explore/page.tsx     → 组合 features/explore
app/about/page.tsx       → About 页面局部内容
```

以上是建议结构，不是已确认事实；在开始实现对应 Feature 时创建，不预建空目录。

## F9 shell placeholder mapping

F9 uses the user-confirmed `/mine`, `/points`, `/stake`, `/explore`, `/about` mapping. `/` redirects to the Mine destination from the same registry. The single code owner is `app/_shell/routes.ts`; destination pages contain only headings. Q-33 is resolved for this shell; Q-01 remains open. No Wallet route or locale route is created.

## M2 Mine Read-only Board

`/mine` 已正式替换 F9 标题占位，由 `app/mine/mine-runtime.tsx` 组合 W1 错链事实与 `features/mine` 的公共只读 Query/page。仅 Development 97 读取存储轮和每格 amount/count；无 selection interaction、交易或 Miners 数据。F9 的标题占位描述为历史交付范围，不再代表当前 Mine。

## About / Points 当前正式页面

`/about` 已组合 features/about/AboutPage，复用 AboutAccordion，默认全收起；`/points` 已组合 features/points/PointsPage，使用明确标记的 Figma static demo model。两者由 request locale 服务端生成，导航 active 沿用唯一 registry；不创建 debug / locale / modal routes。F9 的 destination heading 描述仅为历史阶段，不代表当前页面状态。
