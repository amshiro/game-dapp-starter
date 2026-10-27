# R0 — Read-only Evidence Audit

## 边界与证据等级

本次核对采用 `README.md` 已锁定的 Source of Truth；API 字段冲突另按 `api-reference/README.md` 的 Contract → 已记录 Development 返回 → 调用源码优先级处理。Figma 缺少某项功能，不等于产品已经批准删除该功能；旧代码存在某项功能，也不等于新版必须保留。

本次重新读取了 Figma MCP 的 `ORI-AI测试`（`2003:178`）与登记的品牌页节点，并核对当前 `ori-website` 工作区源码、正式 API Contract、starter 的 Registry/ABI 和已有 F6.1/F7 运行记录。旧源码核对版本为 `adcc99b95c903d3d9866d6c370df0f52cd00ca00`；下文旧路径与行号均相对此 checkout。旧项目只有 `.vscode/settings.json` 存在未提交修改，不涉及本次证据文件；未修改旧项目。

本次没有重新请求 Backend、RPC 或 WS，没有验证代理实现、发出交易或制造实时事件。F6.1 的 500、字段差异和 F7 的 502 是已有运行记录，不能称为本次服务现状重测。ABI 和 Contract 中的事件定义不等于真实 WS 样本。

结论只使用：`CONFIRMED`、`PARTIALLY CONFIRMED`、`STILL OPEN`、`CONTRADICTORY`。下文确认源码事实时，不自动确认其新版产品适用性。

## 问题矩阵

