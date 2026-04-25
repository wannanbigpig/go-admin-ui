# X-L-Admin-Vue3 AI Context

> 供 AI 助手快速建立项目上下文。本文只描述当前代码事实，不写历史对比。遇到冲突时，以源码和配置文件为准。

## AI_RULES

-   回复语言：中文。
-   默认以当前代码为准，不根据旧文档或记忆推断。
-   修改前先定位真实文件与调用链；不要只改表象。
-   文档、代码、测试说明中避免历史对比措辞。
-   涉及用户可见文案时，同步维护 `src/locales/zh-CN` 与 `src/locales/en-US`。
-   涉及菜单标题、动态路由标题时，接口返回的 `title` 是展示事实来源。
-   菜单新增/编辑提交只提交清洗后的 `title_i18n`，不提交 `title`。
-   权限按钮文案需要保持响应式读取，不要在页面初始化时固化为静态对象。
-   i18n 文案里直接写 `@/views/...` 需注意 vue-i18n linked key 语法；需要时用 `@@` 转义。
-   开发环境请求默认走 Vite 代理；不要假设浏览器直连后端。
-   文件编辑保持最小影响，优先复用现有 `modules`、`composables`、`utils`。

## PROJECT_FACTS

-   项目：`x-l-admin-vue3`
-   类型：后台管理系统前端
-   技术栈：Vue 3、Vite 5、TypeScript、Element Plus、Pinia、Vue Router、Vue I18n、Axios、Vitest
-   UI：Element Plus、Iconify 图标、animate.css、NProgress
-   状态持久化：`pinia-plugin-persistedstate`
-   单元测试：Vitest + jsdom + `src/test/setup.ts`
-   在线演示：https://x-l-admin.wannanbigpig.com/
-   后端项目：https://github.com/wannanbigpig/gin-layout
-   API 文档：https://wannanbigpig.apifox.cn/

## CURRENT_STATUS

-   已实现：基础框架、后台布局、登录认证、Token 刷新、路由守卫、RBAC、系统管理、日志管理、个人中心。
-   已实现：`zh-CN` / `en-US` 国际化，运行时切换。
-   已实现：浅色、深色、跟随系统主题。
-   已实现：Vitest 单元测试基础与关键工具测试。
-   可继续优化：`tableList` 泛型化、通用搜索/操作列组件、大型页面拆分、请求类型细化、静态数据缓存、列表虚拟滚动、E2E 测试。

## SOURCE_OF_TRUTH

-   依赖与脚本：`package.json`
-   Vite、代理、自动导入、分包：`vite.config.js`
-   测试配置：`vitest.config.ts`
-   ESLint：`eslint.config.js`
-   TypeScript：`tsconfig.json`
-   环境变量模板：`.env.example`
-   请求封装：`src/utils/request.ts`
-   认证状态：`src/stores/auth.ts`
-   设置状态：`src/stores/setting.ts`
-   路由守卫：`src/router/guard.ts`
-   动态路由：`src/router/dynamicRoutes.ts`
-   路由标题：`src/utils/routeTitle.ts`
-   i18n 入口：`src/locales/index.ts`
-   权限指令：`src/directives/permission.ts`
-   权限组合式函数：`src/composables/usePermission.ts`
-   按钮权限构建：`src/modules/auth/permission.ts`
-   菜单表单契约：`src/modules/menu/useMenuForm.ts`

## DIRECTORY_MAP

```text
src/
├── api/            # 底层 API 方法
├── assets/         # 图片、样式、自定义 SVG
├── components/     # 公共组件，自动组件扫描
├── composables/    # 通用组合式函数及测试
├── constants/      # 通用常量
├── directives/     # 自定义指令
├── layout/         # 后台布局
├── locales/        # zh-CN / en-US 语言包
├── modules/        # 业务模块 model/service/useXxx
├── router/         # 路由、守卫、动态路由
├── stores/         # Pinia store
├── test/           # Vitest setup
├── types/          # TypeScript 类型定义
├── utils/          # 请求、日志、helper、路由标题
└── views/          # 页面组件
```

## ROOT_FILES

