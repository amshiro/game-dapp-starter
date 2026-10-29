# Stake Transaction Slice 1 — Development 97

## 授权与证据边界

User Confirmed：当前 Chain 97 runtime 的 Approve、Deposit、Withdraw 路径足够进入实现。Approve exact amount simulation 成功；小额 `withdrawStake(amount, sameAccount)` simulation 成功；Deposit 的 allowance-negative simulation 返回 `ERC20InsufficientAllowance(ProtocolProxy, 0, 1)`，人工接受为 **RUNTIME PATH VERIFIED**，不再要求额外寻找公开成功 Deposit transaction。

这不是当前 implementation 与历史 artifact 完全相同的证明，也不是 Deposit 正向交易已经完成。用户已确认测试账户 ORI 为 0，并批准在真实交易 QA 暂缓时进行 Development implementation checkpoint；不把代码/mock/browser QA 记作真实交易已验证。Production 56、Claim / reward semantics、Mine transaction、polling/realtime 不在本 checkpoint 范围。

## 当前签收状态

| 项目 | 状态 |
| --- | --- |
| Stake UI | COMPLETE（当前批准的 UI Scope） |
| Stake Read | VERIFIED ON CHAIN 97（已通过人工验收） |
| Stake Tx implementation | COMPLETE（Approve / Deposit / Withdraw，自动与受控浏览器 QA 通过） |
| Stake Real Tx QA | DEFERRED — TEST ORI REQUIRED；测试账户 ORI 为 0，尚未完成真实 Approve / Deposit / Withdraw 验收 |
| Development 主线 | 上述真实交易 QA 暂缓不阻塞主线，用户已授权 checkpoint |
| Production 56 | RELEASE GATE，未验证、不在当前支持范围 |
| Claim | BLOCKED / LATER；收益语义未解锁 |

## Owner 与数据契约

- `features/stake/transaction`：金额验证、Feature-local operation owner、Wagmi/Viem adapter、生命周期与安全错误映射。
- `features/stake/read/stake-allowance.ts`：TanStack Query allowance；key 包含 chain、ORI token、Protocol proxy、account，不复制 Provider 的钱包事实。
- 仅 environment-selected Development 97 可操作，Registry 提供 ORI / Protocol proxy / View；不硬编码 RPC 或自行替换合约。ORI decimals=18 只在此部署得到 runtime 确认。
- `stake-read-page` 组合现有 read owner 和 transaction hook；视觉组件不发 RPC。交易只从用户按钮事件发起，render/effect 不提交交易。
- 输入保持 decimal string：正数、最多 18 位小数、无 exponent；`parseUnits` 转 bigint，拒绝 uint256 overflow。快捷计算 bigint 向下取整至最小单位；Max 为 ORI balance / staked principal，不扣 BNB gas。Figma 的 25% / 50% / 100% 三个按钮保留；100%=Max，纯函数同时覆盖 75%。

## 人工签收的写入与完成策略

| 操作 | 参数与完成条件 |
| --- | --- |
| Approve | `ORI.approve(P, exactAmount)`；P 为 Registry OreProtocol proxy；allowance 已足够则跳过。receipt success / 1 confirmation 后重读 allowance，达到 required amount 才继续 Deposit。绝不 unlimited approval。 |
| Deposit | `P.depositStake(rawAmount)`；当前账户/97/余额/allowance 再校验、当次 simulation 成功后请求钱包。 |
| Withdraw | `P.withdrawStake(rawAmount, operationAccount)`；recipient 固定发起账户，不提供自定义地址；金额不超过当前 staked。 |
| Chain confirmed | Viem 等待 1 confirmation，且 `receipt.status === success`。hash 仅表示提交。 |
| Business success | Deposit 刷新 available / staked / total / allowance；Withdraw 刷新 available / staked / total。个人读取必须成功；实现同时要求上述相关 reads 成功。全局 total 不做精确 delta 断言。无 backend reconciliation owner。 |
| Refresh failure | 保留 chain confirmed 与 hash，显示刷新失败；Retry refresh 只重读，不重新提交。若 Approve 后刷新曾失败，恢复只完成读取，必须再主动点击 Deposit，不自动请求下一笔交易。 |

每次 simulate 后再次读取/验证金额对应余额、allowance 及上下文。提交参数来自不可变 operation；链或账户在请求钱包前变化会停止。钱包确认框一旦打开，其取消操作由用户在钱包执行；前端不声称能够撤回钱包已接收的请求。