| 问题 | 结论 | 本次可确认的证据 | 仍不能决定 / Human Gate |
| --- | --- | --- | --- |
| Q-01 起源与 Points 的保留关系 | PARTIALLY CONFIRMED | 当前 Figma 导航为 Mine/Points/Stake/Explore/About；已审核 shell 路由一致。旧 `components/navbar.tsx:153` 将起源指向 `/`，`pages/index.tsx` 实际包含起源交易/矿池组件 | 当前导航已锁定，不再阻塞 F9；起源业务是否退役、改入口或并入 Points 仍需 G-P，不能由缺少 Figma 页面推出删除 |
| Q-02 Mine trade-to-mine | PARTIALLY CONFIRMED | 当前 `2003:182` 只有方块游戏及 Manual/Auto；旧 `pages/mine/index.tsx:35,281` 保留 mining/game 两个页内分支，game 组合 OriTrade/OriRewards/OriTradeList | 原始两个业务分支可以区分；新版是否下线 game 及相关 API/router 仍需 G-P，不提前实现设计外标签 |
| Q-03 品牌/Logo | PARTIALLY CONFIRMED | 当前 Header `2003:190` 直接使用 `2003:3110` 字标与 `2003:3112` 标志；品牌页仍有 `确认`（`1:4544`）和 `废弃`（`1:4625`），确认区并存多组资产，缺少最终用途对应说明 | F8/F9 可替换 Header 已有有效来源；最终品牌、ORI/起源代币各用哪个版本仍需 G-P/G-V。不能把 frame 名“确认”升级为所有资产用途的批准 |
| Q-20 Points 规则 | CONTRADICTORY | Figma `2003:2121` 明写每 1 USD 获得 1 point；旧 en/zh `Points.subtitle` 写每 10 分钟按未中奖投入比例分配 1000。源码搜索未发现该 subtitle 或 points API wrapper 被页面/组件调用 | 两份文案不一致，但未使用的 locale 文案不证明真实计分算法。Contract 的 points_reward/total_points 示例也不定义公式；仍需 G-P/G-D，不能本地推积分 |
| Q-27 Explore scope | PARTIALLY CONFIRMED | 当前 `2003:2534` 明确四张统计卡和 Mining/Motherlodes/Buybacks 三组表；旧 `pages/explore/index.tsx:36` 有 ori/origin/originGame/oriGame 四分支；正式 Contract 与已有 F6.1 统计字段不一致 | 新视觉结构可执行核对；是否保留旧分支、哪类回购和 type、缺少 circulating_supply 的处理仍需 G-P/G-D，不能默选或补零 |
| Q-22 Wallet receive/export/余额 | PARTIALLY CONFIRMED | 旧 `components/wallet.tsx:41` 的 Receive 调用 Privy fundWallet，指定 BSC/manual；`providers/balanceProvider.tsx:61,141` 的外部余额来自 native getBalance，symbol 为 BNB。WalletBox 另有 mining fund 行；新 Figma `2003:2487` 只有 ORE 占位余额及接收/导出文字 | 旧 Receive 是手动收款入口，不能推成充值业务、指定 0.5 BNB 或 backend mining fund。未发现 WalletBox 的 Export 动作；外部钱包模式不授权导出私钥。新版余额资产、Receive 交互与 Export 用途仍需 G-P/G-W，Q-21 PC Sheet 也未关闭 |
| Q-12 transaction / business completion | CONTRADICTORY | Manual 和 Stake 的成功 toast 早于 receipt；Auto stop 和 Rewards claim 等先 await receipt，详见下文 | 旧提示时点不一致；签名、广播、receipt、业务索引完成必须分开。确认阈值、reconciliation 条件与状态视觉仍需 G-T/G-P/G-V |
| Q-41 About 费率/buyback | CONTRADICTORY | en/zh About 同时被页面引用的文案包含 1% 平台费、90% 奖池、6% ORI 回购、10% 总回购、4% 起源回购及 50/10/40 分配；Figma About 仍有 Solana/BURY/BUBY 和占位段落 | 6+4=10 可作对账线索，但分母、扣费时点与回购代币再分配比例未锁定，不能认定已解释一致，也不能据此断言链上资金算错。正式正文与费率口径需 G-P/G-D；不把 Figma 占位文案发布为 ORI 规则 |
| Q-11 API Contract / runtime | CONTRADICTORY | 保留 F6.1 已记录差异；本次进一步确认 latest/events 的 max 字段层级与旧 Mine 读取不同、旧 Rank 调用与正式 round_winners/round 响应不符；详见字段表 | 不自动互换 endpoint、不沿用旧 round、不选择文档或历史返回中的任一方作为正确版本。需要 Backend owner 修订 Contract/提供新样本，Production host 仍未知 |
| Q-10 ABI / Mine / Stake | PARTIALLY CONFIRMED | 五份当前 ABI 与旧 artifact 的 abi 数组逐项相等，递归排序键后的 sha256 均与复制记录一致；方法签名与字段映射见下文 | 没有读取链上代码、代理 slot 或 decimals 返回；不证明 97/56 当前代理实现、费率数值、枚举语义或测试网部署兼容。仍需协议 owner / G-D |
| Q-23 Header price | PARTIALLY CONFIRMED | `navbar.tsx:148,187` 显示 balance context 的 ORI price；`balanceProvider.tsx:87,112` 从 getPrice 返回数组按 ORI aux_contract_addr 匹配；`service/api.js:22` 指向 query/chain_asset_config，不是 origin_info | 可以缩小 H1 数据候选；Backend 的 chain=bsc、price 示例不足以锁定 97 数据集、报价单位/时效及重复资产选择规则。不能因 Dev 缺价而匹配 56 地址或返回假 0；仍需 G-D/G-V |
| Q-26 Stake 扩展范围 | PARTIALLY CONFIRMED | `pages/stake/index.tsx:534` 有 pendingRewards 大于 0 时的 Account/Yield/Claim；调用 claimStakeYield。locale 有 claimAndDeposit 字符串，但页面无对应绑定动作 | 实际 Claim 与仅存在文案的复存不同；当前 Figma Deposit/Withdraw/Summary 不决定扩展模块是否保留。S3 不能把 locale 字符串当原子合约方法或新版需求，仍需 G-P/G-T |
| Q-47 realtime | PARTIALLY CONFIRMED | 旧 Mine 监听两个登记事件，解包 eventData.data 后读取 timestamp / winning_square；ABI 中 RoundStarted/ResetEvent 字段及 API 示例提供可对照字段 | 仍无真实 WS payload、订阅成功、重连样本或后端 schema。不能从链上 event 推导 wire JSON 包装；已有 502 不在本轮重新验证，M8/G-R 继续阻塞 |
| Q-13 Backend auth（过时未决项） | CONFIRMED | 已有 Backend owner 确认、api.md Authentication / signing、正式 Contract 与 F6.1 记录一致：ORI 不需要后端登录会话、App ID 或 Secret | 仅移除过时问题，写入 requirements；不扩建认证流程，不改变可选 Starter capability 的独立职责 |

