# AGENTS.md

本文件说明 `x-l-admin-vue3` 的项目结构、页面与请求链路、组件边界、代码风格和验证要求。

## 项目概览

- Vue 3 + TypeScript + Vite 后台管理前端，配套后端为 `gin-layout`。
- UI 使用 Element Plus，路由使用 Vue Router，状态使用 Pinia，国际化使用 Vue I18n，HTTP 使用 Axios。
- 业务页面由后端菜单树生成动态路由；菜单、按钮权限和用户信息由 `src/stores/auth.ts` 管理。
- 包管理器及 Node.js 范围以 `package.json` 的 `packageManager`、`engines` 为准；使用 pnpm，仅维护 `pnpm-lock.yaml`。
- 项目运行与部署说明见 `README.md`、`docs/runtime-guide.md`；功能和页面索引见 `docs/project-overview.md`。

## 开发命令

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
corepack pnpm run local
corepack pnpm run type-check
corepack pnpm run lint
corepack pnpm run test:run
corepack pnpm run build:production
```

- `dev` 使用 development mode，`local` 使用 location mode；`prod` 是 production mode 的开发服务器，不是生产构建。
- 开发构建为 `build:dev`，生产构建为 `build:production`，预览构建使用 `preview`。
- `test` 默认进入 Vitest watch；一次性验证使用 `test:run`。覆盖率使用 `test:coverage`，浏览器测试使用 `test:e2e`。
- `src/utils/env.ts` 统一计算 API baseURL；开发默认使用同源代理，生产按 `VITE_BASE_URL` 与 `VITE_BASE_API` 组合。不要在页面硬编码 API 域名。

## 目录职责

| 目录 / 文件 | 职责 |
| --- | --- |
| `src/main.ts`、`src/App.vue` | 创建应用，注册 Pinia、路由、i18n、权限指令、全局错误处理与 Element Plus 语言配置。 |
| `src/router/` | 静态辅助路由、导航守卫、动态菜单路由转换和组件映射。 |
| `src/layout/` | 后台布局、侧边栏、顶部栏、内容区和通知入口。 |
| `src/views/<domain>/` | 路由页面，组织模板、事件、页面状态及业务能力。 |
| `src/views/<domain>/components/` | 领域内使用的面板、表单、网格、工具栏等组件；现有示例位于 `views/system/components`、`views/permission/components`。 |
| `src/modules/<domain>/` | 领域 service、模型常量、表单转换及 `useXxx` 业务组合式函数。这里的 `model.ts` 是前端业务模型，不是数据库模型。 |
| `src/api/` | HTTP 方法、相对路径、请求参数及响应类型，通过统一 request 发请求。 |
| `src/components/` | 跨页面复用的表格、操作按钮、抽屉、选择器、上传等 UI 能力。 |
| `src/composables/` | 跨领域的列表、提交锁、轮询、字典、权限、上传和剪贴板等有状态逻辑。 |
| `src/modules/shared/` | 业务共享的响应归一化、分页、表单校验、i18n 和常量。 |
| `src/stores/` | 跨页面状态：认证、设置、通知、刷新；局部表单和抽屉状态不默认放入 store。 |
| `src/types/` | 共享 API 与领域类型；模块私有类型也可放在所属模块。 |
| `src/utils/` | 请求、环境、日志、URL、缓存等工具，不堆放页面专属业务流程。 |
| `src/directives/` | `v-permission` 等 DOM 指令。 |
| `src/locales/` | `zh-CN`、`en-US` 分域文案和国际化入口。 |
| `src/assets/styles/` | SCSS 变量、主题、布局和 `xl-*` 公共样式。 |
| `src/mock/` | 开发和测试使用的 Mock 与请求降级数据。 |
| `src/test/`、`e2e/` | Vitest 公共测试设施、Playwright 浏览器场景；单元测试通常与源码相邻。 |

## 页面、请求与返回链路

页面进入：`src/main.ts` → `src/router/index.ts` / `guard.ts` → `auth` store 加载用户和菜单 → `dynamicRoutes.ts` / `componentMap.ts` 注册业务路由 → `src/layout/` → `src/views/`。

典型业务请求：

```text
views 页面 / 领域组件的加载或操作事件
  → modules/<domain>/useXxx       组织查询、表单、加载状态及刷新
  → modules/<domain>/service.ts   业务参数与结果适配
  → api/<domain>.ts               定义 HTTP 方法与相对路径
  → utils/request.ts             baseURL、认证、语言、错误和续期处理
  → 后端 API
  → request.ts                   解包响应，归一化业务数据
  → modules/shared/response.ts   按需要兼容列表 / 详情结构
  → useXxx / useListPage         更新响应式状态与分页
  → views / components           渲染结果
