# Assets

原则（User Confirmed，C-03）：使用真实 Figma 资产。禁止用 emoji、Lucide、相似图片或 CSS 临摹替代品牌标志、代币图标和设计师提供的 SVG。导出规格（倍率、格式、命名）遵守 `docs/figma-workflow.md`。

## Logo 与代币图标（待最终确认，Q-03）

| 来源 | Logo | ORI 代币图标 | 起源代币图标 |
| --- | --- | --- | --- |
| 线上 `ori.supply` | **金色圆 + 深色轨道 / 斜杠** 标志 + 粗体无衬线 `ORI` 字标 | 金色轨道圆（小尺寸） | **像素风 O 币**（黑底白 O） |
| 新版 Figma Header | 同形标志（白色单色）`2003:3116` + 同款字标 `2003:3114` | 白色同形图标（raster `2003:489`） | — |
| 品牌页 `确认` `1:4544` | 像素 O 币 + 像素 ORI 字标；铲子 BURY 标志；跪姿人物标志 | — | 像素 O 币 `1:4581` / `1:4587` |
| 品牌页 `废弃` `1:4625` | 多种斜杠圆环 / 十字圆环探索稿 | — | — |
| 旧代码 `origin-website` | Origin.fun 品牌（IPFS 图片） | — | 起源 |

**推荐（需用户确认）**：

- **ORI Logo 与 ORI 代币图标**使用线上正在使用的"轨道圆"标志与粗体 ORI 字标；新版 Figma Header 与之同形，可视为该标志的单色版本。证据：线上实际运行 + 新版 Figma 一致。
- **品牌页 `确认` 中的像素 O 币**对应线上的**起源代币图标**，而不是 ORI Logo。证据：线上起源代币处显示的就是该像素 O 币。
- 品牌页 `废弃` 中的探索稿与线上标志相似但不完全相同，不作为资产来源。
- 实现时需向设计索取线上标志的正式矢量文件（彩色与单色）；Figma 中 ORI 代币图标是 16px raster，不能放大使用。

## 设计占位资产（User Confirmed）

Figma 中所有 **SOL 图标**（`Ellipse 34` 等 raster，例如 `2003:644`、`2003:3250`、`2003:3220`）以及与 Solana 相关的视觉都是占位：

```text
Figma asset placeholder.
Replace with real project asset during implementation.
```

替换规则：部署金额、余额、奖池 BNB → **BNB 图标**；Stake 资产 → **ORI 图标**；未中奖奖励 → **起源图标**。BNB 图标使用官方 BNB 资产（来源需确认，Q-03）。

## 品牌页确认资产（`1:4544` 确认）

| Asset | Node ID | Type | 说明 |
| --- | --- | --- | --- |
| 铲子标志（方底） | `1:4556` | Vector frame 256×256 | 已设导出设置 |
| 铲子标志（圆形） | `1:4545` | Vector frame 256×256 | 已设导出设置 |
| O 币标志（方底） | `1:4581` | Vector frame 256×256 | |
| O 币标志（圆形） | `1:4587` | Vector frame 256×256 | |
| 跪姿人物标志（方底） | `1:4568` | Vector frame 256×256 | 已设导出设置；用途未知 |
| 跪姿人物标志（圆形） | `1:4574` | Vector frame 256×256 | 已设导出设置；用途未知 |
| O 币 + ORI 字标（白字） | `1:4593` | Vector group 337×120 | 深色背景用 |
| O 币 + ORI 字标（黑字） | `1:4604` | Vector group 337×120 | 浅色背景用 |
| 铲子 + BURY 字标（白 / 黑） | `1:4612` / `1:4619` | Vector group 384×120 | BURY 品牌，ORI 是否使用未知 |
| ORI 像素字标（白） | `2:382` | Vector 131×52 | |

`废弃`（`1:4625`）与品牌页上其他未标注的探索 Frame（`1:4626`–`1:5027`）**不得作为资产来源**。

## 业务稿资产（`ORI-AI测试`）