## API 字段级核对

下表仅核对已存在材料，不是新的 runtime 成功报告。正式 Contract 原文不在本轮修改。

| 数据 / identity | Contract | 调用事实 / 已有运行证据 | 单位、缺口与下游边界 |
| --- | --- | --- | --- |
| Latest round；chain + round | `user-api.md:265`：data.round_started、data.reset_event、data.max；max 下是 round_started_round_id / reset_event_round_id | 旧 `pages/mine/index.tsx:90` 读取 data.round_id / data.reset_event_round_id，另按 gameState 与数值 4 的比较推导下一轮 | 这不是等价字段映射。round ID 不转不安全 number；字符串空值也不能当 0。M1 需后端确认层级、含义与 canonical round 来源；ABI 的 uint8 不提供 gameState 数字 4 的业务枚举定义 |
| Winners；round + pagination + account/filter | `user-api.md:187` 的 round_winners/round 是单条 started 对象；`:226` 的 round_started/round 才是 winners list/total | `components/rank.tsx:20` 经 getRoundWinInfo 调前者，传 winner_address，读取 data.list | 正式 Contract 未定义该 winner_address 参数。不能简单交换 URL 或把旧 Rank 当当前 Miners 名单；超大 log_unique_id 示例超过安全 JSON number |
| Points；miner + page/page_size | `user-api.md:12,60`：list、total、user_points / total_points；示例有 bet_amount、points_reward、timestamp | wrappers 已定义但无调用；F6.1 的 points/user 为业务 500 | bet_amount 的带小数字符串不能直接当 BNB 展示值；points 精度、记录/总分一致性与计分公式没有被示例锁定。P1 仍 BLOCKED |
| Explore；统计与表的 type/page/filter | `user-api.md:333` 四项统计，value 为展示字符串；bury_event/list 有 type，reset_event/list 有 motherlode | F6.1 仅三项统计，number/string 混合；旧 BuybacksTable 未传 type；gameTable3/oriGameTable3 有 type 1/2，且部分 prefetch 与当前页 type 不一致 | 不复制旧 prefetch；不采用隐含默认 type。missing circulating_supply 不补 0；两张旧回购表到新一张表的选择需产品/后端签收 |
| Price；chain + token address + inner/outer（如适用） | `user-api.md:456`：可选 symbol、data 资产数组；示例 price 为 number | F6.1 混合 number/decimal string、is_inner 超出 Contract；旧 Header 用 Registry 对应 ORI 地址匹配 | unit/currency、chainId 97/56 数据隔离与重复行规则需确认；原始表示交现有 mapper，不用浮点计算，不把主网数据自动作为测试网余额/价格 |
| Stake APR；环境 + Summary | `user-api.md:500`：staking_annual_yield.value，label 明示 (%) | 旧 Stake 使用 summary 展示 APR；total deposit 来自 getTreasuryState.totalStaked，TVL 另依赖 ORI price | APR 的 percent 标签可确认，不推出复利公式或实时保证；缺价不造 TVL，未重新验证本轮 Summary runtime |
| Wallet native balance vs mining fund | Wallet 原生余额来自 provider.getBalance；后端 origin_info.my_wallet 是另一数据结构 | 旧 WalletBox 分行展示两者，native balance 配 BNB；Figma ORE 是占位资产名 | 余额 identity 必须含 account/chain/token；新版是否保留矿池资金行仍未知。不能把 backend my_wallet.amount 当钱包 BNB/ERC20 余额 |

