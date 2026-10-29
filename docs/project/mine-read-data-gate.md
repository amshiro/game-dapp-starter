# M1 — Mine Read/Data Gate

## 结论与边界

**M1 READ DATA GATE BLOCKED**。97 的若干合约原始读字段已验证，但当前/下一轮呈现、状态映射、Miners 列表语义与选择规则尚不足以签收完整 M2。M1 票据保持 PARTIALLY BLOCKED；M1 审计轮只交付证据与文档。其后用户另行批准限定 M2 Read-only Board；完整 M1 Gate 不因此关闭。

后续 Manual 产品签收以 [Single Deploy Correction](./mine-manual-implementation-plan.md) 为准：每账户每个实际 operation round 最多一次成功 Manual Deploy；技术上允许异格追加不构成产品许可。本报告原始 read/API/timing 的证据限制继续保留，不能用旧的 selection OPEN 描述覆盖新人工决定。

用户确认 → 当前 `ORI-AI测试` → Repository/API Contract/ABI → 旧源码技术事实。旧 Mine UI、60 秒倒计时、名单与选择逻辑都不自动继承。Figma sample values are not runtime data。

## 证据索引

- 当前 Figma：文件 `M6P7gqrEDANm28YSfvOm93`、页面 `2003:178`；重读 Mine `2003:182`、`2003:629`、`2003:1009`、状态稿 `2003:1038`、单格 `2003:1078` / `2003:823`。Metrics `2003:485`、Miners `2003:508`。
- 当前 [Contract Registry](../../src/shared/config/evm-contracts.ts)、[Protocol ABI](../../src/shared/config/abi/ore-protocol.ts)、[View ABI](../../src/shared/config/abi/ore-protocol-view.ts)、[Token ABI](../../src/shared/config/abi/ori-token.ts)。地址与链配置继续由 Registry 持有。
- 正式 [API reference](./api-reference/user-api.md)，既有 [API facts](./api.md)、[Web3 facts](./web3.md)、[R0](./r0-evidence-audit.md)。本轮 runtime 是新增样本，不追溯改写 R0 当时的静态结论。
- 旧技术路径：`ori-website/service/api.js`、`pages/mine/index.tsx`、`components/matrix.tsx`、`components/overview.tsx`、`components/rank.tsx`；旧 artifact `constant/OreProtocolView.json` 的 devdoc。artifact 注释不是已验证的当前代理 Solidity 源码，不据此批准新的产品规则。
- 本轮使用当前 Development RPC 与正式登记的只读 API；未使用旧 RPC、用户私钥、签名、session 或链上 write。账户读使用公共零地址作输入，不能据此声称真实参与账户的奖励/金额验收完成。

## 97 runtime 快照

合约批次固定在 block **139278581**，block hash `0x4c66b1cc04b4995212161dc5b21328a4c30393067aa5fec3071b3308f93dc4ed`，timestamp **1793126144**（Unix 秒）。

| Read | 结果与限制 |
| --- | --- |
| View `protocol()` | 与 97 Registry OreProtocol 相同；S1 已核对 View → Protocol → ORI Token linkage/code，本轮不是全 ABI/所有代理实现审计 |
| Protocol `board()` | currentRoundId=1654；roundLength=134 blocks；intermission=20 blocks；feeBps=100、vaultBps=1000、claimFeeBps=100；live=true |
| View `getCurrentRoundInfo()` | roundId=1654；startBlock=89502888；endBlock=89503022；totalDeployed=1000000000000000；canDeploy=true；canReset=false；randomnessRequested=false |
| View `getGameState()` | state=1、blocksRemaining=0；数值读取成功不等于已确认新版状态名称 |
| View `getRoundData(1654)` | id 与 board 相同；intermissionEndBlock=89503076；randomnessFulfilled=true；winningSquare=23；25 项 deployedPerSquare / minersPerSquare 均能解码 |
| 方块统计 | index 3 amount=1000000000000000、miners=1，其余为 0；`getCurrentRoundSquareStats()` 与该轮总量/amount 数组一致 |
| `getSquareParticipants(1654, 0/3)` | index 0 为 0 行；index 3 为 1 行，金额和 totalDeployed=1000000000000000，与该格存储 amount/count 一致；未输出参与者地址 |
| 账户读（零地址） | `getMinerRoundInfo` → checkpointed=false、hasParticipation=false、totalDeployed/ethReward/oreShares/oreBonus=0；`getMinerSquares` → mask=0、空数组 |
| Treasury | `getTreasuryState()` 可解码；motherlodeOre=600000000000000000；不将 stakeRewardsFactor 或其他累计因子格式化为 ORI |
| ORI | decimals()=18；symbol/linkage 已有 S1 的 97 runtime 证据，不扩展到 56 |

