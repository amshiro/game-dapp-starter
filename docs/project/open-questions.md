# Open Questions

看到这里的问题时**停止猜测**：不要自行选择默认值、合约版本、假 API 或假文案。问题被确认后，把答案写进 `requirements.md`（注明来源）并从这里删除。

优先级：**P0** 阻塞项目壳层或第一批实现；**P1** 阻塞对应 Feature；**P2** 上线前确认。

已解决（不再列出，见 requirements C-01、C-02、C-08、C-09）：目标运行时（EVM / BSC）；开发链（BSC Testnet 97）；生产链（BSC Mainnet 56）；Privy Dev App（`cmkw81a5y00onkw0czubpy4hj`）；开发 RPC（BNB Chain 公开测试网 RPC）；Figma SOL / Solana 为占位；HarmonyOS Sans SC 字体文件来源（线上站点自带，授权仍需确认见 Q-05）。

## P0

| # | Question | Why it matters | Current evidence | Blocked |
| --- | --- | --- | --- | --- |
| Q-01 | 新版是否下线 "起源" 导航与起源交易挖矿，由 Points 取代？ | 决定导航、路由与是否需要起源 swap / 采矿基金 | Figma 导航为 Mine · Points · …；线上为 挖矿 · 起源 · …；线上 i18n 已有 Points | 导航、路由 |
| Q-02 | 新版 Mine 是否去掉 "ORI 游戏"（交易挖矿）标签？ | `oriSwap` 与 6 个 `ori_game` 接口是否还需要 | Figma 只有方块游戏 | Mine 结构 |
| Q-03 | Logo：确认使用线上金色 "轨道圆" 标志 + ORI 字标？品牌页 `确认` 中的像素 O 币是否专用于起源代币？ | Header 与代币图标 | 线上 Logo = 金色圆 + 深色轨道；线上起源代币图标 = 像素 O 币；Figma Header 为白色同形标志 | Header、代币图标 |
| Q-04 | Production Privy App：是否沿用线上 App（`cmi70qts3005hl90c27u5uc75`）？新项目登录方式是否保持仅钱包（Binance / OKX / MetaMask）？Dev / Production App 的 Allowed Origins | 生产 Provider 配置与登录体验 | 开发 App 已确认（C-08）；线上配置已从源码恢复 | 生产 Wallet / Provider |
| Q-05 | HarmonyOS Sans SC 的 Web 使用授权？可否直接使用线上同一字体文件？ | 字体加载 | 线上 `_next/static/media` 自带 TTF | 字体 |

## P1

