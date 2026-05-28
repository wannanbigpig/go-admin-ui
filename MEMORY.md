# MEMORY

这份文档写给接手 `x-l-admin-vue3` 的 AI Agent。它不是项目介绍页，而是为了让下一位 AI 快速确认三件事：

-   当前代码已经实现了什么
-   哪些契约不能碰
-   新需求该先去哪里看

---

## 0. 快速结论

先记住这些，不确定时再往下查细节：

-   **代码是唯一真相，文档只是辅助**；文档和代码冲突时，以源码和配置文件为准并顺手修正文档。
-   项目是 `Vue 3 + Vite 5 + Element Plus + Pinia + Vue Router + Vue I18n + TypeScript` 的后台管理系统前端。
-   关联后端仓库是 [wannanbigpig/gin-layout](https://github.com/wannanbigpig/gin-layout)。
-   动态菜单和动态路由标题都以后端返回的 `title` 原文为准，前端不根据 `name`、`path`、`component` 推断翻译。
-   语言切换后，必须调用 `authStore.refreshUserInfo()` 重新拉取菜单并同步动态路由，否则侧边栏标题不会即时刷新。
-   菜单新增/编辑提交时只能提交清洗后的 `title_i18n`，禁止提交 `title`。
-   权限按钮文案不能静态缓存；要通过 `usePermission().getButtonInfoFull(code)` 读取响应式权限映射。
-   `vue-i18n` 会把 `@` 当作 linked key 语法起始符；文案里出现 `@/views/...` 时必须转义成 `@@/views/...` 或直接改写示例。
-   开发环境的 API 请求默认走 Vite 同源代理，前缀是 `/admin`；不要假设浏览器可以直接跨域直连后端。
-   大文件上传支持分片；如果底层存储不支持分片并返回业务码 `11011`，前端会自动降级为普通上传。

---

## 1. 禁止事项

当前代码库禁止这样做：

-   根据菜单的 `name`、`path`、`component` 或本地 i18n key 自行推断动态菜单标题。
-   语言切换时只改前端 locale，不刷新 `authStore` 中的菜单和动态路由。
-   菜单写接口直接提交 `title`，或在 `title_i18n` 清洗时保留脏字段。
-   将权限按钮标题、图标、显隐状态在页面初始化时读取一次后长期复用。
-   在 `vue-i18n` 文案里直接写未转义的 `@/views/...`。
-   假设存在 `src/stores/routes.ts`；当前路由和按钮权限都由 `auth` store 持有。
-   假设字典缓存无需按语言隔离；`useDictOptions` 的缓存 key 必须区分 `locale`。
-   假设 `SortableJS` 是当前运行时依赖；现在只有类型包残留，没有实际运行时代码。
-   忽略开发代理配置，直接把请求改成依赖浏览器直连后端。

---

## 2. 项目当前状态

### 2.1 基础事实

-   项目名：`x-l-admin-vue3`
-   类型：后台管理系统前端
-   技术栈：`Vue 3.4+`、`Vite 5`、`Element Plus`、`Pinia`、`Vue Router`、`Vue I18n`、`Axios`、`TypeScript`、`Vitest + jsdom`
-   关联后端：[`wannanbigpig/gin-layout`](https://github.com/wannanbigpig/gin-layout)

### 2.2 已落地能力

-   基础后台框架、响应式布局、登录认证、Token 刷新、路由守卫已接通。
-   RBAC 已覆盖管理员、部门、角色、菜单、接口权限管理。
-   个人中心已支持资料维护和头像上传。
-   系统配置已包含存储配置、导出目录配置、请求日志脱敏配置。
-   通知中心已支持广播、指定用户发送、消息红点、全部已读和 `action_url` 跳转。
-   异步导出中心已支持 `run_id` 跟踪、阶段轮询、下载、重试和取消。
-   文件上传已支持本地批量上传、OSS 直传、分片上传和按驱动能力自动降级。

### 2.3 当前应当怎样描述测试

-   项目里已经有一批 Vitest 测试文件，覆盖了 `useListPage`、`useIntervalPolling`、`useDictOptions`、`request.ts`、`response.ts`、`auth.ts`、`helper.ts` 等公共逻辑。
-   这里描述“已有测试文件”，不要直接写成“测试已完全可运行通过”，除非你在当前环境重新验证过。

---

## 3. DIRECTORY_MAP

```text
x-l-admin-vue3/
├── src/
│   ├── api/                  # 底层 API 定义
│   ├── assets/               # 图片、样式、自定义 SVG
│   ├── components/           # 公共组件
│   │   ├── proTable/         # 配置化列表组件
│   │   ├── actionButton/     # 单个权限按钮
│   │   └── actionButtons/    # 操作列按钮收纳
│   ├── composables/          # 通用组合式函数
│   ├── directives/           # 自定义指令
│   ├── layout/               # 布局与通知中心
│   ├── locales/              # 国际化语言包
│   ├── modules/              # 业务模块 service / model / useXxx
│   │   ├── shared/           # 分页、i18n、响应归一等公共逻辑
│   │   └── exportCenter/     # 异步导出中心
│   ├── router/               # 路由守卫与动态路由转换
│   ├── stores/               # Pinia 状态管理
│   ├── test/                 # Vitest 初始化
│   ├── types/                # 类型声明
│   ├── utils/                # request、sse、helper、logger 等工具
│   └── views/                # 页面组件
├── vite.config.js            # Vite 配置
├── vitest.config.ts          # Vitest 配置
└── README.md                 # 项目说明
```

---

## 4. 关键模块

### 4.1 动态路由与菜单契约

-   入口文件：`src/stores/auth.ts`、`src/router/guard.ts`、`src/router/dynamicRoutes.ts`
-   `authStore.refreshUserInfo()` 会并发拉取当前用户和菜单树，并立即调用 `syncDynamicRoutesFromMenu()` 同步动态路由。
-   `convertRoute()` 会过滤按钮节点（`type === 3` 或 `'button'`），并对 `name`、`path` 做去重保护。
-   `normalizeComponentKey()` 会把后端 `component` 统一归一化到 `../views/**/*.vue` 规则。
-   开发模式下 `validateRouteComponents()` 会在组件路径缺失时直接抛错，而不是等到访问页面时再白屏。

### 4.2 权限按钮体系

-   入口文件：`src/composables/usePermission.ts`、`src/components/actionButton/index.vue`、`src/components/actionButtons/index.vue`
-   `usePermission()` 不再做按钮缓存，直接代理 `authStore.buttonPermissionMap`。
-   `xl-action-button` 支持 `:code`，传入后会通过 `getButtonInfoFull(code)` 实时读取按钮标题、图标和显隐配置。
-   `xl-action-buttons` 会先执行 `visible` 判断，再执行 `checkPermission(btn.permission)` 过滤可见按钮，多余按钮收纳到“更多”下拉中。

### 4.3 ProTable 与列表页公共能力

-   入口文件：`src/components/proTable/index.vue`、`src/components/proTable/types.ts`、`src/composables/useListPage.ts`
-   `ProTable` 支持 `columns` 和 `searchSchema` 两种驱动方式。
-   内建搜索目前覆盖 `input / select / daterange` 三种控件。
-   内建单元格渲染覆盖 `tag / avatar / eye / custom`。
-   `useListPage` 负责统一分页、列表请求、重置逻辑和异常兜底；请求异常时会回退空列表并打日志，不让页面直接白屏。

### 4.4 请求层、轮询和字典缓存

-   入口文件：`src/utils/request.ts`、`src/composables/useIntervalPolling.ts`、`src/composables/useDictOptions.ts`
-   请求拦截器会自动注入 `Accept-Language`、`Authorization`，并在响应头返回 `refresh-access-token` 时更新 token。
-   `SILENT_BUSINESS_CODES` 当前包含 `11011`，命中后不会弹全局错误，交给业务侧 `catch` 自行处理。
-   `useIntervalPolling` 是串行轮询模型，支持 `when`、`immediate`、页面隐藏暂停和 `AbortController` 中断。
-   `useDictOptions` 使用“内存 Map + localStorage”二级缓存，且缓存按 `${typeCode}::${locale}` 隔离。

### 4.5 文件上传与通知中心

-   上传入口：`src/composables/useFileUpload.ts`、`src/modules/system/service.ts`、`src/utils/sse.ts`
-   超过 `20MB` 的文件在开启分片时会走 multipart；分片大小 `5MB`，分片并发数 `3`。
-   批量直传链路使用 SSE 预取上传凭证，再并发直传到对象存储，总上传并发上限 `5`。
-   通知入口：`src/stores/notification.ts`、`src/layout/header/notificationCenter.vue`、`src/views/system/notification.vue`
-   通知支持 `action_url` 跳转，且支持“全部已读”。

---

## 5. 任务阅读索引

按任务定位，不要把同一份事实在多个章节重复读一遍：

-   **登录态、菜单、权限**：

    -   `src/stores/auth.ts`
    -   `src/modules/auth/permission.ts`
    -   `src/composables/usePermission.ts`
    -   `src/router/guard.ts`
    -   `src/router/dynamicRoutes.ts`

-   **请求层、静默错误、SSE**：

    -   `src/utils/request.ts`
    -   `src/utils/sse.ts`
    -   `src/api/system.ts`

-   **列表页与通用分页**：

    -   `src/components/proTable/index.vue`
    -   `src/components/actionButton/index.vue`
    -   `src/components/actionButtons/index.vue`
    -   `src/composables/useListPage.ts`

-   **上传、导出、通知**：

    -   `src/composables/useFileUpload.ts`
    -   `src/modules/system/service.ts`
    -   `src/modules/exportCenter/`
    -   `src/stores/notification.ts`
    -   `src/layout/header/notificationCenter.vue`

-   **国际化与菜单编辑**：
    -   `src/locales/`
    -   `src/modules/shared/i18n.ts`
    -   `src/modules/menu/useMenuForm.ts`

---

## 6. 开发约束与验证

### 6.1 保持现有前端范式

-   优先沿用现有 `views / modules / composables / components / stores / utils` 分层。
-   小需求优先做局部增量修改，避免为了一个页面重写整条公共链路。
-   改接口联动时，先核对当前前端请求模型和后端真实返回，再决定是否扩展类型或适配逻辑。

### 6.2 开发风格

-   页面层 `views` 保持偏薄，主要负责模板组织、事件绑定和页面级状态拼装；请求、数据转换和可复用业务逻辑优先下沉到 `modules` 或 `composables`。
-   `modules/<domain>/` 优先承载同领域的 `service / model / useXxx`，不要把页面私有逻辑散落到 `utils`。
-   公共能力优先复用现有组件和组合式函数，尤其是列表页优先复用 `ProTable`、操作按钮优先复用 `xl-action-button` / `xl-action-buttons`、分页优先复用 `useListPage`。
-   新增交互时先遵循现有数据流：`api` 定义底层接口，`modules/service` 做业务封装，`views` 调用组合式函数或 service，不在页面里堆大段请求细节。
-   命名保持直接、领域化，优先使用现有模式如 `useXxxPage`、`useXxxForm`、`fetchXxx`、`buildXxx`，不要引入过度抽象的泛化命名。
-   样式优先沿用现有 design tokens、Element Plus 语义和项目已有 class 命名；不要为单个页面引入风格突兀的新视觉语言。
-   改已有页面时优先做增量调整，不随意把 Options/组合式写法、组件组织方式或按钮体系整体换一种风格。

### 6.3 国际化与菜单契约必须稳定

-   菜单树和动态路由标题展示只消费后端下发的 `title`。
-   菜单详情页若涉及编辑，必须同时正确处理 `title` 与 `title_i18n` 的读写边界：展示可有 `title`，提交只能送 `title_i18n`。
-   示例文案里只要可能出现 `@`，就先考虑 `vue-i18n` 转义影响。

### 6.4 默认验证命令

-   本地开发：`npm run dev` / `npm run local`
-   类型检查：`npm run type-check`
-   全量 Lint：`npm run lint`
-   单文件 Lint：`npx eslint <修改的文件>`
-   单元测试：`npm run test:run`
-   覆盖率：`npm run test:coverage`

如果本次改动涉及源码文件，至少要对改动文件执行 ESLint；如果涉及公共逻辑、请求层、权限链路、动态路由或上传链路，应补充类型检查和对应测试验证。

---

## 7. 一句话接手策略

先判断需求落点是在 `auth` 权限链路、请求层、公共组件、组合式函数还是具体 `views` 页面；沿用现有结构小步修改，优先维护菜单契约、按钮权限响应式和请求层降级逻辑。