既有 `api.md` 中的 chain_asset_config.is_inner/price、explore 缺字段、reset_event/list 增字段、失败 envelope、user_asset_events 分页差异继续有效。`activity-api.md` 的 wd/query_signature 还有 Solana 示例，不是 EVM 新版提现/Receive 的实现契约。

## ABI 与旧调用能证明的边界

来源为当前 `src/shared/config/abi/*.ts` 与旧 `constant/*.json`；本次仅导入静态 ABI 数据做语义比较与复制 hash 校验，没有建立 RPC client 或执行任何合约方法。

| 能力 | 结果 | 可确认的接口 / 旧调用 | 不能因此宣称 |
| --- | --- | --- | --- |
| ABI 副本 | CONFIRMED | OreProtocol 118、OreProtocolView 22、OreToken 40、AssetManager 45、OriSwapRouterV2 50 项，五份数组及记录 hash 一致 | 当前链上代理实现已验证、所有方法均能成功调用 |
| Mine public read | PARTIALLY CONFIRMED | View.getCurrentRoundInfo → roundId/startBlock/endBlock/totalDeployed/canDeploy/canReset/randomnessRequested；getCurrentRoundSquareStats → uint256[25] squareAmounts/totalDeployed | 各方块人数、完整参与者地址/名单已经存在；也不替代后端排名与分页 |
| Mine account read | PARTIALLY CONFIRMED | getCurrentRoundSquares(miner) / getMinerSquares(roundId,miner) → mask/squares/amounts；getUserRewards → ethAmount/oriDirect/oriRefined | eth 字段代表 Ethereum 主网；在 ORI 中原生资产为 BNB。ORI 实际 decimals 与当前部署实现仍待核对 |
| Manual / Auto | PARTIALLY CONFIRMED | deployManual(mask,amountPerSquare) payable；registerAutomation(tuple) payable 含 owner/balance/mask/amountPerSquare/randomizeMask/active/botFee；config() 提供 executorFee；stopAutomation(to) | Auto 输入金额就是所有轮次/方块总额；手续费、gas reserve、轮数上限或启动完成条件已批准 |
| Stake | PARTIALLY CONFIRMED | View.getStakeInfo → stakedAmount/pendingRewards/rewardDebt/updatedAt；getTreasuryState.totalStaked；depositStake(amount)、withdrawStake(amount,to)、claimStakeYield(to)。旧代码 approve 并等待后再 depositStake，按 18 位 parseUnits | 实际 ORI decimals 已读链确认；复存存在原子方法；收益模块是新版必选项 |
| Fees / events | PARTIALLY CONFIRMED | board() 有 feeBps/vaultBps/claimFeeBps；RoundStarted/ResetEvent 有 roundId、时间等字段 | getter 声明给出了当前值；bps 字段足以解释 About 全部分母；链上 event 与 WS payload 同构 |

`AssetManager.deposit(order_id,command,extra_info,token,amount)` 的 string command 只是一段 ABI 输入，不能锁定 claim / claim_bnb 的业务处理或后端完成条件；Q-10 不关闭。97 WBNB 的已知缺口也未填充。

## Q-12：旧成功提示不是新版 completion contract

