# Figma → Frontend 工作流

## 目标与边界

本文规定 AI / Codex 在获得真实 Figma 项目后，如何从设计 intake、全文件扫描、项目级 Design System、组件与资源规划，到页面实现、视觉验收和后续 promotion，完成可维护的 Production Frontend。

本文是操作流程规范，不重复定义 Design Token、组件归属、响应式或 accessibility 的工程原则：

~~~text
docs/design-system.md
→ 设计系统原则和工程边界

docs/figma-workflow.md
→ 拿到 Figma 后的实际执行顺序
~~~

本文不要求创建项目设计文档、组件清单、样式文件或组件。只有真实项目与当前任务需要时，才创建这些产物。

Figma MCP 的定位是：

~~~text
Figma
→ structured design context
→ AI / Codex
→ 依据项目规范和现有代码实现 Production Frontend
~~~

它不是 Figma 到 Production Code 的一键转换器。MCP 给出的 React、Tailwind、HTML-like context、布局信息或实现建议都只是设计上下文，不能直接绕过 AGENTS、Architecture、Frontend Rules、Design System、State、API 与 Web3 规范。

具体使用哪个 Figma MCP capability 由当时官方工具和客户端能力决定。本文规定需要获得哪些设计事实，不锁定具体 tool name 或固定调用顺序。

## Workflow Overview

新项目进入正式页面开发前，默认按以下阶段推进：

~~~text
Phase 0  Project / Figma Preflight
↓
Phase 1  Whole-file Design Scan
↓
Phase 2  Project Design System Extraction
↓
Phase 3  Component Inventory
↓
Phase 4  Asset Inventory & Export
↓
Phase 5  Route / Page Implementation Plan
↓
Phase 6  Foundation Implementation
↓
Phase 7  Feature / Page Implementation
↓
Phase 8  Visual Verification
↓
Phase 9  Cleanup & Promotion
~~~

核心顺序是：

~~~text
scan first
understand second
abstract third
implement fourth
verify last
~~~

不得拿到一个 Figma URL、打开当前 Frame 后，直接定义整站 Shared UI 或开始大规模页面实现。

## Phase 0：Project / Figma Preflight

读取设计前，先确认：

- Figma 文件、项目仓库、目标 routes 与平台是否匹配；
- 当前链接是单个 node、一个 screen、一个 Figma Page，还是完整项目；
- Figma 是否包含多个 Page、Desktop、H5、Component / Library、Variables / Styles、prototype 或 variants；
- 项目是否已有业务代码、Design System、组件、资产或样式基础设施；
- 当前任务要求的是调研、项目 foundation、单页面实现，还是全项目建设。

用户提供某个 node URL 不代表该 node 等于整个项目设计。若目标范围不清晰，应先报告 ambiguity，而不是假设当前 Frame 覆盖全部页面。

脚手架的默认页面、Tailwind 颜色、示例 Card、间距和字体 fallback 都不是项目视觉事实。

## Phase 1：Whole-file Design Scan

第一次进入项目时，应先尽可能建立整站视野，而不是机械遍历每个隐藏节点。至少识别：

~~~text
Pages
Screens
Desktop frames
H5 frames
navigation
dialogs
drawers
bottom sheets
forms
cards
tables / lists
empty states
loading states
error states
success states
selected states
disabled states
hover / active states
~~~

目标是在做全局视觉判断、Token 提炼和组件抽象之前，理解主要页面结构、视觉语言和状态范围。

### Screen / Route Map

扫描完成后，应形成项目级 screen / route map，记录主要 screen、PC / H5 对应关系、共享 shell、独特 layout 与 dialog / sheet。它可以写入 docs/project/ 下的项目文档或其他等价位置；不得为了流程强制创建大量空文档。

必须区分：

~~~text
Figma Page
≠ Next.js Route

Figma Frame
≠ automatically one route
~~~

Route 规划必须结合产品含义、Figma screens、应用导航与现有 App Router 架构。一个 Figma Page 可能包含多个真实页面；一个真实页面也可能跨多个 Frame 或状态。

