# M10 — Current Result Round Winners

## Human-confirmed behavior

- 当前开奖这一轮的中奖账户，非所有参与者、非自行计算的上一轮。只在链上verified randomnessFulfilled结果阶段请求/渲染；round_id直接来自当前result snapshot，不做+1/-1。
- `POST /ori/round_winners/round`（现有transport自动加/v1）；round_id为exact十进制string，winner_address为当前ready账户（无账户留空，获取全部）。query identity包含97/deployment/backend/result round/viewer。
- 按backend data.list原顺序逐行展示，不排序、过滤、聚合或本人置顶。只有第一行winner_address与当前账户相等（case-insensitive）才显示「你」/You、白字、下方1px dashed #303135。后面出现本人仍展示地址。
- ore_reward>0显示ORI数量及+；总是显示eth_reward的BNB。两个API字段均为人工确认8位缩放整数，截断最多6位小数（ROUND_DOWN），去尾零。不能与链上18位wei/ORI amount混用；raw/exact保留，绝不经Number/parseFloat换算。
- 空列表整区不渲染，包括标题。unknown/loading/error也不保留旧名单或假rows；Query仍区分这些状态。标题「矿工」，右侧「回合: #roundId」。
- 每10秒读取一次；通过TanStack Query route observer，仅结果阶段/可见页面运行；后台暂停，focus/reconnect恢复读取，不新建全局轮询器。

## Implementation

- `api/mine-winners.ts`：unknown boundary→typed display；地址/round一致性、正整数字符串/safe integer校验；非安全number/decimal/missing amount拒绝整份响应，不静默丢行/补零。未使用的log_unique_id不成为row identity。
- `read/mine-winners-query.ts` / `use-mine-winners`：canonical winners Query；existing board决定当前result round，账户只影响viewer请求与You。新round/账户独立key，无placeholderData；consumed AbortSignal阻止旧请求结算，新账户不显示旧viewer数据。
- 没有已验证的backend唯一row ID，使用round+address+该地址出现次数生成key，保留重复地址和服务端顺序，不依赖全局数组index或不安全JSON ID。
- `MineReadPage`组合列表与已有board/Manual/Auto/Rewards；top Refresh接入此owner，无交易/realtime/参与名单fallback。
- `MineResults`继续Feature-local semantic table，列名仅screen-reader可见，滚动区键盘focus，数值title保留exact；普通行完整地址title、缩写文本。
- 未新增dependency/store/Provider/env或Shared primitive，不导入旧Rank/旧CSS/ethers/BigNumber/auth store。

## Figma parity / approved overrides

使用figma-design-to-code重新扫描page2003:178全Mine frames与states；Miners唯一列表结构位于frame182 / group508，直接节点509–583及当前token层3220–3238；context完整读取182/508。另核对1152，证实它是frame4结果board，不是第二个Miners列表。

| Property          | Figma / implementation                                           |
| ----------------- | ---------------------------------------------------------------- |
| Title510          | 20px/500/23px white                                              |
| Round509          | 12px/500/14px #868789                                            |
| Row512等          | 347×30 at375，explicit #0D0F13 surface                           |
| Address517等      | 12px/400/14px #868789；首行You白字与1px dashed #303135为人工覆盖 |
| Amount516/579/582 | 12px/400/14px white，token/text gap4px；separator580 #868789     |
| Icon3220/3238/583 | 14×14                                                            |
| Header/list gap   | 12px；10行300px后区域内滚动，全部rows保留DOM                     |

当前Figma3220仍为SOL占位，按已签收BSC/BNB映射复用`/ori/mine/reward-bnb.svg`；不导入SOL。ORI583当前下载的原始资源sha256与existing `/ori/explore/ori-token.png`完全相同，直接复用，无新增重复资产。正常main H5全宽、PC500居中；长amount可换行，不能以unsafe Number或截断整数隐藏overflow。

## API differences / runtime QA

正式reference把winners/started示例内容错位，仍保留Q-11全局差异。此M10由当前人工确认path/fields/8位单位/顺序，不再因旧OPEN或示例名推断阻塞，不交换URL、不读取bet_amount替代payout。不改原始reference文本。

只读97验证：block139589820，当前stored round1655尚未randomnessFulfilled，正式query disabled且整区隐藏。额外对先前已登记1654读取合约确认fulfilled并做单次API诊断，返回round_id/total/list:[]/reset_event，mapper判empty；该历史诊断不成为正式route round owner。

**M10 NON-EMPTY WINNERS QA = RUNTIME QA PENDING**。空API/隔离fixture不冒充非空真实记录验证；若未来nonempty结构/unsafe amount与mapper不符，保持error/隐藏而非造数据，再报告具体compatibility问题。Production56独立Release Gate。M4 execution deduction、M9 live result、M5 nonzero read、Rewards real Claim此前pending均不升级。

## QA

测试覆盖8位/6位截断与大整数、tiny positive ORI仍显示、仅BNB、first-row-only You、重复地址/backend order、round mismatch/invalid address/missing/unsafe amount、empty整区隐藏、query10秒/后台暂停、offstage fail closed、可选viewer、account/round/backend隔离、旧请求取消。

浏览器375/1000（main500居中）：20行/scroll300、row30、标题20/23/500、address12/14/400、You白色及1px dashed rgb(48,49,53)、背景rgb(13,15,19)、icons14、HarmonyOS、无overflow；10秒刷新、offstage停刷、viewer/断开/错误恢复、中文与keyboard PASS。fixture只在/tmp，不进入正式route或commit。

最终全仓七项QA PASS，60 files / 746 tests（含并行收尾的Claim与freshness）。稳定代码下重新browser全状态/10秒计数/离开result停止/账号与错误恢复/375和main500/中文/keyboard均PASS，无pageerror；未把fixture称为非空真实API记录。