追加快照 head **139279536**：`getRoundData(1655)` 的 id/startBlock/endBlock 全为 0。后端 `round_started/round` 的 1654 样本 block_number=89502888，其 block_hash 与 **链 97** 同区块相等，start/end 与 View 一致。仅证明该样本匹配 97，不能把 backend 的 `chain="bsc"` 解释成所有接口/所有环境的完整链契约。

限制：同一个旧 blockTag 稍后再读曾返回 RPC **-32000 / missing trie node**；改用新 head 的追加读成功。历史 DeployEvent `eth_getLogs` 返回 **limit exceeded**，没有取得真实部署日志样本。不能把这些 RPC 能力限制解释成 ABI 不匹配，也不能报告事件字段已完成 runtime 验证。56 因 Production RPC 未配置未验证，继续 Release Gate。

## Canonical round / identity

**推荐 owner（engineering recommendation，待 G-D 签收）**：Protocol 状态通过 Registry/View adapter 读取；API 只做经过对照的索引/展示补充；realtime event is freshness signal, not canonical round state。收到事件后重新读取同一个 owner，不建立第三套 current round store。F7 已规定 freshness-only；本轮未取得新 WS 样本，Q-47 不关闭。

**已确认**：`board.currentRoundId`、View roundId、完整 round.id 与本轮 API 样本均为 1654。**仍 OPEN**：UI 应显示最后存储轮、可参与轮还是待启动下一轮。该轮已 fulfilled、endBlock 远早于 head，但 canDeploy=true，state=1/remaining=0；下一轮数据尚未初始化。这可能涉及下一轮启动语义，不能据此认定部署故障，也不能直接 `canDeploy => active`、`roundId + 1`、API max+1 或“显示 00:00”。需要协议 owner 明确边界/状态映射，无需靠试发交易确定。

稳定 identity：`chainId + protocolAddress + roundId`；roundId 为 ABI **uint64**，内部 bigint，跨 JSON/Query key 边界使用十进制 string。large IDs remain string/bigint。账户读再带 account，方块读再带 squareIndex。轮次切换须隔离迟到旧响应；具体 Query 尚未实现。

区块号/事件位置不是 round identity；DB id 也不是 roundId。事件去重候选为 chain/deployment + blockHash/transactionHash/logIndex，需处理重组，不使用不安全 log_unique_id。API number 只有通过 safe-integer 校验才可规范化；已经失真的 JSON number 不能用 BigInt/字符串转换修复，须由后端提供 lossless string。

## Timing / status

- `startBlock/endBlock/intermissionEndBlock` 是 block height，不能当毫秒/秒；采用完整 round 存储值，不用当前配置倒推历史轮。当前 round 的 intermissionEndBlock 也不能由 board.intermission 替代。
- 1654 的 start/end 区块 timestamp 分别为 **1770707055 / 1770707115**，样本跨度 134 blocks / 60 seconds。这仅确认历史样本，不能保证当前部署未来每轮固定一分钟。ABI 配置是区块数，不是 60 秒。
- 区块/event timestamp 使用 Unix 秒；API common timestamp 是响应元数据，不是轮次起点。未来 end block 尚未出块时无精确终点 timestamp；预计秒数需单独确认估算策略，当前不做 countdown。
- artifact devdoc 提及 NOT_STARTED/PLAYING/ENDED/SETTLING/SETTLED，ABI 只有 uint8。缺少已验证源码/显式数值映射及当前/下一轮行为说明，不能直接继承旧前端 `state===4` 等判断。
- Figma 存在正常、等待开始、倒计时等待开始、中奖/未中奖状态；协议原始字段可读，但这些产品状态与 bool/enum 的映射仍 OPEN。不擅自新增 resolving/reset 状态文案或默认转换。

