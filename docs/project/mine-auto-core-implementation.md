# M4 — Auto Mine Core Implementation

## 当前授权与运行证据边界

Human approved：Development / Chain97不再被当前成功execution扣费证据缺口阻塞，允许实现Auto config/register/Running Card/stop。产品需求全部CLOSED，签收事实与既有只读证据见[M4 Gate](./mine-auto-transaction-gate.md)。

**AUTO EXECUTION FEE DEDUCTION = RUNTIME QA PENDING**。当前已结束round的executeAutomation返回RoundNotLive，没有相反公式证据，也没有当前implementation成功execution的余额delta。只能在真实有效轮次Auto execution QA后升级VERIFIED。本实现不发送executeAutomation，不改变产品公式。

本轮不签名、不广播、不commit/push/deploy；没有Rewards/Origin/Miners新能力、polling、realtime、result animation、Production56或执行器实现。M3真实Manual验收保持有效；Stake Real Tx QA仍DEFERRED — TEST ORI REQUIRED。

## Architecture / owner

| Owner                 | 实现位置与职责                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Route composition     | 现有app/mine运行边界，仅97挂载MineReadPage                                                                           |
| UI composition        | mine-read-page组合manual/auto；MinePage按chain active整体替换form，交易status不随form/card切换丢失                   |
| Local configuration   | use-mine-auto：每格amount、random cellsPerRound、rounds草稿；board selection复用既有Mine局部draft，无新全局store     |
| Chain queries         | mine-automation-queries：P.getAutomation(account)、P.config().executorFee；不调用空revert的automations(address)      |
| Backend enrichment    | 同文件独立query POST /automation/user；只解析剩余回合，nullable与missing安全处理，不与chain DTO混合                  |
| Transaction intent    | auto-model：fixed位图/random数量、bigint金额、principal/displayTotal/requiredValue；1–25格、1–9999产品轮数           |
| Transaction lifecycle | AutoTransaction：冻结account/chain/deployment/intent，phase/event/receipt/retry；无wallet/auth镜像                   |
| RPC/wallet adapter    | auto-runtime：fresh reads、simulation、estimate gas、writeContract、receipt1确认、AutomationUpdated、原账户Query刷新 |

Account query key包含chain97、Protocol deployment、account与chain/enrichment后缀；config key包含chain/deployment。最新资源query由blockNumber pin receipt后读取，不创建第二份历史resource owner。无refetchInterval；现有Query失焦/重连行为不构成新polling功能。

## Config / amounts / Figma

重新读取Figma完整`2003:1832`（未选/已选）与`2003:1413`（active）。保留已审核Mine CSS结构及本地rounds/plus/minus assets，无新图标库、SOL资产或临时Figma URL。

- 有board selection：fixed，mask=bigint bitmask，UI#1→bit0/#25→bit24；Blocks只读且等于selected count，不能形成第二个count intent。
- 无selection：random，Blocks可编辑1–25，mask=count、randomizeMask=true；不能构造普通位图。
- Rounds默认1；产品输入限制1–9999，不是contract maximum；步进器/直接输入一致校验。
- Amount为每格BNB，parseEther且拒绝超过18位；当前Figma +0.5/+1/+2替换输入而非相加。
- 每轮总计/Total/Deploy金额仅本金，`amountPerSquare×count×rounds`。
- Human-approved最小新增行`执行费 / 每轮`，使用fresh Protocol.config.executorFee，非硬编码10^12。
- 实际value=`(perSquare×count+executorFee)×rounds`；余额检查含该value，preflight再检查gas。本金够但执行费或gas不足不能签名。
- 真实金额只用bigint；展示用formatUnits/formatEther，未将amount送入Number/parseFloat。

## Active / enrichment / Stop

- Chain active=true：整个Manual/Auto form与tabs不渲染，Running Card显示fixed列表或Random×count及每轮本金，无额外注册入口。读未知/错误不能授权任一路径；Manual preflight也重新检查active，防止旧闭包绕过UI。
- Remaining唯一来源是backend `extend_data.round_remaining`：string原样保留（含leading zeros），安全整数仅转换成文本，0不被吞掉；缺失/nullable/error留空，不补—，不从balance/fee推算。HTTP200/null仍不等于populated契约已验证；没有demo runtime值。
- active=false恢复form；链上配置与后端enrichment分离，backend id不决定active。wrong chain/换账户不展示旧chain cache为健康状态。
- Stop固定`stopAutomation(transactionAccount)`；fresh active/account/chain+simulation；合约负责退款，无前端退款计算/transfer。

## Register / Stop safety

