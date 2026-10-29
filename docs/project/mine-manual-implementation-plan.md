# Mine Manual — Single Deploy Product Correction

## 当前范围与状态

**后续 M3 实现更新**：本文件前半保留 Single Deploy Correction 时的暂停记录；当前已获用户正式授权恢复 Manual Core。实现与 QA 状态见文末 M3 小节，不能再将历史“未接通”当当前实现状态。

User Confirmed：**每账户每个实际 operation round 最多一次成功 Manual Deploy**。第一次可选多个格子，例如 #1 + #3 + #8，合并为一个 mask，一次调用 `deployManual(mask, amountPerSquare)`。首笔成功后保留链上 deployed visual；格子选择/取消/多选、每格金额输入和总额计算仍可用，仅最终 Manual Deploy action disabled，文案“本轮已部署”。不增加独立已部署提示。

废弃“同轮不同格、相同 amountPerSquare 可以在产品中追加”的上一版决定。**Contract capability != Product behavior**。本轮只修正规则、当前实现计划与暂停时留下的草稿防线，不完成或接通 Manual 功能，不开始 Auto/Rewards。正式 `/mine` 保持已审核的只读页面；草稿 transaction/hook 不是已完成 Feature，也不是已验收代码。

## Product rule 与 runtime evidence 分离

| 项目 | 事实 / 计划 |
| --- | --- |
| 一次多格 | 首次提交前 select/deselect/multi-select；#1–#25 对应 ABI index 0–24，mask 按 bit OR 构造 |
| 第二次 Manual | 同账户同轮存在任何已部署格即禁止，不仅禁止重叠 mask；选择完全不同的格子也不能再次 submit |
| 公共部署 | 其他账户在某格有投入不限制当前账户首次选择；不能以 public cell amount > 0 判断本人本轮已 Deploy |
| Runtime 追加能力 | 前次 Chain 97 `eth_simulateV1` 在非持久虚拟状态中验证异格同金额可继续调用；同格为 InvalidMask、异金额为 DifferentAmountPerSquareNotSupported。仅保留为技术证据，不开放 UI，不作为产品条件 |
| hasDeployedThisRound | Mine-owned account Queries：getMinerRoundInfo 的 hasParticipation / totalDeployed，与 getMinerSquares 的 mask；任一证明本轮参与即锁住第二次提交。未知读取不能当作 false |
| Query isolation | chainId、Protocol/View deployment、实际相关 roundId、account；不依赖旧 `/ori/round` 或 `user.total_amount`，不建全局 store |
| 真正新轮 | 使用新 round/account Queries 重新判断；旧 hasDeployed 不跨 round。已 fulfilled 的历史存储轮不能被当作下一 deployable round，也不能用旧轮本人 mask 永久锁住新一轮 |
| Selection visual | 断连/错链/暂不可部署时仍可纯 UI 预选，submit disabled。全选/清空入口、成功后纯视觉点击和新轮视觉保留仅按当前 Figma/最新需求确认，不从旧 UI 补齐；任何旧草稿均不得自动提交 |

## 保留的安全契约

- 仅 Development / Chain 97。地址和 ABI 归当前 Contract Registry。
- payable `deployManual(uint256 mask,uint256 amountPerSquare)`；无 roundId 参数；value 精确为每格金额 × 选中数，不额外加 1% fee。
- 输入 decimal string → parseEther → bigint；大整数不使用 Number/parseFloat。1 wei simulation 证据不是正式产品 minimum；未知 min/max 不造规则。
- 每次用户主动提交前 fresh reads、账户/链 snapshot、hasDeployedThisRound、余额含 gas、fresh simulation；发现本轮已部署直接停止，不能因合约仍可接受异格追加而绕过。
- 钱包等待期间轮次仍可能变化，合约决定最终 operation round；前端不得 storedRound + 1 或宣称绑定屏幕存储轮。此 UI 产品限制不等于跨浏览器并发的合约级一次性保证。
- receipt success + 1 confirmation 后，校验 Protocol 的 matching DeployEvent（发起账户与 intent），从事件读取 operationRound；hash != success。
- 验证成功后刷新 public board、原账户 operationRound 的 miner info/squares、native BNB balance；不要求全局 total 精确增加。
- 事件验证或 reads 刷新失败保留 chain confirmed；只允许重新验证/读取，绝不 resend。MustCheckpointPreviousRound 仅提示并刷新，不自动 checkpoint 或 deploy。

## 暂停草稿的修正计划

