# AI 项目开发指南 (X-L-Admin-Vue3)

> 快速了解项目架构与当前进度，辅助高效开发。

---

## 🚀 项目看板

### 开发进度

-   [x] **核心框架搭建** (Vue 3 + Vite + TS)
-   [x] **基础布局实现** (侧边栏、顶栏、多标签)
-   [x] **认证系统** (登录、Token 刷新、路由守卫)
-   [x] **权限系统 (RBAC)** (菜单权限、按钮权限、接口权限)
-   [x] **系统管理模块** (用户、角色、部门、菜单、接口)
-   [x] **日志管理** (登录日志、请求日志)
-   [ ] **国际化 (i18n)** (待集成)
-   [ ] **深色模式/主题切换** (待优化)
-   [ ] **单元测试/E2E 测试** (待集成)

### 技术债务/优化项

-   [ ] **组件抽象**: `tableList` 及其相关组件的进一步泛型化。
-   [ ] **类型安全**: 部分模块仍存在 `any` 类型，需进一步完善 TS 定义。
-   [ ] **性能优化**: 路由懒加载与组件分包策略优化。

---

## 项目概述

**X-L-Admin-Vue3** 是一个基于 Vue 3 + Vite + Element Plus 的后台管理系统。

-   **在线演示**: https://x-l-admin.wannanbigpig.com/
-   **后端项目**: https://github.com/wannanbigpig/gin-layout
-   **API 文档**: https://wannanbigpig.apifox.cn/

---

## 技术栈

### 核心框架

| 技术       | 版本 | 用途                           |
| ---------- | ---- | ------------------------------ |
| Vue        | 3.4+ | 前端框架（全面使用组合式 API） |
| Vite       | 5.3+ | 构建工具                       |
| Vue Router | 4.4+ | 路由管理                       |
| Pinia      | 2.1+ | 状态管理（带持久化插件）       |

### UI 组件库

| 技术         | 版本 | 用途      |
| ------------ | ---- | --------- |
| Element Plus | 2.7+ | UI 组件库 |
| @iconify/vue | 4.1+ | 图标库    |
| animate.css  | 4.1+ | CSS 动画  |

### 工具库

| 技术                        | 用途             |
| --------------------------- | ---------------- |
| Axios                       | HTTP 请求封装    |
| NProgress                   | 页面加载进度条   |
| SortableJS                  | 拖拽排序         |
| Pinia-plugin-persistedstate | Pinia 状态持久化 |

### 开发工具

| 技术                    | 用途                          |
| ----------------------- | ----------------------------- |
| TypeScript              | 类型系统                      |
| ESLint + Prettier       | 代码检查和格式化              |
| unplugin-auto-import    | 自动导入 Vue/Element Plus API |
| unplugin-vue-components | 自动导入组件                  |
| unplugin-icons          | 自动导入图标                  |

---

## 项目结构

### 根目录配置

| 文件                 | 用途                                  |
| -------------------- | ------------------------------------- |
| `vite.config.js`     | Vite 构建配置（含插件、代理、别名等） |
| `eslint.config.js`   | ESLint 9 (Flat Config) 规则配置       |
| `.prettierrc.js`     | Prettier 代码格式化配置               |
| `tsconfig.json`      | TypeScript 全局配置                   |
| `.env.*`             | 多环境环境变量配置文件                |
| `.husky/`            | Git Hooks 配置（提交前检查）          |
| `.lintstagedrc.json` | 暂存区文件检查配置                    |

### 源码目录 (src/)

