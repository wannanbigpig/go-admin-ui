# X-L-Admin Vue3 前端代码库地图

> 扫描时间：2026-06-11
> 版本：0.9.2
> 技术栈：Vue 3.4 + Vite 5 + TypeScript 6 + Element Plus 2.7 + Pinia 2 + Vue Router 4 + Vue I18n 9

---

## 一、项目入口与核心链路

### 1.1 入口文件

| 文件          | 职责                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.html`  | SPA HTML 模板，挂载 `#app`                                                                                  |
| `src/main.ts` | 应用入口：创建 Vue 实例、注册 Pinia / Router / I18n / 权限指令 `v-permission`、设置全局错误处理、主题初始化 |
| `src/App.vue` | 根组件：`el-config-provider` + `ErrorBoundary` + `router-view`，根据 locale 切换 Element Plus 语言包        |

### 1.2 核心链路一览

```
index.html
  └─ src/main.ts
       ├─ src/stores/index.ts        (Pinia 实例 + persistedstate 插件)
       ├─ src/router/index.ts        (Vue Router 实例)
       ├─ src/locales/index.ts       (Vue I18n 实例)
       ├─ src/directives/permission.ts (v-permission 按钮权限指令)
       └─ src/App.vue
            └─ src/router/constantRoutes.ts → Layout → 动态路由
```

---

## 二、目录职责说明

### 2.1 `src/api/` — HTTP 接口层

薄封装层，每个文件对应一个后端业务域，调用 `src/utils/request.ts` 的 `get/post/upload` 方法。

| 文件            | 职责                                                           |
| --------------- | -------------------------------------------------------------- |
| `login.ts`      | 登录、获取验证码                                               |
| `auth.ts`       | 获取当前用户信息、菜单列表、更新个人资料                       |
| `adminUser.ts`  | 管理员用户 CRUD                                                |
| `permission.ts` | 菜单/权限 CRUD                                                 |
| `department.ts` | 部门 CRUD                                                      |
| `system.ts`     | 系统配置、字典、文件、通知、WebSocket ticket、存储配置、任务等 |
| `dashboard.ts`  | 仪表盘数据                                                     |
| `log.ts`        | 日志查询                                                       |
| `product.ts`    | 示例业务（产品管理）                                           |

### 2.2 `src/router/` — 路由系统

| 文件                | 职责                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `index.ts`          | 创建 Router 实例（HTML5 History），注册 beforeEach / afterEach 守卫                           |
| `guard.ts`          | **路由守卫核心**：Token 校验 → 用户信息刷新 → 动态路由注入 → 根路径重定向到首个菜单           |
| `constantRoutes.ts` | 静态路由：Layout 壳、Login、404、Profile、通知页、refresh、iframe                             |
| `dynamicRoutes.ts`  | 动态路由：将后端菜单树转换为 Vue Router 路由配置，管理路由增删                                |
| `componentMap.ts`   | 组件映射表：后端 `component_key` → 前端懒加载组件，支持显式映射 + `import.meta.glob` 自动扫描 |

### 2.3 `src/stores/` — Pinia 状态管理

