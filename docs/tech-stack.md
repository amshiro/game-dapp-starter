# 技术栈规范

## 目标与适用范围

本文定义 `game-dapp-starter` 的默认技术选择、职责边界、依赖分级和新增依赖的决策规则。它用于指导公司后续 DApp 项目及 Codex 的技术选型，而不是一份简单的 `package.json` 清单。

技术栈应保持少而明确：同一个职责默认只选择一套主要方案。不得因为个人习惯、旧项目遗留或假设中的未来需求并存多套功能重叠的库。

本文不规定目录结构、React 编码细节、API 协议、状态实现、Web3 交互细节、Design System、Cloudflare 配置或测试策略；这些内容分别由对应专项规范负责。

## 实施前的事实检查

技术分级描述目标技术的职责与采用条件，不是当前 `package.json`、lockfile 或已验证能力的快照。

实施、升级或评审任何技术前，必须检查当前 package、lockfile、source、config、scripts 与 Runtime 验证记录。不得因本文列出某项 Core、Baseline 或 Optional 技术，就假设它已经安装、配置或通过兼容性验证。

Baseline 表示真实业务出现时的默认优先方向；它不等于自动安装、自动接入或自动完成 Runtime 验证。

## 技术分级

技术分级描述依赖的默认地位，不意味着所有依赖都必须在空白脚手架阶段预装。

### Core

Core 是所有项目都必须具备的运行、构建和部署基础能力：

- Next.js 16、React 19、TypeScript；
- Next.js App Router；
- `react-dom` 与 `react-server-dom-webpack`，分别提供 DOM 渲染与 React Server Components 运行支持；
- Tailwind CSS v4 与 `@tailwindcss/postcss`，提供 Tailwind 与 PostCSS 构建集成；
- Vite、vinext、`@vitejs/plugin-react`、`@vitejs/plugin-rsc` 与 `@cloudflare/vite-plugin`，共同提供 React、React Server Components、Vite 与 Cloudflare 集成；
- Cloudflare Workers、`@vinext/cloudflare`、`cf` CLI；
- Node.js、`pnpm` 与 `pnpm-lock.yaml`。

i18n 也是业务页面开始前必须建立的 Core 能力；在未完成 i18n 方案验证与接入前，不得开始正式用户可见业务页面开发。

上述基础运行与构建包存在兼容性关联，不得脱离整条基础链路随意单独升级。

### Baseline

Baseline 是公司 DApp 的默认技术选择。它们在相应业务真实出现时优先采用，但不为了让 starter 看起来完整而预装：

i18n 的能力分级属于 Core；`next-i18next`、`i18next` 与 `react-i18next` 是实现该 Core 能力的 Baseline 方案。

- Authentication / wallet：Privy；
- EVM：Wagmi、Viem；
- Solana：`@solana/kit`，仅在存在 Solana 业务时安装；
- Client-managed Server State：TanStack Query；
- Client State：Zustand；
- 高精度业务十进制：`bignumber.js`；
- i18n：`next-i18next`、`i18next`、`react-i18next`；
- UI 基础能力：Radix Primitives、`lucide-react`、`class-variance-authority`、`clsx`、`tailwind-merge`；
- Toast：`sonner`；
- H5 调试：`vConsole`。

### Optional

Optional 只在明确业务需求出现后安装：

- 动画：`motion`；
- 图表：`recharts`；
- 特定链、协议或第三方 SDK；
- 仅某个 Domain、Feature 或项目需要的依赖。

Optional 依赖不因旧项目中曾经使用、某个产品可能使用或“以后可能复用”而预装。

## Runtime、Framework 与部署

项目正式采用 Next.js 16、React 19、TypeScript、Next.js App Router、Tailwind CSS v4、vinext、Vite、Cloudflare Workers 和 `pnpm`。

Node.js 是本地开发与构建 Runtime。starter 必须在实际 package、CI 与 Runtime 条件明确后声明受支持的 Node.js 版本，避免开发环境与 CI 使用不可控版本。