## Participants / Miners

- **CONFIRMED**：5×5 每格 count 候选是 `getRoundData(roundId).minersPerSquare[25]`，每格 amount 来自 deployedPerSquare 或当前轮 squareAmounts。`getCurrentRoundSquareStats` 自己没有人数字段，不能从 amount 推人数。
- **PARTIALLY CONFIRMED**：`getSquareParticipants(roundId,squareIndex)` 返回地址与 uint96 amount；artifact devdoc 表述 deploy 时记录的下注参与者。本轮验证空格和非空格与存储统计相同。跨格相同账户可能重复，不能把 25 格 count 相加当全轮 unique participant count；多次部署的累计/去重语义仍需确认。
- 当前 Figma **确有 Miners 列表**，含 Round label、缩写地址与金额；部分行有双资产图标/金额。未定义它是所有投注者、获胜格投注者还是奖励获得者，也未定义排序、每行金额口径。Figma 没要求 selected-square/tx hash 列、额外分页，不加旧版字段。
- `getLastRoundWinners` / `getWinningSquareParticipants` 是获胜格名单候选，返回地址和**投注金额**，不是个人 payout。Protocol DeployEvent ABI 含 roundId/miner/mask/amountPerSquare/totalAmount/automation/timestamp，日志元数据可带 tx hash；本轮日志读取失败，不能把其作为已验证 row source。
- 旧 Rank 实际读取 `list[].eth_reward/ore_reward` 并按 8 decimals 显示；它只证明历史技术路径，不能替新版选择名单语义、字段或金额单位。正式 API 与此不一致，见下表。

## Amount / asset / unit

| 字段 | Asset / Raw type / display unit | Status |
| --- | --- | --- |
| deploy amount、个人 totalDeployed、每格 amount、总部署 | 原生 BNB（97 为测试 BNB）；uint256，参与者 amount 为 uint96；18 decimals / BNB。payable deploy、链 native config 与旧技术读路径支持，不是 ORI balance | CONFIRMED（技术资产）；新版图标/文案不得继续使用 SOL 占位 |
| winningsPool / vaultShare / native winning payout | 原生 BNB wei 候选，uint256 / 18；字段金额与当前可领取金额不同，个人分配、扣费/结算时点不由 ABI 类型证明 | PARTIALLY CONFIRMED；不能自动显示 claimable |
| fee | board 的 feeBps/vaultBps/claimFeeBps 是 uint16 费率，不是 token amount；不能直接按 18 decimals；各项分母/扣费和新版文案仍属 Q-41 | PARTIALLY CONFIRMED |
| oreReward / topMinerReward / motherlodePayout / treasury.motherlodeOre | ORI 18 decimals 候选（97 Token metadata/linkage）；uint256。Motherlode 单值与当前 UI 图标/起源关系、分配语义仍 Q-31，不拿旧双资产方案补齐 | PARTIALLY CONFIRMED |
| getMinerRoundInfo.ethReward | 原生币奖励字段候选；uint256。checkpointed/未 checkpoint 与可领取业务语义另属 M5/G-D | PARTIALLY CONFIRMED |
| oreShares / oreBonus / rewardDebt / stakeRewardsFactor | uint256 不是单位定义；份额、因子、累计与实际 ORI 之间映射未证实，不统一 formatUnits(18) | OPEN |
| API bet_amount / eth_reward / ore_reward | 当前赢家列表为空，未取得非空金额样本；历史 8 decimals 与合约 wei/ORI raw amount 不是同一个契约 | CONTRADICTORY / 不进入 M2 |
| USD / 起源 / Figma ORE | 未确认的新资产/报价映射不自动转为 BNB/ORI；USD 数据块需要报价 owner、单位、链与时效 | OPEN（Q-23/Q-31/Q-03） |