-   `vite.config.js`：Vue、自动导入、组件扫描、图标、Element Plus、ESLint、gzip、代理、分包、SCSS 注入。
-   `vitest.config.ts`：Vitest + jsdom + setupFiles。
-   `auto-imports.d.ts`：自动导入类型声明。
-   `components.d.ts`：自动组件类型声明。
-   `.eslintrc-auto-import.json`：自动导入给 ESLint 的全局变量配置。
-   `.gitignore`：忽略 `node_modules`、`dist`、`.vite`、环境文件、`.claude`、`.aitasks` 等。

## AUTO_IMPORTS

-   自动导入 Vue API：`ref`、`reactive`、`computed`、`watch`、`onMounted` 等。
-   自动导入 Element Plus API 与组件：通过 `ElementPlusResolver()`。
-   自动导入图标集合：`ep`、`ant-design`、`custom`。
-   自定义图标目录：`src/assets/svg`。
-   自动扫描项目组件目录：`src/components`。
-   不自动导入：`request`、`get`、`post`、`upload`、业务 service、Pinia store。使用时显式 import。

## REQUEST_FLOW

文件：`src/utils/request.ts`

-   `resolveBaseURL()` 决定请求 baseURL。
-   开发环境默认使用同源代理，除非 `VITE_USE_PROXY=false`。
-   代理前缀默认 `VITE_BASE_API`，空值时为 `/admin`。
-   请求头自动写入 `Accept-Language = settingStore.locale || DEFAULT_LOCALE`。
-   有有效 token 时写入 `Authorization: Bearer <token>`。
-   非 `FormData` 请求默认 `Content-Type: application/json`。
-   GET 参数会过滤空字符串、`null`、`undefined`、空数组。
-   响应头含 `refresh-access-token` 时更新 token 与过期时间。
-   业务 `code === 401` 或 HTTP 401 调用 `authStore.handleTokenExpired()`。
-   业务 `code !== 0` 统一 `ElMessage` 错误提示。
-   网络错误、超时、其他错误统一本地化提示。

请求方法：

```ts
request<T>(url, method, options)
get<T>(url, params)
post<T>(url, data)
upload<T>(url, files, extra)
```

## AUTH_FLOW

文件：`src/stores/auth.ts`

登录流程：

```text
loginWithCredentials(credentials)
→ resetAuthStore()
→ submitLogin(credentials)
→ updateToken(access_token, expires_at)
→ refreshUserInfo()
→ router guard adds dynamic routes
```

`auth` store 持久化字段：

-   `access_token`
-   `expires_at`
-   `userInfo`
-   `menu`

重要计算值：

-   `token`：过期时返回空字符串。
-   `routerData`：`convertRoute(menu.value)`。
-   `buttonPermissions`：从菜单树提取按钮权限 code。
-   `buttonPermissionMap`：按钮 code 到 `{ icon, title, is_show }` 的映射。

## ROUTER_FLOW

文件：

-   `src/router/guard.ts`
-   `src/router/dynamicRoutes.ts`
-   `src/utils/routeTitle.ts`

守卫行为：

-   访问登录页且已登录：跳转 redirect 或 `/`。
-   未登录访问业务页：跳转 `Login`，携带 `redirect=to.fullPath`。
-   用户信息或路由数据为空：调用 `authStore.refreshUserInfo()`。
-   动态路由不存在：调用 `addDynamicRoutes(authStore.routerData)`，然后 replace 当前路由。
-   afterEach：设置标题并结束 NProgress。

动态路由转换：

-   后端菜单树来自 `authStore.menu`。
-   `convertRoute()` 转为 `RouteRecordRaw[]`。
-   按钮类型节点会被过滤：`type === 3`。
-   组件通过 `import.meta.glob('../views/**/*.vue')` 匹配。
-   动态路由挂载到父路由 `Layout`。
-   动态路由 `meta.isDynamic = true`。

动态 route meta：

-   `title`
-   `isDynamic`
-   `icon`
-   `show`
-   `isAuth`
-   `isNewWindow`
-   `isExternalLinks`

标题规则：

-   `resolveRouteTitle()` 优先使用显式 `titleKey/title_key`。
-   动态菜单标题以接口返回的 `title` 为准。
-   不根据 `name`、`path`、`component` 推断翻译。

## PERMISSION_FLOW

文件：

-   `src/modules/auth/permission.ts`
-   `src/composables/usePermission.ts`
-   `src/directives/permission.ts`
-   `src/types/auth.d.ts`

