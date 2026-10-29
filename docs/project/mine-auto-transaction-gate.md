# M4 — Auto Mine Transaction Gate

## 范围与结论

2026-10-29；Repository baseline `ecedbdbd80d80475246c8e7da3799b7b54de5201`。仅 Development / BSC Testnet 97。M3 已由用户完成真实交易验收；Stake Real Tx QA 仍为 **DEFERRED — TEST ORI REQUIRED**，不阻塞本 Gate。

本轮只做 Figma/源码/ABI 核对、RPC read、`eth_call` 和 `eth_simulateV1`。没有 signer、签名、广播、链上写入、正式 Auto 实现、polling 或 realtime。模拟账户为无 code 的合成公开地址 `0x0000…a111`；100 tBNB 仅为非持久化 balance override，不是注资。执行器权限实验仅在虚拟调用中使用链上公开 admin 作为 caller，不持有其凭据。

**Development implementation：Human approved，允许M4 Core实现。** 当前 register / getter / stop 路径已验证；实际每次执行扣费只有历史区块上下文模拟证据，未能证明该历史 implementation 与当前相同。不能据此宣布当前完整Auto资金路径已验证。人工明确接受该Development证据边界，不再阻塞implementation；**AUTO EXECUTION FEE DEDUCTION = RUNTIME QA PENDING**，必须真实Auto execution QA后关闭。M4产品层Human Decisions已全部closed。产品公式仍是已签收事实，不标OPEN。

来源优先级：本次人工规则 → 当前 ORI-AI测试 → Repository docs/ABI → Mine Historical Functional Baseline → runtime 可行性。合约接受某参数不等于产品允许使用。

## 已锁定产品规则

- Manual / Auto 输入都是 `amountPerSquare`，每格 native BNB，18 decimals。`blocks` 是每轮格数，不是 blockchain block。
- 有 board selection：fixed，`mask` 为所选格位图，`randomizeMask=false`，count 为所选数量。无 selection：random，输入格数，经验证编码为 `mask=count`、`randomizeMask=true`。
- 当前账户 automation `active=true`：整个 Manual/Auto form 被 Running Card 替换，无模式切换、全选或再次注册入口。未知 account read 必须 fail closed，不能把 read error 当 inactive。
- Stop 调用 `stopAutomation(currentAccount)`；receipt success + 1 confirmation + reads refresh，确认 inactive 后恢复表单；前端不计算或转账退款。
- 页面每轮总计、总部署和按钮金额只显示本金。余额检查和实际 value 必须含执行费及 gas 能力。允许下一阶段增加最小执行费说明行，不是本轮新增 UI。
- **Human approved追加**：Auto rounds输入限制为1–9999，只是前端产品限制，不是已验证contract maximum。
- **Human approved追加**：Running Card剩余回合唯一display owner为`POST /ori/automation/user`的`extend_data.round_remaining`；按后端字段原样显示，缺失留空，不主动显示—，不从balance、per-round cost或executorFee估算。计算属于backend responsibility。
- Manual 每账户每实际 round 最多一次成功；Auto 注册成功不等于已经执行任何 round。Stop 后恢复表单不自动授予同轮 Manual 提交资格。

## 证据索引

| 来源                                                                                                                      | 本轮用途                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Contract Registry](../../src/shared/config/evm-contracts.ts)                                                             | 97 当前 P / View 地址，无旧 RPC/address 回退                                           |
| [Protocol ABI](../../src/shared/config/abi/ore-protocol.ts)、[View ABI](../../src/shared/config/abi/ore-protocol-view.ts) | signature、tuple 顺序、errors、events                                                  |
| `ori-website/components/trade.tsx:210–300`                                                                                | 历史 fixed/random 编码、config fee、资金公式；不移植旧 Number 位运算、日志或 UI        |
| `ori-website/components/auto.tsx`                                                                                         | 历史 Running Card、Stop 和 remaining display；不继承旧单位/成功语义                    |
| [API Contract](./api-reference/user-api.md) 的 `/ori/automation/user`                                                     | 正式字段样例与当前 null response 对照                                                  |
| Figma `2003:1832`、`2003:1413` 完整 context/截图及直接 Auto 子节点                                                        | 本次重新读取配置/运行态；字段对应见下表                                                |
| 当前状态 RPC snapshots                                                                                                    | baseline block `139564408`；后续当前模拟到 `139567740` 附近；下述数值只代表本次快照    |
| 历史上下文模拟                                                                                                            | base block `139552764`，虚拟 child `139552765`；不能当真实交易或未经核对的当前版本证据 |