金额保留 bigint/exact raw value，再按**已确认字段**用 Viem formatUnits。不得对 raw amount、roundId 使用 Number/parseFloat。

## Grid / selection：Q-18、Q-19

| 问题 | 本轮证据与结论 |
| --- | --- |
| 5×5 是否当前设计 | CONFIRMED：当前 Mine frames 均为 25 格，显示 #1–#25；ABI 数组 25 项，技术 squareIndex 为 0–24 |
| 什么时候可选、active 前/中 | User Confirmed：暂不可部署时允许纯 UI 预选，但 submit disabled；canDeploy 不等于产品 active label |
| 已下注能否重选 | 本轮成功后不得第二次 Manual submit；是否保留纯视觉点击仍按 Figma/新版交互核对，不能由 combined 稿推导提交许可 |
| 新轮是否清空 | 最终视觉保留策略继续核对；旧 selection 不得自动提交，必须 fresh read/validate/simulate，新轮不能继承旧账户轮次锁 |
| disconnected / wrong chain 是否可预选 | User Confirmed：允许纯 UI 预选，submit disabled；W1 身份 owner 不变，回 97 后 fresh revalidate |
| selection owner | 草稿选择可由局部 UI 持有（engineering recommendation）；真实已部署 mask/amount 来自链读，不建立钱包/轮次镜像 store |
| 同一账户一轮多次参与 | User Confirmed：Manual 每账户每个实际 operation round 最多一次成功 Deploy，首笔可多格。后续 97 虚拟状态模拟支持不同格追加的技术证据保留，但不得转为产品 UI/第二次提交许可；见 [修正计划](./mine-manual-implementation-plan.md) |
| 颜色 / Auto 半透明 | PARTIALLY CONFIRMED：1078 独立“已投注”金额金色；823 组合选中+部署金额绿色/白边。不能把不同状态混为一谈；完整映射及其他稿差异仍待 Q-18 签收 |
| 全选 | OPEN：当前稿没有明确入口，不从旧站补入；Q-19 同时记录选择时机/重选/重置决策，不因旧功能存在就默认保留 |

## Q-11：Contract / runtime / ABI 对照

本轮四个登记的只读 API 均 HTTP 200。以下是新的运行样本，并非后端 Contract 已经修复。

| 项目 | 正式 API Contract | 本轮 runtime / 历史调用 | 处理 |
| --- | --- | --- | --- |
| latest/events | 嵌套 round_started/reset_event/max；max 中 number/空字符串混用 | 当前 flat started 对象，round_id=1654，附 reset_event_round_id；没有 max。旧代码也曾读 flat 字段 | CONTRADICTORY；不写双分支猜测 adapter，不用 max+1 生成轮次 |
| round_started/round | winner 列表：winner_address/bet_amount/tx_hash | 当前单个 started 对象，start/end/round_id/区块事件字段 | CONTRADICTORY；本样本起点区块 hash 匹配 97，但正式 DTO 尚未签收 |
| round_winners/round | 单个 started event | 当前 {round_id:string,total:number,list:[],reset_event:object}；旧 Rank 读 list，传未列的 winner_address | CONTRADICTORY；空列表不能验证 row 金额/identity/排序/单位，不自动交换 endpoint |
| reset_event/round | winnings/ore_reward 等；注释仍有 ETH/ORE；check_point 示例为数值 | 当前 check_point=bool，额外 total_deploy/send_point_token；ABI round 是 bigint/bool/原始整数，API 多用 number | 字段映射/单位未签收；backend check_point 不能当个人 checkpointed |
| round identity / large IDs | round_id、log_unique_id 等为 JSON number，示例含 9223372036854775807 | 当前 round_id 有 number/string 混用；多个响应 log_unique_id 已超 safe integer | 禁用失真的 event ID；bigint/string lossless 契约仍需后端修正 |
| /ori/round | 未登记 | 旧 Matrix 4s 读取 global/user.bit_statistics | 不接未登记接口；有 ABI count/amount 候选不代表所有旧 API 字段等价 |
| chain dataset | 无明确 56/97 查询契约 | 返回 chain=bsc；当前 1654 start block hash 确认匹配 97 | PARTIALLY CONFIRMED；不推广到 Production/其他端点 |

