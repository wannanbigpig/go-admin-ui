# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 和 SemVer。

## [Unreleased]

### Changed

- 认证 token、用户信息和菜单改为仅保存在内存中。
- 动态路由异常统一回收登录态并结束加载状态。
- 角色自定义数据范围增加前后端一致校验。
- 中英文 locale 增加键结构一致性测试。

### Security

- 通知发送页面移出静态路由，并增加 `notification:send` 按钮权限。

## [0.9.2]

- 当前开发基线。