## 当前部署与方法

- Protocol P：`0x8Cc12430C18187cE40002c9a67f803fc5591344a`，code 非空（170 bytes）。
- View：`0xF2db01A5Ef364a55C9aCBDC2223711fB6Ea334A4`，code 非空（7921 bytes）。
- 当前 ERC-1967 implementation：`0xad754f027ba3a74c7809d5229681ed7c56f3a158`。本轮只证明列明路径，不认证整份历史 ABI 或 bytecode。

| Method             | Signature / selector                                                                    | Mutability / return | 当前结果                                                     |
| ------------------ | --------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------ |
| registerAutomation | `registerAutomation((address,uint256,uint256,uint256,bool,bool,uint96))` / `0x1a3746c1` | payable；无返回     | fixed/random 均 simulation PASS                              |
| stopAutomation     | `stopAutomation(address)` / `0xedb39d70`                                                | nonpayable；无返回  | 虚拟 register → self stop PASS                               |
| config             | `config()` / `0x79502c55`                                                               | view；9 个 output   | PASS；executorFee 是第9项/index8、uint96                     |
| getAutomation      | `getAutomation(address)` / `0x84bf220a`                                                 | view；七字段 tuple  | 当前读及虚拟 populated 读 PASS                               |
| automations        | `automations(address)` / `0xb9ad4357`                                                   | ABI 声明 view       | 当前 RPC code `3`，`execution reverted: 0x`；不得用此 getter |

`config()` ABI 顺序：feeCollector、buryAuthority、swapOriProgram、swapOriPointProgram、vrfKeyHash、vrfSubId、vrfMinConfirmations、vrfCallbackGasLimit、executorFee。其余字段不解释成费用。

### Register tuple：ABI 顺序与实际覆盖

| 顺序 / 字段       | 类型    | 未来前端传值                   | 当前非持久化 register → getAutomation 证据            |
| ----------------- | ------- | ------------------------------ | ----------------------------------------------------- |
| 1 owner           | address | current account                | 传另一个地址仍保存 msg.sender；不是代他人注册入口     |
| 2 balance         | uint256 | 0                              | 传123仍保存完整 msg.value；不是要求参数必须0          |
| 3 mask            | uint256 | fixed bitmask / random count   | 按模式保存，见边界实验                                |
| 4 amountPerSquare | uint256 | parseEther(input)，正值 bigint | 按传入保存；runtime 接受0不构成产品许可               |
| 5 randomizeMask   | bool    | fixed=false / random=true      | 原样保存                                              |
| 6 active          | bool    | true                           | 传false会保存false；不能假定 runtime 自动改true       |
| 7 botFee          | uint96  | 0                              | 传123仍保存当前 config.executorFee；不是要求参数必须0 |

正常候选对象保留 owner=currentAccount、balance=0、botFee=0、active=true；ABI 编码必须用以上字段顺序，不按对象展示顺序猜。链上 balance 是预存 native BNB wei，不是 ORI。

## Fixed / random / value / rounds 实验

本次测试 amountPerSquare=`1,000,000,000,000 wei`，count=2，executorFee=`1,000,000,000,000 wei`；候选3轮 value=`9,000,000,000,000 wei`。所有 PASS 均指不持久化模拟，不是实际付款。