## Phase 2：Project Design System Extraction

正式编写业务页面前，应基于全局扫描生成或更新：

~~~text
docs/project/design-system.md
~~~

或项目采用的等价位置。该文档记录真实项目的 color、typography、spacing、radius、border、shadow、container、responsive pattern、component variants 与 interaction state。

它记录项目事实，不得复制 starter 默认视觉值；具体工程原则仍遵守 docs/design-system.md。

### Designer Color Collection

扫描时优先识别设计师整理的 Color Collection、Variables 或 Styles，并确认高频颜色的实际用途。Color Token 的 semantic naming、global / local 边界与 promotion 规则由 `docs/design-system.md` 定义。

Phase 2 的产物应将确认后的项目级颜色事实记录到 `docs/project/design-system.md` 或等价位置，并规划其进入 `src/styles/tokens.css` 与 semantic styling 的路径。不要机械复制 Figma 的视觉名称，也不要因低频局部颜色而提前创建 global Token。

### Typography、Spacing 与其他视觉规律

扫描时必须记录真实的 `font family`、`font face`、`font weight`、`font size`、`line height`、`letter spacing` 与 language fallback，并从 Figma 和字体 metadata 确认 weight / family 的事实。

将 Figma font/style 映射到 CSS family、CSS weight 与 Tailwind / semantic usage，记录在项目级 Design System。Token、spacing、radius、shadow、border、container 与 layout scale 的工程提炼原则继续遵守 `docs/design-system.md`；Workflow 只负责发现、确认与记录这些设计事实。

## Phase 3：Component Inventory

完成全局设计扫描后，应建立或更新项目 Component Inventory，例如：

~~~text
docs/project/component-inventory.md
~~~

或等价位置。至少区分：

~~~text
Shared UI candidates
Domain components
Feature components
Page-only components
~~~

Inventory 是项目架构辅助材料，不是立即创建组件的命令。candidate 不等于 implementation。

进入 shared/ui 前必须判断：去掉业务数据和业务行为后，它是否仍是稳定、有意义的 UI Primitive？出现两次或视觉相似，都不足以证明它属于 Shared。反之，明确成立的 Starter / Design System primitive 不必等待第二个 Feature：首次真实使用即可 Shared，按 architecture.md 的语义规则审计。

Figma Component 也不等于 React Component。Figma 的设计组织方式不能替代 React 的 reuse、behavior、state、ownership 与 maintainability 判断。反之，代码中的重要业务组件也不要求在 Figma 中存在同名 Component。

### Variant 观察优先于 API 设计

设计组件 API 前，应先观察完整 variant matrix，例如：

~~~text
size
variant
selected
disabled
loading
icon
danger
secondary
~~~

然后区分真正的 component variants、Feature state 和独立组件，避免后续出现 isGreen、isSpecial、smallBorder、roundedMore 等无语义视觉 prop。

## Phase 4：Asset Inventory 与提取

正式页面编码前，先识别需要的真实资源，并按类别盘点：

~~~text
Logo
Brand asset
Custom icon
Token icon
Chain icon
Illustration
Photo
Background
Decorative raster
SVG / vector
~~~

资源优先级为：

~~~text
Figma original / exact asset
↓
project-owned exact asset
↓
confirmed equivalent library icon
~~~

品牌 Logo、Token、Chain、产品定制图形与 Figma 指定 custom icon，不得用“长得相近”的通用 icon library 替代。

若 Figma 中存在 original uploaded image、vector source 或 dedicated asset node，应优先使用真实 asset。不得截图 parent frame 后裁剪为生产资源，也不得把 text、button、card、simple gradient、basic shape、CSS border 或普通 shadow 截图成图片。

### Vector、Raster 与命名

Figma 原始为 Vector 时，优先保留 vector 能力。根据项目需求选择 SVG file、inline SVG 或 React component；不得机械要求所有 SVG 转换为 React Component。

Raster export 应按实际显示尺寸、DPR、清晰度、文件大小与资源类型决定。不得建立所有图片统一 3x 的规则；小型 icon-like raster 与大型 background 的合理倍率可能不同。设计资源本身透明时，必须保留透明背景。

