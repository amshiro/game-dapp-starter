# M7 / M8 — Mine Read Freshness

## Scope / scheduling ownership

按最新Fast Autonomous连续推进，在核心read/write UI与人工确认M10完成后接入已有owner。M7仅read调度，M8仅F7 freshness signal adapter；不新增协议状态、API/ABI字段解释、计时deadline或写入行为。旧短周期轮询、事件中round/timestamp/winner赋值均不继承。没有新dependency/store/Provider/env。

## M7 route-only budgets（engineering decision）

| Owner                        | Foreground budget | Guard                                                                       |
| ---------------------------- | ----------------- | --------------------------------------------------------------------------- |
| atomic board                 | 15s               | current env97 + correct chain，无账户也可读取                               |
| current account info/squares | 30s               | ready account + verified snapshot/round                                     |
| automation chain             | 30s               | ready account + correct97                                                   |
| executor fee config          | 60s               | ready account + correct97                                                   |
| automation/user remaining    | 30s               | current canonical automation active且chain read无error；不从此API判断active |
| rewards raw                  | 30s               | ready account + correct97                                                   |
| native BNB                   | 30s               | ready account + correct97，复用Wagmi key                                    |
| current result winners       | 10s               | M10人工确认周期；仅fulfilled result，viewer可空                             |

15/30/60秒为当前Development工程预算，不是合约round时钟、产品承诺或后端限流协议；不推导deadline。TanStack Query observer负责timer/dedup，不建全局setInterval。前七类失败按fetchFailureCount指数退避，cap120s；已有retry1仍有界，成功归零恢复常规预算。focus/reconnect always重新读取；hidden不发周期请求，unmount移除observer，不泄漏route调度。account/round/chain变化沿用原key/signal隔离，无placeholderData/缓存镜像。winners保留已签收10s规则与既有retry。

policy仅加在route hooks，imperative transaction query factories仍不创建timer。fresh preflight/simulation、1确认与receipt局部刷新、单轮Manual锁、active Auto、pending操作互斥均保持，不把polling成功当交易成功。realtime disabled/unavailable也不影响此调度。

## M8 existing F7 integration

复用现有Provider/useRealtimeEvent与oriRealtimeEvents：round.new_round / round.data.started、round.reset / round.data.reset，以及F7 resync。仅/mine、97正确链时订阅，离页/错链释放。没有新Pusher/Echo client或全局常驻事件。

Payload schema仍未知，**整个payload视为不可信、完全不读取**：不使用event ID/round ID/timestamp/winning square赋值，不reset本地selection、不更新server state或结束交易。事件只使当前owner的精确key失效并重读：public board、current result/viewer winners；connected时额外current account info/squares、automation/config/enrichment、rewards。无全站invalidate、无旧账户/旧round重读，keys来自现有query factories，不发明cache key。

已提交context由layout effect发布；等scope普通render不取消pending batch，scope变化取消旧timer。250ms合并同批重复信号、两次flush间隔至少5s（工程burst上限，非协议时钟）；乱序/重复/非JSON payload均只能请求当前canonical reads，不能回退round。hidden只mark stale不network，focus由M7补偿。invalidate不取消正在执行的preflight/receipt read。read错误仍由Query owner保存/展示，不暴露原始payload/trace。

**M8 REAL SUBSCRIPTION / PAYLOAD / RESYNC QA = RUNTIME QA PENDING**。Q-47真实服务/订阅/事件schema未签收，不因mock transport通过宣布协议已验证；此signal-only实现不需要解释字段，也不以数据替代读owner。polling为独立fallback，Production56继续Release Gate。

## Verification

M7测试使用实际browser-mode QueryObserver + fake timers：可见周期、hidden暂停/focus恢复、离页释放、disabled停止、失败backoff/成功恢复、离线/重连、慢请求/多observer去重、旧account/round取消不污染新key。仅测试环境创建window stub，不进入runtime。

M8测试复用F7 client和mock transport验证两个wire event、重复/乱序/不可信payload、resync、scope切换取消、hidden仅失效、dispose无残留、current keys精确与无setQueryData。

所有真实钱包/Auto execution/Claim/非空winner/结果切换的原有pending验收继续保留；本轮不签名、广播或调用executeAutomation。

## Final checks

最终七项QA PASS：env/typecheck/lint/format/test/build/diff；60 files / 746 tests（包含本轮Claim/M10/M7/M8）。正式Chrome guest /mine实测15秒内eth_call从3增至6，进入/about后等待2秒再观察5秒无新增Mine contract call；375/1000中main375/500、25格、真实字体、无overflow/pageerror。

业务WebSocket与Vite HMR连接分开检查；本轮未观察到可验证的Pusher业务订阅确认/round事件或真实resync。socket数量/开发工具frames不作为协议证据；M8真实QA继续PENDING，不声称原502已修复或仍为本次准确错误。mock F7事件仅证明adapter边界。
