# X-L-Admin-Vue3

<div align="center">

![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-5.3+-646CFF?style=flat-square&logo=vite)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.7+-409EFF?style=flat-square&logo=element)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

一个基于 Vue 3 + Vite + Element Plus 的后台管理系统前端项目。

[在线演示](https://x-l-admin.wannanbigpig.com/) · [后端项目](https://github.com/wannanbigpig/gin-layout) · [API 文档](https://wannanbigpig.apifox.cn/)

</div>

---

## 项目特性

### 1. 核心业务与高阶配置

- **RBAC 权限管理**：系统级细粒度权限控制，支持管理员、部门、角色、动态菜单、API 接口权限的统一分配与授权。
- **日志审计中心**：支持全面的登录日志与请求日志追踪；支持请求日志一键 CSV 异步导出，支持配置敏感日志字段掩码脱敏。
- **系统存储配置**：支持本地存储（`local`）与阿里云对象存储（`aliyun_oss`）多驱动运行时一键切换；包含敏感密钥安全展示机制（需具备 `storage:secret` 权限通过后端实时解密获取明文）；直观地配置允许的后缀名（`allowed_extensions`）完成上传过滤。
- **统一导出配置**：支持设置默认导出文件夹、导出临时文件夹及临时文件保留天数，后端服务将在到期后自动执行物理清理，释放服务器存储资源。

### 2. 精致交互与最佳实践

- **配置化驱动 ProTable**：列表页基于 columns / searchSchema 配置化驱动，自带强大的搜索表单折叠、自适应多终端、以及 tag/avatar/eye 等内置渲染器；**支持属性级别的响应式浅拷贝监听，解决级联表单联动清除失效的问题，同时彻底防范 `deep: true` 带来的无限死循环。**
- **响应式按钮文案**：`xl-action-button` 通过绑定权限 `:code` 属性，响应式加载最新的权限映射配置，实现国际化切换时按钮标题的无刷新即时刷新。
- **主题切换系统**：支持 `浅色` / `深色` / `跟随系统` 三种模式（默认跟随系统主题，自动响应操作系统的深色模式变化）。
- **语言国际化 (i18n)**：支持 `简体中文` / `English` 运行时一键切换，语言切换后自动刷新用户信息与菜单路由树，侧边栏、按钮文案、**当前网页标题（Tab 栏）及 ECharts 图表图例均即时刷新。**
- **高性能直传与分片**：
    - 支持文件分片并行上传（文件体积大于 20MB 时并发并行 3，单片 5MB），带自动降级单体上传机制；**内建大文件内存释放防御机制（OOM 防御），在上传结束/出错后自动解绑并释放大文件 `File` 强引用，保障浏览器在批量上传超大文件时的稳定性。**
    - 支持 OSS 批量 SSE 直传：通过 Server-Sent Events 流式预取上传凭证，前端并发 PUT 直传 OSS 平台。
- **任务与异步导出中心**：异步导出大型报表文件，支持在导出历史面板（`ExportRecordsPanel.vue`）中进行进度条跟踪与任务的下载、重试、取消；**打通 WebSocket 终态事件通知，在任务成功/失败后由 WS 驱动前端即时更新，无需延迟等待轮询刷新。**
- **通知中心**：支持全体广播或指定用户 ID 列表推送通知，带常驻红点、折叠折叠列表以及 `action_url` 一键智能跳转；**建立完善的多会话安全隔离，在用户登出时彻底注销并清除全局 WebSocket 订阅频道与处理器缓存，严防不同用户会话切换时的越权数据泄漏。**

### 3. 工程质量

- **TypeScript + Composition API**：严格的类型约束，模块与逻辑完全解耦。
- **代码规范**：配置 ESLint + Prettier，严格约束代码风格。
- **Vitest 单元测试**：针对分页、轮询、请求等底层关键组合式函数与通用组件，实现了单测全覆盖，以保障回归稳定性。

---

## 技术栈

- **框架核心**：Vue 3 (Composition API) + Vue Router
- **构建工具**：Vite 5 (带有 gzip 压缩、包体积优化与自动组件导入配置)
- **状态管理**：Pinia + `pinia-plugin-persistedstate` (实现状态自动持久化)
- **UI 组件库**：Element Plus + Iconify (自动按需引入核心图标)
- **网络请求**：Axios (支持业务静默码降级、动态多语言头、请求锁、以及 Token 自动刷新)
- **国际化**：Vue I18n

---

## 环境要求

- **Node.js** >= 18
- **npm** >= 9 (或 yarn / pnpm)

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发

```bash
# 默认开发环境
npm run dev

# 本地自定义环境（加载 .env.location）
npm run local

# 生产环境本地模拟启动（加载 .env.production 并启动 Vite）
npm run prod
```

### 3. 构建与预览

```bash
# 构建测试版本 (development 模式)
npm run build:dev

# 构建生产版本 (production 模式)
npm run build:production

# 本地预览打包后的 dist 静态产物
npm run preview
```

### 4. 代码规范检查与测试

```bash
# 运行 ESLint 静态代码检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# TypeScript 类型安全性校验
npm run type-check

# 运行单元测试 (Vitest 交互式模式)
npm run test

# 单次执行单元测试并退出
npm run test:run

# 运行单元测试并生成代码覆盖率报告
npm run test:coverage
```

---

## 核心设计与说明

### 1. 国际化与菜单契约

- **语言包目录**：
    - 中文包：`src/locales/zh-CN/*`
    - 英文包：`src/locales/en-US/*`
- **请求语言头**：在 `src/utils/request.ts` 中拦截所有请求，并自动往请求头中注入 `Accept-Language`，以保证接口报错和配置能返回匹配的语言。
- **菜单国际化前端契约**：
    - **列表或侧边树展示**：直接展示接口返回的 `title` 原文。
    - **详情或编辑场景**：表单组件应读取 `title_i18n` 字段，多语言环境下通过弹窗编辑各语种的配置。
    - **菜单新增与编辑提交**：只提交清洗后的 `title_i18n` 字段，**绝对不能提交 `title`**。
    - **校验规则**：校验表单时，至少必须有一个语言的标题经 `trim()` 后非空。

### 2. 权限按钮与指令系统

- **指令用法 (`v-permission`)**：

    ```vue
    <!-- 默认模式：拥有指定权限才显示 -->
    <el-button v-permission="'adminUser:add'">新增</el-button>

    <!-- OR 模式：满足数组中的任意一个权限即可显示 -->
    <el-button v-permission:or="['adminUser:add', 'adminUser:edit']">保存</el-button>

    <!-- 禁用模式：无权限时不隐藏按钮，而是禁用按钮并赋予 tooltip 浮现提示 -->
    <el-button v-permission.disabled="'adminUser:delete'">删除</el-button>

    <!-- 隐藏模式：显式声明无权限时进行 DOM 隐藏 -->
    <el-button v-permission.hide="'adminUser:delete'">删除</el-button>
    ```

- **响应式按钮组件 (`xl-action-button`)**：
  在操作列或普通按钮中，推荐使用 `xl-action-button` 并绑定 `:code`：

    ```vue
    <xl-action-button code="adminUser:add" @click="handleAdd" />
    ```

    > **注意**：绑定 `code` 后，按钮组件内部将响应式地通过 `usePermission().getButtonInfoFull(code)` 动态抓取最新的标题、图标、隐藏等信息。这消除了多语言切换后按钮文案不刷新的历史问题。

- **操作按钮收纳 (`xl-action-buttons`)**：
  在 `el-table` 操作列中，如果按钮较多，推荐使用 `xl-action-buttons`。它会根据绑定的 `:buttons` 配置和 `:maxVisibleButtons`（默认为 2）自适应收纳多余的按钮，并自动进行前端权限过滤：
    ```vue
    <xl-action-buttons :buttons="actionButtons" :scope="scope" />
    ```

### 3. 核心 Composables 介绍

- **`useListPage`**：
  提供列表页通用的分页状态、重置流程和加载反馈。内部对 `fetcher` 进行了全局 try/catch 兜底并输出错误日志。若接口抛错，自动将数据清空并更新分页状态为 `EMPTY_RESULT` 以防界面崩溃，业务层调用列表时无需编写冗余的 `try/catch` 逻辑。
- **`usePermission`**：
  动态权限获取辅助，直接代理 Pinia 状态，提供 `getButtonInfoFull(code)` 以响应式获取最新的按钮状态。
- **`useDictOptions`**：
  字典字段加载。集成内存 Map 缓存与 `localStorage` 二级缓存（30分钟 TTL），缓存 Key 按 `locale` 隔离，提供 `invalidateDictOptionsCache(typeCode)` 废弃缓存函数。
- **`useIntervalPolling`**：
  安全的轮询机制。上一轮 fn 异步结束后才派发下一轮（防止并行雪崩）；监听视口可见性（页面最小化或切入后台自动暂停，切回时自动唤醒）；内置 `AbortController`，在暂停或重新调度前向 fn 传递取消信号，彻底切断进行中的网络资源浪费。

---

## 环境变量说明

| 变量名              | 说明                                  | 默认值                  | 示例值                  |
| :------------------ | :------------------------------------ | :---------------------- | :---------------------- |
| `VITE_APP_TITLE`    | 浏览器标签页标题                      | `X-L-Admin`             | `X-L-Admin (dev)`       |
| `VITE_APP_BASE`     | 路由基础路径                          | `/`                     | `/`                     |
| `VITE_BASE_URL`     | 后端 API 地址（非代理模式下生效）     | -                       | `http://127.0.0.1:9001` |
| `VITE_BASE_API`     | 路由 API 前缀                         | `/admin`                | `/admin`                |
| `VITE_BASE_STATIC`  | 静态资源访问路径前缀                  | `/static`               | `/static`               |
| `VITE_PROXY_TARGET` | 开发环境代理的目标服务地址            | `http://127.0.0.1:9001` | `http://127.0.0.1:9001` |
| `VITE_USE_PROXY`    | 开发环境是否启用同源代理（推荐启用）  | `true`                  | `true` / `false`        |
| `AUTO_OPEN_BROWSER` | 启动 dev 开发服务时是否自动打开浏览器 | `true`                  | `true` / `false`        |

---

## 贡献指南

1. Fork 本仓库。
2. 创建属于你的 Feature 分支：`git checkout -b feature/xxx`。
3. 提交代码时，请遵循 Conventional Commits 规范，例如：`feat: add new config panel` / `fix: solve i18n compilation issue`。
4. 推送分支并向本仓库发起 Pull Request。

---

## 许可证

本项目基于 [MIT 许可证](./LICENSE) 开源。

---

## 仓库与反馈

- **前端仓库 (本项目)**：[go-admin-ui](https://github.com/wannanbigpig/go-admin-ui)
- **后端仓库**：[gin-layout](https://github.com/wannanbigpig/gin-layout)
- **问题反馈 (Issues)**：[go-admin-ui/issues](https://github.com/wannanbigpig/go-admin-ui/issues)

---

## 免责声明

本项目按 **“现状”提供**，不附带任何明示或默示担保。项目可能存在缺陷、安全漏洞或与特定业务场景不匹配的实现；上线生产环境前，请使用者自行完成代码安全审计、配置审查、权限逻辑校验和数据冷备份。因使用、依赖、改造或运维本项目导致的数据泄露、服务中断等任何损失，由使用者自行承担，开源作者不承担任何责任。
