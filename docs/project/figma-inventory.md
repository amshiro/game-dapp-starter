# Figma Inventory

文件 `M6P7gqrEDANm28YSfvOm93`。读取精确设计值时直接用这里的 node ID 调 Figma MCP。

Frame 名称中的数字前缀是设计师排序，不代表路由。分类与路由映射见 [routes.md](./routes.md)。

## ORI-AI测试（`2003:178`，当前业务稿）

所有 Frame 宽 375px。Frame 中的 **SOL 图标、SOL 文案与 Solana 叙述是设计占位**（User Confirmed），真实资产为 BNB / ORI / 起源（见 assets.md）。图层几乎都是自动命名的 `GROUP`（例如 `Group 1321316406`），**没有 Figma Component**；唯一的 instance 是远程 iOS 状态栏与 Home Indicator。识别元素时以位置、尺寸和文字为准，不要依赖图层名。

| Name | Node ID | Kind | Meaning | Status |
| --- | --- | --- | --- | --- |
| 1-Mine | `2003:182` | Route view | Mine 基准：Connect、Manual；截图含白框格子/示例 count，不据此确认默认 selection；含 Miners 列表 | Current |
| 2-Mine2-有我的投注 | `2003:629` | View state | Mine 已连接：钱包按钮、用户已部署金额（绿）、选中 #7 #8、可部署 `Deploy 0.84 SOL` | Current |
| 3-Mine2-数据状态2 | `2003:1009` | Component state | 数据卡切换后的展示（`≈$` 美金值、`Round #`） | Current |
| 4-区块状态 | `2003:1038` | Component state sheet | 区块全部状态 + Waiting 卡 + 结果动画说明与示意 | Current |
| 4-区块状态（第二张，同名） | `2003:1413` | View state | Auto 运行中：Autominer 面板 + Rewards 卡；自动模式选中区块（绿框） | Current |
| 5-投注模块状态 | `2003:1715` | Form states | Manual：未登录 / 未选区块 / 余额不足 / 可投注 | Current |
| 6-自动投注模块 | `2003:1832` | Form states | Auto：轮次默认 1 未选区块 / 输入轮次已选区块 | Current |
| 7-积分 | `2003:2101` | Route view | Points | Current |
| 8-Stake | `2003:1949` | Route view | Stake（Deposit） | Current |
| 9-Withdraw | `2003:2073` | Tab state | Stake 面板的 Withdraw 状态（只有面板） | Current |
| 10-Explore | `2003:2534` | Route view | Explore | Current |
| Group 1321316402 | `2003:2921` | Component state | Explore 选中的底部导航，叠在 Explore Frame 底部 | Current |
| 11-About | `2003:2235` | Route view | About，Intro 展开 | Current |
| 11-About-展开 | `2003:2359` | Expanded state | About，Mining 展开 | Current |
| 12-My Wallet | `2003:2487` | Sheet | My Wallet 底部 Sheet + 遮罩 | Current |

合计：5 个主视图、1 个 Sheet、8 个状态 / 变体 Frame，另有 1 个导航状态 group。

### 关键子节点