| 文件              | 职责                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.ts`        | 创建 Pinia 实例，注册 `pinia-plugin-persistedstate`（key 前缀 `__persisted__`）                             |
| `auth.ts`         | **核心 Store**：Token 存储与过期判断、用户信息、菜单权限树、动态路由管理、按钮权限、登录/登出/刷新用户信息  |
| `setting.ts`      | 应用设置：侧边栏折叠、水印、主题（light/dark/system）、语言（zh-CN/en-US）                                  |
| `notification.ts` | **通知中心**：WebSocket 连接管理（ticket 认证、断线重连退避、会话强踢处理）、通知列表、未读数、频道订阅机制 |
| `refresh.ts`      | 刷新页面辅助                                                                                                |

### 2.4 `src/views/` — 页面视图

| 目录                         | 职责                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `login/`                     | 登录页：用户名 + 密码 + 验证码，Canvas 动画背景，主题/语言切换         |
| `home/`                      | 首页仪表盘（ECharts 图表）                                             |
| `about/`                     | 关于页面                                                               |
| `profile/`                   | 个人资料编辑                                                           |
| `permission/adminUser/`      | 管理员用户管理                                                         |
| `permission/role/`           | 角色管理                                                               |
| `permission/department/`     | 部门管理                                                               |
| `permission/menuList/`       | 菜单权限管理                                                           |
| `permission/api/`            | API 权限管理                                                           |
| `permission/components/`     | 权限模块公共组件（菜单编辑抽屉等）                                     |
| `log/adminLogin/`            | 登录日志                                                               |
| `log/request/`               | 请求日志                                                               |
| `log/session/`               | 会话日志                                                               |
| `system/config/`             | 系统配置                                                               |
| `system/dict/`               | 字典管理                                                               |
| `system/file/`               | 文件资源管理（列表/网格视图、上传、目录、移动、删除）                  |
| `system/monitor/`            | 系统监控                                                               |
| `system/notification/`       | 用户通知                                                               |
| `system/notificationManage/` | 通知管理（管理员）                                                     |
| `system/storage/`            | 存储配置                                                               |
| `system/task/`               | 定时任务管理                                                           |
| `system/taskStats/`          | 任务统计                                                               |
| `system/components/`         | 系统模块公共组件（FileExplorerLayout、FileGrid、FileSidebar 等 14 个） |
| `system/composables/`        | 文件模块组合式函数（useFileCategory、useFileUploadFlow 等 5 个）       |
| `business/product/`          | 示例业务模块                                                           |
| `other/404/`                 | 404 页面                                                               |
| `other/notFound/`            | 动态路由未匹配降级页面                                                 |
| `other/refresh/`             | 路由刷新组件                                                           |
| `other/iframe/`              | iframe 嵌入页面                                                        |

### 2.5 `src/components/` — 全局公共组件

| 组件                    | 职责                                                |
| ----------------------- | --------------------------------------------------- |
| `proTable/`             | **增强表格**：封装搜索表单 + 分页 + 表格 + 批量操作 |
| `tableList/`            | 通用列表表格                                        |
| `actionButton/`         | 单个操作按钮（权限感知）                            |
| `actionButtons/`        | 操作按钮组（权限感知）                              |
| `avatarUpload/`         | 头像上传组件                                        |
| `breadcrumb/`           | 面包屑导航                                          |
| `collapsibleSearchBtn/` | 可折叠搜索按钮                                      |
| `dateRangePicker/`      | 日期范围选择器                                      |
| `drawer/`               | 通用抽屉组件                                        |
| `errorBoundary/`        | 错误边界组件                                        |
| `filePicker/`           | 文件选择器                                          |
| `i18nInput/`            | 国际化输入框                                        |
| `iframe/`               | iframe 容器                                         |
| `pagination/`           | 分页组件                                            |

### 2.6 `src/composables/` — 组合式函数（hooks）

| 文件                    | 职责                                                      |
| ----------------------- | --------------------------------------------------------- |
| `usePermission.ts`      | 按钮权限检查组合式函数，代理 `authStore` 的权限查询       |
| `useListPage.ts`        | 通用列表页逻辑封装（搜索、分页、刷新）                    |
| `useFileUpload.ts`      | 文件上传逻辑（SHA256 秒传、分片上传、并发控制、断点续传） |
| `useDictOptions.ts`     | 字典选项加载                                              |
| `useClipboard.ts`       | 剪贴板操作                                                |
| `useSubmitLock.ts`      | 提交防抖锁                                                |
| `useIntervalPolling.ts` | 定时轮询                                                  |

### 2.7 `src/utils/` — 工具函数

| 文件               | 职责                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request.ts`       | **Axios 封装核心**：请求拦截（自动注入 Token、语言头）、响应拦截（401 过期处理、业务码统一错误提示、Blob JSON 解析）、Mock 降级、get/post/upload 方法 |
| `auth.ts`          | 权限检查工具函数 `hasPermission()`                                                                                                                    |
| `env.ts`           | 环境变量解析：`resolveBaseURL()` 组合 API 基础地址                                                                                                    |
| `redirect.ts`      | 重定向路径安全校验（防止 open redirect）                                                                                                              |
| `helper.ts`        | 通用工具函数（`isEmpty` 等）                                                                                                                          |
| `logger.ts`        | 日志工具（`Logger`），全局错误处理器 `setupGlobalErrorHandlers()`                                                                                     |
| `iframe.ts`        | iframe 工具                                                                                                                                           |
| `apiCache.ts`      | API 缓存工具                                                                                                                                          |
| `routeTitle.ts`    | 路由标题解析（支持 i18n titleKey）                                                                                                                    |
| `sha256.worker.ts` | Web Worker 计算文件 SHA256                                                                                                                            |

