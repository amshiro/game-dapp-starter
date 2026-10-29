# About + Points — Full Page State Inventory

## 当前 Points 数据（User Confirmed）

正式 `/points` 已替换静态演示，复用当前钱包 identity 与 ORI transport，在 Development 97 下按账户和 API base 隔离 TanStack Query。读取 `/v1/ori/points/user` 的 `total_points` 与 `/v1/ori/points/list` 的真实记录；列表按当前页读取，每页20条，总数超过20才显示分页（User Confirmed），切页使用区域内圆环 Spinner；成功空记录显示“暂无数据”，失败显示读取错误。未连接/加载/失败不使用演示数据；已成功返回空账户显示0积分和空记录。业务错误不会转换成成功的零积分。`points/user` 失败时可用同一账户的列表响应 `user_points.total_points`；两个来源均不可用显示 `—`。Development 实查 `points/list` 空记录成功，`points/user` 返回业务500（后端查询引用不存在的 points_reward 列），需后端修复；前端不展示后端内部错误文本。

用户确认：`bet_amount` 为 wei（允许数据库 `.000...` 尾缀，拒绝非零小数 wei），按18位转完整 BNB，不截断或使用小额阈值；`total_points` / `points_reward` 是积分原值，不做倍率换算。我的积分使用千分位，获得积分向下截取并补足2位小数。美元价值暂无字段，保留原列显示 `—`，不按积分反推美元。日期使用接口 timestamp，按当前语言及浏览器时区显示。大数保留字符串/BigInt；拒绝不安全 JSON number，后端应以字符串返回精确大数。


原静态演示交付与 Figma 取证如下，仅作为历史记录，不代表当前 Points runtime。

## 原交付边界

本轮只交付正式 `/about`、`/points` 的完整工程演示 UI，已通过人工审核；不做 M7 polling、realtime、交易、积分 API 或新钱包能力。用户明确允许 About 从当前旧源码恢复 copy，Points 在没有匹配新版数据 owner 时使用 Figma demo。此例外不改变其他 Feature 的 source priority。

About Accordion 的 240ms expand/collapse、180ms content fade、arrow transition 均为已人工验收的 **Human-approved interaction override**；不属于 blocker，不移除。

## Figma 全状态扫描

本轮通过 Figma MCP 重新扫描当前 `ORI-AI测试` 页面 `2003:178` 的全部 frame，读取下列完整 frames 的 design context / screenshot 及全部直接子节点。当前页面没有另一个 Points frame；不把其他 Mine / Wallet / Explore 稿当作 Points 状态。

| Frame / state | 模块 / 子节点 | 差异 | 正式 runtime |
| --- | --- | --- | --- |
| 11-About `2003:2235`，375×1040 | 标题2243、副标题2244；五项2245/2254/2263/2272/2281；Intro 正文2290–2292 | Intro expanded，其他收起 | 默认全收起；用户可单项展开 |
| 11-About-展开 `2003:2359`，375×1329 | 标题2421、副标题2422；五项2423/2432/2441/2450/2459；Mining 正文2367–2373 | 同页 Mining expanded，非第二页面 | 同一 Accordion；展开另一项关闭之前项 |
| 7-积分 `2003:2101`，375×812 | 标题2111、副标题2112；积分卡2113–2117 | 主页面 / My Points populated | 集中 static demo model，visible 演示标记 |
| 同 frame Records | 2121规则、2122标题；2159–2170四列表头，2123–2158六行 | Time / Stake / Value / Earn point | 六行批准的 Figma fixture，无 API、钱包或分页依赖 |
| 同 frame shared shell | Header3118，nav2171 | Points active | 复用现有 Shell / route active；不复制手机状态栏、Home indicator、画板外历史 copyright |

About 几何：14px 页面 inset、28px/700 标题、14px 副标题、24px section gap、60px 行、20px/700 行标题、1px dashed divider（4/4）、16px 已有 Figma chevron、14px/20 正文、18px/500 小标题。使用全局 HarmonyOS Sans SC，不注册 Feature 字体。Points：88px 积分卡、2px border、8px radius、40px 原始图标、24px/500 总分、20px/500 Records、12px 四列表格、38px 行高。500px 容器只拉伸可用宽度，不重排桌面列。

## About copy provenance

实际页面：`ori-website/pages/about/index.tsx`；i18n.ts 实际导入 `public/locales/en/common.json` 与 `zh/common.json`。只提取页面实际调用的 About keys：

