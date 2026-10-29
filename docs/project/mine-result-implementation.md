# M9 — Mine result presentation / countdown policy

## 当前范围

Fast Autonomous Development Mode下自主完成M9已确定的只读结果UI和动画。当前人工已锁定倒计时：**继续Waiting / —，等待后端提供deadline**。不换算区块为秒，不展示估算倒计时，不用本地60秒决定round或submit eligibility；产品显示选择已CLOSED，未来deadline字段仍待backend。

M4已形成独立本地checkpoint `cba3635`；Auto execution fee deduction仍RUNTIME QA PENDING，不重复调查已closed产品规则。

## Source / technical owner

- 本轮重新读取ORI-AI测试完整frame `2003:1038`及直接结果节点/标注：1405–1408、1122（中奖单格）、1133（未中奖）、1152（完整终局棋盘）。原完整Mine七稿inventory继续适用；这里只修改结果范围，无新资产。
- 原Mine public Query继续是canonical owner：chain97 + Protocol/View部署 +实际stored round，所有contract reads pin到同一block。新增返回startBlock/endBlock与**仅在randomnessFulfilled=true时有效**的winningSquare，合法index0–24，否则fail closed。
- winningSquare来自View.getRoundData，不依赖winners API、前端随机、旧round+1或realtime payload。动画只存派生UI进度，不复制canonical round state到全局store。
- Initial fulfilled snapshot显示静态终局；观察到同一round从未fulfilled到fulfilled时播放一次。重复刷新不重播，真正的新round优先于旧动画；较旧round不覆盖新round。

## Visual sequence / engineering decisions

1. 排除已确认winningSquare后，将24个losers随机排序；随机源只影响淡出顺序，不能决定winner。
2. 每150ms开始一个格子的opacity100%→25%，24步3.6s。
3. 中奖格颜色150ms变为金色边框/暗金底，保持10s；之后保留已确认静态终局，直到真正的新round到来，不制造下一轮或改变交易资格。
4. Winner：3px #EFC462 border、#23211C background、radius8；lost采用既有Mine Cell视觉的25% opacity。结果覆盖层保留已有金额/本地草稿owner，不把中奖格等同本人已获得/可领取奖励。
5. 尊重prefers-reduced-motion，直接显示静态终局。后台/离页清理timer，恢复不从旧动画中途重新开奖；无focus移动。逐轮结果使用aria-live状态，不逐个loser播报。

以上计时/去重/清理/无障碍属于工程实现选择；没有给协议新增waiting/live枚举，没有根据动画计时解除Manual单轮一次或active Auto互斥，没有签名/交易、polling或realtime。查询/账户/错链状态仍由原owner管理；公共结果不受account切换污染。

## Code ownership

- read/mine-read-query：验证并输出fulfilled winner。
- result/mine-result：Feature-local可测试动画controller，最多一个timer，无请求循环。
- result/use-mine-result：React effect生命周期、reduced motion/visibility、同步scope保护。
- MinePage/MineCell/CSS/locale：结果visual覆盖和可访问文案；保持App Shell/375/500与当前字体。
- 不增加Shared primitive、Domain、Provider、依赖或环境变量。

## QA / runtime boundary

自动测试：24个losers无重复/不含winner；150ms×24、150ms、10s边界；重复结果去重、initial fulfilled静态显示、新/旧round隔离、reduced motion/后台/离页timer清理、unavailable恢复、fulfilled gate与非法winningSquare。

真实live-round的结果到达/换轮仍可能暂不可取得；按新模式记**M9 LIVE RESULT TRANSITION = RUNTIME QA PENDING**，不影响已完成的只读实现。不将fake timers或隔离browser fixture称为真实链开奖验证。未来backend deadline接入是新数据能力，不在本轮补默认值。

## 本次验收记录

自动检查覆盖全仓52 test files / 653 tests（含最新M4非对称交互补充与M9）。typecheck/lint/format/diff检查通过；env与build按当前scope验证，最终命令结果见交付。375 / 1000浏览器main500居中：胜格computed 3px border、rgb(239,196,98)、rgb(35,33,28)、radius8；败格opacity0.25；HarmonyOS Sans SC，无overflow。浏览器验证逐步淡出/揭晓、新round取消、reduced motion即时终局、error恢复不重播、focus不移动、长页Bottom Nav空间及正式/mine无runtime exception。fixture无RPC/signer且不进入仓库；真实live transition仅RUNTIME QA PENDING。

最新人工补充已先完成M4 audit/修正，再恢复此M9收尾；遵守本轮no commit/push/sign/broadcast，当前M9与M4补充均保留为未提交修改。
