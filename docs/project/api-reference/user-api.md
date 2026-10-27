

# 服务器
### 测试环境
API：[https://ori-api-dev.being.com](https://hotfunv3-api-dev.being.com/)

后台：

后台管理凭据不存储在代码仓库中。如需访问，请通过安全渠道向后台管理员获取。

# <font style="color:rgb(33, 33, 33);">积分列表</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/points/list</font>
#### POST
#### request：
##### body:
```json
{
  "page":"xxx",
  "page_size":"xxx",
  "miner":"xxx", // 钱包地址,
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "id": 106,
                "miner": "0x85db328172a28a961d9b929fcaec65fa18000000",
                "round_id": 26,
                "bet_amount": "100000000000000.000000000000000000",
                "points_reward": 1000,
                "transaction_hash": "0x27daf937e2f0455082c0f6bc40bd30e62f3e1e776c85e06f803abc099a547e7b",
                "log_unique_id": null,
                "chain": "bsc",
                "verify": 1,
                "created_at": "2025-11-21T18:20:02.000000Z",
                "updated_at": "2025-11-21T10:20:02.000000Z",
                "timestamp": 1763749202,
                "user_total_points": 1066 // 用户总积分
            }
        ],
        "total": 4,
        "user_points": { // 我的积分
            "miner": "0x85db328172a28a961d9b929fcaec65fa18000000",
            "total_points": 4000
        }
    },
    "common": {
        "timestamp": 1763721938,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(33, 33, 33);">用户积分</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/points/user</font>
#### POST
#### request：
##### body:
```json
{
  "miner":"xxx", // 钱包地址,
}
```

#### response：
##### body:
```json
{
    "data": {
        "miner": "0x7a9f3eD36F7401E58988E5c8F53c665A75a2b1d",
        "total_points": 3800
    },
    "common": {
        "timestamp": 1763369262,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# <font style="color:rgb(33, 33, 33);">查询轮次</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/reset_event/round</font>
#### POST
#### request：
##### body:
```json
{
  "round_id":"xxx",
}
```

#### response：
##### body:
```json
{
    "data": {
        "id": 107,
        "round_id": 171,
        "winning_square": 17, // 中奖格子
        "winnings": 0, // 奖池ETH
        "vault_share": 59400000000000, // Treasury分配
        "split_reward": false, // 分裂模式
        "motherlode": false, // 是否命中母矿
        "top_miner": "0x0000000000000000000000000000000000000000", // ORE Winner 地址 topMiner
        "num_winners": 0, // 中奖人数 numWinners
        "motherlode_payout": 0, // 母矿 ORE 分发数量 motherlodePayout
        "ore_reward": 0, // 本轮 ORE 奖励 oreReward/topMinerReward
        "timestamp": 1763438401,
        "transaction_hash": "0x578b5be8b760128016fdbd6703023eb33e2482234dc88b2864f4d7b45eee49b1",
        "block_hash": "0x7afa13dc30987a4cba8cd9c8954f30d283dad52abda9df3a6110cafe24e15e34",
        "block_number": 73402800, // 区块号
        "log_index": "0x0", // 日志索引
        "log_unique_id": 9223372036854775807,// 日志唯一ID，用于去重
        "log_order_id": 7340280000000,// 日志排序ID
        "chain": "bsc",
        "check_point": 1, // 是否checkpoint
        "created_at": "2025-11-18T12:00:10.000000Z",
        "updated_at": "2025-11-18T12:00:27.000000Z"
    },
    "common": {
        "timestamp": 1763438682,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# <font style="color:rgb(33, 33, 33);">轮次列表</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/reset_event/list</font>
#### POST
#### request：
##### body:
```json
{
  "motherlode":"xxx",   是否命中母矿 motherlode  0-否 1-是
  "page":"xxx",
  "page_size":"xxx",
}
```

#### response：
##### body:
```json
{
"data": {
    "list": [
        "id": 107,
        "round_id": 171,
        "winning_square": 17, // 中奖格子
        "winnings": 0, // 奖池ETH
        "vault_share": 59400000000000, // Treasury分配
        "split_reward": false, // 分裂模式
        "motherlode": false, // 是否命中母矿
        "top_miner": "0x0000000000000000000000000000000000000000", // ORE Winner 地址 topMiner
        "num_winners": 0, // 中奖人数 numWinners
        "motherlode_payout": 0, // 母矿 ORE 分发数量 motherlodePayout
        "ore_reward": 0, // 本轮 ORE 奖励 oreReward/topMinerReward
        "timestamp": 1763438401,
        "transaction_hash": "0x578b5be8b760128016fdbd6703023eb33e2482234dc88b2864f4d7b45eee49b1",
        "block_hash": "0x7afa13dc30987a4cba8cd9c8954f30d283dad52abda9df3a6110cafe24e15e34",
        "block_number": 73402800, // 区块号
        "log_index": "0x0", // 日志索引
        "log_unique_id": 9223372036854775807,// 日志唯一ID，用于去重
        "log_order_id": 7340280000000,// 日志排序ID
        "chain": "bsc",
        "check_point": 1, // 是否checkpoint
        "created_at": "2025-11-18T12:00:10.000000Z",
        "updated_at": "2025-11-18T12:00:27.000000Z"
            }
        ],
        "total": 1
    },
    "common": {
        "timestamp": 1763439102,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# <font style="color:rgb(33, 33, 33);">根据轮次-中奖记录</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/round_winners/round</font>
#### POST
#### request：
##### body:
```json
{
  "round_id":"xxx",
}
```

#### response：
##### body:
```json
{
    "data": {
        "id": 107,
        "round_id": 171,
        "start_block": 17, // 开始的区块高度
        "end_block": 0, // 结束的区块高度
        "timestamp": 1763438401,
        "transaction_hash": "0x578b5be8b760128016fdbd6703023eb33e2482234dc88b2864f4d7b45eee49b1",
        "block_hash": "0x7afa13dc30987a4cba8cd9c8954f30d283dad52abda9df3a6110cafe24e15e34",
        "block_number": 73402800, // 区块号
        "log_index": "0x0", // 日志索引
        "log_unique_id": 9223372036854775807,// 日志唯一ID，用于去重
        "log_order_id": 7340280000000,// 日志排序ID
        "chain": "bsc",
        "created_at": "2025-11-18T12:00:10.000000Z",
        "updated_at": "2025-11-18T12:00:27.000000Z"
    },
    "common": {
        "timestamp": 1763438682,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# <font style="color:rgb(33, 33, 33);">轮次-查询开始</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/round_started/round</font>
#### POST
#### request：
##### body:
```json
{
  "round_id":"xxx",
  "page":"xxx",
  "page_size":"xxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "id": 1,
                "round_id": 268,
                "winner_address": "0xc66b246b816f3edf5b26851f03a96e15c4c6395f", // 中奖用户地址
                "bet_amount": 10000000000000, // 用户在该轮下注的金额
                "tx_hash": "0x0e9a57148cf3a6da00a86e4b9bb0e6f6186f3ba248fca7d259516386f7fd77d5",
                // 中奖相关的交易哈希
              "created_at": "2025-11-18 14:16:52"
            }
        ],
        "total": 1
    },
    "common": {
        "timestamp": 1763447913,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# <font style="color:rgb(33, 33, 33);">最后消息数据</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/latest/events</font>
#### POST
#### request：
##### body:
```json
{
}
```

#### response：
##### body:
```json
{
    "data": {
        "round_started": {
            "id": 115,
            "round_id": 305, // 轮次ID
            "start_block": 19, // 开始的区块高度
            "end_block": 0, // 结束的区块高度
            "timestamp": 1763448729, // 事件时间戳
            "transaction_hash": "0xc4eac567f3303cef73aff25cf5df7505b74e68472ec36e6e4dd622befc5f9285",
            "block_hash": "0xd5bc9363210cffdf3b3d3f23481beedb7642473f1aaaf6412919142986650b41",
            "block_number": 73425751,
            "log_index": "0x0", // 日志索引
            "log_unique_id": 8306266833980887070, // 日志唯一ID
            "log_order_id": 7342575100000, // 日志排序ID
            "chain": "bsc",
            "created_at": "2025-11-18T14:52:11.000000Z",
            "updated_at": "2025-11-18T14:52:18.000000Z"
        },
        "reset_event": {
            "id": 115,
            "round_id": 305, // 结算轮次 roundId
            "winning_square": 19, // 中奖格子 winningSquare
            "winnings": 0, // 玩家奖池 ETH winnings
            "vault_share": 495000000000000, // 进入 Treasury 的 ETH vaultShare
            "split_reward": false, // 是否 Split 模式 splitReward
            "motherlode": false, // 是否命中母矿 motherlode
            "top_miner": "0x0000000000000000000000000000000000000000",// ORE Winner 地址 topMiner
            "num_winners": 0, // 中奖人数 numWinners
            "motherlode_payout": 0, // 母矿 ORE 分发数量 motherlodePayout
            "ore_reward": 0, // 本轮 ORE 奖励 oreReward/topMinerReward
            "timestamp": 1763448729, // 链上事件 timestamp
            "transaction_hash": "0xc4eac567f3303cef73aff25cf5df7505b74e68472ec36e6e4dd622befc5f9285",
            "block_hash": "0xd5bc9363210cffdf3b3d3f23481beedb7642473f1aaaf6412919142986650b41",
            "block_number": 73425751, // 区块号
            "log_index": "0x0", // 日志索引
            "log_unique_id": 8306266833980887070,
            "log_order_id": 7342575100000,
            "chain": "bsc",
            "check_point": true, // 是否checkpoint
            "created_at": "2025-11-18T14:52:11.000000Z",
            "updated_at": "2025-11-18T14:52:18.000000Z"
        },
        "max": {
            "round_started_round_id": "",
            "reset_event_round_id": 305
        }
    },
    "common": {
        "timestamp": 1763449202,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# <font style="color:rgb(33, 33, 33);">explore</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/explore</font>
#### POST
#### request：
##### body:
```json
{
}
```

#### response：
##### body:
```json
{
    "data": {
        "max_supply": {
            "value": "28,000,000", // 最大供应量
            "label": "Max Supply"
        },
        "circulating_supply": { //流通供应
            "value": "827,239",
            "label": "Circulating Supply"
        },
        "buried_7d": { // 7天销毁
            "value": "2,896",
            "label": "Buried (7d)"
        },
        "protocol_rev_7d": { // 7天协议收
            "value": "16,327",
            "label": "Protocol Rev(7d)"
        },
    }
}
```

# 参数变动 bury_event (Buybacks list)
### <font style="color:rgb(33, 33, 33);">/v1/ori/bury_event/list</font>
#### POST
#### request：
```json
{
  "page":"xxx",
  "page_size":"xxx"
  'type':0 0-老版本 1-game挖矿 2-game ori游戏
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "id": 1,
                "amount_in": 268, // Treasury ETH
                "ore_received": 111, // 获得的ORI
                "staker_share": 'xxx', // 分配给质押者
                "burned": 'xxx', // 销毁ORI
                "router": 'xxx', // 路由地址
                "timestamp": "xxx", //
               "transaction_hash": "xxx", //
               "block_hash": "xxx", //
               "block_number": "xxx", //
               "log_index": "xxx", //
               "log_unique_id": "xxx", //
               "log_order_id": "xxx", //
               "chain": "xxx", //
               "created_at": "2025-11-18 14:16:52",
               "updated_at": "2025-11-18 14:16:52"
            }
        ],
        "total": 1
    },
    "common": {
        "timestamp": 1763447913,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# auto Automation user(自动化用户)
### <font style="color:rgb(33, 33, 33);">/v1/ori/automation/user</font>
#### POST
#### request：
```json
{
  "user":"xxx",
}
```

#### response：
##### body:
```json
{
    "data": {
        "id": 65953,
        "user": "0x05375917dd12783156b1e29923b58fb6cae90513",
        "auto": 1 // 0否 1是
        "start_round_id": 29, // 开始轮次id
        "mask": 5, // 投注棋盘
        "amount_per_square": 1000000000000, // 每轮注金额
        "balance": 1000000000000000, // 余额
        "total_balance": 1000000000000000, // 总投注
        "round_id": 36, // 最新轮次
        "randomize_mask": 1, // 是否
        "created_at": "2025-11-20T16:55:56.000000Z",
        "updated_at": "2025-11-20T17:12:11.000000Z",
        "extend_data": {
            "round_remaining": 200,
            "total_per_round": 5000000000000,
            "blocks": 5
        }
    },
    "common": {
        "timestamp": 1763630004,
        "app_name": "hotfunv3",
        "chain_asset_config": []
    }
}
```

# chain_asset_config
### <font style="color:rgb(33, 33, 33);">/v1/ori/query/chain_asset_config</font>
#### POST
#### request：
```json
{
  "symbol":"xxx", // bnb 不传参数显示所有的币种
}
```

#### response：
##### body:
```json
{
    "data": [
        {
            "id": 1,
            "chain": "bsc",
            "asset_type": "erc20",
            "contract_addr": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            "aux_contract_addr": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            "symbol": "bnb",
            "client_symbol": "BNB",
            "system_decimal": 8,
            "token_decimal": 18,
            "price": 843.35,
            "icon": "",
            "wd_enable": 0,
            "contract_enable": 0,
            "wd_fee_symbol": "",
            "wd_fee_usdt": 0,
            "wd_min_usdt_value": 0,
            "wd_interval": 0,
            "created_at": "2025-11-24T15:14:39.000000Z",
            "updated_at": "2025-11-24T10:55:03.000000Z"
        }
    ],
    "common": {
        "timestamp": 1763981711,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(33, 33, 33);">summary</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/summary</font>
#### POST
#### request：
```json
{

}
```

#### response：
##### body:
```json
{
    "data": {
        "staking_annual_yield": { // 投资年利率
            "value": 0,
            "label": "Staking Annual Yield(%)"
        }
    },
    "common": {
        "timestamp": 1764056519,
        "app_name": "hotfunv3"
    }
}
```