## 生命周期与并发边界

`idle → preparing → awaiting-signature → submitted → confirming → confirmed → refreshing → success`；分支 `rejected / failed / refresh-failed`。

- 一条 operation 串行拥有 Approve→Deposit，审批刷新与下一步 preflight 之间也不允许插入另一条操作。
- 得到 hash 后按原 account / chain / hash 跟踪，切换账户不丢弃 receipt。刷新只写原 account 的 Query key；新账户的 UI 不接收旧账户数据。
- post-receipt 读取选择不早于 receipt 的新 block，取消旧 in-flight query，invalidate 后 fetch，避免旧请求或旧 RPC head 被误认成刷新成功。
- 同 intent speed-up 跟踪 replacement hash；取消或改变 to/from/calldata/value 的替换不记作 Stake 成功。
- 确认超时/未知保留 hash、禁止新提交；Check transaction 只重新等 receipt 与刷新，不重发，也不自动继续 Deposit。
- 该 owner 为挂载期间的 Feature-local owner；离开页面/浏览器 reload 不提供持久 transaction journal。若中途离开，reviewer 应用原 hash 在 explorer 核实结果并重读余额，不能凭空白状态认定交易未提交。
- 用户拒绝、错链、账户变化、ORI不足、BNB gas不足、allowance不足、contract revert、RPC错误、receipt revert、未知确认、替换取消、确认后刷新失败分别映射安全双语文案，不输出原始 provider/session 错误。

## Figma 与交互

当前 ORI-AI测试完整读取 `2003:1949`（8-Stake / Deposit）和 `2003:2073`（9-Withdraw）。复用既有 S1 composition，不引入第二套表单/全局 transaction UI；缺少的中间状态使用面板下现有 status 区、action label、explorer link 与 retry 控件。

| 属性 | 设计 / 实现值 |
| --- | --- |
| 375 面板 | 347×223，padding 15px 12px 12px，#191B1F，radius 8px |
| Tabs | 323×32，#25262A；active #303135，13px / 500（inactive 400） |
| Amount surface | 323×56，rgba(13,15,19,.65)，1.5px #25262A，radius 8px |
| Amount / asset | 24px / 500、16px / 500；HarmonyOS Sans SC |
| Shortcuts | 三个 52×24，#25262A，radius 8px，12px / 400；间隔 8px / 6px |
| Action | 323×44，white，radius 22px，15px / 500；disabled opacity .45 为既有最小交互状态 |

宽度随 main 自适应，PC main max 500px 居中；内容不按 375 等比放大。金额字段可水平浏览长输入，余额保留 exact title/accessibility value，极长内容允许自然换行。DPR=1 浏览器将 1.5px border computed 为 1px（设备像素取整），CSS 保留设计的 1.5px，不通过额外 shadow 伪造边框。SOL 图标不复用；ORI icon 仍为 Q-03。

## 人工真实测试网验收

代码/mock/browser QA 不能替代真实 write 验收。使用稳定 OKX profile、Development / BSC Testnet 97，仅操作 reviewer 自己的测试账户；需要少量测试 ORI 和 BNB gas，Agent 不寻找/转移资产。

1. 在 `/stake` 确认目标 97、Available ORI > 0。先测试一次拒绝钱包请求：页面应可恢复、不得误报成功。
2. 输入小额（例如 `0.000001` ORI，且不超过可用余额）。若 allowance 不足，Approve exact amount：钱包内核对 token、spender P 与额度；由用户确认。
3. 等 Approve receipt success / 1 confirmation、allowance 重读通过，才出现 Deposit 钱包请求。用户核对 amount、P 和网络，再亲自确认。
4. 核对两笔（已有足够 allowance 时只有 Deposit 一笔）的 explorer receipt；确认余额、staked、total、allowance 刷新成功才显示 Deposit success。不以 hash 当成功，不要求并发环境下 total 精确增加该 amount。
5. Withdraw 同一个小额至自己：核对 recipient/current account、金额和网络；用户确认后检查 receipt、available/staked/total 刷新。
6. 错链/切账户必须阻止未发起操作；已提交的原 hash 应继续被追踪。刷新失败只使用 Retry refresh；确认未知只使用 Check transaction，不重新发送。
7. 当前测试钱包 ORI 为零，真实交易验收状态为 **DEFERRED — TEST ORI REQUIRED**。测试 ORI 到位后再由用户执行上述步骤；实现 checkpoint 不表示真实交易通过，Claim 与 Production 56 的 Gate 不变。