### 2.8 `src/modules/` — 业务域模块（DDD 分层）

每个模块通常包含 `model.ts`（数据模型）、`service.ts`（API 调用封装）、`use*.ts`（组合式函数）。

| 模块             | 职责                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `auth/`          | 认证域：登录验证码、用户信息、菜单树、权限提取与匹配                  |
| `adminUser/`     | 管理员用户域：列表、表单、角色绑定                                    |
| `permission/`    | 权限域服务                                                            |
| `apiPermission/` | API 权限域：列表、表单                                                |
| `department/`    | 部门域：树形列表、表单、角色绑定                                      |
| `role/`          | 角色域：列表、表单                                                    |
| `menu/`          | 菜单域：列表、表单、树形展开                                          |
| `dashboard/`     | 仪表盘域：ECharts 配置、数据服务                                      |
| `log/`           | 日志域：管理员登录日志、请求日志分页                                  |
| `profile/`       | 个人资料域                                                            |
| `exportCenter/`  | 导出中心域：导出任务提交                                              |
| `system/`        | 系统域：字典选项、存储配置、系统文件服务                              |
| `shared/`        | 共享层：常量（超时、分页、缓存）、响应数据标准化、表单工具、i18n 工具 |

### 2.9 `src/layout/` — 布局系统

| 文件        | 职责                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| `index.vue` | 主布局：侧边栏 + 头部 + 主内容区，支持水印                               |
| `sidebar/`  | 侧边栏：Logo、菜单渲染（sidebarMenu / sidebarItem / iconItem）、折叠按钮 |
| `header/`   | 头部栏：左侧（面包屑）、右侧（全屏/通知/用户下拉）、通知中心面板         |
| `main/`     | 主内容区：`router-view`                                                  |

### 2.10 `src/locales/` — 国际化

- 支持 `zh-CN` 和 `en-US` 两种语言
- 按页面/功能模块拆分翻译文件（login、layout、permission、system、validation 等 14 个命名空间）
- 通过 `src/locales/index.ts` 初始化 Vue I18n，导出 `translate()` 函数供非组件场景使用

### 2.11 `src/directives/` — 自定义指令

| 文件            | 职责                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| `permission.ts` | `v-permission` 指令：支持 hide / disabled / remove / or 模式，控制按钮可见性和可交互性 |

### 2.12 `src/types/` — TypeScript 类型定义

`auth.d.ts`、`router.d.ts`、`menu.d.ts`、`adminUser.d.ts`、`department.d.ts`、`role.d.ts`、`notification.d.ts`、`system.d.ts`、`log.d.ts`、`exportCenter.d.ts`、`common.d.ts`、`i18n.d.ts`

### 2.13 `src/mock/` — Mock 数据

- `index.ts`：Mock 路由匹配引擎，正则匹配 URL + Method
- `modules/auth.ts`：登录、用户信息、菜单 Mock
- `modules/system.ts`：系统配置、文件、通知 Mock
- `modules/adminUser.ts`：管理员用户 Mock
- 通过环境变量 `VITE_ENABLE_MOCK` / `VITE_ENABLE_MOCK_FALLBACK` 控制