正式落地的 asset 应使用语义化名称，避免 image1.png、Frame-123.png、Group-7.svg 等临时名称进入长期生产代码。本文不锁定 asset directory；存放位置由 owner、reuse 与现有工程架构决定。

具体资源导出格式、倍率和当前 Figma MCP 的操作方式应依据当时官方能力与项目需求决定；不得把某次 MCP API 固化为永久规则。

## Phase 5：Implementation Plan

当 Project Design System 与 Component Inventory 已足以支持当前范围时，再规划实现顺序：

~~~text
foundation
↓
shared shell
↓
shared primitives needed now
↓
domain pieces
↓
feature workflows
↓
pages
~~~

不得以“先建组件库”为由，提前实现未来可能用不到的 Shared UI。即使 Figma 展示很多组件，当前任务只需要 Button、Dialog、Input 时，也不得顺手实现 Tabs、Tooltip、Popover、Accordion 或 Table。

完成 scan 后，应检查 starter 现有 UI，并在真实项目语境中决定 keep、adapt 或 remove；不得将 scaffold 当作 project Design System。

## Phase 6：Foundation Implementation

Foundation 只按真实项目已确认的需求逐步建立，可能包括：

~~~text
src/styles/tokens.css
typography
required fonts
required shared/ui primitives
project assets
page shell
~~~

不得为了满足流程预建空目录、placeholder component 或未使用 dependency。

app/globals.css 仍是唯一 global style entry；src/styles/ 用于组织真正的全局样式模块。业务专属样式继续靠近所属 Domain 或 Feature。

## Screenshot-level 与 Property-level Parity

Figma 实现必须同时满足 screenshot-level visual parity 和 property-level parity。核对关键节点的 geometry、surface、effects、typography、icon 与 state；明确存在的 property 不得因父层看起来已产生相同结果、token 化或抽象而省略。不同设计 surface 即使颜色相同，也必须保留各自的背景、描边、圆角与效果表达；不得静默合并视觉层级。

Token 可替代原始值，但最终 computed / rendered value 必须等于对应 Figma 值。验收时使用浏览器 computed style，而非仅看截图；保存 Node / Figma / Implementation / Computed / Result 的最小证据表。检查初始值和所有已实现状态，区分 text AUTO line-height 与固定值、paint alpha 与整个节点 opacity、background blur 与普通 filter blur。设计工具 effect radius 与导出 CSS blur 的单位语义应由实际 design context 核对，不能直接猜换算。

仅在浏览器不支持、存在明确性能/兼容问题、或与用户确认的新产品规则冲突时，可以不直接照搬；必须报告节点、差异、原因与替代实现，不能静默省略。用户明确批准的内容、responsive 或交互覆盖应单独列明，不伪装成原设计事实。

## Phase 7：Feature / Page Implementation

实现某个页面前，必须先扫描当前设计中该页面的全部相关 frame / state，并读取完整 frame 与直接子节点；形成最小 Page State Inventory，区分固定模块、同模块状态与独立页面。不得只读取一个 frame 或局部 row 就宣布页面完成。验收时逐项核对 inventory；没有 runtime owner 的设计状态应明确标记为 presentation / fixture，而非伪造业务能力。

实现某个具体页面或 Feature 前，应重新读取目标 Frame / Component 的最新精确设计上下文，而不是依赖数小时前扫描的记忆。至少重新确认：

~~~text
layout
width / height
padding
gap
font
weight
line-height
color
border
radius
shadow
assets
variants
responsive behavior
~~~

Figma MCP 输出的 JSX tree、React、Tailwind 或 HTML-like 示例只能作为 design context representation。实现必须转换为当前项目的 Architecture、Shared / Domain / Feature ownership、semantic Token、已有组件、state model、API workflow 与 Web3 workflow。

页面实现前先检查是否存在合适的 shared/ui、Domain Component 或 Feature Component。存在合适组件时应复用或增加合理 variant；不得仅因 MCP 返回新 JSX tree 就重写相同 Button、Dialog 或 Card。