| 旧 workflow | 实际顺序（源码） | 审计含义 |
| --- | --- | --- |
| Manual deploy | `components/trade.tsx:165–190`：取得 tx → success/transactionConfirmed toast → 后台 tx.wait，失败仅记录 | 广播不等于 receipt 成功，不能迁移该成功语义 |
| Stake deposit / withdraw / yield | `pages/stake/index.tsx:229,324,392`：success toast → 后台 wait；读数据可能先刷新 | 不证明余额或收益已经对账完成 |
| Auto stop / Auto start | `components/auto.tsx:97`、`components/trade.tsx:299` 先 await tx.wait 再 success | 与 Manual 的成功时点不同，但 receipt 仍不等于 backend automation 已观察 |
| Mine rewards claim | `components/rewards.tsx:161,237` 先 wait，再 invalidate / success | 仅说明旧 receipt 后刷新行为，未提供后端索引完成契约 |

M3/M4/M6/S2/S3 必须在 G-T 中分别签收确认阈值、replacement/revert/cancel/timeout、冻结的 account/chain/round 上下文，以及需要后端时的可观察完成条件；视觉状态再经 G-V。不能用旧 toast 文案关闭 Q-12。

## 对 Feature Graph 的影响与下一张票据

**本次没有把任何完整 BLOCKED / PARTIALLY BLOCKED Feature 自动提升为 READY。** 获得了更明确的可准备子集，不代表已完成真实 API、链上或产品 Gate。

| Slice | 状态变化 / 更可执行的部分 | 仍需的 Gate |
| --- | --- | --- |
| W2 | 维持 PARTIALLY BLOCKED。W1 已审核并 push；地址/复制/断开边界明确。旧 native BNB 与 mining fund 的区分可指导需求签收，Receive/Export 继续归 W3 | Q-21 PC Sheet、Q-22 新版余额资产/口径、反馈视觉：G-P/G-V/G-W |
| W3 | 维持 BLOCKED。旧 manual Receive 来源已定位，可单独讨论收款展示；Export 未获得实现语义 | 产品决定是否保留及具体用途，不能解释为私钥导出 |
| H1 | 维持 PARTIALLY BLOCKED。Header → getPrice → query/chain_asset_config → ORI aux address 的源码链已锁定，可先做资产/字段对照 | 97 数据集、价格单位/时效、多行/缺价选择与视觉：G-D/G-V |
| E1 / P1 | 分别维持 PARTIALLY BLOCKED / BLOCKED。Explore 现稿结构、Points Contract 和冲突字段更明确 | Q-01/Q-20/Q-27、接口差异、points/user 新样本与规则签收 |
| M1 / S1 | 维持 PARTIALLY BLOCKED。ABI 字段清单可支撑 DTO/读接口准备；明确 View 不包含参与者名单 | Q-10 部署/decimals、Q-11 canonical round/接口、Q-26 Scope：G-D/G-P |
| A1 | 维持 PARTIALLY BLOCKED。真实 About sections 与 en/zh 争议键已定位；可做既定本地 accordion 结构子集 | Q-41、正式 copy、Q-30 发布语言：G-P/G-V，不能发布删改后的“无争议版”规则 |
| Transactions / M8 | 保持原 BLOCKED。此次只有 ABI/旧调用/静态事件线索 | G-T / Q-12；G-R / Q-47 真实订阅、payload 和重连证据 |

**推荐下一张实际 Feature Ticket：W2 — Wallet Sheet core，先完成它的 G-P/G-V 签收。** 理由是 W1 身份基础已验证，地址、复制、SDK logout 的职责确定，且不要求先解决 Points、Mine、资金交易或 WS。需要产品/设计明确 PC Sheet 与新版余额口径后再启动完整实现；尚未签收时仅允许原票据已有的地址/复制/断开独立测试子集，不擅自缩减 W2 交付范围宣称完成。

必须继续由人决定：起源/ORI 游戏去留；最终品牌与资产角色；积分规则与 Explore 范围；Wallet 余额/Receive/Export/PC 呈现；About 费率与正式文案；每类交易的业务完成契约；后端 Contract 修订及 Development 数据集；部署/ABI owner；实时 schema 与真实运行证据。