### 2.14 `src/assets/` — 静态资源

- `images/`：Logo、头像等图片
- `styles/`：全局 SCSS 样式（`index.scss` 入口、`layout/` 布局样式、`shared.scss` 全局变量/混入）
- `svg/`：自定义 SVG 图标（由 `unplugin-icons` 的 `FileSystemIconLoader` 加载）

### 2.15 `src/constants/` — 常量

`messages.ts`：消息常量

### 2.16 `public/` — 公共静态资源

`favicon.svg`、`vite.svg`（不经过 Vite 构建，直接复制到 dist）

### 2.17 `src/test/` — 测试配置

`setup.ts`：Vitest 全局测试环境设置

---

## 三、关键功能代码定位

### 3.1 登录流程

| 步骤         | 文件                                               | 关键代码                                                         |
| ------------ | -------------------------------------------------- | ---------------------------------------------------------------- |
| 登录页面     | `src/views/login/index.vue`                        | `handleLogin()` → `authStore.loginWithCredentials()`             |
| 验证码获取   | `src/modules/auth/service.ts` → `src/api/login.ts` | `fetchCaptcha()` → `getCaptcha()`                                |
| 登录 API     | `src/api/login.ts`                                 | `login(data)`                                                    |
| 登录状态管理 | `src/stores/auth.ts`                               | `loginWithCredentials()` → `updateToken()` → `refreshUserInfo()` |

### 3.2 Token 管理

| 功能             | 文件                   | 关键代码                                                                                  |
| ---------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| Token 存储       | `src/stores/auth.ts`   | `access_token`、`expires_at`（内存），persistedstate 持久化到 localStorage                |
| Refresh Token    | `src/stores/auth.ts`   | `refresh_token`、`refresh_expires_at` 存储在 localStorage，启动时 `restoreRefreshToken()` |
| Token 过期判断   | `src/stores/auth.ts`   | `isTokenExpired` computed：`Date.now() / 1000 >= expires_at`                              |
| Token 滑动刷新   | `src/utils/request.ts` | 响应拦截器读取 `refresh-access-token` / `refresh-exp` 响应头                              |
| Token 注入请求头 | `src/utils/request.ts` | 请求拦截器：`Authorization: Bearer ${token}`                                              |

### 3.3 路由守卫与动态路由

| 功能          | 文件                          | 关键代码                                                                    |
| ------------- | ----------------------------- | --------------------------------------------------------------------------- |
| 路由守卫入口  | `src/router/guard.ts`         | `beforeEach()`：Token 检查 → 刷新用户信息 → 动态路由注入                    |
| 动态路由转换  | `src/router/dynamicRoutes.ts` | `convertRoute()`：后端菜单树 → Vue Router 路由配置                          |
| 组件映射      | `src/router/componentMap.ts`  | `component_key` → 懒加载组件，显式映射 + `import.meta.glob` 自动扫描        |
| 路由添加/移除 | `src/router/dynamicRoutes.ts` | `addDynamicRoutes()` / `removeDynamicRoute()` / `checkDynamicRouteExists()` |
| 未匹配降级    | `src/router/componentMap.ts`  | 未找到组件映射时降级到 `other:notFound`                                     |

### 3.4 菜单权限

| 功能         | 文件                                                     | 关键代码                                    |
| ------------ | -------------------------------------------------------- | ------------------------------------------- |
| 菜单数据获取 | `src/modules/auth/service.ts`                            | `fetchUserMenuTree()` → `getUserMenuList()` |
| 菜单渲染     | `src/layout/sidebar/sidebarMenu.vue` + `sidebarItem.vue` | 根据 `routerData` 递归渲染                  |
| 菜单显隐控制 | `src/router/dynamicRoutes.ts`                            | `meta.show` 由 `route.is_show` 控制         |

### 3.5 按钮权限