1. 正式 route 不挂载未完成的 Manual hook/action，保持既有只读 UI。
2. 草稿 hook 暴露 `hasDeployedThisRound`；任意本轮部署使 canSubmit=false，资料不全时 fail closed。不同 mask 不构成第二次提交许可。
3. 草稿 transaction preflight 同时 fresh fetch account info/squares，使用同一单次 Deploy policy 拒绝第二次交易，不能只做 ownMask & nextMask 的重叠检查。
4. 实际恢复开发时，UI 必须把该 flag 映射到本轮 action disabled，保留本人链上 deployed visual；成功 receipt 的 operationRound 与当前 read scope 匹配时也不得短暂重新开放第二次提交。
5. 真正换轮/account 后只更新对应 Query/draft context；新交易必须由新用户点击触发，重新 read / validate / simulate。草稿视觉保留细节不得推导为自动提交许可。
6. 补完整 transaction/receipt/context/browser QA 和人工 Testnet QA 后再讨论 checkpoint。本次规则修正不代表 Manual Slice READY。

## Mine Historical Functional Baseline

用户授权从当前 `ori-website` 恢复的 Mine 资料作为历史功能基线，可恢复 Manual/Auto 行为、round 生命周期、reward 结构、API/realtime 技术路径及 contract interaction。它不高于当前人工决定，也不替代当前 Figma 的新版 UI/layout/visual state。

不复制旧 UI/PC layout、旧 hash 即成功语义、未经验证的旧 API availability 或与新版冲突的交互。Auto/Rewards 的资料可作后续需求核对，本轮不实现。已验证 runtime selector、payable 参数、mask/value、simulation、receipt/event/refresh 安全事实保持有效。

## Requirement reconciliation — 2026-10-29

本文件前文“未完成/暂停”描述现有实现状态；[完整需求对齐](./mine-requirements-reconciliation.md) 现已完成，**限定 Manual Core READY FOR IMPLEMENTATION**，不是代码已验收。执行优先级：用户 → 当前 Figma → 已审核 docs → Mine Historical Functional Baseline → runtime 可行性。

下一阶段可接通 selection 与一次 deploy；不新增旧全选按钮，Manual shortcuts 按后续人工签收启用当前Figma值并替换输入，成功后保守保留 deployed visual + disabled action，不自动提交新轮旧草稿。不要让 Auto 金额、真实 countdown、Rewards、Miners、M7/M8 阻塞此 Core；局部 fresh preflight/receipt refetch 仍必须完成。当前本轮只有文档变更，不恢复草稿或执行签名/交易。

## M3 Mine Manual Core — COMPLETE / Human Real TX QA PASS

- 正式 `/mine` 通过 app composition 投影 Privy/Wagmi identity/connect，Feature 自己持有 local selection/amount、TanStack account Queries 与 transaction owner；无新 store、Provider、dependency 或 environment variable。
- 25 个 native pressed buttons，UI #1→bit0/#25→bit24，支持选/取消/多选。公共金额不禁止选格；本人相关未结算轮 participation/principal/mask 任一证明已部署即锁本轮全部 action。unknown fail closed；不新增全选/清空。
- Manual/Auto 输入 Human approved 均为每格金额；本次只启用 Manual。decimal string → parseEther → bigint，value=amountPerSquare×count，不额外加1%。Manual shortcuts 已 Human approved 启用 +0.5/+1/+2 替换每格输入；Auto 配置/提交仍 disabled。
- account Query key 按 chain + Protocol/View + roundId + account 隔离。读取 fulfilled 存储轮仍要求 info/squares 成功，但历史参与不能锁住未来 deployable round；不构造 next round ID。提交前在同 block 重读 board/current/round/account，再校验余额、模拟、估 gas/价格、再次 gate 和模拟；provider account/chain 在 send 前再次校验。
- lifecycle：preparing → awaiting-signature → submitted → confirming → confirmed → refreshing → success。rejected/failed/confirmation-unknown/verification-failed/refresh-failed 分开，错误仅展示本地化类别，不输出原始 provider。
- receipt success +1 confirmation 后仅接受来自 Registry Protocol、miner/mask/amount/value/manual 类型均匹配的唯一 DeployEvent；operationRound 只从该事件读取。置换交易只有同一 intent 可继续校验。hash 不是成功。
- 成功后 fresh public board、原交易账户 operationRound info/squares 与原账户 native balance；RPC head 不可早于 receipt。切账户后的状态/哈希不展示给新账户；公共 board 不含 account key。
- confirmed 后校验/刷新失败只提供 retry verification/reads；重试读取不重新请求钱包，也不重发交易。确认未知只检查原 hash。MustCheckpointPreviousRound 仅提示并刷新，不发 repair write。
- 非直观边界注释已保留在 mask/participation、runtime preflight/event/refresh、hook context 和页面组合处；未抽 shared 业务组件，未改 Stake。

### Verification scope

