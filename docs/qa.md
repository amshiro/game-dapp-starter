# QA 与 Validation 工程规范

## 目标与适用范围
本文为 `game-dapp-starter` 定义长期 QA 与 Validation 规则。
目标是依据改动范围、Runtime 边界、业务影响和回归风险选择足够的验证，并如实报告证据与剩余风险。
本文不是 Vitest、Playwright、CI、Cloudflare 或 Web3 的使用教程，也不锁定测试框架、CI 平台、覆盖率阈值或固定 command。
本文定义如何证明专项规则被满足；实现语义仍以专项文档为准。
执行 validation 前必须检查当前仓库真实存在的 `package.json` scripts、依赖、config、测试基础设施与目标环境。
不得根据本文假设某个 command、工具、CI 或测试环境已经存在。
```text
docs → 规定应该怎样验证
source / package / config / CI → 描述当前实际能如何验证
```

## Validation Philosophy
每项实现应沿以下顺序考虑验证证据：
```text
implementation → static validation → build / runtime validation
→ behavioral validation → visual / responsive validation
→ domain-specific validation → truthful report
```
这是风险思考顺序，不是每次改动都必须机械执行全部层级。
```text
build passed ≠ task complete
screenshot looks correct ≠ behavior correct
mock passed ≠ real integration validated
```
```text
validation level ≈ changed surface + runtime risk + business impact + regression risk
```
不得因任务很小而跳过必要验证，也不得对所有任务强制全量 E2E。

## Risk-based Validation
开始前，Codex 应识别：
- 改动涉及文档、纯逻辑、UI、API、State、Web3、Cloudflare，还是多个领域；
- 是否跨越 Server、Client、Worker、钱包、链或外部服务边界；
- 是否影响资产、认证、身份、精度、缓存、交易、生产运行或共享基础能力；
- 当前自动化能力、人工验证需要和无法执行的检查。
典型推论：
```text
docs change ≠ full E2E
pure utility ≠ visual regression
UI change ≠ only type validation
Web3 transaction workflow ≠ only screenshot
Cloudflare runtime change ≠ only local build
```
跨领域任务必须组合相关验证，不能只选择一个主要类别。

## Validation Layers

### Static
Static Validation 包括 TypeScript、lint、format、import/config consistency 和 diff hygiene。
它们覆盖不同问题，不能互相替代；只能执行当前仓库真实存在且适用的 command。
仓库没有独立 typecheck、lint 或 format command 时，不得报告对应检查已经通过。
`git diff --check` 是基础 diff hygiene，但不等于 TypeScript、lint、测试或 Runtime 验证。
新的 TypeScript error 不能作为可接受完成状态。
不得为通过检查随意引入 `any`、`@ts-ignore`、`@ts-expect-error` 或其他掩盖真实问题的做法。
若失败确认在本次任务前已存在且无关，应保留事实并报告，不得顺手修复整个项目。
当前仓库存在 lint 或 format 时，应执行与改动范围匹配的检查，并区分：
```text
current-change failure ≠ pre-existing unrelated failure
```

### Build
Build 用于验证 framework build、bundling、编译期集成和部分 config 组合。
涉及 Next.js、App Router、Server Component、routing、dependency、config、Tailwind 或 Cloudflare 等结构性改动时，通常应根据当前 scripts 执行真实 build。
```text
build success ≠ runtime correctness
```
Build 不能单独证明目标路由可访问、Client hydration 正确、API 合约正确、钱包流程可靠或视觉符合设计。

### Runtime
改动影响 Runtime 行为时，build 不足以构成完成证据。
按任务实际验证 application starts、target route reachable、critical interaction、runtime exception、hydration error 和 repeated request loop。
具体使用 dev、preview、测试环境或其他手段，取决于当前仓库能力、风险和授权范围。
明显的 hydration error、uncaught exception、React warning、错误环境请求或重复请求循环，不能因页面“看起来能用”而忽略。

### Behavioral
Behavioral Validation 关注用户可观察行为、状态转换、错误路径和 Feature workflow。
测试优先验证 observable behavior、contract 和 business rule，而不是 private function、内部 Hook 顺序或 implementation-specific DOM tree。
测试应允许纯重构而不改变业务行为时保持稳定。

