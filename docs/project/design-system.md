# ORI Design System

ORI 项目的视觉事实。数值来自 `ORI-AI测试`（`2003:178`）节点 metadata 与设计师库样式，不来自截图估计。实现具体组件时仍须用 Figma MCP 读取对应节点确认。

全局方法论见 `docs/design-system.md`；本文件只记录 ORI 事实。

## Layout

### H5 / PC（User Confirmed）

```text
H5:
width 100%
375px = Figma 设计参考宽度（不是运行时固定宽度）

PC:
500px 内容宽度，水平居中
只做简单适配：信息层级、结构、组件顺序、流程与 H5 一致
不做多列、不重新设计 Desktop UI
```

具体 CSS（`max-width`、media query、容器组件）属于实现决策，不是设计事实。实现时注意：

- User Confirmed：所有页面 PC 最外层内容不加左右 padding，与 500px Bottom Navigation 两侧对齐；H5 保留 14px 页面左右边距。卡片内部 padding 不受影响。
- 375px 稿中的固定数值（14px 边距、65px 区块等）在其他宽度下如何伸缩，设计未定义。合理做法是保持边距固定，让内容宽度与网格列宽随容器伸缩。这是 implementation decision，需在视觉验证时与设计确认。
- User Confirmed（本次 PC 布局修正）：ORI viewport 全宽；Header 全宽，PC 左右 padding 120px；Main 与 Bottom Navigation 保持 max-width 500px 居中。H5 Header 维持 14px inset。沿用现有 500px desktop 分界是 implementation decision，不是 Figma PC 稿。

### 375px 参考尺寸

| 项 | 值 | Source |
| --- | --- | --- |
| 页面左右边距 | 14px（内容宽 347px） | Mine / Stake / Points 实测 |
| 状态栏（设计稿模拟） | 44px | 系统 UI，不实现 |
| Header | 56px 高；Logo 左侧，按钮右对齐到 14px | `2003:190` |
| Bottom Navigation | 52px 高 + 34px Home Indicator 安全区 | `2003:584` |
| 底部导航单元 | 5 等分（375px 时每格 75px） | `2003:585` |
| 页面标题区 | 标题顶部 y=124（Header 下 24px），副标题在标题下 8px | Stake / Points |
| 卡片 / 面板内边距 | 12px | 部署面板 `2003:456` |
| 数据卡网格 | 2 列，169–170 × 61px，间距 8px | `2003:485` 等 |
| 区块网格 | 5 × 5；列宽 65 / 65 / 65 / 64 / 64px，行高 65px，间距 6px | `2003:206` 等 |
| 表格行高 | 基础38px；Explore 内容超出列宽自动折行，行高随内容撑开，不裁切省略（User Confirmed） | Points / Explore |
| 表格宽度 | Explore 最小行宽 361–378px，窄屏横向滚动；宽屏铺满容器，挖矿/母矿五列各20%，回购四列各25% | Explore `2003:2534`；User Confirmed 响应式修正 |
| Wallet Sheet 内卡片 | 左右 16px（**与页面 14px 不同**） | `2003:2505` |

Safe area：设计以 34px Home Indicator 区表达底部安全区（User / Figma 事实）。实现应使用 `env(safe-area-inset-bottom)` 而不是写死 34px，这是 implementation decision。

## Color

### 设计师颜色集合（Designer Color Collection）

业务稿中的颜色来自设计师的**远程库 Paint Style**（1,200+ 个节点引用）。这是项目颜色 Token 的来源。

