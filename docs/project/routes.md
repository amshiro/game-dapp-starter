# Routes / Views / States

Figma Frame 不等于 Next.js Route。本文件把 Frame 分类，并给出建议的 route ownership。**所有 URL 均为 TBD**：设计和需求都没有给出路径，最终路径需要产品确认。

## 分类

| Figma Frame | Node | 分类 | 建议归属 |
| --- | --- | --- | --- |
| 1-Mine | `2003:182` | Route（主视图） | Mine route，`features/mining` 组合 |
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

## 建议的路由（TBD）

| 视图 | 建议 | 状态 |
| --- | --- | --- |
| 视图 | 建议 | 线上现状 | 状态 |
| --- | --- | --- | --- |
| Mine | `/` 或沿用 `/mine` | `/mine`（"ORI 挖矿" 标签）；线上 `/` 为起源交易挖矿 | TBD（Q-33） |
| Points | `/points` | 404（未上线） | TBD |
| Stake | `/stake` | `/stake` | 与线上一致 |
| Explore | `/explore` | `/explore` | 与线上一致 |
| About | `/about` | `/about` | 与线上一致 |

若 Mine 改为 `/`，需要决定线上 `/mine` 与旧 `/`（起源）链接的去向（Q-01、Q-33）。

这五个都在底部导航中，适合作为独立 App Router 路由，底部导航用 `next/link` 切换。Withdraw、About 展开项、数据卡模式、Wallet Sheet 都不创建路由。

i18n 当前没有 locale 路由（Starter 现状，见 `docs/i18n.md`）。线上同样没有 locale 路由（语言由 i18n 切换）；默认语言见 Q-30。不得增加 `/en/*`、`/zh/*`。

## 页面组合

`app/` 只负责路由组合，业务实现放在 Feature 中（`docs/architecture.md`）：

```text
app/layout.tsx           → 根布局（Server Component）
app/<shell>              → Header + Bottom Navigation 的项目壳层（位置待实现时决定）
app/page.tsx             → 组合 features/mining
app/points/page.tsx      → 组合 features/points
app/stake/page.tsx       → 组合 features/stake
app/explore/page.tsx     → 组合 features/explore
app/about/page.tsx       → About 页面局部内容
```

以上是建议结构，不是已确认事实；在开始实现对应 Feature 时创建，不预建空目录。