### Visual / Responsive
Visual Validation 验证 layout、spacing、typography、color、radius、border、shadow、asset、responsive、interaction state、overflow 与 long content。
先确认结构、层级和响应式布局，再调整精确视觉值。
不得把视觉偏差直接处理为无依据的 margin、transform 或 magic-pixel 补丁。

### Domain-specific
API、Web3、Cloudflare、i18n、State 和 accessibility 都有普通 build 或 screenshot 无法证明的风险。
涉及这些领域时必须补充相应专项验证。

## Testing Strategy

### Unit Test
适合 Unit Test 的内容包括 pure mapping、validation、precision logic、formatter、query identity、state transition 与 domain rule。
不应仅为 coverage 测试 simple Tailwind wrapper、trivial JSX 或 pure visual markup。
Unit Test 应以稳定输入、明确输出和真实边界为主。

### Integration Test
风险来自多个模块组合时，Integration Test 通常优于大量彼此隔离的 mock Unit Test。
常见组合为 `Feature + Query`、`Feature + API mapping`、`Provider + UI state`、`Web3 workflow + context`。
不得为追求“单元测试纯度”而将真实集成关系全部 mock 掉。

### E2E
E2E 优先覆盖真实项目的关键用户旅程、高风险 workflow 和跨边界行为。
未来业务可以覆盖登录、钱包连接、Swap、创建、领取或交易流程；starter 不应预建虚构业务 E2E。
E2E 范围取决于真实产品、环境安全性和稳定性。

### Regression Test
修复真实 bug 时，应优先留下贴近根因的 regression protection。
precision bug、race condition、query identity、account / chain context 与 API mapping bug，尤其不应只依赖最终页面文字作为回归证据。

### Snapshot 与 Coverage
Snapshot 不是默认测试策略；不得以巨大的 DOM snapshot 作为主要质量保障。
若使用 snapshot，应只覆盖稳定且适合以输出形态回归的内容。
```text
100% coverage ≠ QA goal
```
Coverage 仅是辅助指标；关键行为、高风险逻辑和易回归路径是否被验证更重要。

## API、State 与 Web3 QA

### API
API integration 应结合 `docs/api.md` 按风险验证：
```text
request URL / method / headers / Content-Type / query / body
DTO mapping / success / empty / non-JSON response
auth boundary / error normalization / abort / retry semantics
```
Frontend QA 不负责重测 Backend 内部业务实现，但必须验证前端是否遵守真实 Backend Contract。
Mock 或 fixture 应来自真实 Contract、已确认的有效示例或明确 schema。
不得编造完美响应后，将前端通过误称为真实 API integration 已验证。

### State
高风险状态逻辑应结合 `docs/state-management.md` 关注：
```text
stale async result / account switch / chain switch / cleanup
persistence hydration / query invalidation / context isolation
```
```text
old context result → mutate new context
```
属于重要 regression risk。
验证应尽量靠近根因；例如 Query identity 漏掉 wallet address 时，不能只依赖页面最终文字的偶然结果。

### Web3
Web3 改动应遵守 `docs/web3.md`，并区分：
```text
pure precision logic / encoding / RPC read / simulation
wallet interaction / broadcast / receipt / backend reconciliation
```
不同层级需要不同验证；不得用 screenshot 替代交易状态、链上下文或金额精度验证。
Transaction workflow 应按实际风险考虑：
```text
user rejection / unsupported or wrong chain / switch failure
simulation failure / broadcast failure / pending / confirmed / reverted
replacement / backend reconciliation / timeout / stale account or chain context
```
不要求 starter 预先覆盖全部情形；真实存在且高风险的 workflow 必须有相称验证。

### 不可逆链上写入
```text
automated QA ≠ automatic irreversible real-chain write
```
不得将 mainnet transaction、production wallet 或真实资产移动作为普通自动测试。
真实外部副作用仍受 `AGENTS.md` 授权边界控制。

### Mock、Local、Testnet 与真实集成
报告必须明确区分：
```text
mock / fixture / local chain / testnet
real backend / real wallet / real chain integration
```
不得将 mock、local chain 或 testnet 通过夸大为生产真实集成已验证。

