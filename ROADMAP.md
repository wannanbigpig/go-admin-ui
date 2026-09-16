# Roadmap

路线图只围绕 Vue 后台管理脚手架的稳定性和二次开发体验。

## Core

- 保持 refresh cookie、内存 access token、动态菜单路由和 `Menu.Code` 按钮权限契约。
- 完善请求错误处理、i18n 键一致性、Vitest 和 CI。
- 在现有登录与动态权限路由 smoke E2E 基础上，扩展关键表单提交流程覆盖。

## Enhancement

- 后端 OpenAPI 补齐请求/响应 schema 后，优先生成 TypeScript Types；只有收益明确时再生成 Client。
- 持续减少一次性 helper 和跨文件薄转发，但不按函数行数机械拆分。

## Optional

多租户、ABAC、微前端、OpenTelemetry、Agent 等由具体项目按需接入，不进入默认脚手架核心。