| 实验                                 | 当前结果                                    | 边界                                                      |
| ------------------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| fixed mask=5（UI #1/#3）             | PASS                                        | UI #n → bit(n−1)，bigint `1n << index`；无独立 round 参数 |
| fixed mask=0 / bit25                 | `InvalidMask`                               | bit25 是第26格，超出棋盘                                  |
| fixed bit24 / 全25位 `33554431`      | PASS / PASS                                 | 支持 #25 和25格位图，不因此增加全选按钮                   |
| random mask=count：0 / 1 / 25 / 26   | `InvalidMask` / PASS / PASS / `InvalidMask` | 提交有效 count=1–25；0只能是未填草稿状态                  |
| fixed exact / 少1wei / 多1wei        | 全部 PASS                                   | runtime 不强制刚好整数轮预算                              |
| random exact / 少1wei / 多1wei       | 全部 PASS                                   | 余额保存实际 value，不自动补足或截断                      |
| 按0 / 1 / 9999 / 10000轮公式 funding | 全部 PASS                                   | ABI 无 rounds 字段；没有证据证明9999是合约上限            |
| value=0 / 一轮费用少1wei             | 均可注册，active=true                       | 不等于能执行完整一轮，前端不能沿用这种 permissive 行为    |
| amountPerSquare=0                    | PASS                                        | 产品输入仍须正值，不新增零金额功能                        |

**Rounds 的技术含义**：前端以预存资金表达资助N次执行意图；P.getAutomation不返回requestedRounds/remainingRounds。当前人工已锁定输入1–9999，10000轮预算simulation被接受仅说明它不是已证合约上限。Running Card的剩余回合由`POST /ori/automation/user → extend_data.round_remaining`原样展示；没有字段就留空。**禁止**以前端balance除以每轮成本、executorFee等方式推导或补齐remaining。该字段计算方式是backend责任，不再是产品OPEN。

### 本金与实际钱包支出

人工签收公式保持：

```text
principalPerRound = amountPerSquareWei × count
principalTotal = principalPerRound × rounds
executorFees = config.executorFee × rounds
requiredValue = (principalPerRound + config.executorFee) × rounds
wallet requirement = requiredValue + gas capability
```

示例只用于说明：.02 BNB/格 ×4格 ×3轮：页面 .08/轮、.24 总本金；按本次 fee 快照，执行费 .000003，value .240003 BNB，另需 gas。不把 Figma `.02/.06` 或本次 fee 常量写入 runtime。

- 当前 `config.executorFee=10^12`，注册时保存 `botFee=10^12`。当前 snapshot 足以确认配置/注册字段。
- 历史执行上下文证明该值为 native BNB wei、每次成功 execution 额外支付一次；不是每格收费，也不是一次 registration 总手续费。详见下节的版本限制。
- 未证明它包含协议全部其他费用；不能据此解释平台1%、claim fee、payout或跨版本费率变更规则。不自行在 funding 公式再加1%。
- exact / ±1全部接受说明公式是前端预算策略，不是合约强制 value 等式；不会与人工精确预算规则冲突。

## 当前与历史执行证据必须分开

### 当前状态：注册、重复拦截、停止均成功

虚拟批次 register → P getter → View getter → duplicate register → wrong-caller stop → self stop → P getter：

- P 保存 balance=9×10^12、mask5、perSquare10^12、active=true、botFee10^12。View 六字段投影与 P 前六项相同，View 不提供 botFee。
- 第二次 register：`AutomationAlreadyActive`。失败不改变已注册数据。
- 其他 caller stop：`AutomationNotAuthorized`；本人 stop 成功。
- self stop native transfer trace：P → caller 完整9×10^12 wei。trace 是节点模拟信息，不是链上 ERC20 Transfer event。
- Stop 发出 AutomationUpdated，cfg balance=0/active=false；该事件仍保留 owner/mask/amount/botFee，但随后 getter 返回全零 tuple，说明记录已删除。不能要求事件与删除后完整 tuple 相等。
- 从未拥有该配置、或已 stop 删除后，再 stop 均 `AutomationNotAuthorized`。
- underfunded预算、random注册也可 self stop，按实际余额退回。前端不用另发退款交易。
- 虚拟实验前后真实 synthetic account getAutomation 都全零/inactive，没有链上状态改动。

