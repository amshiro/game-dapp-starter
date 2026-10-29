# Mine Rewards Claim Transactions — Development97

本轮用户沿用M5名称扩展Rewards交易；task graph保留M5 read / M6 claim原票号，属于同一Mine Feature，不另开产品Gate。

## Human-approved contract

- 三字段/全零隐藏/条件入口沿用M5；ORI任一有值→领取→`P.claimAll(currentAccount)`，BNB有值→仅领取BNB→`P.claimEth(currentAccount)`。仅BNB时不显示claimAll。
- recipient固定当前交易账户，不开放第三方地址；无approve、无native value、无自动checkpoint或expired sweep。
- 不推算税后到账金额、手续费或领取窗口。simulation/合约约束决定当前调用是否可执行；未知窗口不阻塞此已授权Development实现，也不从About文案造规则。
- Development97 1 confirmation；hash不是success。receipt success、操作验证与相关reads成功后才business success。真实Claim必须由用户另行操作，本轮不签名/广播。

## Ownership / lifecycle

`MineReadPage → useMineClaim → ClaimTransaction → createClaimDependencies → Registry.oreProtocol`。未新增依赖、Provider或全局store；继续用Privy/Wagmi事实，TanStack Query持有Rewards/balance。Claim与Manual/Auto待签名、确认、恢复中的操作互相阻止并发，不把已Manual部署当Claim或Auto限制。

冻结account/chain97/Protocol/action；fresh reward query、对应asset>0、实时Wagmi连接匹配、RPC97、simulation、gas估计/余额检查、再次fresh read/simulation后才允许wallet write。每次尝试重新检查；旧simulation不是发送许可。

状态：idle → preparing → awaiting-signature → submitted → confirming → confirmed → refreshing → success；支持rejected/failed/confirmation unknown/verification-failed/refresh-failed。普通失败统一通用提示，拒签表示取消；内部保留typed category，不输出SDK原文/凭据。hash后继续追踪原97交易，不追踪新账户；replacement必须保持同from/to/input/value，否则不建立success。

receipt至少1确认；读取对应transaction验证from/Protocol/input/zero-value。ClaimEth需要匹配Protocol的ClaimEth(miner,to,positive amount)；claimAll需要匹配ClaimOre(miner,positive amount)，或canonical ORI Token从Protocol向冻结账户的正Transfer（覆盖refined-only路径）。不将event/return amount当净到账display，不用balance前后差做并发条件。缺少证据保持chain confirmed + verification failed，可重试验证/读取，不重发。

## Refresh / recovery

使用receipt之后block、原账户keys：

1. M5 canonical getUserRewards query invalidate/refetch；不本地减额或清零。
2. Wagmi native BNB balance query invalidate/refetch（包含claim与gas影响）。
3. claimAll另以Wagmi readContract balanceOf(originalAccount) query读取Registry ORI token余额。此read是领取后的余额证据，不将reward raw直接当到账额；不从Mine deep-import Stake owner。

claimEth不清空ORI；oriDirect/oriRefined始终以新getUserRewards结果为准。所有相关reads成功才success；任一失败保留chain confirmed，Retry Refresh只重复reads。相同account query复用，不把operation block建第二份server-state镜像。新账户UI使用其独立key，旧账户refresh不覆盖新账户。组件卸载/错链不把旧结果显示为新账户结果；未确认原交易继续阻止新操作。

## UI / Figma

重新通过Figma MCP读取frame2003:1413（Rewards唯一有奖状态）及现有全状态inventory；复用M5已审定card/icon/token/style，无新的Shared primitive。375px card347×188、primary323×44/radius22；PC main500居中、card472×188。正常/等待签名/确认/刷新文案放原按钮及最小aria-live状态，无大型提示系统。全零后Rewards区域仍隐藏，单独transaction status保留恢复入口，避免刷新失败时丢失原操作。

资产/映射继续按已确认BNB/ORI覆盖Figma占位ORE/BURY。支持中英文，键盘按钮/重试，保留HarmonyOS Sans SC与所有已核对surface properties。

## QA boundary

自动测试覆盖条件显隐、fresh reward guard、Registry/self recipient、simulation失败不发送、gas不足、单次prepare permission、拒签、receipt revert/success、event匹配/不匹配、refined token transfer、相关reads失败/恢复、只重试不resend、confirmation unknown、账户/链切换与原hash追踪、旧账户数据/状态隔离、claimEth不本地清除ORI、各pending按钮与通用错误/取消提示。

375/1000浏览器隔离真实UI/controller，使用仅内存mock dependencies（无wallet/RPC/send），测试claimEth→ORI保留、claimAll→全零隐藏、确认后refresh失败→键盘retry→发送次数不变、computed背景/边框/radius/geometry/字体。正式/mine访客同尺寸无claims泄漏/overflow/pageerror。临时fixture在/tmp，验收后删除，不加入正式runtime或Git。

**REWARDS REAL CLAIM QA = RUNTIME QA PENDING**：当前无非零真实奖励测试账户；模拟/隔离浏览器不冒充真实测试网Claim。M4 execution fee deduction与M9 live result transition仍各自RUNTIME QA PENDING，Stake Real Tx QA仍DEFERRED — TEST ORI REQUIRED。Production56独立Release Gate。

## Final checks

完整七项QA PASS（env/typecheck/lint/format/test/build/diff）；57 test files / 707 tests。浏览器375/1000（main500居中）实际card347/472×188、button323/448×44、radius22、显式background与dashed border正确；HarmonyOS字体、keyboard、claimEth保留ORI、refresh retry不resend、正式访客route与overflow均PASS。组件/transaction fixture只在/tmp，不进入runtime。当前实现未真实签名或广播。