| 设计师样式名 | Hex | 实际用途 | Token 候选 |
| --- | --- | --- | --- |
| 背景色 | `#0D0F13` | 页面背景、区块单元、输入框、表格行 | `bg` |
| 卡片1 | `#191B1F` | 面板、数据卡、Bottom Navigation、Wallet Sheet、钱包按钮、分页按钮 | `surface` |
| 卡片2、边框1 | `#25262A` | 默认边框（区块 2px、卡片 1px、虚线分隔）；分段控件底、快捷按钮、Wallet 卡上半 | `border` / `surface-2` |
| 边框2 | `#303135` | 分段控件选中项、不可用主按钮底、次按钮（`导出`）、Wallet 卡边框 | `raised` |
| 白色 | `#FFFFFF` | 主文字、主按钮底、选中区块边框、当前导航项 | `text` / `primary` |
| 文字-正文、灰色图标 | `#868789` | 次要文字、灰色图标（使用最多的次要色） | `text-secondary` |
| 文字-注释 | `#4A4B4E` | 注释、输入占位、不可用按钮文字 | `text-tertiary` |
| 文字-注释、默认文案 | `#8C8C8C` | 少量注释 / 默认文案 | 使用少，暂不建 token |
| 金色 | `#EFC462` | 强调：Motherlode 卡、中奖区块、`Claim` 按钮 | `accent` |
| 辅助色-红 | `#FF3C4C` | 错误：余额不足 | `danger` |
| 灰按钮 | `#36383B` | 业务稿中几乎未使用 | 暂不建 token |
| 背景 | `#000000` | Wallet 遮罩底色（65% 透明度） | 遮罩使用 |

**修正上一轮规范**：Design Specification 页写的 error `#FF3D3D` 不正确。`#FF3D3D` 实际只是 Header 钱包按钮内小图标的描边；真实错误色为 `辅助色-红 #FF3C4C`（`2003:1793`）。文件里另有本地样式 `红色 #FF5160`，业务稿未使用。

### 未挂样式但稳定重复的颜色

| Hex | 用途 | 次数 | 处理 |
| --- | --- | --- | --- |
| `#D4BB81` | 区块编号 `#1`–`#25` | 110 | Token 候选 `block-index`（Mine 专用，可放 Feature 层） |
| `#606164` | 底部导航未选中图标与文字 | 56 | Token 候选 `nav-inactive` |
| `#2ED075` | 用户已部署金额、自动模式选中边框 | 11 | Token 候选 `positive`；对应本地样式 `绿色` |
| `#AB9FF2` | About 中链接文字（Figma 占位文案 "Solana blockchain"） | 2 | 对应本地样式 `紫色`；低频，局部使用 |
| `#EFC462` 低透明度 | Motherlode 卡底色 | 3 | 金色叠加，局部值 |
| `#23211C` | 中奖区块底色 | 2 | 局部值 |
| `#B89E60` | Auto 表单 Blocks / Rounds 图标 | 4 | 局部值（图标资产自带） |

一次性颜色保留为组件局部值，不建全局 token。`辅色-点缀色 #9AED2C`、`按钮不可用 #2E2D41`、`按钮灰态 #383838`、`Dark-重要文字 #DBDBDB` 只出现在不可见或被遮罩的节点上，不作为实现依据。

## Typography

### 字体

| 用途 | 字体 | 字重 | Source |
| --- | --- | --- | --- |
| 全部产品 UI | **HarmonyOS Sans SC** | Regular、Medium、Bold | 854 个文字段（Regular 586 / Medium 252 / Bold 16） |
| 页脚（不可见，见 Q-32） | Manrope | Regular 11 | 9 处 |
| 设计稿系统状态栏 | SF Pro Display | Medium 15 | iOS 状态栏模拟，不实现 |

本轮 Figma MCP 读取 numeric fontWeight：Regular 400（`2003:1008/2291`）、Medium 500（`2003:2494/2292`）、Bold 700（`2003:2530/2247`）。保留 CSS 400/500/700，Medium 不映射为 semibold。