当前存储 round1655，start/end block=`139552763/139552897`，canDeploy=false、canReset=true，getGameState raw `[2,0]`。注册仍 PASS，足以证明不受“必须 Manual gameState=1”这一条件限制；不把单个状态样本写成所有未来状态都保证成功，仍要 fresh simulation。已知当前存储轮有部署的公开账户 `0x7FB3…e5DC`，register simulation 也 PASS；这与最新Human Decision“Manual已部署不阻塞Auto Register”一致；不添加hasDeployedThisRound注册限制。只有链上active Auto整体替换Trade Card，Manual单轮一次规则单独保留。

### 历史上下文：执行费、random 执行、执行后 stop

在 base139552764（当轮区间内）的虚拟 child139552765：

| 批次                             | 观察                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| fixed：register9×10^12 → execute | balance变6×10^12，active=true；DeployEvent round1655/mask5/totalAmount2×10^12/automation=true                  |
| executor transfer                | P → public admin1×10^12 wei；balance减少3×10^12=本金2×10^12+执行费1×10^12                                      |
| execute后stop                    | 合约退回6×10^12，getter全零；前端无额外转账                                                                    |
| 只资助1轮                        | execute后balance0、active=false，但owner/config仍存在；本人stop仍可成功并清空记录。stop不是简单要求active=true |
| random count2                    | 存储mask保持2；DeployEvent实际mask262152（bits3/18，两格），本金2×10^12、执行费1×10^12；stop退款6×10^12        |

`AutomationExecuted.totalCost` 在该证据中是 **本金2×10^12**，不是余额含费扣减3×10^12。不得按 event 名字推导最终钱包支出。无 admin 权限的虚拟 caller / owner 均得到 `Error("sender should be admin")`；public admin 在当前已结束轮返回 `RoundNotLive`，历史有效上下文才成功。不证明当前执行器服务实际运行，更不授权前端调用 executeAutomation。

**版本/可用性限制**：历史 ERC-1967 slot / config / game read 返回 RPC `-32000 missing trie node`，无法把历史执行与当前 implementation绑定。当前状态模拟回退 block number 也被拒绝：`-38020 block numbers must be in order: 139552765 <= 139567740`。没有覆盖未知 storage、没有 reset/VRF、更未发送交易。故本轮 executorFee 的当前扣减语义、完整N轮预算消费保持 PARTIAL。最小技术补证是：当前版本在有效轮次的成功非持久化 execution，或可信的相同 implementation 版本关联证据；不要求真实付款。

最近500-block AutomationUpdated logs 查询返回 `-32005 limit exceeded`，未得到可引用的当前真实 register/stop receipt。不无限扫描，不把历史模拟写成近期真实交易成功。

## Canonical account owner 与 API

**当前技术 owner：P.getAutomation(account)**；Query identity 必含 chain + Protocol deployment + account。P.config 为注册费用来源；已注册 botFee 从七字段记录读取，不能无条件用新config覆盖旧账户配置。View六字段可作投影，但不是完整fee模型；`automations(address)` 不兼容不影响已验证 P.getAutomation 路径，仍须记录 ABI 局部不兼容。

运行卡替换条件为 `active=true`；不是 backend id、balance>0或owner非零。当前 runtime允许active=true/balance0，历史耗尽状态也可能active=false/owner非零。read未知或错误不授权register，且不得因账户切换沿用旧账户的运行卡。

`POST /ori/automation/user`：zero、正式Contract示例账户 `0x0537…0513`、synthetic三样本均HTTP200/data:null。状态为 **PARTIAL — populated contract unverified**。正式示例有 id/user/auto/start_round_id/mask/amount_per_square/balance/total_balance/round_id/randomize_mask 和 extend_data.round_remaining/total_per_round/blocks，但不能证明当前非空值、单位、索引延迟或链一致性。