反过来，已有组件若明显不符合当前 Figma，也不得为了“项目里已经有”而强行套用。应判断组件是否需扩展、当前设计是否确为不同组件，或旧实现是否已 drift，并报告差异后再决定。

## Responsive、真实数据与未绘制状态

若 Figma 提供 PC 与 H5，必须从一开始同时理解 shared structure、responsive differences、layout / navigation changes、visibility、spacing 与 Dialog → Bottom Sheet 等变化。不得先完整实现 Desktop，再用 media query 将其硬压为 H5。

默认策略是：

~~~text
same semantic component
+
responsive presentation
~~~

只有真实结构或交互差异足够大时，才拆分 presentation component；业务 workflow 与 state 尽量共享。PC centered Dialog 与 H5 Bottom Sheet 若属于同一 semantic interaction，应共享 Feature content、business state 与 events，仅改变 presentation primitive。

页面不应只按照 Figma 的理想文案验收。应考虑 long wallet address、large token amount、long localized text、empty value、loading、error 与 overflow。

若 Product、API 或 Web3 明确存在 loading、error、pending transaction、disabled 或 empty，而 Figma 未画出，不得忽略。应在已确认的 Design System、产品语义与 accessibility 基础上形成合理 fallback，并明确这是 implementation decision，不是 explicit Figma fact。若该状态影响核心体验且无法合理推导，应报告 ambiguity。

## Phase 8：Visual Verification

实现完成后必须进行视觉核验，至少覆盖：

~~~text
layout
size
spacing
typography
weight
line height
color
border
radius
shadow
asset
responsive
interaction state
overflow
long content
PC
H5
accessibility
~~~

发现视觉差异时，应先检查结构性原因：

~~~text
wrong layout model
wrong container
wrong font
wrong line-height
wrong asset
wrong responsive rule
wrong component
~~~

只有结构正确后，才调整精确像素。不得将所有问题直接处理为 margin-top: 3px 或 left: -2px。

视觉差异可以归类为：

~~~text
Design Fact Missing
Implementation Bug
Token Mismatch
Typography Mismatch
Asset Mismatch
Responsive Mismatch
Component Abstraction Issue
Intentional Product Difference
~~~

Figma screenshot 可用于整体 composition 对照和最终 visual QA，但不能替代结构化 spacing、font metadata、asset source 或 component tree。Fidelity 不允许用整页 absolute positioning、大量 magic coordinate、screenshot as UI、frame screenshot as background 或 magic transform 伪造视觉相似。

## Phase 9：Cleanup 与 Promotion

真实页面完成后，再回看：

~~~text
哪些局部视觉开始稳定重复
哪些组件证明值得复用
哪些 Token 应 promotion
哪些抽象没有价值
~~~

只有在真实使用证明后，才进行必要的：

~~~text
Page local
→ Feature
→ Domain
→ Shared UI
~~~

promotion。不得在第一次扫描设计时一次性决定所有最终抽象。

确认新的稳定项目设计事实时，应同步更新 docs/project/design-system.md 与实际需要的 src/styles/、shared/ui 或所属模块，避免代码、Token 与项目设计文档长期 drift。Component Inventory 也可随真实实现修正，它不是不可变的圣经。

## Figma Facts、Ambiguity、Variables 与 Code Connect

若设计师已整理 Colors、Typography、Components、Icons 或 Assets 的 handoff 区，应优先读取该区域。页面扫描用于验证实际使用、发现局部例外或设计 drift，不应用像素出现频次取代设计师已确认的事实。

Figma 使用 Variables 时，应读取 colors、spacing、typography-related styles、modes / themes，并判断它们是否与项目 Token 对应。Figma Variable 存在不意味着必须一比一复制为 CSS Variable；工程侧仍要进行 semantic ownership 与合理 mapping。