部署后的生产执行 Runtime 是 Cloudflare Workers，而不是完整 Node.js Runtime。Cloudflare Workers 即使提供 Node.js compatibility，也不等价于完整 Node.js Runtime：部分 Node.js API 可能仅部分支持、通过兼容实现提供，或存在 Runtime 行为差异。新增任何会运行在 Server / Worker 侧的 npm dependency，都必须验证 Cloudflare Workers Runtime compatibility；不得仅因依赖可在本地 Node.js 运行，就认定它可在生产 Worker 中运行。

具体 compatibility date、flags 和 Workers 配置由 `docs/cloudflare.md` 定义。本文仅规定 Runtime 边界，不将任何具体 compatibility flag 锁定为永久前提。

Cloudflare 的部署目标为 Cloudflare Workers，不采用 Cloudflare Pages。`vite.config.ts`、`cloudflare.config.ts` 与 `cf` CLI 构成既定部署链路；其实际配置必须以仓库文件为准。

不得因为传统 Next.js 项目习惯自行引入：

- webpack-first 构建；
- `--webpack`；
- 旧 Cloudflare Pages 架构；
- 不必要的 Wrangler legacy 配置。

若未来 vinext 或 Cloudflare 的官方集成方式发生变化，必须重新评估后再调整。不得直接复制旧项目的构建、部署或兼容配置。

Cloudflare 将 vinext 标记为 beta；它是 Next.js App Router、Vite 与 Cloudflare Workers 基础链路中的关键组件。具体 package 版本与 prerelease 状态必须以实际 package 和 lockfile 为准。

Next.js、React、`react-dom`、`react-server-dom-webpack`、vinext、Vite、`@vitejs/plugin-react`、`@vitejs/plugin-rsc`、`@cloudflare/vite-plugin` 与 `@vinext/cloudflare` 是兼容性敏感的基础运行链。升级其中任一项前，必须作为整体兼容链评估；升级后必须重新验证 `dev`、`build`、Workers test deploy，以及项目实际使用的 Next.js / App Router 功能。不得无理由单独漂移。

## Authentication 与 Wallet

默认 Authentication / wallet 方案为 Privy。

Privy 负责：

- Authentication；
- Embedded Wallet；
- External Wallet connection；
- 用户认证 session；
- wallet session 与 wallet facts。

Privy 是认证与钱包事实的 source of truth。不得为了方便，将 `isLoggedIn`、wallet session 或 Privy user 复制为另一套 Zustand 权威状态。

业务用户资料和公司后端用户体系可以在 Privy 登录完成后通过 API 获取，但它们必须与 Privy Authentication Facts 分离。

## EVM

EVM 默认采用 Wagmi 与 Viem。

Wagmi 负责 React 层能力：

- wallet / account state；
- React hooks；
- chain state；
- contract read/write integration；
- transaction 相关 React integration。

Viem 负责底层 EVM 能力：

- client 与 RPC；
- ABI；
- encoding / decoding；
- contract primitives；
- address utilities；
- `parseUnits`、`formatUnits`、`parseEther`、`formatEther`。

默认不安装 `ethers`。不得形成 Wagmi、Viem、Ethers 三套重叠 EVM 技术栈。

仅在以下情况允许增加 `ethers`：

- 第三方 SDK 明确依赖；
- legacy integration 无法合理迁移；
- Wagmi / Viem 存在明确且真实的能力缺口。

引入前必须说明 Viem 无法解决的原因、`ethers` 的明确使用范围，以及是否会形成长期重复技术栈。

## Solana

Solana 默认方案为 `@solana/kit`。它负责通用 Solana client、RPC、transaction 等基础能力；没有 Solana 业务时不需要安装。不得默认安装 `@solana/web3.js`、Solana wallet-adapter、`@coral-xyz/anchor`、Meteora SDK 或其他历史 Solana SDK。

只有真实业务或第三方 SDK 存在明确兼容性要求时，才允许引入兼容依赖。引入时必须说明：

- `@solana/kit` 无法独立完成的原因；
- 兼容依赖的使用范围；
- 它属于基础模板能力还是单项目业务依赖。