历史 Running Card 还用 extend_data.selected；正式示例未声明。旧 total_per_round 按8 decimals展示，不能移植为Chain97 BNB18。大整数原始值/ID保留bigint或安全十进制string，不能把JSON不安全number当已恢复的精确金额。Backend只作已签收 enrichment；缺少非空样本不阻塞链上active owner，但仍不能填造remaining/total_per_round。**最新人工签收**：remaining字段owner与展示行为已closed，不因populated样本未验证而重新打开产品Gate；实现时若缺失就留空，不发明估算或—fallback。历史`components/auto.tsx:158`也直接展示`info?.extend_data?.round_remaining`。

## Figma Auto 字段 → 产品 → runtime

本轮重新获取 `2003:1832`（未选/已选两个配置状态）与 `2003:1413`（同一Mine页运行态）完整context与截图，并核对以下直接子节点。不创建页面/资产/业务代码。

| Figma field / node                                    | 人工产品含义                        | Runtime / 状态                                                                          |
| ----------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| amount `1920/1922`，未选版本 `1869`                   | 每格BNB金额；不是每轮总额           | bigint parseEther → cfg.amountPerSquare                                                 |
| Blocks `1835/1892` 与格数输入/已选列表                | 每轮格数；固定selected或随机count   | fixed popcount(mask)；random cfg.mask=count，提交1–25                                   |
| Rounds `1850/1857/1908`；标注 `1947/1948`             | 默认1，计划资助轮数                 | 前端产品限制1–9999，非contract maximum；无ABI字段，用于value                            |
| selected list（1832下已选状态）                       | #2/#8/#14/#22等是视觉示例           | UI #n→bit(n−1)，非runtime默认选择                                                       |
| Random×25 `1672`                                      | 无fixed selection时random模式/count | cfg.randomizeMask/cfg.mask；非每25个block执行一次                                       |
| Total per round `1836/1893/1896`、running `1671/1674` | 每格金额×格数，本金only             | 新模型自行bigint计算；Figma .02/ORE占位被人工覆盖                                       |
| Total / Deploy `1897/1938–1940`                       | 多轮本金，不含执行费                | amountPerSquare×count×rounds；Figma .06/SOL不是runtime默认                              |
| executor fee（原稿无独立行）                          | Human-approved最小额外费用说明      | fresh config.executorFee×rounds；具体行格式下一阶段按最小扩展                           |
| active card `1667–1681`                               | 整体替换form，无tabs/第二次register | P.getAutomation(account).active；未知fail closed                                        |
| Round remaining `1670/1673`                           | 后端负责计算剩余回合                | POST /ori/automation/user → extend_data.round_remaining，原样显示；缺失留空；前端不估算 |
| Stop `1679–1681`                                      | 本人停止，合约处理退款              | P.stopAutomation(currentAccount)；receipt/event/read                                    |

Figma card费用排版实现仍需后续375/500 property-level与截图QA。本Gate没有改UI，不能报告新Auto页面视觉已通过。

## Lifecycle / matching event / refresh 契约

沿用人工签收：idle → preparing → awaiting-signature → submitted → confirming → confirmed → refreshing → success。另分 rejected / failed / confirmation-unknown / verification-failed / refresh-failed。Chain97仅1 confirmation；hash != success。