```
src/
├── api/                    # API 接口定义（按模块划分）
│   ├── adminUser.ts       # 管理员接口
│   ├── auth.ts            # 认证接口
│   ├── department.ts      # 部门接口
│   ├── log.ts             # 日志接口
│   └── permission.ts      # 权限接口
├── assets/
│   ├── images/            # 图片资源
│   ├── styles/            # 全局样式
│   │   ├── global.scss    # 全局 SCSS 变量和混入
│   │   └── index.scss     # 样式入口
│   └── svg/               # 自定义 SVG 图标
├── components/            # 公共组件（自动导入）
│   ├── actionButton/      # 操作按钮组件
│   ├── actionButtons/     # 操作按钮组组件
│   ├── breadcrumb/        # 面包屑组件
│   ├── collapsibleSearchBtn/ # 可折叠搜索按钮
│   ├── dateRangePicker/   # 日期范围选择器
│   ├── drawer/            # 抽屉组件
│   ├── iframe/            # iframe 组件
│   ├── pagination/        # 分页组件
│   └── tableList/         # 表格列表组件
├── composables/           # 组合式函数
│   └── usePermission.ts   # 权限相关组合式函数
├── directives/            # 自定义指令
│   └── permission.ts      # 权限指令（v-permission）
├── layout/                # 布局组件
│   ├── header/            # 头部组件
│   ├── main/              # 主内容区组件
│   ├── sidebar/           # 侧边栏组件
│   └── index.ts           # 布局入口
├── modules/               # 业务模块（按功能划分）
│   ├── adminUser/         # 管理员模块
│   ├── apiPermission/     # 接口权限模块
│   ├── auth/              # 认证模块
│   ├── department/        # 部门模块
│   ├── log/               # 日志模块
│   ├── menu/              # 菜单模块
│   ├── profile/           # 个人中心模块
│   ├── role/              # 角色模块
│   └── shared/            # 共享工具
├── router/                # 路由配置
│   ├── constantRoutes.ts  # 常量路由（固定路由）
│   ├── dynamicRoutes.ts   # 动态路由（权限路由）
│   ├── guard.ts           # 路由守卫
│   └── index.ts           # 路由入口
├── stores/                # Pinia Store（自动导入）
│   ├── auth.ts            # 认证状态
│   ├── refresh.ts         # 刷新状态
│   ├── routes.ts          # 路由状态
│   ├── setting.ts         # 设置状态
│   └── index.ts           # Store 入口
├── types/                 # TypeScript 类型定义
│   ├── adminUser.d.ts     # 管理员类型
│   ├── auth.d.ts          # 认证类型
│   ├── common.d.ts        # 通用类型
│   ├── department.d.ts    # 部门类型
│   ├── log.d.ts           # 日志类型
│   ├── menu.d.ts          # 菜单类型
│   └── role.d.ts          # 角色类型
├── utils/                 # 工具函数（自动导入）
│   ├── auth.ts            # 认证工具
│   ├── helper.ts          # 辅助函数
│   └── request.ts         # 请求封装
├── views/                 # 页面组件
│   ├── about/             # 关于页面
│   ├── home/              # 首页
│   ├── log/               # 日志页面
│   ├── login/             # 登录页面
│   ├── other/             # 其他页面（404 等）
│   ├── permission/        # 权限管理页面
│   └── profile/           # 个人中心页面
├── App.vue                # 根组件
└── main.ts                # 入口文件
```

---

## 核心机制

### 1. 自动导入

项目配置了自动导入，**无需手动导入**以下内容：

-   **Vue API**: `ref`, `reactive`, `computed`, `watch`, `onMounted` 等
-   **Element Plus**: `ElMessage`, `ElMessageBox`, 所有组件
-   **图标**: `i-ep-*`, `i-ant-design-*`, `i-carbon-*`
-   **组件**: `XlTableList`, `XlDrawer`, `XlActionButton` 等（src/components 下）
-   **工具函数**: `request`, `get`, `post`, `upload` 等

### 2. 请求封装

所有 API 请求通过 `src/utils/request.ts` 封装：

```typescript
// 方法签名
get<T>(url: string, params?: object): Promise<T>
post<T>(url: string, data?: object): Promise<T>
upload<T>(url: string, files: File|File[], extra?: object): Promise<T>
```

**拦截器功能**：

-   自动添加 `Authorization: Bearer <token>`
-   统一处理 401 未授权
-   统一错误提示
-   支持 token 刷新

### 3. 认证流程

**登录流程**：

```
1. 用户输入凭证 → 2. 调用 login API
→ 3. 存储 token（Pinia + localStorage）
→ 4. 获取用户信息和菜单
→ 5. 添加动态路由
→ 6. 跳转到首页
```

**路由守卫** (`src/router/guard.ts`):

-   检查 token 是否有效
-   未登录重定向到登录页
-   动态添加权限路由
-   页面加载进度条

**状态管理** (`src/stores/auth.ts`):

-   `token`: 当前 token
-   `userInfo`: 用户信息
-   `menu`: 用户菜单树
-   `buttonPermissions`: 按钮权限列表
-   `buttonPermissionMap`: 按钮权限映射

### 4. 权限系统

**按钮权限控制**：

```vue
<!-- 方式 1: 指令方式 -->
<el-button v-permission="'adminUser:add'">新增</el-button>

<!-- 方式 2: 组合式函数方式 -->
<script setup lang="ts">
const { checkPermission, getButtonInfoFull } = usePermission()

if (checkPermission('adminUser:edit')) {
    // 有权限的操作
}
</script>
```

**权限数据结构**：

```typescript
interface UserPermission {
    id: number
    title: string
    icon?: string
    path?: string
    name?: string
    component?: string
    redirect?: string
    children?: UserPermission[]
    is_show: boolean
    is_menu: boolean
    is_router: boolean
    is_cache: boolean
    is_link: boolean
    link_url?: string
    always_show: boolean
}
```

### 5. 动态路由

**流程**：

1. 登录后从后端获取菜单树
2. `auth.store.menu` 存储菜单数据
3. `convertRoute()` 将菜单转换为 Vue Router 路由
4. `router.addRoute()` 动态添加路由

**文件位置**：`src/router/dynamicRoutes.ts`

---

## 模块组织模式

项目采用 **模块化开发模式**，每个业务模块包含：

```
src/modules/{module}/
├── model.ts           # 数据模型（类型定义、常量）
├── service.ts         # API 服务层（请求封装）
├── use{Module}List.ts # 列表页逻辑（Composable）
├── use{Module}Form.ts # 表单逻辑（Composable）
└── index.ts           # 模块入口（可选）
```

### 示例：管理员模块