| 功能           | 文件                               | 关键代码                                                                                   |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| 权限提取       | `src/modules/auth/permission.ts`   | `extractButtonPermissions()` / `buildButtonPermissionMap()` 从菜单树提取 type=3 的按钮节点 |
| 指令方式       | `src/directives/permission.ts`     | `v-permission`：支持 hide / disabled / remove / or 模式                                    |
| 组合式函数方式 | `src/composables/usePermission.ts` | `usePermission()` → `checkPermission()` / `shouldShowButton()`                             |
| 工具函数方式   | `src/utils/auth.ts`                | `hasPermission()`                                                                          |

### 3.6 请求拦截器与错误码处理

| 功能           | 文件                                  | 关键代码                                                                                |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| 请求拦截器     | `src/utils/request.ts:136-163`        | 自动注入 Authorization、Accept-Language、Content-Type                                   |
| 响应拦截器     | `src/utils/request.ts:172-269`        | 统一处理：204 空响应、Blob JSON 解析、401 过期弹窗、业务码非 0 错误提示、网络错误、超时 |
| 静默业务码     | `src/utils/request.ts:26`             | `SILENT_BUSINESS_CODES = [11011]`（未配置功能不弹错误）                                 |
| 401 处理模式   | `src/utils/request.ts:13-17`          | `authErrorMode: 'credential'`（登录失败，不过期弹窗） / `'session'`（会话失效）         |
| Token 过期弹窗 | `src/stores/auth.ts:245-262`          | `handleTokenExpired()` → `ElMessageBox.alert` → 跳转登录                                |
| Mock 降级      | `src/utils/request.ts:78-93, 279-302` | Mock 开启时，未匹配接口返回 401 错误（不再自动成功）                                    |

### 3.7 文件上传下载

| 功能                | 文件                               | 关键代码                                                                                  |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| 上传基础方法        | `src/utils/request.ts:348-370`     | `upload()` 封装 FormData                                                                  |
| 上传业务逻辑        | `src/composables/useFileUpload.ts` | SHA256 秒传、分片上传（multipart）、并发控制（MAX_PARALLEL_UPLOADS=5）、断点续传          |
| 文件模块服务        | `src/modules/system/service.ts`    | `uploadSystemFile`、`initMultipartUpload`、`completeMultipartUpload` 等                   |
| 文件管理页面        | `src/views/system/file/index.vue`  | 文件列表/网格视图、搜索、目录管理                                                         |
| 文件相关组件        | `src/views/system/components/`     | FileExplorerLayout、FileGrid、FileSidebar、FileToolbar、FileUploadQueue、FileDetailDrawer |
| 文件相关 composable | `src/views/system/composables/`    | useFileCategory、useFileExport、useFileFolder、useFileOperations、useFileUploadFlow       |

### 3.8 环境变量

| 文件               | 用途                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| `.env.example`     | 环境变量模板（完整注释说明）                                                     |
| `.env.development` | 开发环境：`VITE_BASE_URL` 为空（走代理）、`VITE_ENABLE_MOCK=false`、默认登录凭据 |
| `.env.production`  | 生产环境：`VITE_BASE_URL=https://admin-api.wannanbigpig.com/`                    |
| `.env.location`    | 本地模式：类似 development，用于 `pnpm local`                                    |

关键环境变量：

| 变量                                      | 作用                           |
| ----------------------------------------- | ------------------------------ |
| `VITE_APP_TITLE`                          | 浏览器标签页标题               |
| `VITE_BASE_URL`                           | 后端 API 基础地址              |
| `VITE_BASE_API`                           | API 前缀（默认 `/admin`）      |
| `VITE_BASE_STATIC`                        | 静态资源路径                   |
| `VITE_PROXY_TARGET`                       | 开发代理目标地址               |
| `VITE_USE_PROXY`                          | 是否启用代理                   |
| `VITE_ENABLE_I18N`                        | 是否开启国际化                 |
| `VITE_DEFAULT_LOCALE`                     | 默认语言                       |
| `VITE_APP_BASE`                           | 页面 base 路径（部署子目录用） |
| `VITE_ENABLE_MOCK`                        | 是否启用 Mock                  |
| `VITE_ENABLE_MOCK_FALLBACK`               | 是否启用 Mock 降级             |
| `VITE_DEV_USERNAME` / `VITE_DEV_PASSWORD` | 开发环境默认登录凭据           |