权限数据结构：

```ts
interface UserPermission {
    id: number
    parent_id: number
    title: string
    code: string
    name?: string
    type: 'menu' | 'button' | number
    icon?: string
    path?: string
    component?: string
    redirect?: string
    is_show: number | boolean
    is_auth?: number | boolean
    is_new_window?: number | boolean
    is_external_links?: number | boolean
    sort: number
    children?: UserPermission[]
}
```

按钮权限规则：

-   按钮节点判断：`type === 'button' || type === 3`。
-   权限 code 来源：按钮节点 `code`。
-   显示判断：`Number(is_show) === 1`。
-   `buttonPermissions` 只存 code 列表。
-   `buttonPermissionMap` 存按钮标题、图标、显示状态。

`usePermission()` 返回：

-   `buttonPermissions`
-   `checkPermission(permission)`
-   `getButtonInfo(code)`
-   `getButtonInfoFull(code)`
-   `shouldShowButton(code)`

`getButtonInfoFull(code)` 是实时代理对象，避免语言切换后按钮文案不刷新。

`v-permission` 用法：

```vue
<el-button v-permission="'adminUser:add'">新增</el-button>
<el-button v-permission:or="['adminUser:add', 'adminUser:edit']">保存</el-button>
<el-button v-permission.disabled="'adminUser:delete'">删除</el-button>
<el-button v-permission.hide="'adminUser:delete'">删除</el-button>
```

`v-permission` 支持：

-   默认：数组按全部满足判断。
-   `:or`：数组按任一满足判断。
-   `.disabled`：无权限时禁用元素并提示。
-   `.hide`：无权限时隐藏元素。
-   `.once`：只在 mounted 检查一次。

## I18N_FLOW

文件：

-   `src/locales/index.ts`
-   `src/stores/setting.ts`
-   `src/main.ts`
-   `src/App.vue`
-   `src/layout/header/right.vue`

事实：

-   默认语言：`zh-CN`
-   兜底语言：`zh-CN`
-   支持语言：`zh-CN`、`en-US`
-   语言状态：`settingStore.locale`
-   持久化 key：`setting.locale`
-   Element Plus 语言：`src/App.vue` 的 `ElConfigProvider`
-   请求语言头：`Accept-Language`

语言切换流程：

```text
handleLanguageCommand(locale)
→ settingStore.setLocale(locale)
→ main.ts watch syncs i18n.global.locale.value
→ if logged in: authStore.refreshUserInfo()
→ addDynamicRoutes(authStore.routerData)
```

菜单国际化契约：

-   列表/树展示：使用接口返回的 `title`。
-   详情/编辑：使用 `title_i18n`。
-   新增/编辑提交：只提交清洗后的 `title_i18n`。
-   提交时删除 `title`。
-   校验：至少一个语言标题 `trim()` 后非空。
-   单语言：直接输入框。
-   多语言：弹窗编辑各语言标题。

## THEME_FLOW

文件：

-   `src/stores/setting.ts`
-   `src/main.ts`
-   `src/layout/header/right.vue`

主题值：

-   `light`
-   `dark`
-   `system`

规则：

-   默认：`system`
-   持久化 key：`setting.theme`
-   `main.ts` 引入 `element-plus/theme-chalk/dark/css-vars.css`
-   `main.ts` 切换 `document.documentElement.classList.dark`
-   `main.ts` 同步 `document.documentElement.style.colorScheme`
-   `system` 模式监听 `prefers-color-scheme: dark`

## MODULE_PATTERN

常见模块结构：

```text
src/modules/{module}/
├── model.ts
├── service.ts
├── use{Module}List.ts
├── use{Module}Form.ts
└── index.ts
```

注意：不是所有模块都完整包含以上文件。以实际目录为准。

当前模块：

-   `adminUser`
-   `apiPermission`
-   `auth`
-   `department`
-   `log`
-   `menu`
-   `permission`
-   `profile`
-   `role`
-   `shared`

业务层习惯：

-   `src/api/*`：底层接口路径和 HTTP 方法。
-   `src/modules/*/service.ts`：调用 API 并做响应归一化。
-   `src/modules/*/model.ts`：默认值、常量、类型辅助。
-   `src/modules/*/useXxx.ts`：页面逻辑、表单逻辑、列表逻辑。
-   `src/views/*`：页面模板与页面组合。