不得因为旧项目曾使用某个 Solana SDK 而自动复制。

项目采用 React 与 Privy，但不将 `@solana/react` 作为固定依赖。只有未来真实 React-side Solana integration 超出 Privy 与 `@solana/kit` 已提供的能力时，才评估 `@solana/react` 或其他兼容层，并按新增依赖规则处理。

## 状态管理

### Client-managed Server State

TanStack Query 是 Client-managed Server State 的默认方案，用于需要 Client cache、refetch、mutation、invalidation、stale / fresh lifecycle 或多个 Client consumer 共享生命周期的 API remote state。它负责相应的 cache、loading state、error state 与 mutation lifecycle。

仅服务于 Server Component / route render 的 Remote Data，不因来自 API 就必须进入 TanStack Query。`/user/me`、token list、token detail、swap quote、transaction history 与其他后端 API 数据，只有在需要 Client-managed lifecycle 时才属于 TanStack Query 的管理范围；不得为了方便将这些 Server State 再复制到 Zustand。

Web3 remote state 的具体 Query / cache owner 由 `docs/web3.md` 决定。状态 owner、Server-only Remote Data 与 Client-managed Server State 的详细边界遵守 `docs/state-management.md`。

### Client State

默认使用 Zustand 存放真正的 Client State、Business State、跨组件共享状态和跨路由共享状态。

Zustand 不用于：

- Privy 已拥有的认证事实；
- TanStack Query 已拥有的 Server State；
- 页面局部 form state；
- 临时 Modal 状态；
- 单个组件内部交互状态。

局部状态优先使用 React local state。具体状态归属必须继续遵守 `docs/architecture.md`，不得建立不断增长的全局巨型 Store。

## 数值与精度

### 链上整数与 raw amount

链上整数、raw amount、contract integer、wei 与链上整数参数使用 JavaScript `bigint`；EVM 的 decimals conversion 使用 Viem 的 `parseUnits`、`formatUnits`、`parseEther`、`formatEther`。不为统一展示工具而将合约读写改为 BigNumber 对象。

不得使用 `Number(rawValue)`、`parseFloat(rawValue)` 或 `10 ** decimals` 进行价值敏感的链上金额计算。

### 高精度业务十进制

统一使用 `bignumber.js` 处理 `price × amount`、USD value、percentage、ratio、PnL、积分等十进制业务计算，以及金额展示的截取、补位、千分位与舍入。这里的 BigNumber 指 `bignumber.js`，不是其他 SDK 的同名整数类型。

不得无理由同时引入多个 BigNumber、Decimal 或 BN 类库。

### 输入与精度边界

- API 金额优先使用十进制字符串；链上原始整数保留 `bigint`。传入 `bignumber.js` 时使用原始十进制字符串，或原始 `bigint.toString()`，不得先经过 `Number`、`parseFloat` 或浮点运算。
- 后端 JSON number 若在解析时已经丢失精度，BigNumber 无法恢复。需要精确表示的大数和小数应由后端返回字符串；不可恢复的数据不得伪装成精确金额。
- 字段单位和 decimals 必须由合约或 API Contract 确认，不能因数值大小推断倍率。BigNumber 不替代输入格式、有效范围、正负值及非有限值校验。
- 除法等可能产生无限小数的运算须显式配置计算精度和舍入模式。配置使用独立构造器（如 `BigNumber.clone`）或操作参数，不允许某个 Feature 修改全局配置影响其他调用方。
- 转回合约整数前，必须检查小数位与范围；不得依赖工具的默认舍入静默改变交易金额。

### 展示格式

展示使用 `bignumber.js` 的 `toFixed`、`toFormat` 等能力，并显式指定舍入模式；例如正数向下截取使用 `BigNumber.ROUND_DOWN`。该模式对负数是向零截取，不等于数学上的向负无穷取整，涉及负数时必须按业务语义选择。

原始金额、计算结果与展示字符串分离。截断、千分位或 compact 后的展示值不得参与后续计算或作为交易提交值；输入草稿继续保留字符串，以支持清空及末尾小数点等编辑状态。