用户提供的 Starter 字体为 HarmonyOS Sans SC 2.040 单文件 Variable Font，`wght` 40–900，包含 SC/CJK；原始完整 WOFF2 保留作为校验源，原始 TTF 不入库。当前用户授权提交和发布按字符分片的 Web 资产；集合保留原 Unicode 覆盖、字形与变量轴，分片通过 `unicode-range` 按需加载；不预加载整库。全局入口仍为 `src/styles/fonts.css`。2026-10-30 用户明确确认已取得字体分片授权，允许本项目提交及发布；见 Q-05。文件的命名 Bold 实例是 706，与当前 Figma numeric 700 有差异；CSS 700 使用变量轴真实插值，不伪造 Bold，也不静默改 Figma 为 706。Regular/Medium 命名坐标分别为 400/500，与 Figma 一致。

字体与 fallback stack 的唯一 owner 为全局 `--font-family-sans`；`--ori-font-family` 仅保留兼容别名，不再持有独立 stack。字体不进入 Header/Wallet/About 局部定义。用户已授权本仓库接入；`LICENSE-update.txt` 已由用户提供并保留；本项目字体分片提交与 Web 发布依据用户 2026-10-30 的授权确认；不扩大为其他项目或通用模板的再分发授权，metadata 不替代授权。

行高：除少数正文外全部为 `auto`（字体默认行高）。明确行高的只有 About 正文 14 / 20px、Intro 14 / 22px。

字间距：全部为 0。

### 字号角色

| 角色 | 字号 / 字重 | 示例 |
| --- | --- | --- |
| Page title | 28 Bold | Points、Stake、About、Explore |
| Section title | 20 Medium | Summary、Records、Mining、Rewards、Miners |
| Accordion title | 20 Bold | About：Intro、Mining… |
| Sub heading | 18 Medium | About：Motivation、How it works |
| Large amount | 24 Medium | 金额输入值、My Points |
| Wallet balance | 24 Bold | `48.60 ORE` |
| Metric value | 16 Medium | 数据卡数值 |
| Sheet title / Token label | 16 Medium | `My Wallet`、输入框代币名（Figma 中 `SOL` 为占位，实际 BNB / ORI） |
| CTA | 15 Medium | `Deploy 0.84 BNB`（Figma 中 SOL 为占位）、`Deposit` |
| Control | 13 Medium（选中）/ 13 Regular（未选中） | 分段控件、`Connect` |
| Row / Key-value | 13 Regular | Summary 行、钱包地址 |
| Body / Subtitle | 14 Regular | 页面副标题、About 正文 |
| Table / Caption | 12 Regular；表头 12 Medium | 表格、余额 `Bal:`、导航标签、Header 价格 |
| Block amount | 11 Regular | 区块总额 `1.4308` |
| Block meta | 10 Medium（编号）/ 10 Regular（人数） | `#1`、`326` |

## Radius

| 值 | 用途 | 语义 |
| --- | --- | --- |
| 8px | 区块、数据卡、面板、输入框、分段控件、快捷按钮、积分卡 | 基础圆角（默认） |
| 12px | Wallet Sheet 内卡片 | Sheet 内卡片 |
| 16px（仅上两角） | Wallet Sheet | Sheet 顶部 |
| 全圆（高度 / 2） | 主按钮 323×44（22）、Header 按钮 32 高（16）、分页按钮 28（14）、Wallet 小按钮 31 高（20） | Pill：所有按钮型控件 |

只需要 `8`、`12`、`16`、`pill` 四个语义。不要为每个出现过的数值建 token。

## Border、Effect

| 项 | 值 |
| --- | --- |
| 区块边框 | 2px `#25262A`；选中 2px `#FFFFFF`；中奖 2px `#EFC462`；自动选中 2px `#2ED075` |
| 卡片边框 | 1px `#25262A`；Motherlode 卡 2px 金色 |
| 输入框边框 | 1.5px |
| 分隔线 | 1px 虚线 `#25262A`，dash 4 / 4 |
| Rewards 卡 | 虚线边框 |
| Header / 导航分隔 | `INNER_SHADOW` radius 0（细线），实现前在 Figma 确认偏移与颜色 |
| 卡片 `BACKGROUND_BLUR 12` | 设在不透明底色上，视觉上无效果，实现可忽略 |

