# M5 — Mine Rewards read/UI

## Human decisions applied

- `ethAmount` → BNB；`oriDirect` → 未精炼 ORI；`oriRefined` → 已精炼 ORI。Q-25 CLOSED。
- 三项raw全零隐藏整个Rewards区域，不展示三行零值/禁用领取按钮；未知/失败不当零。I-30 CLOSED。
- 沿用人工确认的historical规则：非零行显示；任一ORI>0显示领取→`claimAll`；BNB>0显示仅领取BNB→`claimEth`；BNB-only只有后者。
- M5仅read/UI，两个入口的visible与可执行分离：目前原生disabled，有可访问的只读说明。未实现Claim writes，不承诺raw等于扣税后的立即到账金额。税/窗口/recipient/资金完成验证属于M6，不重新打开已签收的映射/显隐问题。

## Canonical owner / architecture

`MineReadPage → useMineRewards → createMineRewardsQuery → Registry.oreProtocol.getUserRewards(account)`。TanStack Query持有链上server state，纯presentMineRewards映射typed display model，MineRewardState只做展示。无新store、Provider、dependency、env或backend API。

Query identity：mine/rewards + environment chain + Protocol deployment + ORI deployment + account。只在ready account、correct chain、Development97 client时启用；imperative fetch同样检查，不会绕过disabled。RPC chain确认97后固定同一latest block读取tuple。minimumBlock可用于未来receipt-aware读取，不另建历史缓存owner。

使用raw bigint与Viem formatUnits(18)，BNB wei与97 ORI metadata均18decimals；保留exact字符串/原始值，无Number/parseFloat、税/到期/净额推导。标签不从ABI变量名误解释为ETH/BURY/起源。

账户切换使用独立key、无previousData；断开隐藏个人Rewards，错链隐藏旧额，失败隐藏cached成功值并提供只读Refresh。正常focus/reconnect/refetch使用现有Query行为，staleTime30s、无interval/polling。顶部手动Refresh涵盖reward owner；Rewards不依赖当前Auto active，也不创建第二个balance owner。

## Current Figma full-state scan / properties

重新读取ORI-AI测试page2003:178，核对全部Mine 182/629/1009/1038/1413/1715/1832；Rewards唯一有奖稿在1413，直接节点1682–1714。重新读取1413完整context与screenshot、1683surface、1704/1713资产。零/BNB-only/ORI-only由真实raw数据派生，不把Figma example amounts用于runtime。

| Node/property         | Figma                                               | Implementation / computed target                                                                                    |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1682 title            | 20px Medium, line23, white                          | HarmonyOS Sans SC / 20px / 500 / 23px                                                                               |
| 1683 card             | 347×188 at375, #0D0F13, 1px dashed #25262A, radius8 | explicit background rgb(13,15,19), 1px dashed rgb(37,38,42), 8px; all-positive normal content188px, long text可增高 |
| 1687/1692/1699 labels | 13px Regular, line15, #868789                       | 13px/400/15px rgb(134,135,137)                                                                                      |
| info1691/1696/1707    | 12×12                                               | existing /ori/mine/info.svg 12px                                                                                    |
| asset1704/1713/1714   | 14×14                                               | BNB人工asset override；ORI现有相同Figma资源14px                                                                     |
| 1685 primary          | 323×44 at375, gold1px, radius22                     | 44px / 1px rgb(239,196,98) / 22px                                                                                   |
| 1686 primary copy     | 15px Medium, line18                                 | 15px / 500 / 18px                                                                                                   |
| 1688 secondary        | 14px Regular, line16, #868789                       | 14px / 400 / 16px; transparent                                                                                      |

1px border计入box model，card padding11px使内容外沿距card12px、primary宽323；bottom15px使三行/双入口自然总高188。少行/少入口自适应紧凑布局，避免保留不存在的零值行空间。长精确值可换行，不截断source、不横向溢出。

当前Figma的ORE/BURY文案/首行token形状被已签收资产映射覆盖。ORI1713资源sha256与既有explore/ori-token.png相同，复用不复制；BNB符号从历史标准BNBIcon恢复，仅路径和颜色，不继承旧UI。无新Shared primitive；卡片、行、状态均Mine-local。

## Read-only runtime evidence

BSC Testnet97 block **139583090**：P/View/ORI均有bytecode；ORI symbol=ORI，decimals=18；P.ORI_TOKEN与Registry一致。P.getUserRewards(zeroAddress)与P自身公开地址均返回三项uint256=0；View对zeroAddress也返回相同结构。canonical只使用P，不建立双owner。仅RPC read，无signature/send/write，未访问或输出私钥/钱包凭据。

这证明当前部署的tuple/单位/linkage可读取，不证明所有账户均无奖励。非零真实账户、真实账户切换/错链往返后的reward显示验收为 **RUNTIME QA PENDING**；隔离fixture不冒充真实钱包验收。Production56继续独立Release Gate。

## QA

测试覆盖全零隐藏、BNB-only/ORI-direct/ORI-refined/mixed入口规则、1wei及大整数exact、中文label、disconnected/loading/error/unavailable/wrong-chain、失败隐藏旧值、恢复零值、RPC/账户key隔离、minimumBlock/chain guard、active Auto与Trade两种页面中Rewards独立且不重复。

隔离浏览器使用真实组件/CSS/字体与集中临时fixture（不进入repo，无wallet/signer/RPC），375px与1000px中main500居中；验证各显隐组合、error键盘Refresh、中文、disabled claim、长数值不overflow、实际computed属性和字体加载。正式/mine guest复核与全七项QA结果见本次交付；不能因此宣称M6真实Claim已验证。

## Final verification record

完整七项QA均PASS：env:check、typecheck、lint、format:check、test（54 files / 669 tests）、build、git diff --check。375px实测card347×188、primary323×44/radius22；1000px viewport中main500居中（x250），card472×188，真实HarmonyOS字体与属性均符合上表。隔离fixture所有显隐/长值/error键盘重试/中文PASS，无pageerror；字体请求成功（首次200、重载304）。正式localhost /mine访客375/1000复核25格、无claims、正确active nav、无横向overflow或runtime exception。未签名、未广播、未commit/push/deploy；既有M4/M9未提交工作保留。