## UI、Figma、i18n 与 Accessibility QA

### UI 与 Figma
Shared UI 与 Feature UI 应根据真实行为验证 interaction、keyboard、focus、disabled、loading、controlled behavior 与 variant behavior。
纯视觉差异不应全部转化为脆弱的 DOM assertion；视觉正确性由 Visual QA 补充验证。
Figma 实现继续遵守 `docs/figma-workflow.md` 和 `docs/design-system.md`。
Screenshot 或 visual diff 可以证明视觉输出，但不能单独证明：
```text
behavior / data correctness / API correctness / Web3 correctness / accessibility
```
项目同时提供 PC 与 H5 时必须分别验证：
```text
Desktop passed ≠ Mobile assumed passed
```
Visual / i18n QA 应考虑长文案、长钱包地址、大额 Token 数量、错误文本、空值与 overflow，而不是只验证 Figma 理想样例。

### i18n
国际化改动应结合 `docs/i18n.md` 按实际范围验证：
```text
locale resolution / Server-Client consistency / language switch
missing translation / fallback leakage / long text
number formatting / amount input / date-timezone
plural / interpolation / accessible copy
```
具体工具与 locale / device matrix 由真实项目决定。

### Accessibility
至少检查与本次改动相关的 semantic element、keyboard、focus-visible、label、accessible name、Dialog focus management、disabled semantics 与 contrast。
```text
automated accessibility pass ≠ accessibility fully correct
```
自动工具可以辅助；本文不替代完整 accessibility 或 WCAG 指南。

## Cloudflare 与 Smoke Validation
涉及 Worker dependency、Binding、Route Handler、Runtime API、compatibility 或 server-only config 时，应遵守 `docs/cloudflare.md` 并进行与风险匹配的 Workers Runtime verification。
```text
Vite build success ≠ Cloudflare Workers runtime success
```
Smoke Verification 用于确认本次修改没有让核心路径直接失效。
它可以验证 app reachable、target route reachable、critical API reachable、basic interaction 和 runtime starts cleanly。
Starter 不预设业务 smoke path；路径必须来自当前项目实际路由和功能。
```text
Production deploy ≠ routine QA step
```
生产部署、账户选择、Secret 修改和其他外部副作用仍遵守 `AGENTS.md` 与 `docs/cloudflare.md`；QA 不授予这些权限。

## Environment、Secret 与 Determinism

### Environment Safety
测试或集成验证前必须确认实际环境：`local`、`test`、`preview`、`staging` 或 `production`。
禁止在未明确授权和未确认边界时形成：
```text
test frontend → production backend → mainnet write
```

### Secret Safety
测试不得将 private key、seed phrase、production credential、server secret 或 private token 写入 fixture、snapshot、log、screenshot、report 或 Git。
Secret 必须从安全环境注入，并继续遵守 `.env` 与 Cloudflare 配置边界。

### Determinism
自动测试应尽量保持 deterministic、repeatable、isolated。
避免无必要依赖当前墙上时间、随机公共 RPC、生产 API 或其他外部可变状态。
必须依赖真实外部环境时，最终报告必须说明依赖、环境和不确定性。

### Flaky Test
不得采用：
```text
flaky test → retry until green → declare success
```
应判断问题属于产品缺陷、竞态、测试设计还是环境不稳定。
Retry 不是根因修复，也不能替代如实报告。

## Existing Failures、Scope 与 Docs QA
运行 validation 发现失败时，应：
1. 判断是否与当前 change 相关；
2. 尽可能确认是否 pre-existing；
3. 不擅自修复整个项目的无关问题；
4. 如实报告失败、影响与剩余风险；
5. 当前 change 若引入或恶化失败，必须处理后再称完成。
QA 发现无关问题时，不应自动重构无关区域，除非它阻塞当前验证、由本次改动造成，或用户明确要求修复。
修改工程规范文档时，至少检查：
```text
facts accurate / owner clear / no conflict with other docs
no repository snapshot presented as permanent rule
paths and references correct / no duplicated responsibility
git diff --check
```
Docs-only task 不需要机械运行应用完整 E2E。