具体显示几位、是否补零、千分位分隔符、小额阈值及 compact 策略属于项目视觉与业务规则，记录在 `docs/project/design-system.md` 或对应项目文档，不在全局工程规范中锁定。

业务无关且确有跨 Feature 复用的格式化能力属于 `shared/lib/number`；Token decimals 等带领域含义的处理属于 `domains/token/lib`；具体业务计算属于对应 Feature。遵守架构的实际复用要求，不为本规则预建模块。

此规则明确统一方向，不代表依赖已安装或现有实现已迁移。新增依赖仍遵守本文的依赖与 Runtime 检查；已有金额处理在获授权的改动范围内逐步迁移，不能仅因更新规则就自动重写合约或交易流程。

## i18n

多语言属于业务页面开发前必须建立的基础能力。默认方向为 `next-i18next`、`i18next` 与 `react-i18next`，并须适配 Next.js App Router、Server Component、Client Component、vinext 与 Cloudflare Workers。

用户可见产品文案不得散落为业务组件中的硬编码字符串。语言资源、SSR / Client 策略与目录结构由后续 i18n 专项规范确定。

`next-i18next` 是当前首选 i18n 实现方向。正式纳入 starter 并锁定为默认实现之前，必须完成与 vinext、Cloudflare Workers 的最小集成验证，覆盖 `dev`、`build` 与 Workers 测试部署；验证失败时重新评估方案，不得直接作为默认实现继续开发。

## UI 与 Design System

项目采用 Figma-driven 自有 Design System，不使用完整 UI Component Framework 决定产品视觉。

Radix Primitives 是 Baseline UI 基础技术方案，负责 accessibility 与交互 primitive behavior；视觉样式仍由 Tailwind、Design Tokens 与 Figma 决定。具体 primitive 只按真实 Design System 与组件需求使用，不得因为未来可能需要而提前创建或引入大量组件。采用统一 `radix-ui` package 或独立 primitive packages 的具体方式由 `docs/design-system.md` 决定。

默认图标库为 `lucide-react`，仅用于通用 UI icon。它不得替代品牌 Logo、Token Icon、Chain Icon、产品专属图形或 Figma 专属视觉资产。

默认使用 `class-variance-authority`、`clsx` 与 `tailwind-merge` 构建自有 UI primitives 与 variants。

## 交互反馈、动画、图表与调试

### Toast

默认 Toast 方案为 `sonner`。业务代码不得无限散落对底层 Sonner API 的直接调用；后续必须建立统一的应用级 Toast / Error feedback 入口，用于 API error、Web3 error、transaction error 与业务校验反馈。

### Animation

默认动画库为 `motion`。hover、color、opacity 与 basic transition 优先使用 CSS / Tailwind；仅在 enter / exit、layout animation、gestures 或 complex transitions 等真实需求出现时使用 Motion。

不得同时安装 `motion` 与 `framer-motion`。

### Charts

默认图表库为 `recharts`，适用于 line chart、area chart、bar chart、普通 DApp 数据趋势和 dashboard visualization。

professional candlestick、TradingView-like chart、complex zoom 或 realtime high-frequency market visualization 等需求出现后，才评估专用图表库。不得为可能出现的高级图表提前增加依赖。

### Mobile / H5 Debug

默认使用 `vConsole` 进行真实移动设备、wallet WebView 与 H5 调试。它必须通过环境配置控制，可用于 development、staging 或 internal debug；Production 面向普通用户时默认关闭，不得永久开启。

## HTTP 与 Server-side Data

默认 HTTP 方案为 Web Fetch API，不默认安装 `axios`。若需求只是 request、JSON、headers 与 error handling，不得因个人习惯引入 Axios。HTTP transport 的统一封装位置遵守 `shared/api`。

starter 定位为 API-first DApp frontend，不安装 Prisma，也禁止 `Browser -> Database`。

未来确实存在 Server-side CRUD 时，数据访问必须采用：

```text
Browser
    ↓
Next Route Handler / Server Action / Server Layer
    ↓
Server Data Layer
    ↓
Prisma / Database
```