```

- 真实示例：`src/views/permission/adminUser/index.vue` → `useAdminUserList` → `fetchAdminUserList` → `src/api/adminUser.ts` → request → `normalizeListData` → `useListPage` → `xl-pro-table`。
- 上述是复杂页面的现有组织方式，不要求每个页面凑齐全部层级。`src/views/business/product/index.vue` 直接组合 `src/api/product.ts` 与 `useListPage`；小型页面没有独立业务适配时，可沿用这种方式，不新增纯转发 service。
- HTTP 请求统一经过 `src/utils/request.ts`。页面不创建另一套 Axios 实例、Token 刷新或错误弹窗机制；对象存储直传、SSE、WebSocket 使用已有专用链路。

### 响应契约

- 后端普通 JSON 外壳包含 `code`、`msg`、`data`、`cost`、`request_id`；`src/types/common.d.ts` 的 `ApiResponse<T>` 当前只声明前三项。页面拿到的是解包后的业务数据，不是 AxiosResponse 或完整后端外壳。
- `code=0` 时 request 返回 `normalizeApiData(response.data.data)`；`data.result` 被解包，后端分页 `{ data: rows, total, current_page, per_page }` 转为前端 `PageData<T>`：`{ list, total, page, pageSize }`。
- 分页请求使用 `page`、`per_page`，页面分页状态使用 `page`、`pageSize`；由 `useListPage` 和 `src/modules/shared/pagination.ts` 同步，不混用请求与返回字段。
- 领域需要兼容列表或详情结构时复用 `normalizeListData` / `normalizeDetailData`，不要在页面重复写 `res.data.data` 等猜测性解包。
- 普通 API 错误由 request 统一提示并 reject；业务需要自行提示时使用 `silent` / `silentCodes`，避免重复 toast。列表加载失败由 `useListPage` 清空结果并记录日志，这不代表请求成功。
- 登录凭证错误使用 `authErrorMode: 'credential'`；会话失效刷新与重放由 request 和 auth store 统一处理，不在页面重复刷新或把所有网络错误都当成退出登录。

## 现有组件如何复用

先使用匹配业务语义的现有组件；普通输入框、开关、标签等基础控件直接使用 Element Plus，不为它们默认再包一层。

| 场景 | 优先使用 | 使用边界 |
| --- | --- | --- |
| 搜索 + 表格 + 分页的管理列表 | `src/components/proTable/index.vue` + `useListPage` | `columns` 定义展示列，搜索可用列内 `search` 或独立 `searchSchema`；内建搜索为 input/select/daterange。特殊搜索、单元格和操作列使用 `search`、`td`、`operation` 等插槽。 |
| 工具栏的权限操作按钮 | `src/components/actionButton/index.vue`（`xl-action-button`） | `code` 响应式读取按钮标题、图标等信息；它本身不检查操作权限，需配合 `v-permission` 或已有权限判断。 |
| 表格行内多个操作及“更多”菜单 | `src/components/actionButtons/index.vue`（`xl-action-buttons`） | 用 `ActionButtonConfig<T>` 定义 `permission`、`visible`、`disabled`、`tooltip`、点击动作；组件负责权限过滤和折叠，不在每页复制一套下拉操作栏。 |
| 标准编辑 / 绑定表单抽屉 | `src/components/drawer/index.vue`（`xl-drawer`） | 复用默认提交、取消、重置区，传入 `onConfirm`、`isSubmitting` 和需要的 `formRef`；尺寸支持 sm/md/lg。该组件不自动校验和加提交锁，提交回调负责这些行为。 |
| 头像上传 | `src/components/avatarUpload/index.vue` | 复用上传校验、状态和结果回填；大小等限制由业务 props 传入。 |
| 已有文件选择 | `src/components/filePicker/index.vue` | 复用文件列表和选择交互，按组件现有 props/emits 接入。文件中心的上传编排使用 `useFileUpload`，不为每页另建上传协议。 |
| 部门树选择 | `src/components/DeptTreeSelect.vue` | 复用单选 / 多选和树数据加载，保持 `v-model` 的 number / number[] 类型匹配。 |
| 多语言字段编辑 | `src/components/i18nInput/index.vue` | 使用语言键值对象回填与更新，例如 `title_i18n`；普通页面文案仍由 `t()` 输出。 |
| 带快捷选项的时间范围 | `src/components/dateRangePicker/index.vue` | 需要已有范围选择能力时复用；ProTable 普通日期搜索可直接用内建 daterange。 |

- `proTable` 已组合 `tableList` 和 `pagination` 等基础组件；标准列表无需再复制搜索展开、分页布局和 loading 控制。
- 不适合表格语义的界面保留领域布局，例如文件中心的网格、目录树和拖拽交互，不强行塞入 ProTable。
- 现有组件缺少一个局部呈现能力时，先使用插槽或清晰的可选 prop；不要为了单一页面加入按路由名判断的特殊分支。

## 何时抽成组件，放在哪里

| 情况 | 处理方式 |
| --- | --- |
| 多个页面确实共享同一套 UI 行为和稳定输入输出 | 抽到 `src/components/`，以 props、emits、v-model、slots 表达差异。 |
| 仅同一领域使用，或包含明确领域语义 | 放到 `src/views/<domain>/components/`，不要仅因被两个地方引用就升级为全局组件。 |
| 独立面板具有自己的查询、分页、加载或详情生命周期 | 即使当前只用一次，也可按业务边界拆成组件；父页面保留 Tab 切换、路由参数和跨面板协调。 |
| 重复的是请求状态、表单提交、轮询等逻辑，模板不同 | 领域逻辑抽到 `src/modules/<domain>/useXxx.ts`；跨领域能力放 `src/composables/`，不为复用逻辑制造空壳组件。 |
| 重复的是纯转换、校验或常量 | 放所属模块的 `model.ts`、helper 或 `modules/shared`；不需要 Vue 生命周期时保持普通函数。 |
| 只是一小段静态模板、一次性简单表单或连续业务流程 | 保留在页面中；文件行数、标签数量或“以后可能复用”本身不是拆分理由。 |

当前可参考的拆分边界：

- `src/views/system/task/index.vue` 负责 Tab 与路由同步，`TaskDefinitionPanel`、`TaskRunPanel`、`CronStatePanel`、`ExportRecordsPanel` 分别负责各自功能；这些面板位于 `src/views/system/components/`。
- 文件中心复用同目录的 `FileExplorerLayout`、`FileSidebar`、`FileToolbar`、`FileGrid`、`FileUploadQueue`、`FileDetailDrawer`；领域上传、导出、目录操作逻辑位于 `src/views/system/composables/`。
- 管理员列表和表单逻辑分别在 `src/modules/adminUser/useAdminUserList.ts`、`useAdminUserForm.ts`，表单模板仍可留在页面；不要求逻辑拆出后模板也必须再拆一次。

组件边界约定：

- 父组件持有页面筛选、选中项和跨区域协调状态；展示组件接收数据、发出操作事件，避免传入整个页面状态对象或一整组无关回调。
- 通用 UI 不依赖具体页面路由或某个业务接口。已有部门选择器、文件选择器等有明确业务能力的组件可以封装自身数据加载，但不接管使用方的新增、编辑或删除流程。
- 用有类型的 `defineProps`、`defineEmits`、`defineModel` 表达边界，不直接修改 props；需要编辑副本时创建明确的表单状态，不意外修改表格行对象。
- 自包含领域面板可拥有自己的业务 composable；父子组件之间不重复加载同一份数据，也不让同一个事件在父子两侧分别提交。
- 组件被 `KeepAlive` 缓存时，切换 Tab 不等于卸载。轮询和订阅需考虑 active / 激活状态；任务面板已有 `active` + `useIntervalPolling` 的例子。定时器、事件监听、订阅和图表实例由创建方清理。
- 抽取后若出现大量布尔开关、按页面名分支或层层透传，优先缩小抽象范围，用领域组件或插槽表达差异，不建设通用页面生成器。

## 列表与表单约定

- 列表加载、搜索重置、分页及旧响应防覆盖优先使用 `useListPage`；额外筛选使用 `extraParams` 或模块已有 `transformParams`，不要并行维护第二套分页状态。
- 提交复用 `validateFormSafely` 和 `useSubmitLock`：校验失败不请求，提交锁与按钮 loading 使用同一状态；锁已包含最短锁定时长，不再叠加人为延时。
- 编辑表单按领域 model 构造初始值和提交 payload，不把详情对象、展示字段或只读权限元数据原样提交。列表刷新和关闭抽屉在提交成功后进行。
- 展示字典选项使用 `useDictOptions`；缓存按字典类型及语言隔离，不另写不区分语言的页面缓存。
- 文件上传复用 `src/composables/useFileUpload.ts` 和已有 system service：保留服务端返回的 `complete_token`、分片及完成流程，不由客户端重新拼造可信对象元数据。

## 路由、权限与认证

- 静态辅助路由位于 `src/router/constantRoutes.ts`；后台业务路由来自后端菜单，不通过添加静态业务路由绕过菜单权限。
- 后端 `component_key` 由 `src/router/componentMap.ts` 解析。显式映射优先，`views/**/index.vue` 提供自动映射；移动页面时保留原语义 key，更新映射，不随目录改名改变后端契约。
- 菜单和动态路由标题使用后端 `title`；按钮节点不注册为页面路由。权限查询复用 `usePermission`，不新增按钮信息缓存导致权限更新失效。
- `xl-action-button` 的 `code` 与操作授权是两件事；例如新增按钮同时使用 `code="adminUser:add"` 和 `v-permission="'adminUser:add'"`。前端控制可见性，最终授权仍由后端执行。
- auth store 当前 `persist: false`，访问令牌和用户状态不持久化到 localStorage；refresh cookie 由后端管理，request 使用 `withCredentials`。页面不要自行保存 refresh token。
- 并发续期、请求重放和会话代次由 request/auth 统一管理；退出或切换账号后，旧请求不能覆盖新账号状态。
- 通知连接与频道订阅由 `src/stores/notification.ts` 管理，连接通过 ticket 建立；使用方复用订阅入口，不为每个页面新建 WebSocket。

## 代码风格、国际化与样式

- 新增 Vue 组件沿用 `<script setup lang="ts">` 与组合式 API，路由页面通常命名为 `index.vue`，领域组件使用有业务含义的 PascalCase 名称，组合式函数使用 `useXxx`。
- `@` 指向 `src/`；业务组件和模块依赖沿用显式 import。Vite 已配置 Vue API、Element Plus 和图标自动导入，不机械补齐所有自动导入，也不手改 `auto-imports.d.ts`、`components.d.ts`、`.eslintrc-auto-import.json` 等生成声明。
- 格式以 `.prettierrc.js`、`.editorconfig` 为准：4 空格、单引号、无分号、LF；ESLint 禁止显式 any、var 和直接修改 props，未使用参数可用 `_` 前缀。
- 日志使用 `src/utils/logger.ts` 的 `Logger`；用户反馈沿用 Element Plus 与 request 错误处理，不将内部异常直接拼成页面提示。
- 页面静态文案在 `src/locales/zh-CN/`、`src/locales/en-US/` 对应领域维护；会随语言变化的列名、选项等使用 computed 或实时翻译，避免 setup 时取一次后固定不变。
- 菜单编辑使用 `title_i18n`，展示使用后端 `title`；语言切换除更新 setting store 外，还需刷新用户菜单及动态路由，参考 `src/layout/header/right.vue`。
- 样式入口为 `src/assets/styles/index.scss`；优先复用 `xl-*` 公共类、`--xl-*` 和 Element Plus 的 `--el-*` 变量。布局、颜色、圆角、间距等 token 位于 `vars.scss` / `global-var.scss`。
- `shared.scss` 经 Vite `additionalData` 注入，仅保留变量、mixin 等定义，避免加入直接输出的全局 CSS 导致每个组件重复生成样式。
- 页面和组件样式优先 `scoped`；共享主题规则放公共样式目录。使用暗色模式变量，抽屉和表格考虑窄窗口；局部需求不全局覆盖 Element Plus 样式或引入另一套 UI 库。

## 测试与验证

- 纯文档修改检查 `git diff --check` 和文档中的路径、命令，不默认运行构建或业务测试。
- 源码变更对相关文件运行 ESLint；公共组件、composable、请求、路由、权限或类型契约变化补 `type-check` 和相关 Vitest 测试，例如 `corepack pnpm exec vitest run src/components/actionButton/index.test.ts`。
- 单元 / 组件测试使用 Vitest + Vue Test Utils + jsdom，通常放在源码旁的 `*.test.ts`；公共环境位于 `src/test/setup.ts`，覆盖率范围与阈值以 `vitest.config.ts` 为准。
- 提交前检查按 `CONTRIBUTING.md` 执行 lint、type-check、test:run、build:production 和 diff 检查；不要把 `lint:fix` 当只读验证命令。
- 页面布局、交互和主题改动需在浏览器检查相关场景；类型检查与构建不能证明视觉正确。按变更验证加载、空数据、错误、表单校验、权限可见性和受影响的窄窗口 / 暗色模式。
- `playwright.config.ts` 使用独立 Vite 服务及开发 Mock；现有 `e2e/` 覆盖登录和动态路由基本场景。Mock 通过不代表真实后端、对象存储或生产环境已联调通过。