| 当前 Figma section | 当前源码区域 | 恢复范围 |
| --- | --- | --- |
| Intro | what-is-ori | whatIsORI、oriDescription1/2 |
| Mining | mining | miningTitle、机制/规则、开奖/分配、未中奖/普通中奖/Motherlode 对应段落 |
| Staking | staking | stakingTitle、stakingDesc/Rule*/Benefit |
| Tokenomics | tokenomics | tokenomicsTitle、基础信息/回购分配/精炼费对应段落 |
| Links | 当前页面末尾 Links block | 官网 ori.supply、X refinORI、Telegram refinORI、白皮书（英文 /en、中文根路径） |

页面结构以 Figma 五项为准。旧版额外 Refinement / Origin Pool / Core Value 栏目与白皮书顶部 banner 不继承；locale 文件中未被当前页面引用的 summary/长篇 intro 等另一组文案不作为来源。仅恢复对应当前文案，不复制旧组件/布局/CSS。编号强调用 React composition 安全渲染，不注入 HTML。

当前源码同一实际页面仍有口径差异：Mining 写 1% 平台费、90% 奖池；Staking 写 6% 回购及 5/6、1/6；Tokenomics 写 10% 回购和 50/10/40、60% slippage。按用户指令保留实际文案，不自行统一，也不把 copy 当链上规则。en/zh 都保留当前实际引用版本。

## Points 旧源码搜索结果与数据边界

完整搜索 pages/components/service 的 points/point/score/credits/积分及相关调用：没有 `/points` 页面，`pages/_app.tsx` 的 prefetch 不等于页面实现。`getPointsList`、`getUserPoints` 只有 service/api.js wrapper，没有 consumer。

存在真实挂载的 `PointsRewards`（Mine 中起源未中奖奖励，originInfoData / OriginClaimCard）和 `OriPointsTable`（另一游戏分支的 getOriGameRecords）。它们不是 Figma 的 My Points / 每 USD 积分 / 四列 Records，不复用其数据、claim 或 UI。旧 Points 相关文案与现有 Figma 规则冲突继续记录 Q-20。

`features/points/data/points-demo-data.ts` 集中保存 Figma sample，display model 通过 props 可替换；纯字符串保留精度，不计算积分，不创建 store，不假装钱包账户数据。页面清楚显示 Static demo / 静态演示，表格 caption 也包含该标记。依据此前人工确认的 BSC 事实，将 Figma SOL 占位文案替换为 BNB；金额仍仅是 demo，不声称来自当前钱包。没有引入 SOL 资产。没有额外按钮、tabs、pagination 或 modal 的设计证据，因此不自行添加。

## Shared UI 与 Review 注释

About 复用 feature-local AboutAccordion。Points card/table 均只具有本 Feature 语义，不提升 Shared；没有新 Starter primitive，也没有 Resilient Image 的真实需要。必要注释放在恢复 copy owner、编号富文本处理与 static demo owner；不修改 Wallet/Modal/Mine。

## 验证

最终 QA 和浏览器结果在任务报告中列出；本轮不创建 debug route。生产积分接口、Q-20 规则、Q-41 合约费率一致性、Q-30 发布语言策略继续 OPEN。

本轮实际验证：375px、500px viewport，以及 1280px PC 内 500px main 居中（left=390）；两页 document scrollWidth 均等于 viewport width。About 五项逐项展开均只有一个 visible region，Enter/Space 与 2px accent focus 正常；中英文长文滚动到底后最后内容与 Bottom Nav 保持 24px 间距。Points 四列/六行完整，40px 图标成功加载，computed HarmonyOS Sans SC 与 400/500/700 正常；两页导航 active 正确，locale 切换后无混合 UI 文案或 console warning/error。demo 时间仍为 Figma 字面样本，没有推断年份或真实事件时间。

env:check、typecheck、lint、format:check、test、build、git diff --check 全部通过；38 files / 442 tests。build 保留已有 vinext/RSC sourcemap warnings，没有新的构建错误。无 commit/push/deploy，等已通过人工审核。

## 后续强制 Property-Level Parity 复核

本轮页面与 Wallet 已补做 [逐节点属性审计](./visual-property-audit.md)：补齐独立 surface fills、两层 Wallet backdrop blur、完整描边、文字角色和精确 divider；About 加入用户要求的双向过渡，保持单项 state 与立即 inert/aria-hidden。该报告包含 Figma / implementation / computed / result 对照和批准的差异，不能仅以本文件此前的 screenshot-level 记录代替属性验证。
