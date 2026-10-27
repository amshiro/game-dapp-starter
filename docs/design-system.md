# Design System 工程规范

## 目标与适用范围

本文规定 \`game-dapp-starter\` 在真实项目中如何从 Figma 提炼视觉规则、Design Token、组件体系、响应式行为和视觉资源，并将其以可维护的方式落地到代码。

目标是在保证 Figma fidelity 的同时，保持正确的 Web 布局、清晰的组件归属、可访问性和长期可维护性。本文不定义某个产品的品牌视觉，也不预建组件或安装 UI dependency。

本文不替代以下专项规范：

- React、Tailwind 编码和组件实现规则：\`docs/frontend-rules.md\`
- Domain、Feature、Shared 归属与依赖方向：\`docs/architecture.md\`
- UI state、数据状态与状态 owner：\`docs/state-management.md\`
- API、Web3 的错误和业务语义：\`docs/api.md\`、\`docs/web3.md\`
- 图片 Runtime、部署和 Cloudflare 配置：\`docs/cloudflare.md\`
- Figma MCP 的具体操作、节点读取与资源导出细则：\`docs/figma-workflow.md\`
- 视觉回归、设备矩阵和测试执行策略：\`docs/qa.md\`

## Global 与 Project Design System

Design System 分为两个层次，二者不得混淆。

### Global Design System Rules

\`docs/design-system.md\` 记录跨项目稳定的工程规则，包括：

- Figma-first workflow；
- Design Token 的提炼和代码落地原则；
- typography mapping；
- UI Primitive、Domain Component 与 Feature Component 的归属；
- PC / H5 响应式呈现原则；
- asset、icon 和图片的使用边界；
- interaction state、accessibility 与反馈 UI 的职责；
- Figma fidelity 和 Design QA 的范围。

本文不写入任何项目的具体品牌值或固定组件清单。

### Project-specific Design System

真实项目开始后，应根据完整 Figma 在下列位置或项目采用的等价位置记录项目视觉事实：

\`\`\`text
docs/project/design-system.md
\`\`\`

其中可以包含：

- font family、font file、weight mapping 和语言 fallback；
- color、spacing、radius、shadow、border 与 layout scale；
- container、breakpoint、页面 shell 和 responsive pattern；
- component variants、状态和项目 asset；
- 经确认的图标、主题和动画语言。

项目设计事实不应被误当为 starter 的跨项目默认值；starter 的工程原则也不能代替真实 Figma 事实。

## 设计事实、代码 Token 与全局样式入口

设计文档、运行时代码和全局样式入口各有明确职责：

\`\`\`text
Figma
  ↓
docs/project/design-system.md
  项目设计事实
  ↓
src/styles/tokens.css 等
  代码级 Design Token source
  ↓
Tailwind semantic utility / component styling
  ↓
shared/ui / domains / features / app
\`\`\`

页面和组件不会、也不得在运行时读取 Markdown 来获取视觉值。经确认且需要在运行时消费的全局 Token 必须进入代码层。

\`app/globals.css\` 是唯一的 global style entry，必须继续由 \`app/layout.tsx\` 引入。它可以统一引入 \`src/styles/\` 中真实需要的全局样式模块，例如 \`tokens.css\`、\`typography.css\` 或 \`utilities.css\`。不得建立第二套独立全局样式入口。

\`src/styles/\` 仅用于真正全局的样式基础设施。只有项目需要时才创建文件或目录；不得为了占位提前创建空文件，也不得把 Feature、Domain 或页面专属样式集中堆放到这里。

## Figma-first Workflow

在开始实现新项目的页面或建立 Shared UI 前，应先获得足够完整的设计视野。默认流程如下：

\`\`\`text
完整扫描 Figma
  ↓
识别 routes、screens、PC / H5 和主要状态
  ↓
识别 shared visual patterns、layout shell 与 component candidates
  ↓
提炼 typography、color、spacing、radius、shadow 与布局规律
  ↓
建立项目级 Design System 与 component inventory
  ↓
检查 starter 现有 UI：keep / adapt / remove
  ↓
实现页面、Domain 与 Feature
\`\`\`

不得只打开第一张页面便开始编码，并在实现过程中凭局部截图定义全项目 Token 或 Shared UI。

“完整扫描”不要求机械读取所有隐藏节点。目标是在做全局抽象前，尽量覆盖 major pages、major frames、PC、H5、navigation、dialogs、drawers、forms、重复组件，以及确认存在的 default、hover、active、focus、disabled、loading、error、success、empty、selected 和替代状态。

### Figma MCP 与事实边界

使用 Figma MCP 时，应先定位正确的 page、frame、component、node 和 variant，再读取实际 layout、spacing、typography、color、radius、border、shadow、asset 与 PC / H5 差异。不得仅根据截图肉眼猜测这些值。

信息不足时应报告 ambiguity，而不是编造设计值。具体 MCP tool command、资源导出倍率、文件格式和节点操作流程由 \`docs/figma-workflow.md\` 定义，本文只规定工程边界。

不同来源表达不同事实：

\`\`\`text
Figma
→ visual design truth

Product / Backend / API / Web3 Contract
→ behavior truth

Source code / Runtime config
→ current implementation truth
\`\`\`

Figma 与旧代码不一致时，不得自动假定旧代码正确；Figma 未画出业务状态时，也不得自动假定该业务不存在。需要调查、说明冲突和确认后再决定。

## Design Token

### 提炼原则

只将真实存在、稳定并具有设计语义的视觉规律提升为全局 Token。可能的类别包括：

```text
color
typography
spacing
radius
shadow
border
layout scale
```

这不是固定 Token 清单。具体类别、名称和数量必须由项目 Figma 的真实规律决定。

### Designer Color Collection

设计师通常会在 Figma 中单独整理项目常用的高频颜色；整站高频颜色通常约不超过 15 个，实际数量仍以项目设计事实为准。这组 Designer Color Collection 默认是项目级全局 Color Token 的来源，而不是 starter 固定色板。

项目应按以下链路处理：

```text
Designer Color Collection
→ docs/project/design-system.md
→ src/styles/tokens.css
→ 全站通过 semantic token 使用
```

设计师负责确认哪些颜色属于高频 Collection，以及它们的具体色值。工程侧负责根据真实用途定义代码中的 semantic token 名称与消费边界。

例如 Figma 可以将颜色标为 Green、Gray 1、Gray 2；代码不应机械复制这些纯视觉名称，而应在真实用途明确后映射为 primary、text-secondary、border、surface 等语义。具体 token 名称和数量仍由项目决定。

### Global Token、局部值与 Promotion

```text
高频 + 稳定 + Designer Color Collection
→ project-level semantic token

