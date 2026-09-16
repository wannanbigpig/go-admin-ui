# 前后端兼容与版本策略

| x-l-admin-vue3 | gin-layout | 支持状态 | 关键契约                                                      |
| -------------- | ---------- | -------- | ------------------------------------------------------------- |
| `0.9.x`        | `0.9.x`    | 当前支持 | HttpOnly refresh cookie、统一响应、动态菜单、按钮 `Menu.Code` |

同一 minor 内的 patch 应保持兼容。字段删除或重命名、认证模式、菜单结构、错误码语义变化时，两端提升到相同 minor 并在 Changelog 与 GitHub Release 中给出迁移说明。

Git Tag 使用 `vMAJOR.MINOR.PATCH`，必须与 `package.json` 的版本一致。提交采用 Conventional Commits；`feat!:` 或 `BREAKING CHANGE:` 必须说明后端最低兼容版本。

当前后端 OpenAPI 没有完整的 query/body/业务响应 schema，直接生成 Client 会产生大量宽泛类型和手工补丁。现阶段不引入自动 Client；待 schema 元数据完整后先生成 Types，并通过 CI 检查漂移。