```typescript
// src/modules/adminUser/service.ts
export const fetchAdminUserList = (params: PageParams) => get<PageData<AdminUser>>('/admin-user', params)

// src/modules/adminUser/useAdminUserList.ts
export function useAdminUserList() {
    const loading = ref(false)
    const adminUserList = ref<AdminUser[]>([])
    const queryWhere = reactive({ page: 1, per_page: 10, username: '' })

    const getList = async () => {
        /* ... */
    }
    const handleSearch = () => {
        /* ... */
    }

    return { loading, adminUserList, queryWhere, getList, handleSearch }
}
```

### 使用方式

```vue
<script setup lang="ts">
import { useAdminUserList } from '@/modules/adminUser/useAdminUserList'

const { loading, adminUserList, queryWhere, getList, handleSearch } = useAdminUserList()

onMounted(() => {
    getList()
})
</script>
```

---

## 开发规范

### 命名规范

| 类型       | 规范                   | 示例                      |
| ---------- | ---------------------- | ------------------------- |
| 组件文件   | PascalCase             | `XlTableList.vue`         |
| Composable | camelCase + use 前缀   | `useAdminUserList.ts`     |
| 类型定义   | PascalCase             | `AdminUser`, `PageParams` |
| Store      | camelCase + 模块名     | `auth.ts`, `setting.ts`   |
| API 方法   | camelCase + fetch 前缀 | `fetchAdminUserList`      |

### 代码风格

1. **组合式 API**: 统一使用 `<script setup lang="ts">`
2. **类型注解**: 函数参数和返回值必须标注类型
3. **组织顺序**: Props → State → Getters/Computed → Methods → Lifecycle
4. **注释**: 使用 JSDoc 风格注释

### 通用 Composables

-   `useListPage`: 通用列表页逻辑（分页、查询、加载）
-   `usePermission`: 权限检查和按钮信息获取
-   `useForm`: 通用表单逻辑（编辑、新增、删除）

---

## 常用操作

### 新增页面

1. 在 `src/views/` 下创建页面组件
2. 在 `src/modules/` 下创建对应模块（service + composables）
3. 在后端配置路由和权限

### 新增 API

```typescript
// src/api/xxx.ts
import { get, post } from '@/utils/request'
import type { ApiResponse, PageData } from '@/types/common'

export const fetchList = (params: PageParams) => get<PageData<Item>>('/api/list', params)
```

### 新增组件

1. 在 `src/components/` 下创建组件目录
2. 组件会自动导入，无需手动注册

### 调试技巧

1. **网络请求**: 查看 `src/utils/request.ts` 拦截器日志
2. **路由**: 查看 `src/router/guard.ts` 守卫日志
3. **状态**: 在 Vue DevTools 中查看 Pinia Store

---

## 环境配置

### 环境变量文件

| 文件               | 用途     |
| ------------------ | -------- |
| `.env.development` | 开发环境 |
| `.env.location`    | 本地环境 |
| `.env.production`  | 生产环境 |

### 关键配置项

```bash
# API 地址
VITE_BASE_URL=http://127.0.0.1:9001
VITE_BASE_API=/admin

# 代理目标（开发环境）
VITE_PROXY_TARGET=http://127.0.0.1:9001

# 页面标题
VITE_APP_TITLE=X-L-Admin (dev)
```

---

## NPM 命令

```bash
npm run dev          # 启动开发服务器
npm run local        # 本地环境
npm run prod         # 生产环境预览
npm run build:dev    # 开发环境构建
npm run build:production  # 生产环境构建
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run type-check   # 类型检查
```

---

## 关键文件说明

### `src/main.ts`

-   应用入口
-   注册全局组件（AppIcons）
-   注册指令（v-permission）
-   配置错误处理

### `vite.config.js`

-   路径别名配置（@ 指向 src/）
-   自动导入配置
-   图标配置
-   代理配置（/admin, /static）
-   代码分割配置

### `.gitignore`

已忽略的文件：

-   `.claude/` - AI 配置目录
-   `node_modules/`
-   `dist/`
-   `*.local`

---

## 常见问题

### Q: 新增的组件不生效？

A: 检查组件是否在 `src/components/` 下，自动导入需要重启开发服务器。

### Q: 图标不显示？

A: 确保使用正确的图标前缀：

-   Element Plus 图标：`i-ep-xxx`
-   Ant Design 图标：`i-ant-design-xxx`
-   自定义 SVG：放在 `src/assets/svg/` 下

### Q: 权限不生效？

A: 检查：

1. 后端是否返回了正确的菜单树
2. `auth.store.menu` 是否有数据
3. 按钮权限 code 是否正确

### Q: 回车搜索不生效？

A: 确保表单配置了 `@keydown.enter.prevent="handleSearch"`。

---

## 相关链接

-   [Vue 3 文档](https://vuejs.org/)
-   [Vite 文档](https://vitejs.dev/)
-   [Element Plus 文档](https://element-plus.org/)
-   [Pinia 文档](https://pinia.vuejs.org/)
-   [Vue Router 文档](https://router.vuejs.org/)