---

## 四、构建与运行流程

### 4.1 `package.json` scripts

| 命令                    | 作用                                                    |
| ----------------------- | ------------------------------------------------------- |
| `pnpm local`            | `vite --mode location` 本地开发（使用 `.env.location`） |
| `pnpm dev`              | `vite --mode development` 开发模式                      |
| `pnpm prod`             | `vite --mode production` 预览模式                       |
| `pnpm build:dev`        | 开发环境构建                                            |
| `pnpm build:production` | 生产环境构建                                            |
| `pnpm type-check`       | TypeScript 类型检查（`vue-tsc --noEmit`）               |
| `pnpm lint`             | ESLint 检查                                             |
| `pnpm lint:fix`         | ESLint 自动修复                                         |
| `pnpm test`             | Vitest 测试（watch 模式）                               |
| `pnpm test:run`         | Vitest 单次运行                                         |
| `pnpm test:coverage`    | Vitest 覆盖率报告                                       |
| `pnpm preview`          | 预览构建产物                                            |

### 4.2 Vite 配置 (`vite.config.js`)

- **路径别名**：`@` → `src/`，`~` → `node_modules/`
- **插件链**：
    - `@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx`
    - `unplugin-auto-import`：自动导入 Vue API、Element Plus、图标
    - `unplugin-vue-components`：自动导入组件（Element Plus + 图标）
    - `unplugin-icons`：图标自动安装 + 自定义 SVG 集（`src/assets/svg/`）
    - `unplugin-element-plus`：Element Plus 按需样式导入
    - `vite-plugin-eslint`：开发模式 ESLint
    - `vite-plugin-compression`：Gzip 压缩（>10KB 文件）
- **开发服务器**：`127.0.0.1:3000`，代理 `/admin` 和 `/static` 到 `VITE_PROXY_TARGET`
- **构建优化**：
    - `manualChunks`：element-plus / vue-vendor / axios / echarts / vendor 分包
    - 生产环境移除 `console` 和 `debugger`
    - SCSS 全局注入 `shared.scss` 变量/混入
- **CSS**：Dart Sass modern compiler API

### 4.3 TypeScript 配置 (`tsconfig.json`)

- 目标：ESNext，模块：ESNext，模块解析：Bundler
- 严格模式开启
- 路径别名：`@/*` → `./src/*`
- 包含：`src/**/*.ts`、`src/**/*.d.ts`、`src/**/*.tsx`、`src/**/*.vue`

### 4.4 测试配置 (`vitest.config.ts`)

- 测试框架：Vitest + jsdom
- 全局 setup：`src/test/setup.ts`
- 覆盖率：v8

---

## 五、测试覆盖

现有 22 个测试文件：

| 测试文件                                     | 覆盖范围         |
| -------------------------------------------- | ---------------- |
| `src/stores/auth.test.ts`                    | 认证 Store       |
| `src/stores/notification.test.ts`            | 通知 Store       |
| `src/utils/request.test.ts`                  | 请求封装         |
| `src/utils/helper.test.ts`                   | 通用工具         |
| `src/utils/redirect.test.ts`                 | 重定向工具       |
| `src/utils/apiCache.test.ts`                 | API 缓存         |
| `src/utils/logger.test.ts`                   | 日志工具         |
| `src/utils/iframe.test.ts`                   | iframe 工具      |
| `src/router/componentMap.test.ts`            | 组件映射表       |
| `src/router/dynamicRoutes.test.ts`           | 动态路由转换     |
| `src/composables/useListPage.test.ts`        | 列表页组合式函数 |
| `src/composables/useFileUpload.test.ts`      | 文件上传         |
| `src/composables/useDictOptions.test.ts`     | 字典选项         |
| `src/composables/useClipboard.test.ts`       | 剪贴板           |
| `src/composables/useSubmitLock.test.ts`      | 提交锁           |
| `src/composables/useIntervalPolling.test.ts` | 轮询             |
| `src/components/actionButton/index.test.ts`  | 操作按钮         |
| `src/components/actionButtons/index.test.ts` | 操作按钮组       |
| `src/components/avatarUpload/index.test.ts`  | 头像上传         |
| `src/api/permission.test.ts`                 | 权限 API         |
| `src/modules/shared/i18n.test.ts`            | i18n 工具        |
| `src/modules/shared/response.test.ts`        | 响应标准化       |