## 组件视觉规则

只记录 Figma 中重复出现的视觉规律。组件归属见 [components.md](./components.md)。

### Header（`2003:190` / `2003:990`）

- 56px，背景 `#0D0F13`，底部细分隔线。
- 左：Logo 标志 28×28 + ORI 字标，旁边价格 12 Regular（灰色）。
- 右：未连接为 `Connect` 白色 pill 75×32，文字 13 Medium 黑色；已连接为钱包按钮 110×32，`#191B1F` + 1px 边框 + 钱包图标 + 地址 13 Regular。

### Bottom Navigation（`2003:2921`）

- 52px，背景 `#191B1F`，5 等分；图标 + 12 Regular 标签。
- 当前项白色，其余 `#606164`。

### Button

| 变体 | 视觉 | 出现 |
| --- | --- | --- |
| Primary | 白底黑字，pill 44 高，15 Medium | `Deploy …`、`Deposit`、`Stop autominer` |
| Primary disabled | `#303135` 底，文字 `#4A4B4E` 级灰 | `Deploy`、`Insufficient BNB`（Figma 中 SOL 为占位） |
| Connect（主按钮位） | `#303135` 底白字 | `Connect wallet` |
| Outline accent | 金色 1px 边框、金色文字、透明底 | `Claim` |
| Text link | 灰色文字 | `Claim only ORE` |
| Small pill | 50×31，白底（主）/ `#303135`（次） | Wallet `接收` / `导出` |
| Header pill | 32 高 | `Connect`、钱包按钮 |
| Icon circle | 28×28 `#191B1F` | 分页 ‹ › |

### Segmented Control

323×32，底 `#25262A`，选中半边 `#303135`，圆角 8；选中 13 Medium 白色，未选中 13 Regular 灰色。用于 Manual / Auto、Deposit / Withdraw。

### Amount Input

323×56，底 `#0D0F13`，1.5px 边框，圆角 8；左侧代币图标 20px + 代币名 16 Medium；右侧数值 24 Medium（空值显示 `0.00` 占位灰）。下方一行：左 `Bal: x SOL` 12 Regular，右侧快捷按钮 52×24、`#25262A`、圆角 8、12 Regular。

### Card / Panel

- 面板：`#191B1F`、圆角 8、内边距 12。
- 数据卡：`#191B1F`、1px `#25262A`、圆角 8；数值 16 Medium，标签灰色小字。
- 积分卡：`#0D0F13` 底、2px 边框、圆角 8。
- Rewards 卡：虚线边框。

### Block Cell

