# ORI 项目概览

## 这是什么

ORI（`https://ori.supply`）是运行在 **BNB Smart Chain** 上的链上挖矿游戏 DApp，自称"新一代 PoW 价值存储资产"、"链上原生 BTC 2.0"。核心玩法：

- **Mine（方块挖矿）**：每轮 1 分钟，5 × 5 共 25 个方块。用户把 **BNB** 部署到一个或多个方块；链上随机数选出一个获胜方块。获胜方块上的部署者按比例分得本轮奖池 BNB 的 90%，并产生 ORI 奖励；未中奖者损失部署的 BNB，但获得 **起源** 奖励。累积奖池 **Motherlode** 以 1/625 概率触发。
- **Stake**：质押 **ORI**，分享协议回购带来的收益。
- **Points**（新版）：积分，规则待确认。
- **Explore**：协议统计与挖矿、母矿、回购记录。
- **About**：玩法、精炼机制、质押机制、代币经济、链接。

当前产品已上线运行；新版 Figma 是对线上产品的视觉重做，并调整了部分导航与功能。线上与新版的差异见 [legacy-runtime-audit.md](./legacy-runtime-audit.md#current-figma-vs-live--legacy)。

## 资产与代币

| 名称 | 是什么 | 来源 |
| --- | --- | --- |
| BNB | 部署 / 下注资产，奖池资产 | Live；OreProtocol |
| ORI | 挖矿产出的协议代币，最大供应 4,200,000；可质押 | Live About；ORI token 合约 |
| 起源（Origin） | 起源代币（与前代产品 Origin.fun 为同一合约），未中奖用户获得 | Live About；合约配置 |
| 未精炼 / 精炼 | 领取挖矿奖励收 10% 精炼费并分给仍未领取者；"精炼"部分领取免费 | Live About |

## 命名说明

| 设计中的名字 | 实际含义 |
| --- | --- |
| ORI | 产品名与协议代币 |
| **ORE** | 协议合约命名沿用的上游名称（合约 `OreProtocol`、配置键 `oreContract`）。Figma 中的 "ORE" 字样是占位 / 沿用，**不是代币名** |
| **BURY** | "回购埋藏"机制（buyback & bury，合约 `bury` / `BuryEvent`）；`BURY` Figma Page 是历史设计。Figma 中 "Unrefined / Refined BURY"、"BURE"、"BUBY" 为占位或拼写错误 |
| SOL / Solana | Figma 占位，**不适用**（User Confirmed） |
| 起源 | 第二种代币；中文名在英文文案中也保持 "起源" |

## 产品结构（新版 Figma）

```text
App Shell
├─ Header：ORI Logo + 价格 · Connect / 钱包地址
├─ 主内容（单列；H5 100%，PC 500px 居中）
└─ Bottom Navigation：Mine · Points · Stake · Explore · About

Mine：4 张数据卡 · 5×5 方块 · Manual / Auto 部署面板 · Autominer · Rewards · Miners
Points：我的积分 · 记录
Stake：Deposit / Withdraw（ORI）· Summary
Explore：统计卡 · Mining / Motherlodes / Buybacks 表
About：手风琴
My Wallet：底部 Sheet
```

线上当前结构不同：导航为 挖矿 · 起源 · 质押 · 探索 · 关于，挖矿页另有 "ORI 游戏"（交易挖矿），`/` 为起源交易挖矿，Points 页未上线。新版是否保留这些功能见 [open-questions.md](./open-questions.md) Q-01、Q-02。

## 核心流程（Mine）

```text
Connect wallet（Privy，仅钱包）
→ 选择方块（可多选）
→ Manual：输入每方块 BNB 金额 → deployManual(mask, amountPerSquare)，支付 金额 × 方块数
  Auto：设置每方块金额、轮数（或随机方块）→ registerAutomation（预付 BNB）→ 链下执行器每轮部署 → 可 stopAutomation
→ 每轮结束：VRF 开奖 → 结果动画 → 获胜方块高亮
→ Rewards：claimAll（BNB + ORI）或 claimEth（仅 BNB）
```

## 范围

新版有设计：Mine（方块游戏）、Points、Stake、Explore、About、Wallet Sheet、Header、Bottom Navigation。

线上有但新版 Figma 没有：起源交易挖矿页、"ORI 游戏" 交易挖矿、起源 swap、采矿基金存取、Stake 的 Account / Yield / Claim、Explore 多标签统计、语言切换。

设计与线上都没有清晰定义：交易 pending / 成功 / 失败视觉、加载、空状态、错误状态、PC 专属呈现。