## COMMON_COMPOSABLES

-   `useListPage`：分页、查询、加载状态、搜索、重置。
-   `usePermission`：按钮权限检查和按钮信息读取。
-   `useSubmitLock`：异步提交锁。
-   `useClipboard`：复制文本与提示。

## FILES_BY_TASK

新增/修改请求：

-   底层 API：`src/api/{domain}.ts`
-   服务封装：`src/modules/{domain}/service.ts`
-   响应归一化：`src/modules/shared/response.ts`
-   请求通用行为：`src/utils/request.ts`

新增/修改页面：

-   页面：`src/views/{domain}/...vue`
-   业务逻辑：`src/modules/{domain}/useXxx.ts`
-   默认值/常量：`src/modules/{domain}/model.ts`
-   文案：`src/locales/zh-CN/*`、`src/locales/en-US/*`

权限相关：

-   权限检查：`src/utils/auth.ts`
-   权限映射：`src/modules/auth/permission.ts`
-   指令：`src/directives/permission.ts`
-   组合式函数：`src/composables/usePermission.ts`
-   类型：`src/types/auth.d.ts`

路由相关：

-   固定路由：`src/router/constantRoutes.ts`
-   动态路由：`src/router/dynamicRoutes.ts`
-   路由守卫：`src/router/guard.ts`
-   路由标题：`src/utils/routeTitle.ts`

i18n 相关：

-   i18n 入口：`src/locales/index.ts`
-   中文：`src/locales/zh-CN/*`
-   英文：`src/locales/en-US/*`
-   语言状态：`src/stores/setting.ts`
-   顶部切换：`src/layout/header/right.vue`

主题相关：

-   状态：`src/stores/setting.ts`
-   应用：`src/main.ts`
-   顶部切换：`src/layout/header/right.vue`
-   样式变量：`src/assets/styles/*`

测试相关：

-   测试配置：`vitest.config.ts`
-   测试初始化：`src/test/setup.ts`
-   测试文件：`*.test.ts`

## COMMANDS

```bash
npm run dev               # 开发环境
npm run local             # 本地环境 .env.location
npm run prod              # production mode 启动 Vite
npm run build:dev         # development mode 构建
npm run build:production  # production mode 构建
npm run preview           # 预览构建产物
npm run lint              # ESLint 检查
npm run lint:fix          # ESLint 自动修复
npm run type-check        # TypeScript 类型检查
npm run test              # Vitest watch
npm run test:run          # Vitest 单次运行
npm run test:coverage     # Vitest 覆盖率
npm run prepare           # 初始化 Husky hooks
```

## ENV_KEYS

```bash
VITE_APP_TITLE=X-L-Admin (dev)
VITE_APP_BASE=/
VITE_BASE_URL=http://127.0.0.1:9001
VITE_BASE_API=/admin
VITE_BASE_STATIC=/static
VITE_PROXY_TARGET=http://127.0.0.1:9001
VITE_USE_PROXY=true
AUTO_OPEN_BROWSER=true
```

代理：

-   `vite.config.js` 为 `/admin` 与 `/static` 配置开发/预览代理。
-   代理请求会移除 `origin` 与 `referer`。

## COMPONENT_RULES

-   公共组件放 `src/components/{name}/index.vue`。
-   自动组件名来自 `components.d.ts`。
-   例：`components/tableList/index.vue` 的全局组件名是 `TableList`。
-   多页面复用组件放 `components`。
-   模块私有逻辑优先放 `modules`。
-   页面保持薄，业务状态与请求逻辑优先沉到 composable/service。

## STYLE_FILES

-   `src/assets/styles/index.scss`：样式入口。
-   `src/assets/styles/reset.scss`：reset。
-   `src/assets/styles/global-var.scss`：CSS 变量。
-   `src/assets/styles/vars.scss`：SCSS 变量。
-   `src/assets/styles/global.scss`：全局 SCSS 注入内容与 mixin。
-   `src/assets/styles/xl-common.scss`：通用样式。
-   `src/assets/styles/layout/*`：布局样式。
-   Vite SCSS `additionalData` 注入：`@import "@/assets/styles/global.scss";`

## TESTS