- Register preflight：快照account/chain/mode/mask/count/perSquare/rounds；fresh active/config/native balance，含gas能力；按人工精确公式构造value并simulation。read未知、active存在或simulation失败都不打开钱包。不得套Manual canDeploy作为注册唯一门槛，但任何真实约束以fresh simulation为准。
- Register receipt：status success + 1 confirmation；P地址的匹配 AutomationUpdated，user=原账户、cfg owner/mask/amount/random/active=true及注册余额/fee与请求/快照一致。注册确认不等于已自动下注。
- Stop preflight：当前账户自己的配置/权限，fresh stop simulation；调用参数为退款recipient（ABI参数名to），正常产品固定self。wrong caller和wrong recipient不是同一个概念；本轮不测试或开放第三方recipient。
- Stop receipt：status success + 1 confirmation；P地址 AutomationUpdated user=原账户、cfg.active=false/balance0；不能要求event其余字段也为0。
- Register/Stop确认后 invalidate/refetch 原账户 automation query、native BNB balance，以及已存在的对应public/account Mine reads；这些Query key须实现阶段归Mine owner，不虚构目前不存在的Auto key。未来执行事件只是freshness signal，不是第二个余额owner。
- operation相关reads重读成功才是business success。若executor并发执行/停机，应以最新链上状态保留其语义，不能要求余额永远等于初始value或用全局total严格delta判成功；事件证明原注册/停止动作，fresh read决定当前card。
- confirmed+refresh-failed保留chain-confirmed/hash，只允许retry reads，不能resend。account/chain切换后仍追踪原交易快照，不污染新账户表单；Stop退款不由前端补发。

当前register/stop的事件兼容已由虚拟批次证明；上述真实receipt与应用lifecycle尚未实现/验收，不报告真实Auto TX PASS。

### Error taxonomy（实现约束，不新增UI）

| Register                                   | 区分与处理                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| invalid blocks / rounds / amount           | count1–25、rounds产品限制1–9999、perSquare正值；不要把9999描述成contract maximum |
| insufficient BNB                           | 检查requiredValue+gas，不只比较页面本金                                          |
| active / unknown account                   | AutomationAlreadyActive或read未知；fail closed，重读当前账户                     |
| invalid value                              | 前端预算应精确；runtime接受±1，不虚构 InvalidValue 错误                          |
| wrong chain / account changed              | 签名前与快照再核对，不替其他账户提交                                             |
| simulation / contract revert               | decode已知错误、保留安全分类，不展示原始SDK/provider对象                         |
| RPC/network / reject / receipt reverted    | 分开可重试读取、用户取消、链上失败；不自动广播                                   |
| confirmation unknown / verification failed | 保留hash核查receipt/event；不能假定success或自动重发                             |
| refresh failed                             | 保留chain confirmed，仅Retry reads                                               |

| Stop                                                 | 区分与处理                                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| 无配置 / caller不符                                  | 当前均可AutomationNotAuthorized；按fresh getter区分，不能只按错误名称造产品解释   |
| inactive但owner仍存在                                | 历史耗尽后stop可执行；不宣称所有inactive都会revert；产品RunningCard仍按active控制 |
| reject / RPC / receipt revert / confirmation unknown | 沿用原交易快照与安全分类，不自动重发                                              |
| confirmed / refresh failed                           | 保留确认，重读automation/native/public reads；不另发退款                          |

## Final Gate Table

| Item                    | Status   | Evidence                                                                                                     |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| registerAutomation ABI  | VERIFIED | 当前97 selector0x1a3746c1，payable七字段tuple，simulation及虚拟populated/event                               |
| params                  | VERIFIED | owner/balance/botFee覆盖；mask/amount/random/active保存；前端必须显式active=true                             |
| fixed mask              | VERIFIED | mask5、bit24、全25位PASS；0/bit25 InvalidMask                                                                |
| random blocks encoding  | VERIFIED | mask=count，1/25 PASS、0/26 InvalidMask；历史执行产生对应数量真实位图                                        |
| rounds semantics        | VERIFIED | 无rounds参数；预存预算表达资助意图；产品输入1–9999；remaining由backend round_remaining直出，缺失留空，不计算 |
| executorFee             | PARTIAL  | 当前config和stored botFee=10^12；native wei/每execution扣款仅历史上下文，版本关联未证                        |
| msg.value formula       | PARTIAL  | 人工公式已锁定；当前exact/±1全部接受；完整执行扣费仍缺当前版本补证                                           |
| active automation owner | VERIFIED | 当前P.getAutomation七字段；View六字段投影；backend populated unverified不替代链owner                         |
| stopAutomation          | VERIFIED | 当前self stop成功、wrong caller/已删除为AutomationNotAuthorized，event+getter一致                            |
| refund responsibility   | VERIFIED | 当前虚拟stop由P退完整未执行余额；历史执行后退余额，前端不发退款                                              |
| events                  | VERIFIED | 当前register/stop均AutomationUpdated；历史AutomationExecuted.totalCost仅本金，未取得近期真实receipt          |
| Business Success        | VERIFIED | 人工receipt success+1confirm+matching event+相关reads；refresh失败只读重试；实际Auto TX QA未执行             |