## Mine Read Data Map

Refresh Strategy 只分类，不决定 polling 频率或实现；所有 contract query 必须带 environment/deployment 与 round/account 边界。后续 polling fallback 与 realtime freshness signal 只刷新同一个 canonical owner。

| UI Field | Canonical Source | Raw Type | Unit | Refresh Strategy | Status |
| --- | --- | --- | --- | --- | --- |
| Round label / key | board.currentRoundId + View round.id（存储轮）；正在参与轮解释待签收 | uint64 → bigint/string | round ID | contract query | 原始值 CONFIRMED；呈现轮 OPEN |
| Time remaining / Waiting | View gameState/blocksRemaining + round start/end/intermissionEnd | uint8 / uint256 / uint64 | block；非精确秒 | contract query | OPEN：产品状态/秒数 unavailable |
| Total deployed | View current.totalDeployed / 同轮 round.totalDeployed | uint256 | BNB 18 | contract query | CONFIRMED（97 存储轮快照） |
| You deployed | View getMinerRoundInfo(roundId,account).totalDeployed | uint256 | BNB 18 | contract query | PARTIALLY CONFIRMED：零地址读成功，真实参与账户另验 |
| Grid labels | 25 格 index→#1–#25 | index 0–24 | 无 | static/config | CONFIRMED |
| Cell deployed amount | round.deployedPerSquare / current squareAmounts | uint256[25] | BNB 18 | contract query | CONFIRMED（97） |
| Cell participant count | round.minersPerSquare | uint256[25] | 每格计数 | contract query | CONFIRMED（97）；非全轮 unique count |
| My cell deployment | getMinerSquares(roundId,account) | mask:uint256、uint8[]、uint256[] | BNB 18 | contract query | PARTIALLY CONFIRMED：零地址结构；账户切换需实现验收 |
| Cell selection | 人工确认后的本地草稿，不覆盖 deployed mask | 局部 index set | 无 | static/config | OPEN：可选时机/清空/重选 |
| Winning / unwinning cell | round.randomnessFulfilled + winningSquare | bool / uint8 | index | contract query | 技术字段 CONFIRMED；呈现时序 OPEN |
| Motherlode | View.getTreasuryState().motherlodeOre，不混起源 | uint256 | ORI 18 | contract query | User Confirmed；Q-31 CLOSED，正式slot已接入；不推导payout |
| Miners list / row amount | 尚无批准 owner；逐格 participants、winning participants、API winners 不是同一语义 | address/uint96 或未签收 DTO | 投注 / payout / 双资产未定 | contract query 或 API query（待 Gate） | OPEN；不造 rows/排序 |
| USD alternate metrics | 待确认 price owner + exact amount | 高精度 decimal | USD | API query（待 Gate） | OPEN；unavailable |
| Round transition freshness | F7 resync/invalidation 后重读上述 owner | 已验证事件 schema 尚缺 | 无 | realtime freshness signal / polling fallback | PARTIALLY CONFIRMED；Q-47，不实现 |

## M2 可执行边界与剩余 Gate

- **字段级 READY**：97 的存储 round ID/区块边界、total deployed、25 格 amount/count、winningSquare/fulfilled 原始值。账户部署 read 的 ABI/空账户返回结构可用，但尚非真实参与账户或完整 UI 验收。这些不是独立获批的 M2 implementation scope。
- **必须 unavailable / 不猜规则**：精确秒 countdown、当前可参与轮/状态 label、Miners 列表/payout、Motherlode 资产映射、USD、未确认收益/起源，以及 selection 交互策略。不将历史轮数字当“当前正在参与”的正常状态，不把缺失当 0。
- **G-D / 协议 owner**：签收 Protocol/View 为 canonical adapter 的推荐；解释已 fulfilled + canDeploy=true + next round 未初始化的轮次边界、enum 数值映射、时间策略；确认参与统计累计/去重、真实参与账户读路径。
- **G-P / G-V**：确定 Miners 是投注者还是获奖者、行金额/排序/round；Q-18/Q-19 的状态颜色、预选/重选/清空；Q-31 母矿单值资产。当前 Figma 决定 Scope，旧 Rank 不作产品答案。
- **后端 G-D**：修订 DTO、lossless ID/amount、非空 winners 样本与链语义；只有实际使用 API 的字段才由此阻塞，不把 backend 冲突扩大为所有 ABI 原始读不可用。
- **独立 Gate**：56 Production RPC/deployment、M5 奖励语义、交易 G-T、Q-47 realtime 均未解锁。本轮没有新资金操作授权。