| # | Question | Why it matters | Current evidence | Blocked |
| --- | --- | --- | --- | --- |
| Q-10 | 代理合约当前实现是否与 `ori-website/constant/*.json` 一致？是否有合约仓库 / 已验证 ABI？测试网地址是否可用于新开发？`AssetManager.deposit(…, "claim" \| "claim_bnb", …)` 的业务语义？ | 所有链上读写 | 地址与 ABI 已从源码确认，与线上一致（见 web3.md） | 交易、链上读取 |
| Q-11 | 后端 API 是否继续为新版服务（`https://gate.game.com/v1/ori/*`）？各端点请求 / 响应 Contract？测试环境 host？ | 所有数据视图 | 23 个端点名已恢复，DTO 未恢复 | Read APIs |
| Q-12 | 交易 UX：签名中、已提交、确认中、成功、失败、取消的视觉？成功是否需要等待后端索引？ | 设计无交易状态 | 线上仅 toast | 所有交易 |
| Q-13 | 后端是否需要鉴权？源码与线上均无登录会话（签名 `_post` 未使用），地址作为参数，用户数据可被任意查询 | 安全与 Backend Auth 阶段 | Source；Live | Backend Auth |
| Q-14 | Production RPC：专用 provider / endpoint 与凭据边界（凭据不得进入前端）；生产读取是否部分走后端？ | 旧 QuickNode 凭据已泄露、不得复用 | 开发 RPC 已确认（C-08） | 生产 Web3 读写 |
| Q-15 | Auto：Figma "Total per round" 等于输入金额、未乘方块数，与 `amountPerSquare` 模型矛盾；Auto 的 `botFee` / `executorFee` 是否展示？最大轮数？ | Auto 表单与交易参数 | Figma `2003:1832`；`registerAutomation` | Auto |
| Q-16 | 金额快捷按钮数值：Figma `+0.5 / +1 / +2`（SOL 占位）还是线上 `+0.02 / +0.05 / +0.1`（BNB）？Stake 百分比按钮是否不变？ | 表单 | Figma vs Live | 部署面板 |
| Q-17 | 最小 / 最大部署金额、小数位、是否预留 gas、100% 如何计算 | 输入校验 | `InvalidAmount` 错误存在，阈值未知 | 表单校验 |
| Q-18 | 已部署金额颜色（绿 / 金）；自动选中半透明变体含义 | 方块视觉 | Figma 内部不一致 | BlockCell |
| Q-19 | 线上 `全选` 按钮在新版是否保留？ | Figma 无 | Live | 方块网格 |
| Q-20 | Points 规则：Figma "每 1 USD 下注得 1 积分" vs 线上文案 "每 10 分钟按未中奖用户投入比例分配 1000 积分"？Points 数据接口？是否包含起源池、起源回购记录（线上 Points 文案包含）？ | 两种规则完全不同 | Figma `2003:2121`；Live i18n `Points.subtitle`（源码未使用）；源码定义 `/ori/points/list`、`/ori/points/user` 但从未调用 | Points |
| Q-21 | PC 上 Wallet Sheet 呈现方式 | 唯一弹层 | 无 PC 稿 | Wallet |
| Q-22 | Wallet `导出` / `接收` 含义（外部钱包无法导出私钥）；显示的余额是 BNB 还是 ORI？ | Figma 余额为 "48.60 ORE"（占位命名） | 仅钱包登录、无嵌入式钱包 | Wallet Sheet |
| Q-23 | Header 价格是 ORI 价格？数据来源 `chain_asset_config` 还是 `origin_info`？ | Header | 线上 Header 显示 ORI 价格 | Header |
| Q-24 | Info 图标说明内容（线上 i18n 有 Stake 各项说明） | Tooltip | Live i18n `Stake.*Desc` | InfoHint |
| Q-25 | Rewards 命名：Figma `ORE / Unrefined BURY / Refined BURY / Claim only ORE` 应为 BNB、ORI（直接）、ORI（精炼）与 "仅领取 BNB"？ | 文案与合约字段对应 | `getUserRewards` → `ethAmount`、`oriDirect`、`oriRefined`；`claimEth` | Rewards |
| Q-26 | Stake 是否需要线上的 Account / Yield / Claim / Claim and deposit？ | Figma 只画了表单与 Summary | Live i18n | Stake |
| Q-27 | Explore 新版是否保留线上的多标签统计（ORI / ORI 游戏 / 起源挖矿 / 起源游戏）与两张回购表？ | Figma 简化为 4 卡 + 3 表 | Live | Explore |

## P2

| # | Question | Why it matters | Current evidence | Blocked |
| --- | --- | --- | --- | --- |
| Q-30 | 新版默认语言（线上默认中文；Figma 英文） | i18n locale 策略 | Live | locale |
| Q-31 | 母矿卡显示 `ORI + 起源` 双资产还是只显示 ORI？ | 数据卡 | Live 显示双资产；Figma 单值 | 数据卡 |
| Q-32 | 页脚是否显示 | Frame 外文本 | Figma | App Shell |
| Q-33 | 路由路径：Mine 为 `/` 还是保持线上 `/mine`？旧链接是否需要重定向？ | URL 与外部链接 | 线上 `/` = 起源，`/mine` = 挖矿 | 路由 |
| Q-34 | Production domain（是否仍为 `ori.supply`）与各环境 | 部署、Privy Origins | Live | 部署 |
| Q-35 | 地区限制（旧项目限制 CN）是否保留？在 Cloudflare 上如何实现？ | 合规 | Legacy middleware | 部署 |
| Q-36 | 结果动画是否支持 `prefers-reduced-motion` 简化 | 可访问性 | — | 动画 |
| Q-41 | 费率口径：About 的 1% 平台费、90% 奖池、6% / 10% / 4% 回购表述，与合约 `feeBps`、`vaultBps`、`claimFeeBps` 的对应关系；展示文案以哪个为准 | 文案与合约一致性 | Live About 自相矛盾 | About、Rules 展示 |
| Q-42 | 奖励领取时限是多久？UI 是否提示即将过期？ | `ClaimWindowPassed` | OreProtocol | Rewards |
| Q-43 | 上一轮结算（checkpoint）由 bot 完成，还是前端需要在部署前触发？ | `MustCheckpointPreviousRound` | OreProtocol | Deploy |

## 安全（需要人工处理，非开发问题）

| # | Item |
| --- | --- |
| S-01 | 轮换 `origin-website` 已提交 `.env` 中的全部 secret，并决定是否重写历史 / 设为私有 |
| S-02 | 将 `origin-website` 历史中出现过的私钥视为泄露 |
| S-03 | 轮换 QuickNode BSC 主网 / 测试网 RPC token（出现在 `origin-website`、`ori-website` 源码与线上 bundle） |