**M4 Development Core implementation已人工放行；execution QA仍PENDING**。仅当前版本execution扣费/预算消费待真实Auto execution QA补证，不再是Development implementation blocker；不扩大到源码全量认证、主网、Rewards或新keeper实现。backend非空契约与真实bot服务能力仍未验证，不能宣称端到端Auto已运行。

## Human Decisions — CLOSED

本轮M4产品需求全部closed：rounds=1–9999是前端产品限制；Running Card的remaining直接来自backend `extend_data.round_remaining`，缺失留空；不从链上balance或fee估算，不主动补—。其余已批准产品规则保持不变。

### HUMAN DECISIONS REQUIRED

NONE。API populated contract尚未取得是运行证据限制，不重新成为产品字段owner选择题。本轮不扩大到其他Mine产品Gate。

## Execution Runtime Verification Pending — 前轮定点证据

本次只读取当前implementation/config/round，并做一次当前状态非持久化register → read → executeAutomation → read，不重新扫描API/历史logs或讨论产品规则。

| Item                     | 最新证据                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Chain / pinned block     | 97 / 139572425；虚拟child139572426                                                           |
| 当前implementation       | 0xad754f027ba3a74c7809d5229681ed7c56f3a158，与前次相同                                       |
| config.executorFee       | 1000000000000 wei；注册后的stored botFee同值                                                 |
| executeAutomation        | executeAutomation(address)，selector0xdb326efc；使用链上当前admin作虚拟caller，无凭据/签名   |
| Current round            | stored1655，start139552763/end139552897；canDeploy=false、canReset=true，gameState raw [2,0] |
| 模拟资金                 | amountPerSquare=10^12、count2、3轮含fee预算9×10^12 wei，全部是虚拟余额                       |
| Before / execute / after | register成功；before balance9×10^12；execute失败RoundNotLive；after仍9×10^12，delta=0        |
| 证据含义                 | 轮已不live，未到成功execution，0差值不是“执行免手续费”证据；未能验证本次成功扣本金+fee       |
| 真实链状态               | synthetic账户getAutomation仍全零/inactive，无真实注册或执行                                  |

分类：**runtime path technically unresolved**。不是产品公式OPEN，也不是已发现公式冲突。当前deployment轮次状态无法得到正向execution evidence；不发送reset/checkpoint/VRF，不改storage，不用历史版本冒充当前，不扩大调查。

**是否足够进入Development Auto implementation：YES — Human approved exception。** 产品规则已齐备，当前RoundNotLive未提供相反公式证据；人工授权按已确认公式实现。成功execution的实际扣费保留RUNTIME QA PENDING，真实Auto execution QA后关闭；不推广Production56。M4 Core当前实现与QA边界见[实现记录](./mine-auto-core-implementation.md)。

## QA / 后续边界

本轮仅项目文档变更：检查内容/链接/跨文档一致性，执行 `pnpm format:check` 和 `git diff --check`。仓库format脚本按既有 `.prettierignore` 排除docs；新增Gate文件另显式绕过ignore执行Prettier检查，已有项目文档保持其现有格式。RPC只读/虚拟matrix为技术证据，不等于应用自动测试或真实Testnet TX验收；无UI改动，不重复声称375/500回归。临时工具位于仓库外，完成后删除，不进入正式runtime或Git。未commit/push/deploy。
