# Mine Page State Inventory — M2 Correction

Source：用户本轮纠正 → 当前 `ORI-AI测试`（file `M6P7gqrEDANm28YSfvOm93`）→ Repository。1–6 的数字是设计排序，不是独立页面；两张“4”同属 `/mine`。本轮在补代码前重读全部七个 frame 的 design context/screenshot、metadata 直接子节点，并读取下列模块子节点。

## Frame / state inventory

| Figma frame/state | Mine 模块 / 直接子节点 | 与其他 frame 的差异 | Runtime 是否已可驱动 |
| --- | --- | --- | --- |
| 1 `2003:182`（375×1431） | Header 190；Metrics 485/490/497/501；25 cells；Manual 455；Miners 508；Bottom Nav 584 | 全页面基准：四卡 → 棋盘 → 下注 → Miners；Manual 默认选中。系统 status/home indicator 不实现为网页 UI | 仅存储轮及已确认公共 board reads；表单/名单 unavailable |
| 2 `2003:629`（375×1049） | Header 990；Metrics 640/645/652/656；cells 753/823/864；Manual 917 | 已连接、有个人部署/选中；输入和 Deploy 示例金额变化。该截稿未重复 Miners，不据此判定永久隐藏名单 | Header 由 W1；个人部署、selection/可下注状态仍不映射 |
| 3 `2003:1009` | Metrics 1014/1019/1026/1030；注释 1037 | 点击数据卡切换 secondary label：USD 或 Round；不是另一个页面 | 可做本地显示切换；USD —，轮次仅当前存储 ID，不伪造价格/倒计时 |
| 4a `2003:1038`（375×1598） | cells 1039/1049/1058/1068/1078/1089/1100/1111/1122/1133；Waiting 1409；结果示意 1152；注释 1405–1408 | default、计数 >1000、selected、deployed、combined、auto-selected/25% muted、winning、lost、等待；动画注释 0.15s/3.6s/10s | 完成静态 presentation；不创建链上状态机，不自动播放结果动画；正式 board 仍只读 |
| 4b `2003:1413`（375×1598） | grid 1414；Autominer 1667；Rewards 1682–1714 | 同页的 Auto 运行 + 有奖励状态：Autominer 取代表单，后接 Rewards 卡；不是第二个 Mine route | Autominer 与奖励卡仅隔离视觉状态，正式 runtime 无 running/reward owner；不启动 M4/M5/M6 |
| 5 `2003:1715` | Manual panels 1716/1745/1776/1804 | 同一 347×282 panel：未登录、未选、余额不足（1793 红色）、可投注（白色 action）；重复不代表四个 Feature | 可展示全部变体；正式 action 始终 disabled，不据此批准 transaction |
| 6 `2003:1832` | Auto panels 1833/1890；round stepper 1856/1907；Blocks/round icons 1844/1852 | 同一 347×393 panel：默认 draft rounds=1 / 未选；draft rounds=3 / 已选；添加 Blocks、Rounds、Total per round、Total | Tab 可本地切换；selection/shortcut/stepper/submit 无执行语义，未确认字段 — |

## 固定结构与变体

正式 `/mine` 顺序：现有 Header → 四个 Metrics → 5×5 board → Betting（Manual/Auto，同一局部 Tab）→ Miners/results 结构 → 现有 Bottom Nav。保持 375 参考、H5 100%、main max500 居中；不创建桌面多栏。

- Manual：panel 347×282、radius8、padding12；tabs 323×32；input 323×56，border1.5；余额/shortcuts 行高24；divider；Blocks、Total 两行（13px）；action 323×44、pill。
- Auto：同一 tabs/input/余额行；增加 Blocks 和 Rounds 配置行，Rounds stepper 102×32、中心38×28；两个 divider；summary 三行；panel 347×393。默认 draft=1 是已绘制 UI default，不是已开启 automation。
- Autominer 状态：347×204、顶栏32、summary 三行 Blocks/Round remaining/Total per round；Stop autominer44。仅静态状态，无 stop handler。
- Rewards 状态：title20/23；dashed surface347×188；三行 label/value、info 图标、Claim44、secondary Claim only。只覆盖 frame4b 的隔离视觉，不接 reward reads、不批准原稿 ORE/BURY token 映射或 claim。
- Miners：group508，347×335，title20/23；Round12；地址12px 靠左、金额12px 靠右；每行30；部分行有双资产金额 + separator。没有明确 rank、column heading、selected-square 或 tx-hash 列，不自行添加可见列。使用 semantic table、屏幕阅读器列名和 typed rows；unknown 状态不生成占位地址/假 row。
- Cell：参考65×65、2px border/radius8、label10/500、count10、amount11；deployed gold；combined green/white border；auto green border；winning3px gold/#23211c；lost与 auto-muted opacity25%。这些是绘制能力，不是已批准的 runtime 状态映射。

## 业务边界

1. Figma state ≠ approved runtime state。保留 M1 的 stored round 语义，不推导 roundId+1，不把 canDeploy 当 active。
2. Manual/Auto UI 完整不代表允许下注；M2阶段 Submit、shortcut、selection、轮次执行控件均为disabled/read-only（历史交付；后续M3已单独启用Manual选择/输入/shortcuts，不解锁Auto）。Unknown amount/balance/total 为 —；Figma 0.42/0.02/0.84/2.3056 不进入 runtime。
3. `+0.5/+1/+2` 为原始Figma标签；后续Human approved Manual直接替换每格输入，现已启用，Q-16 Manual范围关闭；Auto 总额不按旧逻辑自行计算，Q-15/Q-17 保留。
4. 用户指出该区域包含 previous-round winners UI；沿用当前 Figma 可见标题 Miners，完成 address/amount row 结构。究竟哪些 rows/round/金额仍由数据 Gate 决定；不使用当前 round 或 roundId-1 冒充上一轮 identity，不自动接旧 Rank。
5. SOL 与 ORE/BURY 占位不提供当前资产事实；Manual native asset 用已确认 BNB 文本，未知奖励资产不擅自定名或下载占位 token 图。
6. Fixture 只用于隔离 visual tests，必须明确 TEST/FIXTURE 标识；正式 route 不导入 fixture，不新增 debug route。

## M2 覆盖修正

`736af9d` 只完成棋盘和部分只读区域，不能证明 Mine 全页面 UI 已覆盖。当前 FULL MINE read-only UI 已覆盖并验证固定模块与上述状态组件，且已通过人工审核；不因先前 checkpoint 已 push 而把缺失模块视为完成。完整数据、selection、transaction、automation execution、reward 和 realtime Gate 继续保留。

## Requirement reconciliation 全状态复读 — 2026-10-29

本轮重新通过 Figma MCP 完整读取 2003:182、629、1009、1038、1413、1715、1832 及直接内容。逐 frame 模块/visible state/差异/交互含义/demo/规则证据与最终 scope 见 [Mine Requirement Reconciliation](./mine-requirements-reconciliation.md)。两个“4”是同页状态，不是两个 Feature。

重要修正：winning border 为3px；Stats 标注不证明四卡同时切换；Auto 4格/.02/3轮显示 .02/.06 是原始设计证据；后续 Human approved 输入为每格金额，本金应 .08/轮、3轮 .24 BNB，覆盖该示例。执行费/最终 payable 仍待 Gate。Figma 证明视觉状态不等于 runtime enum/时钟/收款语义；本轮没有改实现。