真实 Development 页面只读/本地交互：已连接97读取 BNB；公共 #4 可选，#4+#25、每格 .02→总额 .04，输入100→不足并禁用，Enter/Space取消与空选择禁用。未点击真实 Deploy、未请求真实签名/广播。

375 与1000px浏览区域（main500居中）以隔离 browser fixture 检查 disconnected/no-selection/insufficient/ready、wrong-chain、已部署后可继续编辑草稿、仅Deploy禁用、preparing/awaiting-signature/confirming/refreshing，无横向溢出，HarmonyOS Sans SC。fixture不导入钱包动作，已删除。上述自动化与无签名验证是实现阶段记录；后续用户已完成最终人工Testnet验收并确认真实Manual Deploy PASS，见文末。mock本身不作为真实交易证据。

Property evidence：375面板347×282（四态基础高度）；background rgb(25,27,31)、radius8；输入height56、background rgba(13,15,19,.65)、font24/500/28；action height44、radius22、ready white/背景色文字；selected白边/独立surface。CSS明确保留input1.5px border，当前DPR1浏览器computed量化为1px，属于既有浏览器栅格化差异，未省略属性/未用缩放hack。main底部padding76；滚动后末内容bottom1024、nav top1048，无遮挡。loading/error新增中性反馈可使面板增高，不裁切错误。

自动化：selection/mask/金额精度、单轮一次/新轮/unknown、preflight、模拟失败不发交易、拒签、receipt revert/success、DeployEvent全字段匹配/不匹配、refresh/no-resend、签名前context变化与hash后原账户刷新均由测试覆盖。最终完整 QA：env:check / typecheck / lint / format:check / test / build / git diff --check 全部 PASS；45 个测试文件、564 项通过。build 存在 vinext/RSC sourcemap、动态导入与路由静态分类 warning，构建成功。

**Status：M3 implementation COMPLETE；用户最终人工验收确认 Chain97真实Manual Deploy PASS。** Auto/Rewards/Countdown/Polling/Realtime/Production56未解锁。

## Human UI Decision — deployed form remains editable

已部署后只禁用最终 Manual Deploy action，按钮文案为“本轮已部署”（en: Already deployed this round）；不渲染独立同类提示区块。hasDeployedThisRound 不限制 selection/amount draft，选择计数与 bigint total 正常重算。交易进行中/待恢复时原有 busy 边界不变。UI、hook submit eligibility、fresh preflight 的单轮一次防线均保留；新轮由新的 account Queries 判断资格，不以本地 reset 解锁。此人工决定覆盖本文前面关于成功后“纯视觉点击待确认”的历史记录。

## Human approved — Manual amount shortcuts

当前 Figma1715 四态均为 +0.5 / +1 / +2。Manual 每个按钮点击直接 set 每格金额为0.5 / 1 / 2 BNB，不累加；不采用用户举例或旧站的0.02/0.05/0.1覆盖设计数值。选择集合和count不变，沿原bigint pipeline立即重算total。

断连、wrong-chain、已部署均可使用本地shortcuts；输入与shortcut在现有transaction busy期间仍只读/禁用。hasDeployedThisRound=true只锁最终Deploy并显示“本轮已部署”；快捷操作不调用 transaction start，不绕过 fresh account read/simulation/receipt/event/refresh。Auto与孤立无owner presentation仍禁用。此前Manual“shortcut disabled”裁决废弃，无新增交易能力或金额处理库。

## Final Human Acceptance — M3 checkpoint

用户明确确认 Development / BSC Testnet97 Manual Deploy真实交易PASS，M3已完成最终人工验收；未提供transaction hash，本记录不补造hash/receipt/log证据。

- 每账户每个实际round最多一次成功Manual Deploy；首笔可多格，不允许同轮追加。
- 已部署后selection、每格amount与shortcuts仍可编辑；输入保持白色，仅最终Deploy disabled，文案“本轮已部署”，无独立同类提示。
- 当前Figma +0.5/+1/+2直接替换amountPerSquare，非累加，selected count不变，bigint total正确联动。
- Manual transaction safety与account/round Queries不因本地草稿编辑放宽。Agent本次checkpoint不发交易、不签名。

此验收仅覆盖M3 Development97；不等于Stake Real Tx QA完成，不解锁Auto/Rewards/Claim/Countdown/Polling/Realtime或Production56。按用户授权创建checkpoint并push；不deploy。

Checkpoint Final QA：env:check / typecheck / lint / format:check / test / build / git diff --check 全部 PASS；46 个测试文件、575 项通过。构建保留 vinext/RSC sourcemap、动态导入与路由静态分类 warning，Build complete。未运行deploy，无临时fixture或Secret进入提交范围。