1. 冻结intent；fresh automation/config/native balance，未知fail closed；注册不依赖Manual canDeploy/gameState来定义可注册时机。
2. fresh fee必须与冻结intent一致；变化要求review，不静默改变value。register owner=原账户、balance=0、botFee=0、active=true，runtime按Gate覆盖balance/botFee；参数按真实ABI编码。
3. fresh simulation、gas estimate、余额含gas、第二次fresh check与simulation，签名前核对真实Wagmi连接account/chain。
4. hash只是提交；1确认的receipt success之后保留chain confirmed。
5. P发出的唯一matching AutomationUpdated：user/owner=原账户；register匹配mask/perSquare/random/active/balance/botFee；Stop匹配active=false/balance0，不要求被保留在event的其他cfg字段全零。
6. 刷新原账户chain automation、backend enrichment、native balance和config，queries按原account隔离；receipt后链上head不得早于receipt。Stop重新确认inactive后才恢复form。并发executor可能已改变当前balance/active，不把初始值当永久状态。
7. rejected/failed/confirmation-unknown/verification-failed/refresh-failed分开；unknown只能核查原hash。链上confirmed之后任何event/read/backend失败只允许verification/reads retry，不再send。

账户/链变化前的旧operation只追踪其原snapshot；不会把旧refresh写入新account key。busy/unknown confirmation期间不开放另一次Auto或Manual提交。没有自动retry transaction、自动签名或自动reset/checkpoint。

## QA evidence

自动测试覆盖per-cell本金/执行费分离、full bigint、fixed/#25/random数量、产品rounds上限、预算/gas不足、unknown/active/config变化、simulation失败不发送、取消、receipt revert、event mismatch/重复、refresh失败不重发、签名前context变化和hash后原账户刷新。SSR UI测试覆盖form/card替换、缺失remaining空白、fee行、fixed只读与双语。

浏览器隔离fixture只位于仓库外，不挂signer或RPC，使用正式Mine UI与金额model：375px及1000px浏览器下main500px居中；fixed/random、preset替换、rounds上限、invalid cells、含fee余额不足、active隐藏tabs、backend003原样/缺失空白、Stop恢复、retry与keyboard。HarmonyOS Sans SC computed family正确，card背景#191B1F、radius8，amount surface rgba(13,15,19,.65)；无横向overflow。1.5px border保留原CSS；DPR1浏览器会按设备像素将computed border取整，本身不修改设计值。

正式localhost:5199/mine无签名检查Auto tab可打开、无横向overflow。Connected register/Stop和真实execution不能由fixture替代，留给人工测试网验收。最终命令结果在交付报告给出；临时fixture/工具完成后删除，不保留debug route。

## Real Testnet QA — 待人工执行

优先1格/1轮/极小正值amountPerSquare，使用专用Chain97测试钱包且留gas。分别验收register、active card、backend字段、Stop、receipt/event/refresh与账户/链恢复。

只有在当前implementation真正成功执行一轮后，核对automation balanceBefore−balanceAfter是否等于`amountPerSquare×count+executorFee`，才能将**AUTO EXECUTION FEE DEDUCTION**从**RUNTIME QA PENDING**升级为**VERIFIED**。注册成功、hash、RoundNotLive或历史版本模拟都不能代替此项。

最终自动QA：env:check、typecheck、lint、format:check、test（50 files / 632 tests）、build与git diff --check通过。vinext build保留既有静态route分类提示，不是交易/Workers部署验证。正式route与隔离UI浏览器均无本次runtime exception；真实Auto register/Stop/execution待人工，不将fixture或mock等同真实交易。

## Fast Autonomous Development checkpoint

用户已授权在automated QA / browser QA通过且无已知implementation blocker时创建本地checkpoint；仅缺真实环境验收记RUNTIME QA PENDING，不再要求implementation长期悬挂。此授权覆盖M4本地提交，取代上文原轮次的commit=NO限制；没有自动签名、广播、push或deploy授权。AUTO EXECUTION FEE DEDUCTION保持RUNTIME QA PENDING，不写成VERIFIED。

## Manual / Auto interaction audit — latest Human Decision

Audit确认Auto hook的eligibility不读取hasDeployedThisRound；otherBusy只表示Manual transaction仍在进行，不是Manual已部署。原active-card整体替换与Stop后恢复符合要求，无重写register/stop/query owner。必要修正只有Auto普通失败的公共提示收口；内部AutoState.error保持decoded category，confirmed+verify/refresh失败及confirmation unknown维持原安全恢复，不resend。

新增actual-hook/SSR测试证明Manual deployed=true/false不改变Auto eligibility、已部署仍可派发register intent；active removes entire Trade/tabs，inactive restores Trade而Manual单轮锁保留。普通失败统一提示，确认/核验/刷新异常仍专门引导read-only retry。本次补充不签名、广播、commit或push；M9既有未提交工作保留。