可以为未来 Server-side Data Layer 留出扩展空间，但不得为了可能使用数据库而预装 Prisma。

## 非默认技术与旧项目继承原则

以下技术不是 starter 默认依赖：

- `ethers`；
- Redux；
- `axios`；
- Prisma；
- React Vant；
- Sass；
- Three.js；
- Visx；
- `html2canvas`；
- `confetti`；
- `@solana/web3.js`；
- Solana wallet-adapter；
- Anchor；
- Meteora SDK。

这些技术并非永久禁止；真实业务需要时可按依赖新增规则评估。

不得因为 `wu-website`、`bar-website` 或 `jager-website` 中存在某个依赖，就自动复制到 starter。旧项目用于提炼生产需求、理解真实 DApp 场景和继承经过验证的工程思想，不用于复制历史 `package.json`、兼容层、重复技术栈或临时 workaround。

## 新增依赖规则

新增任何 npm dependency 前，必须回答：

1. 它解决什么明确问题？
2. 当前技术栈是否已经覆盖？
3. 是否与现有依赖职责重叠？
4. 为什么现有方案无法合理解决？
5. 它属于 Core、Baseline、Optional、Domain 专属、Feature 专属还是当前项目专属依赖？
6. 是否支持当前 Next.js、React、Vite、vinext 与 Cloudflare Workers？
7. 是否会影响 bundle size？
8. 是否会影响 Client / Server boundary？
9. 是否值得长期进入公司 starter？
10. 是否存在更小或更稳定的方案？

若现有技术栈已经能够合理解决问题，不得因个人偏好、熟悉程度、旧项目习惯或“以后可能会用”增加功能重叠的替代依赖。

### dependency build-script 审批

dependency 的 install、postinstall 或 build script 属于供应链与构建安全边界。新增依赖若要求执行 dependency build script，必须先说明其必要性。

仅允许最小范围批准确实需要运行脚本的 package；不得为了消除 install warning 而批量允许未知 package 执行脚本。`allowBuilds` 等审批配置必须与真实依赖保持一致，并纳入代码审查。

## 版本与包管理原则

基础技术栈验证完成后，starter 的直接基础依赖不得继续使用 `latest` 或 `beta` tag 作为长期版本声明，应改为明确、可审查的具体版本或经过明确决策的版本范围。prerelease 包即使仍处于 beta，也必须锁定具体 beta 版本，而不是长期跟随 `beta` tag。

`pnpm-lock.yaml` 必须提交，`pnpm` 是唯一包管理器。前文定义的兼容性敏感基础运行链升级必须经过 `dev`、`build` 与 Workers 测试部署验证，并作为整体兼容链评估。

不得同时维护 `package-lock.json`、`yarn.lock` 与 `pnpm-lock.yaml`。基础技术栈全部验证通过后，再统一决定最终的版本 pinning 策略。

版本变更必须作为明确任务处理，不得在无关实现中顺手改写。

## 文档边界

`docs/tech-stack.md` 仅负责技术选择、技术职责、技术边界、默认 / 可选技术和依赖新增原则。

以下内容由其他专项规范定义：

- 目录架构：`docs/architecture.md`；
- React 编码规则：`docs/frontend-rules.md`；
- API 设计：`docs/api.md`；
- 状态细节：`docs/state-management.md`；
- Web3 具体实现：`docs/web3.md`；
- Design System 细节：`docs/design-system.md`；
- Figma 工作流：`docs/figma-workflow.md`；
- Cloudflare 细节：`docs/cloudflare.md`；
- QA / 测试：`docs/qa.md`。

以下待决项不在本文选择具体依赖，由专项规范处理：

- 测试框架、Workers integration test 与 mock strategy：`docs/qa.md`；
- `imagesOptimizer()`、远程图片、图片缓存与 Cloudflare Images：`docs/cloudflare.md`、`docs/design-system.md`；
- 环境变量、Secrets、Bindings 与 Client / Worker config boundary：`docs/cloudflare.md`、`docs/api.md`；
- Production observability、logging 与 error tracking：`docs/cloudflare.md`、`docs/qa.md`。