| Name | Node ID | 所在 Frame | 说明 |
| --- | --- | --- | --- |
| Header（未连接） | `2003:190` | 1-Mine | Logo + 价格 + `Connect` |
| Header（已连接） | `2003:990` | 2-Mine2 | Logo + 价格 + 钱包按钮 |
| Logo 标志 | `2003:3116` / `2003:3138` | Header | 28×28 vector |
| Logo 字标 | `2003:3114` / `2003:3136` | Header | 41×16 vector |
| 钱包按钮 | `2003:999` | 2-Mine2 Header | 110×32 |
| 数据卡 ×4 | `2003:485` `2003:490` `2003:497` `2003:501` | 1-Mine | Motherlode / Total deployed / Time remaining / You deployed |
| 区块 #1 | `2003:205` | 1-Mine | 其余 24 块为同级 group |
| 部署面板（Manual） | `2003:455` | 1-Mine | 347×282 |
| Miners 列表 | `2003:508` | 1-Mine | 347×335 |
| 底部导航（Mine 选中） | `2003:584` | 1-Mine | 375×52 |
| 区块状态说明标注 | `2003:1132`–`2003:1151` | 4-区块状态 | 中文状态名 |
| Waiting 卡 | `2003:1409` / 矩形 `2003:1410` | 4-区块状态 | |
| 结果动画说明 | `2003:1405`–`2003:1408` | 4-区块状态 | |
| 结果动画示意网格 | `2003:1152` | 4-区块状态 | 只有 #14 点亮 |
| Autominer 面板 | `2003:1667` | 4-区块状态（第二张） | |
| Rewards 卡 | `2003:1683` 等 | 4-区块状态（第二张） | |
| Manual 表单 × 4 | `2003:1716` `2003:1745` `2003:1776` `2003:1804` | 5-投注模块状态 | 依次为未登录 / 未选区块 / 余额不足 / 可投注 |
| 余额不足文字 | `2003:1793` | 5-投注模块状态 | 红色 `#FF3C4C` |
| Auto 表单 × 2 | `2003:1833` `2003:1890` | 6-自动投注模块 | |
| Stake 面板 | `2003:1961` | 8-Stake | |
| Withdraw 面板 | `2003:2078` | 9-Withdraw | |
| 积分卡 | `2003:2113` | 7-积分 | |
| 积分图标 | `2003:2117` | 7-积分 | 40×40 金色六边形 |
| Explore 统计卡 ×4 | `2003:2659` `2003:2664` `2003:2671` `2003:2675` | 10-Explore | |
| Explore 分页按钮 | `2003:2883` `2003:2886` `2003:2891` `2003:2896` `2003:2899` | 10-Explore | 28×28 |
| About 手风琴行 | `2003:2245` `2003:2254` `2003:2263` `2003:2272` `2003:2281` | 11-About | 347×60 |
| Wallet Sheet | `2003:2490` | 12-My Wallet | 遮罩 `2003:2489`，Sheet 底 `2003:2491` |

## ORI · Design Specification（`2007:146`）

| Name | Node ID | 说明 |
| --- | --- | --- |
| ORI / Design Specification v1 | `2007:182` | 1440px 规范页（上一轮 Agent 创建） |
| Foundation / Color | `2007:189` | error 色板 `2007:244` 错误（应为 `#FF3C4C`） |
| Foundation / Typography | `2007:248` | |
| Layout / H5 + PC | `2007:252` | 文本 `2007:254` 中 PC 375 规则错误 |
| Interaction / Mine | `2007:255` | 内容为推断，见 requirements |
| Interaction / Secondary views | `2007:259` | |
| Source inventory / Delivery contract | `2007:262` | |

## 颜色规范、Logo（`1:4529`）

| Name | Node ID | 说明 |
| --- | --- | --- |
| 确认 | `1:4544` | 确认资产：金色像素 O 币标（方 / 圆）、ORI 像素字标（白 / 黑）、BURY 铲子标志与字标、跪姿人物标志 |
| 废弃 | `1:4625` | 废弃资产：多种十字 / 斜杠圆环标志与 ORI 字标 |
| 其他散置 Frame | `1:4626`–`1:5027` | 探索稿，未标记状态，不作为资产来源 |
| 色块组 | `1:4530` | 12 个 120×80 色块 |

## BURY（`0:1`，历史稿）

24 个顶层节点：与 ORI 同结构的 H5 稿（`1:115` 等），以及 5 张 1440×960 PC 稿：

| Name | Node ID |
| --- | --- |
| Pc-首页 | `1:3311` |
| Pc-points | `1:3714` |
| Pc-Stake | `1:3807` |
| Pc-About | `1:3890` |
| Pc-Explore | `1:3973` |

BURY PC 稿为顶部导航 + 左右双栏布局，与已确认的 PC 规则（500px 居中、保持移动端结构）冲突，**不采用**。

## M2 Full Mine UI scan

用户确认 1–6（含两个同名4）是同一个 Mine 页的完整模块/状态。最新完整扫描与直接子节点对照见 [Mine Page State Inventory](./mine-page-state-inventory.md)，不是只以 frame182 决定 Scope。Frame4b 包含 Autominer/Rewards 静态设计；实现其视觉不自动批准 Auto execution、奖励资产/可领取语义或 M5/M6。
