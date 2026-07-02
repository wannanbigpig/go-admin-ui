# 项目总览

本文档基于当前仓库代码整理，重点描述项目目录、页面入口和前端已实现的业务模块，避免只看 `README.md` 时对功能范围理解过宽或过窄。

## 1. 项目定位

`x-l-admin-vue3` 是一个基于 Vue 3、Vite、Element Plus、Pinia 和 TypeScript 的后台管理前端。项目通过后端返回的菜单树动态生成业务路由，并在前端统一处理认证、权限、国际化、通知和常见管理页交互。

## 2. 目录结构

```text
src
├── api              # 接口定义
├── components       # 通用组件
├── composables      # 通用组合式函数
├── directives       # 自定义指令（如 v-permission）
├── layout           # 整体布局
├── locales          # 中英文语言包
├── mock             # 开发期 Mock
├── modules          # 业务模块逻辑层
├── router           # 静态路由、动态路由与守卫
├── stores           # Pinia 状态管理
├── types            # 全局类型定义
├── utils            # 请求、日志、跳转、标题等工具
└── views            # 页面视图
```

## 3. 页面与组件映射

后端菜单通过 `component_key` 与前端 `src/router/componentMap.ts` 建立契约。当前已显式映射的关键页面如下：

| `component_key`             | 页面文件                                        | 说明                    |
| --------------------------- | ----------------------------------------------- | ----------------------- |
| `home:index`                | `src/views/home/index.vue`                      | 首页 / 仪表盘           |
| `about:index`               | `src/views/about/index.vue`                     | 关于页                  |
| `profile`                   | `src/views/profile/index.vue`                   | 个人中心                |
| `permission:adminUser`      | `src/views/permission/adminUser/index.vue`      | 管理员管理              |
| `permission:department`     | `src/views/permission/department/index.vue`     | 部门管理                |
| `permission:role`           | `src/views/permission/role/index.vue`           | 角色管理                |
| `permission:menuList`       | `src/views/permission/menuList/index.vue`       | 菜单管理                |
| `permission:api`            | `src/views/permission/api/index.vue`            | API 权限管理            |
| `log:adminLogin`            | `src/views/log/adminLogin/index.vue`            | 登录日志                |
| `log:request`               | `src/views/log/request/index.vue`               | 请求日志                |
| `log:session`               | `src/views/log/session/index.vue`               | 在线会话                |
| `system:config`             | `src/views/system/config/index.vue`             | 系统参数与存储/审计配置 |
| `system:dict`               | `src/views/system/dict/index.vue`               | 字典管理                |
| `system:file`               | `src/views/system/file/index.vue`               | 文件中心                |
| `system:notificationManage` | `src/views/system/notificationManage/index.vue` | 通知发送管理            |
| `system:task`               | `src/views/system/task/index.vue`               | 任务中心                |
| `system:taskStats`          | `src/views/system/taskStats/index.vue`          | 任务统计                |
| `product:index`             | `src/views/business/product/index.vue`          | 业务示例页              |

除显式映射外，`src/router/componentMap.ts` 还会通过 `import.meta.glob('../views/**/index.vue')` 自动补充 `index.vue` 页面映射。

## 4. 核心业务模块

### 权限与组织

- `src/modules/auth`：登录、当前用户、菜单树、按钮权限提取与映射。
- `src/modules/menu`：菜单树列表、菜单编辑表单、树展开收起。
- `src/modules/role`：角色列表与角色编辑。
- `src/modules/department`：部门树、部门表单、部门绑定角色。
- `src/modules/adminUser`：管理员列表、管理员表单、管理员绑定角色。
- `src/modules/apiPermission`：接口权限管理。

### 系统能力

- `src/modules/system`：系统参数、字典、存储配置、任务、通知、文件资源等接口服务。
- `src/modules/exportCenter`：导出任务提交和导出记录联动。
- `src/views/system/task/index.vue`：任务中心分为 `definition`、`run`、`cron`、`export` 四个 Tab。
- `src/views/system/storage/index.vue`：作为兼容路由入口，进入后会重定向到 `/system/config?tab=storage`。

### 文件中心

`src/views/system/file/index.vue` 及其子组件组成当前文件中心，已实现的前端能力包括：

- 目录树与分类筛选联动；
- 网格 / 表格双视图；
- 文件名搜索、分页与滚动加载；
- 文件上传、目录上传、上传队列与失败重试；
- 文件夹新建、重命名、移动、删除；
- 文件拖拽移动、批量移动、批量删除；
- 回收站、引用明细、详情抽屉、列表导出。

### 日志、通知与仪表盘

- `src/modules/log`：请求日志、登录日志、在线会话查询。
- `src/stores/notification.ts`：通知列表、未读数、WebSocket 连接、频道订阅与心跳重连。
- `src/modules/dashboard`：首页概览、统计图表和监控数据处理。

## 5. 通用基础设施

### 权限体系

- `src/directives/permission.ts` 提供 `v-permission` 指令。
- `src/composables/usePermission.ts` 直接代理 `authStore` 的按钮权限查询。
- `xl-action-button` / `xl-action-buttons` 会结合权限按钮元数据渲染标题、图标和可见性。

### 列表与表单

- `src/components/proTable`
- `src/components/tableList`
- `src/composables/useListPage.ts`
- `src/modules/shared/*`

这些目录承载了列表搜索、分页、列配置、响应格式标准化等通用能力。

### 国际化与主题

- 语言包位于 `src/locales/zh-CN` 与 `src/locales/en-US`。
- `src/main.ts` 会根据 `stores/setting.ts` 中的设置切换 `light` / `dark` / `system` 主题，并同步更新 `vue-i18n` locale。

## 6. 静态路由入口

`src/router/constantRoutes.ts` 当前包含以下静态入口：

- `/login`
- `/profile`
- `/system/notification`
- `/system/notification-manage`
- `/iframe`
- `/refresh`
- `/:pathMatch(.*)*` 404

业务页面主体通过登录后的菜单树动态注入到 `Layout` 下。

## 7. 适合继续阅读的文件

如果要继续理解项目，建议按下面顺序阅读：

1. `src/main.ts`
2. `src/router/guard.ts`
3. `src/stores/auth.ts`
4. `src/utils/request.ts`
5. `src/router/componentMap.ts`
6. `src/stores/notification.ts`
