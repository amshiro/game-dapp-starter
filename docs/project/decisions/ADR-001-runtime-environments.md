# ADR-001 Runtime Environments

Status: Accepted（User Confirmed）

## Decision

ORI uses:

- EVM / BNB Smart Chain.
- **Development**：BSC Testnet（chainId 97）+ Privy Dev App `cmkw81a5y00onkw0czubpy4hj` + BNB Chain 公开测试网 RPC `https://data-seed-prebsc-1-s1.bnbchain.org:8545` + BSC 97 合约地址 + 开发后端配置。
- **Production**：BSC Mainnet（chainId 56）+ Privy Production App + BSC 56 合约地址 + 生产后端配置 + 专用 RPC（**TBD**）。
- 开发与生产使用**不同的 Privy App**；历史生产 App ID 不作为开发默认值。
- 每个环境整体一致。禁止混用，例如 Dev Privy + 主网合约、测试网 RPC + 主网链、Production Privy + 测试网合约。
- RPC endpoint 是环境配置，由 Starter 配置层提供，**不得硬编码在 Feature / 业务代码中**。
- 旧项目中已泄露的 QuickNode RPC URL 与凭据**永远不得迁移或复用**。

## Why

- 用户确认链、环境、Privy Dev App 与开发 RPC。
- ori.supply 源码（`ori-website`）与线上运行均为 BSC 56 / 97，合约配置已恢复（[web3.md](../web3.md)）。
- 旧 RPC 凭据出现在源码与公开 bundle 中，已视为泄露（[legacy-runtime-audit.md](../legacy-runtime-audit.md)）。

## Consequences

- Runtime 实现不得自行引入其他链、其他钱包方案或其他 provider 模型。
- 开发阶段的真实交易只在 BSC Testnet 97 上进行。
- 生产 RPC 与生产 Privy 配置确定前，不配置生产运行时（Q-04、Q-14）。