65×65（375px 下），圆角 8，2px 边框。左上编号（`#D4BB81` 10 Medium），右上人数 + 人形图标（灰 10 Regular），右下区块总额（白 11 Regular），用户金额在其上方（绿色）。状态视觉见 [ui-behavior.md](./ui-behavior.md#block-cell-states)。

### Table

表头 12 Medium 灰色，单元格 12 Regular，行高 38，行间虚线分隔；在 375px 下横向溢出可滚动。分页按钮右对齐。

### Bottom Sheet（Wallet）

全屏 65% 黑色遮罩（User Confirmed，覆盖旧 viewport 限制）；内容面板 H5 宽 100%、PC 400px 居中；Shared Modal 默认 H5 bottom、PC center（User Confirmed，覆盖旧 PC bottom 工程方案）；500px 及以上启用 PC placement 是本轮工程分界，不是 Figma PC 稿。宽 100%，bottom 顶部圆角 16 / center 四角 16，`#191B1F`、外壳无可见 border（0px，border color token 仍可覆盖）；48px 标题栏（16 Medium 居中，右侧 24px 关闭图标）；底部含安全区。遮罩点击默认关闭，仅 `closeOnBackdrop={false}` 禁止；没有拖拽手柄。

### Accordion（About）

行高 60，标题 20 Bold，右侧 › / ⌃ 图标，行间虚线分隔；展开内容为 14 Regular 灰色正文与 18 Medium 小标题。

## 资产

使用 Figma 原始资产，详见 [assets.md](./assets.md)。


## 金额展示（User Confirmed）

Mine 统计与棋盘最多4位小数；个人余额与奖励最多6位，均向下截断、去尾零。非零且小于显示单位时用 `<0.0001` / `<0.000001`，只有真实零显示0。完整值与计算一直保留raw bigint或exact decimal，不使用展示字符串计算或提交；输入框、Max和交易确认金额不截断。Mine 手动/自动投注输入按用户确认的 `/^\d*\.?\d{0,6}$/` 限制最多6位小数，允许清空，以小数点开头时补0；非法字符及超位输入保留原值。输入中的末尾小数点允许保留；提交仍要求金额大于0，链上金额继续按18位精度解析。输入提示对应6位规则，居中、错误色 #FF3C4C、句末不加句号。

中英文金额均用逗号千分位。Mine卡片/棋盘从1,000,000起使用M、B、T缩写，最多2位小数向下截断；个人余额/奖励保留千分位不缩写。统计/余额/奖励金额保持原设计文字样式，不加下划线，不提供完整金额入口、tooltip或详情弹层；溢出仅截断展示，raw/exact继续保留供计算与无障碍读取。

## UI 变更边界（User Confirmed）

不得自行增加设计稿以外的可见内容、入口、装饰或交互；认为有必要添加时，必须先说明并询问用户，获得确认后再实现。用户本轮明确要求的修正可直接执行。

Mine 四卡 PC 鼠标移入切换 secondary 文案、移出恢复，H5 点击切换；键盘可激活原按钮。投注输入为空时，总计/每轮总计显示0 BNB；非空无效输入或数据不可用不伪造零。Auto 摘要未选格子显示“随机”，选中后显示真实格子ID，随机格子数量仍由上方输入控制。中文统一“格子”，英文Cells。

## 数据区域状态（User Confirmed）

积分记录和 Explore 三张表采用 Section Loading：容器内居中圆环 Spinner，成功无记录显示“暂无数据”，成功有记录渲染数据，失败独立显示错误；未接入/读取条件不足不伪装为空数据。积分每页20条，Explore 每页10条（User Confirmed），超过每页条数显示圆形上一页/下一页受控分页。Explore 三张表独立页码，每10秒刷新当前页，后台刷新保留已有记录，不切回第一页或用 Spinner 替换已有内容。

圆环参考 `wu-website/src/components/common/LoadingSpinner.tsx`（用户指定 `src/styles/loading.module.css` 实为三圆点动画，按用户明确要求采用转圈圆环）；Shared 的 SectionLoading 与 DataLoading 为独立组件，拥有各自 SVG 和样式，不通过 variant 共用。SectionLoading 默认采用 ORI 品牌色 #EFC462 和较粗圆环；DataLoading 大段圆环使用 text-muted 灰色，旋转小段继承当前文字颜色，采用很细的圆环（24px viewBox 中 strokeWidth=2.5，默认13px），不复用 Section 的粗实心弧。两个公共组件均支持 size（px）和 color（CSS 颜色）参数；未传 color 时保留各自默认颜色。区域默认20px、Explore 顶部四个单值16px（仅替换金额及币种图标，不替换卡片），尊重 reduced-motion。积分/Explore 数据读取失败文字使用错误色 #FF3C4C。高度由页面及 Feature 容器决定，Spinner/EmptyState 本身不固定区域高度，不增加插图。积分页最小高度覆盖扣除 Header、底部导航、安全区与主内容上下间距后的可用视口；记录区 flex: 1，Loading/空态占满剩余空间并居中。有记录时自然撑高、整页滚动，不固定页面高度或新增表格内部滚动。Explore 三张表各自保留152px最小状态区域，避免单一区域占满整屏。