当前测试文件：

-   `src/composables/useListPage.test.ts`
-   `src/composables/useSubmitLock.test.ts`
-   `src/modules/shared/response.test.ts`
-   `src/utils/helper.test.ts`
-   `src/utils/logger.test.ts`
-   `src/utils/request.test.ts`

常规验证：

```bash
npm run test:run
npm run type-check
npm run lint
```

构建验证：

```bash
npm run build:dev
npm run build:production
```

## DO_NOT_ASSUME

-   不要假设 `SortableJS` 是运行时依赖；当前没有运行时依赖，只存在类型包残留。
-   不要假设存在 `src/stores/routes.ts`；当前 store 是 `auth`、`refresh`、`setting`、`index`。
-   不要使用 `i-carbon-*` 作为已启用图标集合；组件解析器启用的是 `ep`、`ant-design`、`custom`。
-   不要把 `request/get/post/upload` 当自动导入。
-   不要把 `npm run prod` 说成预览构建产物；预览命令是 `npm run preview`。
-   不要用旧权限字段：`is_menu`、`is_router`、`is_cache`、`is_link`、`link_url`、`always_show`。
-   不要根据路由 `name/path/component` 推断动态菜单标题。
-   不要在菜单编辑提交 `title`。

## QUICK_RECIPES

新增接口：

1. 在 `src/api/{domain}.ts` 增加 `get/post/upload` 调用。
2. 在 `src/modules/{domain}/service.ts` 封装 API。
3. 如是列表，优先返回 `normalizeListData<T>()`。
4. 页面 composable 调 service，不直接散落请求。

新增页面：

1. 创建 `src/views/{domain}/index.vue` 或业务页面文件。
2. 创建/扩展 `src/modules/{domain}`。
3. 文案写入双语 locales。
4. 后端菜单配置组件路径和权限 code。

新增按钮权限：

1. 后端菜单树添加按钮节点，`type` 为 `button` 或 `3`。
2. 设置唯一 `code`。
3. 页面使用 `v-permission` 或 `usePermission()`。
4. 按钮文案优先读取 `getButtonInfoFull(code)` 的实时信息。

修改菜单表单：

1. 看 `src/modules/menu/model.ts` 默认值。
2. 看 `src/modules/menu/useMenuForm.ts` 校验、详情回填、提交清洗。
3. 看 `src/views/permission/menuList.vue` 交互。
4. 保持 `title_i18n` 契约。

修改语言切换：

1. 看 `src/stores/setting.ts`。
2. 看 `src/main.ts` locale watch。
3. 看 `src/App.vue` Element Plus locale。
4. 看 `src/layout/header/right.vue` 刷新菜单和重建路由。

## TROUBLESHOOTING

组件不自动导入：

-   检查是否在 `src/components`。
-   检查 `components.d.ts` 是否生成对应名称。
-   必要时重启 Vite。

图标不显示：

-   检查前缀是否为 `i-ep-*`、`i-ant-design-*` 或自定义 SVG。
-   自定义 SVG 放 `src/assets/svg`。

权限不生效：

-   检查菜单树按钮节点是否存在。
-   检查 `type` 是否为 `button` 或 `3`。
-   检查 `code` 是否匹配页面权限码。
-   检查 `is_show` 是否为可显示。
-   检查 `authStore.buttonPermissions` 与 `buttonPermissionMap`。

语言切换后菜单或按钮不刷新：

-   检查 `handleLanguageCommand()` 是否调用 `authStore.refreshUserInfo()`。
-   检查刷新后是否 `addDynamicRoutes(authStore.routerData)`。
-   检查按钮是否通过实时权限映射读取标题。

请求语言不对：

-   检查 `settingStore.locale`。
-   检查 `src/utils/request.ts` 是否写入 `Accept-Language`。

菜单标题提交不对：

-   检查是否只提交 `title_i18n`。
-   检查是否删除 `title`。
-   检查空标题是否被 `trim` 并过滤。

## RELATED_DOCS

-   Vue 3：https://vuejs.org/
-   Vite：https://vitejs.dev/
-   Element Plus：https://element-plus.org/
-   Pinia：https://pinia.vuejs.org/
-   Vue Router：https://router.vuejs.org/
-   Vue I18n：https://vue-i18n.intlify.dev/
