# Security Policy

## Supported versions

安全修复优先覆盖最新的 `0.9.x` 开发线。进入 `1.0.0` 后，至少维护最新 minor；其他版本的支持状态由 Release Notes 说明。

## Reporting a vulnerability

请通过 GitHub Security Advisory 的 private reporting 提交，不要先创建公开 Issue。请提供受影响版本、复现步骤、影响和缓解建议，并移除 Token、Cookie、用户数据和生产地址。

浏览器端 access token 只保存在内存中，refresh token 由后端 HttpOnly Cookie 管理。任何重新引入 localStorage token、静态注册受保护业务路由或绕过按钮权限的变更都按安全变更审查。
