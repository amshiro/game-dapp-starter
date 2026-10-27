# <font style="color:rgb(51, 51, 51);">wd info</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/activity/wd/info</font>
#### POST
#### request：
##### body:
```json
{
  'addr':"xxxxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "limit_amount": 100000,
        "chain_asset_config": {
            "id": 2,
            "chain": "bsc",
            "asset_type": "erc20",
            "contract_addr": "0x0000000000000000000000000000000000000000",
            "aux_contract_addr": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            "symbol": "bnb",
            "client_symbol": "BNB",
            "system_decimal": 8,
            "token_decimal": 18,
            "price": 887.13,
            "icon": "",
            "wd_enable": 0,
            "contract_enable": 0,
            "wd_fee_symbol": "",
            "wd_fee_usdt": 0,
            "wd_min_usdt_value": 0,
            "wd_interval": 0,
            "created_at": "2025-11-24T15:14:39.000000Z",
            "updated_at": "2025-11-28T16:43:34.000000Z"
        }
    },
    "common": {
        "timestamp": 1764319436,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">wd query_signature</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/activity/wd/query_signature</font>
#### POST
#### request：
##### body:
```json
{
  'signature':"xxxxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "id": 3,
        "symbol": "sol",
        "mint": "So11111111111111111111111111111111111111112",
        "slot": 1,
        "signature": "z_13111",
        "created_ts": 1724146984,
        "status": 1, // 状态:0-默认 1-成功 2-失败'
        "user": "A9akXNT67tJRByDgkCsMC5hsJFhmC98WhPwA6Bjb5dBT",
        "amount": 19727536414,
        "limit_amount": 100000, // 金额
        "token_decimal": 9,
        "system_decimal": 9,
        "created_at": "2024-08-20 09:43:05",
        "updated_at": "2024-08-22 18:40:58",
        "chain_asset_config": {
            "id": 2,
            "chain": "bsc",
            "asset_type": "erc20",
            "contract_addr": "0x0000000000000000000000000000000000000000",
            "aux_contract_addr": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            "symbol": "bnb",
            "client_symbol": "BNB",
            "system_decimal": 8,
            "token_decimal": 18,
            "price": 887.13,
            "icon": "",
            "wd_enable": 0,
            "contract_enable": 0,
            "wd_fee_symbol": "",
            "wd_fee_usdt": 0,
            "wd_min_usdt_value": 0,
            "wd_interval": 0,
            "created_at": "2025-11-24T15:14:39.000000Z",
            "updated_at": "2025-11-28T16:43:34.000000Z"
        }
    },
   "common": {
        "timestamp": 1764319436,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">origin_info（起源矿池）</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/activity/origin_info</font>
#### POST
#### request：
##### body:
```json
{
  'user_addr':"xxxxx"
}
```

#### response：
##### body:
```json
{
    "data": {
      "ori_config": { // 起源代币信息配置
            "enable": true,
            "mint_address": "0x0A700052EbF92DC0798C353437c84A6f76E80E2f",
            "mining": 400,
            "motherlodes": 200
        },
       "chain_asset_config": { // 代币信息
            "id": 3,
            "chain": "bsc",
            "asset_type": "erc20",
            "contract_addr": "",
            "aux_contract_addr": "",
            "symbol": "qiyuan",
            "client_symbol": "qiyuan",
            "system_decimal": 8,
            "token_decimal": 18,
            "price": 111,
            "icon": "",
            "wd_enable": 0,
            "contract_enable": 0,
            "wd_fee_symbol": "",
            "wd_fee_usdt": 0,
            "wd_min_usdt_value": 0,
            "wd_interval": 0,
            "created_at": "2025-11-30T11:48:56.000000Z",
            "updated_at": "2025-11-30T14:46:39.000000Z"
        },
        "global": { // 全局
            "total_amount": "117000", 总发放
            "current_mother_reward": 396000000000,
            "total_unrefined": "1980000000000", // 未精炼
            "burned_last_7days": "25328307969",  // 七天销毁
            "system_decimal": 8
        },
        "user": { // 用户
            "amount": 0, // 我可领取的奖励
            "accumulated_amount": 0, // 已累计领取的奖励
            "total_amount": 0, // 总发放
            "system_decimal": 8,
            "native_amount": 0, // 已精炼
            "total_native_amount": 0, // 已精炼总额
        },
        "my_wallet": { //我的钱包bnb相关数据
            "chain_asset_config": {
                "id": 2,
                "chain": "bsc",
                "asset_type": "erc20",
                "contract_addr": "0x0000000000000000000000000000000000000000",
                "aux_contract_addr": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
                "symbol": "bnb",
                "client_symbol": "BNB",
                "system_decimal": 8,
                "token_decimal": 18,
                "price": 905.21,
                "icon": "",
                "wd_enable": 1,
                "contract_enable": 0,
                "wd_fee_symbol": "",
                "wd_fee_usdt": 0,
                "wd_min_usdt_value": 0,
                "wd_interval": 0,
                "created_at": "2025-11-24T15:14:39.000000Z",
                "updated_at": "2025-12-08T12:07:03.000000Z"
            },
            "user": {
                "amount": 0,
                "system_decimal": 8
            }
        }

    },
    "common": {
        "timestamp": 1764483184,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">user_asset_events（中奖记录）</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/activity/user_asset_events</font>
#### POST
#### request：
##### body:
```json
{
  'user_addr':"xxxxx",
  'event_type':"xxxx",  310001-起源中奖记录， 310002-起源母矿中奖记录
}
```

#### response：
##### body:
```json
{
    "data": [
        {
            "id": 3746,
            "event_time": 1764486260, // 时间
            "chain": "bsc",
            "user": "0x7d1dfa4bb8f3264a3b61f03911994f8e00000000",
            "event_type": 310001,
            "op": 1,
            "asset_type": "erc20",
            "symbol": "ori",
            "system_decimal": 8,
            "token_decimal": 18,
            "token": "0x0a700052ebf92dc0798c353437c84a6f76e80e2f",
            "asset_id": 0,
            "amount": 40000000000, // 积分
            "old_amount": 160000054300,
            "now_amount": 200000054300,
            "account_type": 1,
            "param_1": 319, // 轮次
            "param_2": 2400, //  投注金额
            "param_3": 7789040964020916014,
            "param_4": 0,
            "param_5": 0,
            "created_at": "2025-11-30T07:04:21.000000Z",
            "updated_at": "2025-11-30T07:04:21.000000Z",
            "str_1": "0x8d0312b5226b130139fb253e9c711c9f817be08b5e805863223ae041e9e19024",
            "str_2": "0x1",
            "str_3": "",
            "str_4": "",
            "str_5": "",
            "from_chain": "bsc"
        }
    ],
    "common": {
        "timestamp": 1764488065,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">参数变动 bury_point_events（回购列表）</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/activity/bury_point_events</font>
#### POST
#### request：
##### body:
```json
{
  'page':"xxxxx",
  'page_size':"xxxx",
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
                "id": 12,
                "amount_in": 156, bnb
                "burned": 148831162, 销毁
                "timestamp": 1764718495, 时间戳
                "transaction_hash": "0x1b94bcefd2f98fc4510845677d21daee1661a94154bb59acaa3a68de43e86b80",
                "block_hash": "0x9eee5a054217a71a1c884b4b5cefe9667f640c7f87a750594bfd0c5155e21c3d",
                "block_number": 76241648,
                "log_index": "0x6",
                "log_unique_id": 9223372036854775807,
                "chain": "bsc",
                "created_at": null,
                "updated_at": null
            }
        ],
        "total": 12
    },
    "common": {
        "timestamp": 1764735028,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">挖矿游戏 充值记录</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/mining_game/deposit_records</font>
#### POST
#### request：
##### body:
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
  'user_addr':"xxxxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "id": 86701,
                "user": "0x85db328172a28a961d9b929fcaec65fa18000000",
                "amount": 100000000000000000,
                "timestamp": 1765203164,
                "transaction_hash": "0x6cdf43e3510863e9035b355fb7cab38b375fb6fc41b67085b4f05a9b0ae00c7f",
                "block_hash": "0x8c9fb8d3705256da834fdf76eb78ba536edab23f41e56489c332876db9ccd79f",
                "block_number": 77315283,
                "log_index": "0x6",
                "log_unique_id": "15753803472255699782",
                "log_order_id": 7731528300006,
                "chain": "bsc",
                "created_at": "2025-12-08T22:23:35.000000Z",
                "updated_at": "2025-12-08T22:23:35.000000Z"
            }
        ],
        "total": 1
    },
    "common": {
        "timestamp": 1765206007,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">挖矿游戏 挖矿记录-全局+母矿记录</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/mining_game/record_list</font>
#### POST
#### request：
##### body:
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
  'mother_reward_enabled': "xxx"  0-全局记录 1-母矿记录
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "round_id": 2, // 期数
                "show_round_id": 172, // 前端显示
                "participant_count": 1, // 参与人数
                "total_buy_amount": 10000000, // 总买入
                "total_sell_amount": 0, //总卖出
                "total_net_buy_amount": 10000000,// 总净买入
                "normal_reward_amount": 1800, // 普通矿奖励
                "normal_is_split": 1, //  - 是否均分（1=均分，0=独得）
                "normal_winner": null, // 独得用户地址
                "mother_reward_enabled": 1, // 是否开启母矿（0=关闭，1=开启）
                "mother_reward_amount": 5400,// 母矿奖励
                "mother_is_split": 1,// 是否均分（1=均分，0=独得
                "mother_winner": null, // 独得用户地址
                "created_ts": 1765540957 //创建时间
            }
        ],
        "total": 2
    },
    "common": {
        "timestamp": 1765512675,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">挖矿游戏 挖矿记录-我的</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/mining_game/record_list</font>
#### POST
#### request：
##### body:
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
  'user_addr':"xxxxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "round_id": 2, // 期数
                "show_round_id": 172, // 前端显示
                "buy_amount": 10000000, // 总买入
                "sell_amount": 0, //总卖出
                "net_buy_amount": 10000000,// 总净买入
                "normal_reward_amount": 1800, // 普通奖励
                "mother_reward_amount": 0,  // 母矿奖励
                "created_ts": 1765540957 //创建时间
            }
        ],
        "total": 2
    },
    "common": {
        "timestamp": 1765512675,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);"></font>
# <font style="color:rgb(51, 51, 51);">挖矿游戏 info</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/mining_game/info</font>
#### POST
#### request：
##### body:
```json
{
  'user_addr':"xxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "round_id": 3, // 轮次
        "start_ts": 1765445400, // 游戏开始时间戳
        "end_ts": 1765446300 // 游戏结束时间戳
        "count_down": 0,
        "my_ratio": 100, // 我的占比
        "all_net_buy": 10000000, // 全局净买入
        "my_net_buy": 10000000, // 我的净买入
        "expect_reward": 1800, // 预计获得
        "game_mother_reward": 1800, 游戏母矿奖励
        "game_round_rewards": 1800 // 本轮奖励
        "game_swap_info": {  swap 信息
            "reserve_a": "989980311", // bnb
            "reserve_b": "10101211009666", // 未精炼起源
            "enable": 1,
            "volume_bnb": 14393721 //总交易量
        }
    },
    "common": {
        "timestamp": 1765510372,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">挖矿游戏 交易记录</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/mining_game/swap_record</font>
#### POST
#### request：
##### body:
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "id": 48,
                "side": 1, // 交易方向：0=卖出, 1=买入
                "input_amount": "10000",  bnb
                "output_amount": "537326815", 起源
                "input_system_decimal": 8,
                "output_system_decimal": 8,
                "which_timestamp": 1766135756 // 创建时间
            }
        ],
        "total": 48
    },
    "common": {
        "timestamp": 1766136305,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏 info</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/ori_game/info</font>
#### POST
#### request：
##### body:
```json
{
  'user_addr':"xxx"
}
```

#### response：
##### body:
```json
{
    "data": {
        "round_id": 3, // 轮次
        "start_ts": 1765445400, // 游戏开始时间戳
        "end_ts": 1765446300 // 游戏结束时间戳
        "count_down": 0,
        "my_ratio": 100, // 我的占比
        "all_trade_volume": 10000000, // 全局交易量
        "my_trade_volume": 10000000, // 我的交易量
        "expect_reward": 1800, // 预计获得
        "game_mother_reward": 1800, 游戏母矿奖励
        "game_round_rewards": 1800 // 本轮奖励
    },
    "common": {
        "timestamp": 1765510372,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏 挖矿记录-全局+母矿记录</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/ori_game/record_list</font>
#### <font style="color:rgb(51, 51, 51);">POST</font>
#### <font style="color:rgb(51, 51, 51);">request：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
  'mother_reward_enabled': "xxx"  0-全局记录 1-母矿记录
}
```

#### <font style="color:rgb(51, 51, 51);">response：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
    "data": {
        "list": [
            {
                "round_id": 2, // 期数
                "show_round_id": 172, // 前端显示
                "participant_count": 1, // 参与人数
                "total_buy_amount": 10000000, // 总买入
                "total_sell_amount": 0, //总卖出
                "total_trade_volume": 10000000,// 总交易量
                "normal_reward_amount": 1800, // 普通矿奖励
                "normal_is_split": 1, //  - 是否均分（1=均分，0=独得）
                "normal_winner": null, // 独得用户地址
                "mother_reward_enabled": 1, // 是否开启母矿（0=关闭，1=开启）
                "mother_reward_amount": 5400,// 母矿奖励
                "mother_is_split": 1,// 是否均分（1=均分，0=独得
                "mother_winner": null, // 独得用户地址
                "created_ts": 1765540957 //创建时间
            }
        ],
        "total": 2
    },
    "common": {
        "timestamp": 1765512675,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏  挖矿记录-我的</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/ori_game/record_list</font>
#### <font style="color:rgb(51, 51, 51);">POST</font>
#### <font style="color:rgb(51, 51, 51);">request：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
  'user_addr':"xxxxx"
}
```

#### <font style="color:rgb(51, 51, 51);">response：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
    "data": {
        "list": [
            {
                "round_id": 2, // 期数
                "show_round_id": 172, // 前端显示
                "buy_volume": 10000000, // 买交易量
                "sell_volume": 0, //卖出交易量
                "total_trade_volume": 10000000,// 总交易量
                "normal_reward_amount": 1800, // 普通奖励
                "mother_reward_amount": 0,  // 母矿奖励
                "created_ts": 1765540957 //创建时间
            }
        ],
        "total": 2
    },
    "common": {
        "timestamp": 1765512675,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏 交易记录</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/ori_game/trade_records</font>
#### <font style="color:rgb(51, 51, 51);">POST</font>
#### <font style="color:rgb(51, 51, 51);">request：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
  'page':"xxxxx",
  'page_size':"xxxxx",
}
```

#### <font style="color:rgb(51, 51, 51);">response：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
    "data": {
        "list": [
            {
                "id": 5, // 主键ID
                "user_address": "0x17F6AD8Ef982297579C203069C1DbfFE4348c372", // 用户地址
                "is_buy": 1, // 是否买入：1=买入 0=卖出
                "bnb_amount": "1300000000000000000", // BNB交易额（买入=投入，卖出=产出，原始单位）
                "ori_amount": "4521000000000000000", // ORI数量（买入=产出，卖出=投入，原始单位）
                "amount_out_min": "4294950000000000000", // 最小接受数量（ORI或BNB，原始单位）
                "admin_fee_bnb": "65000000000000000", // 管理费（BNB，原始单位）
                "buyback_fee_bnb": "390000000000000000", // 回购费（BNB，原始单位）
                "event_timestamp": 1735610231000, // 事件中记录的时间戳
                "chain": "bsc", // 链标识（bsc / eth / testnet 等）
                "transaction_hash": "0x5f5390a89999755296c8226c96564c9989990000a1b2c3d4e5f6a7b8c9d0e1f6", // 交易hash
                "block_hash": "0x555575296c8226c96564c9989990000a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5da", // 区块hash
                "block_number": 32905678, // 区块高度
                "log_index": 12, // 日志在区块中的索引
                "log_unique_id": 1000000015, // 事件唯一ID（用于幂等）
                "created_at": "2025-12-30T11:27:16.000000Z", // 创建时间
                "updated_at": "2025-12-30T11:27:16.000000Z" // 更新时间
            }
        ],
        "total": 5
    },
    "common": {
        "timestamp": 1767065296, // 接口响应时间戳
        "app_name": "hotfunv3" // 应用名称
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏 探索统计</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/ori_game/stats</font>
#### <font style="color:rgb(51, 51, 51);">POST</font>
#### <font style="color:rgb(51, 51, 51);">request：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{

}
```

#### <font style="color:rgb(51, 51, 51);">response：</font>
##### <font style="color:rgb(51, 51, 51);">body:</font>
```json
{
    "data": {
        "refine_game_config": { // ori游戏相关配置
            "enabled": true,
            "start_ts": 1767174000,
            "round_duration_minutes": 10,
            "normal_reward_amount": 18000000000,
            "mother_reward_amount": 18000000000,
            "normal_reward_split": true,
            "mother_reward_split": true,
            "mother_round_interval_min_rounds": 3,
            "mother_round_interval_max_rounds": 6,
            "mother_reward_probability": 0.5,
            "reward_method": "trade"
        },
        "chain_asset_config": {
            "id": 1,
            "chain": "bsc",
            "asset_type": "erc20",
            "contract_addr": "0x0A700052EbF92DC0798C353437c84A6f76E80E2f",
            "aux_contract_addr": "0x0A700052EbF92DC0798C353437c84A6f76E80E2f",
            "symbol": "ori",
            "client_symbol": "ori",
            "system_decimal": 8,
            "token_decimal": 18,
            "price": 830.9,
            "icon": "",
            "wd_enable": 1,
            "contract_enable": 0,
            "wd_fee_symbol": "",
            "wd_fee_usdt": 0,
            "wd_min_usdt_value": 0,
            "wd_interval": 0,
            "created_at": "2025-11-24T15:14:39.000000Z",
            "updated_at": "2025-12-02T15:44:38.000000Z"
        },
        "global": {
            "game_total_amount": 36000000000, // 已产出（游戏总派送）
            "game_buyback_bury": "996693938", //  回购并埋葬(ori)
            "game_total_unrefined": "135436297237021", // 未精炼ori
            "system_decimal": 8
        }
    },
    "common": {
        "timestamp": 1767584275,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏（起源回购列表）bury_point_events</font>
### <font style="color:rgb(33, 33, 33);">/v1/ori/activity/bury_point_events</font>
#### POST
#### request：
##### body:
```json
{
  'page':"xxxxx",
  'page_size':"xxxx",
  'type':2,  2-game ori游戏
}
```

#### response：
##### body:
```json
{
    "data": {
        "list": [
            {
                "id": 12,
                "amount_in": 156, bnb
                "burned": 148831162, 销毁
                "timestamp": 1764718495, 时间戳
                "transaction_hash": "0x1b94bcefd2f98fc4510845677d21daee1661a94154bb59acaa3a68de43e86b80",
                "block_hash": "0x9eee5a054217a71a1c884b4b5cefe9667f640c7f87a750594bfd0c5155e21c3d",
                "block_number": 76241648,
                "log_index": "0x6",
                "log_unique_id": 9223372036854775807,
                "chain": "bsc",
                "created_at": null,
                "updated_at": null
            }
        ],
        "total": 12
    },
    "common": {
        "timestamp": 1764735028,
        "app_name": "hotfunv3"
    }
}
```

# <font style="color:rgb(51, 51, 51);">ori游戏</font> (ori 回购列表) bury_event
### <font style="color:rgb(33, 33, 33);">/v1/ori/bury_event/list</font>
#### POST
#### request：
```json
{
  "page":"xxx",
  "page_size":"xxx"
  'type':2, 2-game ori游戏
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