| Asset | Node ID（示例实例） | Type | Usage | Reusable / local | Code destination candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Logo 标志（Header） | `2003:3116` | Vector 28×28 | Header | 全局 | 项目壳层资产 | 与线上标志同形，Q-03 |
| Logo 字标（Header） | `2003:3114` | Vector 41×16 | Header | 全局 | 项目壳层资产 | Q-03 |
| ORI 代币图标 | `2003:489` | **Raster**（image fill）16×16 | 数据卡、Miners、Explore、Rewards、Stake | 全局 | 代币资产 | 需矢量源文件，Q-03 |
| ~~SOL 代币图标~~ | `2003:644`、`2003:3250`、`2003:3220` | Raster | — | — | **不使用** | 占位，替换为 BNB / ORI / 起源 |
| 积分图标 | `2003:2117` | Vector group 40×40 | Points 卡 | Points 局部 | `features/points` | 金色六边形 + ✕ |
| 底部导航图标 ×5 | `2003:589`、`2003:600`、`2003:606`、`2003:616`、`2003:622` | Vector 20×20 | Bottom Navigation | 项目壳层 | 壳层资产 | 选中白色 / 未选 `#606164`，适合 `currentColor` |
| 参与人数图标 | `2003:210` | Vector 8×8 | 区块单元 | Mining 局部 | `features/mining` | 人形 |
| 钱包图标 | `2003:2518` | Vector group 16×16 | Header 钱包按钮、Wallet 地址行 | Wallet | `features/wallet` | |
| 复制图标 | `2003:2512` | Vector group 14×14 | Wallet 地址行 | 可共享 | shared 或 wallet | |
| 断开连接图标 | `2003:2507` | Vector group 20×20 | Wallet 地址行右侧 | Wallet | `features/wallet` | |
| 关闭图标 | `2003:2498` | Vector group 24×24 | Wallet Sheet 标题栏 | 可共享 | Sheet primitive 使用方传入 | |
| Info 图标 ⓘ | `2003:1988` | Boolean 12×12 | Stake Summary、Rewards | 可共享 | shared | 内部有被遮罩的绿色椭圆，导出时确认结果正确 |
| 手风琴箭头 | `2003:2249` | Vector 16×16 | About | About 局部 | 页面局部 | › / ⌃ 两态 |
| 分页箭头 | `2003:2883` 内 | Vector | Explore | 可共享 | Pagination | |
| Auto 表单图标（Blocks / Rounds） | `2003:1902`、`2003:1941` | Vector 16×16 | Auto 表单 | Mining 局部 | `features/mining` | 金色 `#B89E60` |
| 步进器 −/+ | `2003:1907` 内 | Vector | Auto 表单 | Mining 局部 | `features/mining` | |
| Wallet Sheet 背景图 | `2003:2488`（"积分 1"） | Raster 375×812 | Wallet 稿背景 | — | **不导出** | 只是稿中遮罩下的页面截图 |

## 导出注意事项

- 定位真实资产节点导出，不截取父 Frame（`docs/figma-workflow.md`）。
- 矢量保持 SVG；Raster 代币图标按 DPR 选择倍率，保持透明背景与圆形裁切效果。
- 单色图标（导航、复制、关闭等）优先导出为可用 `currentColor` 的 SVG。
- 运行时不得 fetch SVG 再注入 HTML（旧项目反模式）。
- 设计稿中的 iOS 状态栏、Home Indicator 是系统 UI 模拟，不导出、不实现。

## F9 shell exports

`public/ori/shell/` contains only current Figma shell SVGs: `mark.svg` (`2003:3112`), `wordmark.svg` (`2003:3110`), `mine.svg` (`2003:589`), `points.svg` (`2003:600`), `stake.svg` (`2003:606`), `explore.svg` (`2003:616`), `about.svg` (`2003:622`). Navigation SVGs are CSS masks using currentColor; original geometry is retained. Header artwork is the current Figma monochrome version, replaceable pending Q-03. No token or SOL placeholder asset is included.

### W1 Header wallet asset

`public/ori/wallet/header-wallet.svg` is the exact current Figma Header wallet icon (`2003:1003`, parent `2003:999`), rendered at 14×14 inside the 110×32 identity capsule. It is separate from the 16×16 Wallet address-row candidate above. No Sheet, token or chain assets are added in W1; Q-03 remains open.

### W2 Wallet Sheet exports

`public/ori/wallet/close.svg`（`2003:2499`，24×24）、`address-wallet.svg`（`2003:2520`，16×16）、`copy.svg`（`2003:2512`，14×14）、`disconnect.svg`（`2003:2507`，20×20）直接下载自本轮 Figma design context，保留 SVG 原始尺寸/geometry。Export 为文字控件，无独立 icon。透明返回图层 `2003:2495`、页面截图、系统 Home Indicator、Receive 和代币资产不导入。

### A1 Accordion UI asset

`public/ori/about/chevron-right.svg` 为当前 About 的原始 16×16 矢量（`2003:2257`，design context 下载）。展开稿 `2003:2249` 使用相同 SVG 与 -90° 旋转；两份导出文件 hash 相同，因此只保留一份资产，按 Figma 旋转显示。分隔线是 CSS 1px / dash 4 / gap 4；不导入 Figma 正文、页脚、系统 UI 或外链资产。