结论：**尚不足以进入包含 timing/status、Miners 数据与 selection interaction 的完整 M2**。

## 后续用户批准：M2 Read-only Board 子集

用户已明确授权正式 `/mine` 展示 Protocol/View **实际存储 roundId**、总部署 BNB18 与 25 格 amount/count；不推导 +1，已结束/fulfilled 的存储轮只用中性 Waiting/数据 unavailable 呈现。此授权锁定该子集的 canonical read adapter，不批准完整轮次状态机或未来可参与轮。

当前实现 owner 为 `features/mine`：Registry → Viem 固定单区块快照 → TanStack Query → typed display → 页面。Query key 包含链与 Protocol/View 部署、不含 account；无全局 store、API、polling/realtime。缺省/未初始化/错误/错链数据不补零；个人部署、Miners 列表、Motherlode、USD、精确 countdown、奖励/起源 unavailable。winning visual 暂不显示，避免把历史结果呈现成当前可参与轮。cell 的 selected/deployed/combined 仅是局部 presentation 与测试能力，runtime 不可选择。

Q-18/Q-19、Miners 与 timing 的完整产品 Gate 保留；56 继续 Release Gate。

## 后续用户纠正：完整 Mine UI

此前 checkpoint 仅完成棋盘及部分只读区域，不能代表 Mine 全页面 UI 已完成。用户现要求重读全部 1–6（两个4同页），补齐 Manual/Auto、结果 row renderer 与全部局部视觉状态；[完整 inventory](./mine-page-state-inventory.md) 是本轮覆盖索引。新 UI 不改变本文件的原始 read 来源、不新增 current/next round 推导；M2阶段 form/amount/balance/shortcut/selection/Automation/Rewards 未获批准，actions 当时 disabled/read-only（历史交付；后续M3已单独启用Manual选择/输入及当前Figma shortcuts，不解锁Auto/Rewards），未知 data unavailable。Miners/results 的 round 不再复用当前 stored round；旧 API 冲突和各 Gate 仍保留。

## Requirement reconciliation 补充 — 2026-10-29

原始审计与完整数据 Gate BLOCKED 的历史结论保留；后续 Human approved Manual 规则、七 frame inventory 与 [正式需求对齐](./mine-requirements-reconciliation.md) 已将限定 Manual Core 标为 READY FOR IMPLEMENTATION，不表示完整 M1 或当前草稿已交付。Public board Query 继续 canonical；account deployment 按 chain/deployment/operationRound/account 隔离。stored round 不推导 +1；执行轮从 matching DeployEvent 确认。

本轮 /ori/round 的只读 HTTP200 返回 round_id:string/global/user/last_updated，修正“未正式登记”可能被误读为“不可达”的判断；并未签收其非空 DTO/单位或替换 Chain owner。其他五端点也仅获得 smoke evidence，见 api.md；WS 本轮未重测。


## 当前母矿 / 数据卡接线（覆盖上方 M1/M2 历史限制）

User Confirmed：母矿仅ORI treasury.motherlodeOre、18 decimals。Feature-local独立公共Query按chain/View部署隔离，30s前台刷新、沿用退避/焦点恢复；读取失败只令母矿不可用，不阻塞board和交易。我的部署复用当前展示round/account的info Query totalDeployed，断连/错链/error隐藏旧值。BNB图标复用既有reward-bnb.svg；ORI图标复用已用16px资产。精确秒deadline与开奖执行仍是独立边界。