低频 + 局部 + 一次性
→ local hardcoded value allowed

局部值后来稳定复用
→ 重新评估并 promote to token
```

Figma 中出现的所有颜色不等于全部必须进入 global token system。只在局部视觉出现、仅使用 1～2 次、没有稳定全局语义，或未进入设计师高频 Color Collection 的颜色，可以靠近对应 component 或 Feature 使用真实色值；不必为了让 Design System 看起来完整而创建全局 Token。

反之，当这种局部值后来在多个页面或多个组件中稳定重复使用时，应重新评估其设计语义，并在确认后提升为 project-level semantic token。

当一个值已被确认是全局 semantic token，页面和业务组件不得继续大量散落等价的 #xxxxxx、rgb(...) 或 arbitrary Tailwind color 来替代它。本文不禁止所有 hardcoded hex；禁止的是已存在稳定全局语义后仍绕过其 Token。

继续遵守：

```text
small duplication
>
wrong abstraction
```

### Semantic Token 优先

全局 Token 优先表达用途，例如 primary、surface、text-primary、text-secondary、border、positive、negative，而不是只表达某个视觉样本，如 green-1 或 dark-gray-2。命名体系必须从项目实际设计和使用语义中提炼，不在本文锁定固定名称或数量。

### Tailwind v4 与 CSS Variable

当前项目使用 Tailwind CSS v4。项目级 Token 推荐遵循以下方向：

\`\`\`text
Figma design fact
→ semantic CSS variable
→ Tailwind semantic utility / component styling
\`\`\`

具体 Tailwind v4 token syntax、theme 配置和 utility 映射必须在真实项目中验证后决定。不得在本文预写未经验证的完整 Tailwind theme 配置。

## Typography 与字体

Typography 必须从真实 Figma 与 font metadata 确认，至少包含：

\`\`\`text
font-family
font-face
font-weight
font-size
line-height
letter-spacing
language fallback
\`\`\`

不得仅凭视觉猜测字体或字重。若 Figma 中的 Regular、Medium、Bold、Black 实际属于同一字体家族，优先建模为一个 \`font-family\` 配合经过 metadata 确认的 weight，而不是随手用多个字体或将 Medium 机械映射为 \`font-semibold\`。

字体来源和加载方式由真实资源决定。不得在 starter 中强制选择 \`next/font\`、\`@font-face\`、remote CDN 或 local font 其中一种；一旦确定，应避免多个互相冲突的字体加载入口。

### 当前 Starter 默认字体

当前 Starter 使用用户提供的 HarmonyOS Sans SC 2.040，资产位于 `public/fonts/harmonyos-sans/`，不归属于具体项目或 Feature。唯一注册入口为 `src/styles/fonts.css`，由 `app/globals.css` 导入；全局 `--font-family-sans` 提供 HarmonyOS Sans SC → Noto Sans SC → system UI fallback，Tailwind `font-sans` 消费同一入口。Feature 只选择字号/字重，不重复注册或加载字体。

该文件为 normal TrueType Variable Font，`wght` 范围 40–900。使用一个 `@font-face`、`font-weight: 40 900`、`font-display: swap`；root layout 对同一 URL 做 anonymous font preload，避免按 Regular/Medium/Bold 重复请求。保留全局 `font-synthesis: none`，不可依赖伪造的粗体/斜体。CSS 400/500/700 均为真实可插值字重；文件命名 Bold 为 706，不应把命名实例和 CSS 坐标混为一谈。

后续 Starter 项目默认可沿用此技术入口，并按自己的设计事实核对 weight mapping。运行资产使用保留完整字形与 40–900 axis 的单文件 WOFF2（12.43 MB，原始 TTF 20.62 MB 不进入仓库）；preload 与 CSS 使用同一 WOFF2。首次慢网加载仍须按项目验收；用户提供的 `LICENSE-update.txt` 原样保留为本地许可依据，发布模板前需核对适用条款。来源、版本、覆盖范围与 hash 见 [字体资产说明](../public/fonts/harmonyos-sans/README.md)。本节不包含项目颜色、页面尺寸或业务规则。

## Component Ownership 与提升规则

组件归属必须与 \`docs/architecture.md\` 保持一致：

\`\`\`text
shared/ui/
domains/<name>/components/
features/<name>/components/
\`\`\`

### Shared UI

进入 \`shared/ui/\` 的组件必须同时满足以下倾向：

- 不理解产品业务、业务数据或业务行为；
- 能脱离某个具体 Feature 有意义地使用；
- 主要承担视觉或通用 interaction primitive；
- 能由 Token 驱动，并具备其应有的 accessibility 基础。

Button、Input、Dialog primitive、Drawer primitive、Tabs、Tooltip、Spinner、Skeleton 与基础 Badge 可能属于此类，但本文不要求预建其中任何组件。

### Domain 与 Feature Component

表达稳定产品概念、领域数据或领域规则的组件属于对应 Domain。表达用户动作、业务流程或交易工作流的组件属于对应 Feature。

例如 \`TokenSelector\`、\`PositionCard\`、\`SwapForm\`、\`ClaimPanel\`、\`DepositModal\` 等，即使在多个地方出现，仍可能是 Domain 或 Feature Component。它们不得仅因“可能复用”而进入 \`shared/ui/\`。

判断关键是：

> 去掉业务名称、业务数据和业务行为后，该组件是否仍是稳定且有意义的 UI Primitive？

### Promotion 与视觉相似性

组件默认从页面局部、Feature 局部或 Domain 局部开始。只有真实设计和业务使用证明其复用稳定、归属清晰时，才提升到 Domain 或 \`shared/ui/\`。

视觉相似不等于业务相同。两个业务卡片可以共享 Card primitive，却保留独立的 \`PositionCard\` 与 \`RewardCard\` 语义。反过来，同一 semantic component 在 PC、H5 或不同状态下可以使用不同 presentation；不得因此复制两套完整的业务逻辑。

完成 Figma 扫描后，应形成项目级组件清单，例如：

\`\`\`text
docs/project/component-inventory.md
\`\`\`

或等价位置。清单至少区分 Shared UI candidates、Domain components、Feature components 与 page-only components。它是项目事实，不是 starter 预建组件列表。

## Component API、Variants 与基础库职责

Shared UI 的 API 应表达 semantic intent、variant、size、state、content 和 event。避免以大量视觉微调 prop 重新设计组件，例如 \`specialGreen\`、\`borderColor\`、\`marginTop\` 或 \`customRadius\`。这不禁止合理的 \`className\`、\`children\` 或 composition 能力。

若组件存在经真实设计确认的稳定 variant matrix，可以使用 \`class-variance-authority\`（CVA）。CVA 是 Baseline 选项，不代表每个组件都必须使用。

未来接入 \`clsx\` 与 \`tailwind-merge\` 时，应建立一个明确的 class composition helper：

\`\`\`text
clsx
→ conditional classes

tailwind-merge
→ Tailwind conflict resolution
\`\`\`

不得同时维护 \`cn\`、\`cx\`、\`classnames\`、\`mergeClass\` 等多套重复 helper。

Radix Primitives 负责可访问的 interaction primitive behavior，不负责项目视觉设计：

\`\`\`text
Radix
→ behavior / accessibility foundation

Figma + Token + Tailwind
→ visual appearance
\`\`\`

具体采用统一 \`radix-ui\` package 或独立 primitive packages，按项目 Design System 的实际需求决定。

## Responsive：PC、H5、Modal 与 Safe Area

如果 Figma 同时提供 PC 与 H5，两者都是设计事实。不得把 Desktop 按比例缩小后声称实现了 Mobile。应识别实际变化的 container、layout、stacking、spacing、visibility、navigation、typography、Modal / Drawer、sticky 与 safe area。

没有提供某个 viewport 的 Figma 时，可以依据已确认的 responsive rule、项目其他设计模式和 \`docs/frontend-rules.md\` 做出合理实现，但必须明确：

\`\`\`text
implementation decision
≠ Figma fact
\`\`\`

默认共享 semantic component、业务逻辑、state 与 Feature workflow。不得因同时存在 Desktop Frame 与 Mobile Frame，就默认创建并复制 \`DesktopPage.tsx\` 和 \`MobilePage.tsx\`。只有结构、焦点行为或交互形态确实不同，才拆分 presentation 分支。

同一 semantic interaction 可以在 Desktop 呈现为 centered Dialog，在 H5 呈现为 Drawer 或 Bottom Sheet；这仍可由同一个业务组件承载。具体呈现由项目 Figma 决定。

真实 H5 DApp 需求存在时，应考虑 \`safe-area-inset-*\`，特别是 bottom navigation、fixed action、Drawer 与 Bottom Sheet。不得在无实际需求时预建复杂的 safe-area framework。

## Assets、Icon 与 Image

### Asset 与 Icon 选择

图标与资源的选择顺序为：

\`\`\`text
Figma exact asset
→ project-owned exact asset
→ confirmed equivalent icon library asset
\`\`\`

\`lucide-react\` 可用于项目已确认接受的通用 UI icon，但不得替代品牌 Logo、Token Icon、Chain Icon、产品专属图形或 Figma 指定的 custom icon。

提取 Figma asset 时，应定位真实 asset node，不得截图 parent frame，不得把文本或普通 CSS shape 导为图片。应保持透明背景、正确 aspect ratio，并按资源性质区分 raster 与 vector。具体导出规格由 \`docs/figma-workflow.md\` 定义。

### Raster、SVG 与图片实现

raster 资源的清晰度应综合 display size、DPR、asset type 与 file size 决定。不得建立“所有 raster 一律 3x”的规则；小型 icon-like raster 与大型 background 的需求可能不同。

真实 vector asset 应优先保持 vector 能力，并根据实际需要考虑 fill、stroke、\`currentColor\`、themeability、build compatibility 与安全来源。不得要求所有 SVG 都转为 React Component。

根据用途选择 \`img\`、Next/Image 或兼容的 image abstraction、CSS background、inline SVG 等实现方式；不得为了统一 API 强制一种方式解决所有图片。Cloudflare 图片 Runtime 与部署边界仍由 \`docs/cloudflare.md\` 负责。

## Figma Fidelity 与可维护布局

Figma 实现应准确还原经确认的 layout、size、spacing、typography、color、radius、border、shadow、asset、responsive behavior 与 interaction state。“看起来相似”不是完成标准。

同时：

\`\`\`text
Figma fidelity
≠ absolute-position everything
\`\`\`

不得通过整页 absolute positioning、大量无语义 magic coordinate、截图式整页图片、固定像素定位修正常规 flow，或用图片代替可交互内容来模拟设计稿。优先使用 flex、grid、gap、padding、margin 与正常文档流。

Figma 中真实的 padding、gap、height、radius 等精确像素值可以合理使用。应避免的是为了让截图“看起来差不多”而不断叠加没有布局语义的 magic number。

## Interaction State 与 Accessibility

应依据真实 Figma 和 Product requirement 确认 default、hover、active、focus、disabled、loading、selected、error、success、empty 等状态。不得随意发明大量视觉状态，但 accessibility 所需行为不因 Figma 未画出而消失。

至少应覆盖：

- semantic HTML，以及正确区分 \`button\` 与 clickable \`div\`；
- keyboard interaction 与 \`focus-visible\`；
- label、accessible name 与必要的 ARIA；
- Dialog 的 focus management；
- disabled semantics；
- 可读 contrast；
- 不只依赖颜色传达状态。

Figma 未画出 focus-visible、keyboard navigation 或 screen-reader label，不是移除这些能力的理由；也不得借此随意改变核心设计语言。

## Feedback、Loading、Error 与 Toast

Design System 只负责视觉 primitive 与一致的呈现语言，例如 Spinner、Skeleton、Toast presentation、Error presentation primitive 和 Button loading state。

业务 owner 负责语义与时机：

\`\`\`text
为什么 loading
什么时候 success
是什么 error
是否 retry
什么时候 Toast
\`\`\`

这些由 Feature、route、API owner 或 Web3 owner 依据各自专项规范决定。API transport、Web3 primitive 和 Shared infrastructure 不得直接决定业务 Toast、关闭 Modal、导航或业务文案。

\`shared/ui\` 也不得自行识别 RPC Error、Backend Auth Error 或 Transaction Revert 并决定业务提示；它只提供 error visual language。未来如使用 Sonner，它可作为统一 Toast primitive，但：

\`\`\`text
Toast library
≠ Toast ownership
\`\`\`

## Motion 与 Starter UI Cleanup

不得因为 AI 认为“更高级”而自行增加大量 animation。复杂 motion 必须来自 Figma prototype、Product requirement 或已建立的项目 Design System。hover、color、opacity 与基础 transition 优先使用 CSS / Tailwind；\`motion\` 仅在真实的 enter / exit、layout animation、gestures 或复杂 transition 需求出现时按依赖规则评估。

真实项目开始后，应先完成 Figma 扫描和项目 Design System，再检查 starter 现有 UI，决定 keep、adapt 或 remove。默认页面、默认 Tailwind 颜色、默认 Card、间距和文案只属于 scaffold，不得被当成 production Design System 或组件抽象依据。

## Design QA Boundary

实现后至少从以下维度核验视觉结果：

\`\`\`text
layout
spacing
typography
colors
assets
responsive behavior
interaction states
overflow
long text
PC
H5
accessibility
\`\`\`

本文定义应核验的设计维度；screenshot automation、visual regression tooling、device matrix、test commands 和 CI execution strategy 由 \`docs/qa.md\` 定义。

## 实施前检查

Tech Stack Baseline 不等于已经安装、接入或通过 Runtime 验证。实施真实 Figma、UI 或 Design System 工作前，必须检查当前 package、source、styles、assets、组件与项目 Design System 事实，不得根据本文假设 Radix、图标库、class helper、Toast、`shared/ui`、Token、字体或响应式体系已经存在。

脚手架的默认 Tailwind 颜色、页面 spacing、示例 Card、字体 fallback 与文案不是生产视觉事实，不得将其当作项目 Design System 或组件抽象依据。

## Forbidden Patterns

以下模式不得作为默认做法：

- 单个 Figma 页面就定义完整 Shared UI；
- 因组件“看起来可复用”就移入 \`shared/ui/\`；
- 已确认的全局 semantic color 仍以散落 hardcoded hex 使用；
- 将 Figma Medium 盲目实现为 \`font-semibold\`；
- 将 Desktop 设计推测为 Mobile Figma 事实；
- 因 PC 与 H5 Frame 同时存在而复制完整业务页面；
- 用截图、整页 absolute positioning 或大量 magic coordinate 模拟 Figma；
- 将 parent frame screenshot 当作可复用 asset；
- 用相似 Lucide icon 替换 custom Figma icon；
- 让 Shared UI 理解业务 error、API 或 Web3 semantic；
- 因 Figma 未画 focus 而忽略 accessibility；
- 因一次性局部值存在就创建推测性 global Token；
- 将 starter scaffold 误认为项目视觉规范。

## 实施检查清单

1. 是否已完成足够完整的 Figma scan？
2. 当前视觉值是 Figma fact，还是 implementation decision？
3. 稳定的全局视觉规律是否已被正确 token 化？
4. 项目 Token 是否进入代码层 \`src/styles/\`，而非只记录在 Markdown？
5. 是否把一次性颜色或局部样式错误提升为 global Token？
6. Shared UI 是否真正 business-neutral？
7. 是否因视觉相似错误合并了不同业务组件？
8. Typography 是否使用真实 font metadata？
9. PC / H5 是否共享业务逻辑，而非复制成两套页面？
10. 未提供的 viewport 是否被错误描述为 Figma fact？
11. custom icon 是否被错误替换为相似 library icon？
12. asset 是否来自真实 Figma node，而非 parent screenshot？
13. 是否用 absolute positioning 或 magic coordinate 模拟截图？
14. accessibility 是否因 Figma 未画而被忽略？
15. Design System 是否越界承担了 Feature、API 或 Web3 的业务语义？

## TBD

以下内容必须由真实项目、Figma 和经过验证的技术决策确定，不得由 starter 预先锁定：

- brand colors、font family、font files、font loading strategy 与 weight mapping；
- spacing、radius、shadow、breakpoint、container width 与 layout scale；
- dark / light theme；
- component inventory 与 exact shared/ui components；
- icon set、asset naming scheme 与 Radix package strategy；
- Toast appearance、animation language 与 safe-area implementation。