Figma Auto Layout 的 direction、gap、padding、alignment、sizing 是重要结构信息，但不要求机械复制每个 wrapper div。生产代码应选择合理的 flex、grid 或 normal flow。Figma 节点的 absolute position 也不自动要求 Web 使用 absolute；先区分真实 overlay、decorative layer、badge、floating element 与设计工具中的布局表达。

若出现同一语义使用相近不同颜色、同一 Button radius 不同、同一 Typography style weight 不同，或 PC / H5 规则冲突，应按以下顺序处理：

~~~text
检查 Designer Collection / Component
↓
检查其他页面和 variants
↓
判断是否 intentional variant
↓
无法确定时报告 ambiguity
~~~

不得任意选择其中一个，也不得自动将每个异常都建成 Token。

如果未来已经拥有稳定 Figma Component 与稳定 Production Component，可以评估 Code Connect 或等价 mapping，让 Agent 优先使用真实组件。Code Connect 不等于 starter 必须配置；Design System 或代码组件尚未稳定时，不得为“先进”提前建立大量 mapping。

## Figma Gates

### 项目开发前 Gate

开始大规模页面实现前，至少确认：

1. 是否已看过主要页面与 Frame？
2. 是否识别 PC / H5？
3. 是否找到 Designer Color Collection？
4. 是否确认 Typography？
5. 是否识别主要 layout shell？
6. 是否形成 Component Inventory？
7. 是否识别 custom assets / icons？
8. 是否建立 Project Design System？
9. 是否明确 starter UI 的 keep / adapt / remove？
10. 是否存在尚未确认的 design ambiguity？

关键项未知时，不得假装 Design System 已完成。

### 单页面 / Feature Gate

实现前确认：

1. 是否读取目标 Frame 的最新设计上下文？
2. 是否知道对应 PC / H5 设计？
3. 是否已有可复用的项目组件？
4. 是否消费正确 semantic Token？
5. 是否使用准确 Typography 与 asset？
6. 是否识别页面的重要状态与真实数据边界？
7. 是否存在未确认的设计值？

### 完成后 Visual Gate

至少确认 layout、spacing、typography、color、asset、border / radius / shadow、responsive、overflow、long content、states、PC、H5 和 accessibility。自动化比较、screenshot tooling、device matrix 与测试执行继续归 docs/qa.md。

## Forbidden Patterns

以下模式不得作为默认实践：

- single selected frame → start coding whole project；
- Figma screenshot → guess spacing / typography / color；
- MCP generated React / Tailwind → copy directly as production architecture；
- Figma Page 或 Frame → automatically Next.js route；
- Figma Component → automatically React component；
- same-looking UI → automatically shared component；
- Designer Color Collection exists → ignore it and invent palette；
- every Figma color → global token；
- custom asset → screenshot parent frame；
- custom icon → similar library icon；
- Desktop only → claim guessed H5 as Figma fact；
- PC + H5 → duplicate business logic；
- visual mismatch → immediately add magic pixels；
- Figma Auto Layout → mechanically copy wrapper tree。

## 与其他规范的边界

本文负责：

~~~text
Figma intake
whole-file scan
project Design System extraction workflow
component and asset inventory
implementation sequence
visual verification workflow
ambiguity handling
~~~

其他文档分别负责：

- docs/design-system.md：Token、组件归属、响应式、accessibility 与视觉系统原则；
- docs/frontend-rules.md：React、Next.js、Tailwind 与组件编码规则；
- docs/architecture.md：Shared、Domain、Feature 的所有权与依赖方向；
- docs/state-management.md：state owner、UI / form / Query state；
- docs/api.md：API error 和数据协议语义；
- docs/web3.md：Web3 transaction、wallet、chain 与 error 语义；
- docs/qa.md：visual regression tooling、screenshots、device matrix、自动化比较与测试执行。

## TBD

以下事项随 Figma 当前官方能力、项目和团队流程确定，本文不预先锁定：

- 具体 Figma MCP tool names 与 call sequence；
- asset export API、精确格式与倍率；
- Code Connect strategy；
- Figma branch workflow 与 design approval workflow；
- specific screenshot / pixel diff tooling；
- specific asset directory 与 naming convention。
