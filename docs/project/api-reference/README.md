# ORI Backend API Reference

本目录保存 ORI 项目后端提供的正式 API Contract。

## 文件说明

- `user-api.md`
  - 用户相关接口
  - 用户信息、邀请关系、用户状态等用户域能力

- `activity-api.md`
  - ORI 活动 / 业务接口
  - Mine、Stake、Explore、Points、Round、Reward 等活动域能力

## 使用原则

这些文件用于记录后端提供的接口事实，包括：

- Endpoint
- Method
- Request parameters
- Request body
- Response structure
- Error / business code
- Field semantics

不要在这些文件中记录前端实现方式。

前端如何调用 API、Browser / Server boundary、DTO mapping、错误处理、重试策略等工程规则，请参考：

`../api.md`

## 安全规则

本目录会提交到 Git，只能记录可公开的接口事实。

允许：endpoint、host、request / response schema、示例业务数据、transaction hash / block hash、公开标识。

禁止：用户名 / 密码、API key、token、cookie、private key、JWT、application secret、Authorization credential。需要访问后台或私有服务时，通过安全渠道向对应管理员获取，不写入任何文档、`.env.example` 或源码。

## Source of Truth

当接口实现、旧源码与本目录中的正式后端文档发生冲突时：

1. 后端最新确认的 API Contract
2. 当前测试环境实际返回结果
3. 当前项目源码调用事实
4. 历史源码或旧线上行为

不要根据历史代码猜测新的接口字段或业务语义。

## Environment

实际 Backend Host 不写死在本文档中。

运行时通过：

`NEXT_PUBLIC_API_BASE_URL`

选择当前环境对应的 Backend。

Development、Production 环境必须分别配置，不要在源码中 hardcode Backend Host。