## Task-type Validation Matrix
下表是最低思考框架，不是固定 command 清单。
| 改动类型 | 通常需要考虑的验证 |
| --- | --- |
| Docs | 内容与跨文档一致性、范围检查、`git diff --check` |
| Pure TS / Utility | 类型验证、目标行为、边界输入 |
| UI | Static、Runtime、交互、PC/H5、Accessibility、必要 Visual QA |
| API | Static、mapper/error 行为、必要 Runtime 或 Integration |
| Web3 | Static、精度、workflow/simulation、需要时的安全环境集成 |
| Cloudflare | Build、Workers Runtime、Smoke |
| i18n | locale 一致性、resource/fallback、格式化、布局、Accessibility |

## Completion Gate
Codex 在声称 `done`、`completed`、`finished` 或 `implemented` 前，必须确认：
1. 当前 scope 的 implementation 已完成；
2. 已按风险选择适当 Validation；
3. 已实际运行所有报告为已运行的检查；
4. 不存在由当前 change 引入的已知 blocking failure；
5. 未运行或受阻检查已明确标记；
6. 剩余风险已如实说明；
7. 未将 mock、build 或 screenshot 夸大为更高级别验证。

## Validation Result 与 Final Report
最终报告必须明确区分：
```text
PASS / FAIL / NOT RUN / BLOCKED / NOT APPLICABLE
```
不得用 `should work`、`probably fine`、`looks good` 或 `likely passes` 替代真实结论。
最终报告至少说明：
```text
Changed / Validation run / result / Environment used
Important behavior verified / Remaining risk / External side effects
```
未运行的检查不得报告为 passed。

## Forbidden Patterns
1. `build passed → task complete`；
2. `did not run → report passed`；
3. `mock passed → real integration validated`；
4. `Desktop passed → H5 assumed passed`；
5. `screenshot matches → behavior correct`；
6. `coverage high → quality guaranteed`；
7. `flaky test → retry until green`；
8. `automated test → production mainnet write`；
9. `visual mismatch → magic-pixel patch`；
10. `new TypeScript error → any / ts-ignore suppression`；
11. `QA found unrelated issue → refactor entire repository`；
12. `production deploy → routine validation`；
13. `pre-existing failure → silently ignore`。

## 专项文档边界
本文负责 validation strategy、risk-based validation、completion criteria、test result reporting、regression policy 与 QA evidence boundary。
专项语义继续由以下文档定义：
```text
AGENTS.md → authorization / Git / deploy / external side effects
architecture.md → ownership / dependency
frontend-rules.md → frontend implementation rules
state-management.md → state correctness model
api.md → API semantics
web3.md → Web3 semantics / safety
cloudflare.md → Workers runtime / deployment
design-system.md → visual design principles
figma-workflow.md → Figma implementation SOP
i18n.md → locale / localization semantics
```

## 实施检查清单
1. Validation 是否与改动风险匹配？
2. 当前执行的 command 是否真实存在？
3. 是否出现新增 TypeScript、lint 或 format failure？
4. 本次是否需要 build 或 Runtime verification？
5. 是否验证核心行为，而不只断言 implementation detail？
6. UI 是否需要 PC、H5 和 accessibility 验证？
7. API、State 或 Web3 是否验证实际边界？
8. mock 是否被错误描述为真实 integration？
9. 是否存在不安全环境组合或生产写入风险？
10. test Secret 是否安全？
11. flaky test 是否被作为真实问题处理？
12. pre-existing failure 是否被准确区分和报告？
13. 未运行检查是否明确标记？
14. 是否已有足够证据声称任务完成？

## TBD
以下内容在 starter 实施阶段依据实际技术组合另行决定：
```text
Testing Library / DOM test environment
Playwright vs Cypress / visual diff tool / axe integration / Lighthouse
CI provider / Workers integration strategy / coverage threshold / device matrix
```
在这些决策完成前，不得将候选工具写成既成项目事实。

Phase 1 已选择 ESLint flat config（Next.js / TypeScript presets）、Prettier 与
Node 环境 Vitest。实际命令、范围及上游兼容性限制见根目录 `README.md` 和工具配置；
这些检查不等于 React、Workers Runtime 或业务集成已经验证。
