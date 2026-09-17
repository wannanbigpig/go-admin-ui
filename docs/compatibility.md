# 前后端兼容与版本策略

| x-l-admin-vue3 | gin-layout | 支持状态 | 关键契约                                                                               |
| -------------- | ---------- | -------- | -------------------------------------------------------------------------------------- |
| `0.10.x`       | `0.10.x`   | 当前支持 | 个人工作台/请求日志、全局指标权限、HttpOnly refresh cookie、动态菜单、按钮 `Menu.Code` |
| `0.9.x`        | `0.9.x`    | 开发基线 | 首版公开发布前的开发基线，不承诺与 `0.10.x` 跨 minor 混用                              |

同一 minor 内的 patch 应保持兼容。字段删除或重命名、认证模式、菜单结构、错误码语义变化时，两端提升到相同 minor 并在 Changelog 与 GitHub Release 中给出迁移说明。

Git Tag 使用 `vMAJOR.MINOR.PATCH`，必须与 `package.json` 的版本一致。提交采用 Conventional Commits；`feat!:` 或 `BREAKING CHANGE:` 必须说明后端最低兼容版本。

`v0.10.0` 是首个公开版本候选。它依赖后端新增的登录级个人工作台、个人请求日志和工作台分区权限语义，因此必须与 `gin-layout v0.10.x` 配套；不支持将本前端部署到 `0.9.x` 后端。候选阶段以干净初始化或重置系统数据为准，不承诺未发布 `0.9.x` 开发数据库的原地升级。

正式 `v0.10.0` tag 后，前后端同一 minor 的 patch 应保持现有接口和权限码兼容；需要跨 minor 的接口、认证或菜单契约变更必须在两端 Changelog 和 Release Notes 中同步记录升级步骤及回滚限制。

当前后端 OpenAPI 没有完整的 query/body/业务响应 schema，直接生成 Client 会产生大量宽泛类型和手工补丁。现阶段不引入自动 Client；待 schema 元数据完整后先生成 Types，并通过 CI 检查漂移。
