# 运行机制说明

本文档描述当前前端项目的认证、路由、请求、通知和环境变量约定，方便排查问题或补充功能时快速定位。

## 1. 启动模式

`package.json` 当前提供以下脚本：

| 命令                       | 说明                                           |
| -------------------------- | ---------------------------------------------- |
| `npm run dev`              | 使用 `development` 模式启动                    |
| `npm run local`            | 使用 `location` 模式启动，读取 `.env.location` |
| `npm run prod`             | 使用 `production` 模式启动 Vite 开发服务器     |
| `npm run build:dev`        | 构建 `development` 产物                        |
| `npm run build:production` | 构建 `production` 产物                         |
| `npm run type-check`       | 执行 `vue-tsc --noEmit`                        |
| `npm run lint`             | 对 `src/` 执行 ESLint                          |
| `npm run test:run`         | 执行 Vitest 单测                               |

## 2. 认证与登录流程

### 登录页

`src/views/login/index.vue` 当前包含：

- 用户名、密码、验证码三项输入；
- 启动时请求 `/v1/login-captcha` 获取验证码；
- 开发环境下可通过 `VITE_DEV_USERNAME`、`VITE_DEV_PASSWORD` 自动填充默认账号密码。

### Token 生命周期

认证核心在 `src/stores/auth.ts`：

- 登录成功后保存 `access_token` 与 `expires_at`；
- 通过 `refreshUserInfo()` 并发拉取当前用户信息与菜单树；
- `ensureTokenValid()` 会优先校验当前 token，失败时尝试静默刷新；
- `resetAuthStore()` 会清空本地认证状态并移除动态路由。

## 3. 路由生成机制

### 静态路由

`src/router/constantRoutes.ts` 负责登录页、通知中心、个人中心、iframe 和 404 等固定入口。

### 动态路由

`src/router/dynamicRoutes.ts` 的核心行为：

- 过滤按钮节点（`type === 3`）；
- 根据 `component_key` 通过 `componentMap` 解析组件；
- 自动跳过重复的 `name` / `path`；
- 目录无自有组件且没有有效子路由时会被过滤；
- 根路径 `/` 在只命中 `Layout` 时会跳转到第一个可访问菜单。

### 守卫

`src/router/guard.ts` 负责：

- 登录态检查；
- 失败时静默刷新 `access_token`；
- 初始化用户信息与动态路由；
- 统一设置页面标题；
- 路由切换时展示 `NProgress`。

## 4. 请求层与 Mock

### 请求层

`src/utils/request.ts` 基于 Axios 封装，当前行为包括：

- 注入 `Authorization` 和 `Accept-Language`；
- 标准化后端响应结构；
- 多个 401 场景共享一次刷新 token 请求，避免并发刷新；
- 支持上传与下载；
- 业务异常统一消息提示。

### Mock 约定

开发模式下，以下任一变量为 `true` 时会启用 Mock：

- `VITE_ENABLE_MOCK`
- `VITE_ENABLE_MOCK_FALLBACK`

当前实现约定：

- 仅在 `import.meta.env.DEV` 下启用；
- 请求命中 Mock 时直接返回 Mock 数据；
- 未命中 Mock 时直接报错，不会自动回落成“假成功”。

## 5. 通知与 WebSocket

通知状态集中在 `src/stores/notification.ts`，当前机制包括：

- 获取通知列表与未读数；
- 建立 WebSocket 连接；
- 频道订阅 / 退订；
- 心跳保活；
- 断线重连；
- 导出任务消息与普通消息统一归一化。

关键常量：

- 心跳间隔：`30000ms`
- 心跳超时：`90000ms`
- 重连退避：`3000ms ~ 60000ms`

如后端返回会话终止 Close code `4001` 或 `4002`，前端会停止重连并回到登录流程。

## 6. 环境变量

### 必备变量

| 变量名                | 说明                     |
| --------------------- | ------------------------ |
| `VITE_APP_TITLE`      | 页面标题后缀             |
| `VITE_ENABLE_I18N`    | 是否启用国际化           |
| `VITE_DEFAULT_LOCALE` | 默认语言                 |
| `VITE_APP_BASE`       | 前端路由 base            |
| `VITE_BASE_URL`       | API 主机地址             |
| `VITE_BASE_API`       | API 前缀                 |
| `VITE_BASE_STATIC`    | 静态资源前缀             |
| `VITE_PROXY_TARGET`   | 开发代理目标地址         |
| `VITE_USE_PROXY`      | 开发环境是否走代理       |
| `AUTO_OPEN_BROWSER`   | 启动时是否自动打开浏览器 |

### 可选变量

| 变量名                        | 说明                           |
| ----------------------------- | ------------------------------ |
| `VITE_ENABLE_MOCK`            | 在开发模式下启用 Mock          |
| `VITE_ENABLE_MOCK_FALLBACK`   | 在开发模式下启用 Mock fallback |
| `VITE_NOTIFICATION_WS_URL`    | 显式指定通知 WebSocket 地址    |
| `VITE_IFRAME_ALLOWED_ORIGINS` | 限制 iframe 可访问源           |
| `VITE_DEV_USERNAME`           | 开发环境默认用户名             |
| `VITE_DEV_PASSWORD`           | 开发环境默认密码               |

## 7. 主题与国际化

`src/main.ts` 启动时会：

- 注册全局错误处理；
- 挂载 `pinia`、`i18n`、`router`；
- 根据 `stores/setting.ts` 应用 `light` / `dark` / `system` 主题；
- 监听系统主题变化；
- 监听 locale 变化并同步更新 `vue-i18n`。

## 8. 建议排查路径

遇到问题时，优先按下面顺序排查：

1. 登录 / 菜单问题：`src/stores/auth.ts`
2. 路由跳转问题：`src/router/guard.ts`、`src/router/dynamicRoutes.ts`
3. 接口异常 / Mock：`src/utils/request.ts`
4. 权限按钮异常：`src/composables/usePermission.ts`、`src/directives/permission.ts`
5. 通知异常：`src/stores/notification.ts`