---

## 六、优先 Code Review 模块清单

按风险和影响范围排序，建议优先审查：

### P0 — 安全与认证核心

1. **`src/stores/auth.ts`** — Token 生命周期、登录/登出、refresh token 恢复、并发刷新控制（refreshingPromise）、会话版本号（authSessionVersion）防旧请求覆盖
2. **`src/router/guard.ts`** — 路由守卫：Token 校验、用户信息刷新、动态路由注入、重定向逻辑
3. **`src/utils/request.ts`** — 请求/响应拦截器：401 处理（credential vs session 模式）、Token 滑动刷新、错误码统一处理、Mock 降级逻辑
4. **`src/modules/auth/permission.ts`** — 权限提取与匹配算法

### P1 — 核心业务逻辑

5. **`src/router/dynamicRoutes.ts`** — 动态路由转换：菜单树 → 路由配置，组件映射、路由去重、无效路由过滤
6. **`src/stores/notification.ts`** — WebSocket 连接管理：ticket 认证、断线重连退避、会话强踢处理、频道订阅机制、消息解析与去重
7. **`src/composables/useFileUpload.ts`** — 文件上传：SHA256 秒传、分片上传、并发控制、失败重试（File 句柄释放问题）、目录上传竞态
8. **`src/directives/permission.ts`** — 权限指令：DOM 操作安全性、状态清理

### P2 — 基础设施与工具

9. **`src/components/proTable/index.vue`** — 搜索模型引用类型比较、状态同步
10. **`src/utils/env.ts`** — 环境变量解析、baseURL 组合逻辑
11. **`src/modules/shared/response.ts`** — 响应数据标准化（normalizeArrayData / normalizeDetailData）
12. **`src/mock/index.ts`** — Mock 路由匹配引擎、未命中处理策略

### P3 — UI 与体验

13. **`src/views/login/index.vue`** — 登录页完整流程、Canvas 动画性能
14. **`src/views/system/composables/useFileUploadFlow.ts`** — 文件上传流程编排、目录创建并发
15. **`src/views/system/components/FileSidebar.vue`** — 文件目录树交互
16. **`src/components/tableList/index.vue`** — 通用列表组件

---

## 七、架构特点总结

1. **DDD 分层**：`modules/` 按业务域组织（model + service + composable），`views/` 仅负责 UI 组合
2. **组件映射表**：后端 `component_key` → 前端 `componentMap` 查表，支持显式映射 + glob 自动扫描，解耦前后端目录结构
3. **权限体系**：三层权限 — 路由级（动态路由注入）、菜单级（侧边栏渲染）、按钮级（v-permission 指令 + usePermission composable）
4. **Token 安全**：access_token 内存存储 + refresh_token localStorage 持久化、单调递增校验防并发覆盖、会话版本号防旧请求干扰
5. **WebSocket 通知**：ticket 认证、指数退避重连、会话强踢（4001/4002）停止重连、频道订阅机制
6. **文件上传**：SHA256 秒传 + 分片上传 + 并发控制（5 并发）+ Web Worker 哈希计算
7. **Mock 系统**：正则匹配 URL + Method，支持降级模式（`VITE_ENABLE_MOCK_FALLBACK`）
8. **国际化**：Vue I18n + Element Plus 语言包联动，14 个命名空间
9. **主题系统**：light / dark / system 三种模式，CSS 变量切换 + 系统主题监听
