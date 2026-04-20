# X-L-Admin-Vue3

<div align="center">

![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-5.3+-646CFF?style=flat-square&logo=vite)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.7+-409EFF?style=flat-square&logo=element)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

一个基于 Vue 3 + Vite + Element Plus 的后台管理系统前端项目。

[在线演示](https://x-l-admin.wannanbigpig.com/) · [后端项目](https://github.com/wannanbigpig/gin-layout) · [API 文档](https://wannanbigpig.apifox.cn/)

</div>

## 项目特性

### 核心业务

-   RBAC 权限管理：管理员、部门、角色、菜单、接口权限
-   日志管理：登录日志、请求日志
-   个人中心：资料维护、头像上传

### 体验与交互

-   主题切换：`浅色` / `深色` / `跟随系统`（默认跟随系统）
-   响应式后台布局 + 路由动画
-   水印开关与内容配置（Pinia 持久化）
-   按钮级权限控制（`v-permission` + `usePermission`）

### 工程质量

-   TypeScript + Composition API
-   ESLint + Prettier
-   Vitest 单元测试（已配置 `jsdom`、`setupFiles`）
-   请求层/分页/提交锁等关键逻辑已覆盖测试

## 技术栈

-   Vue 3
-   Vite
-   Vue Router
-   Pinia（`pinia-plugin-persistedstate`）
-   Element Plus
-   Axios
-   Animate.css
-   @iconify/vue

## 环境要求

-   Node.js >= 18
-   npm >= 9（或 yarn / pnpm）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发

```bash
# 开发环境
npm run dev

# 本地环境（.env.location）
npm run local

# 生产模式本地启动
npm run prod
```

### 3. 构建与预览

```bash
# 构建（dev）
npm run build:dev

# 构建（production）
npm run build:production

# 预览构建产物
npm run preview
```

### 4. 代码检查与测试

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# TypeScript 类型检查
npm run type-check

# 运行测试（watch）
npm run test

# 单次运行测试
npm run test:run

# 测试覆盖率
npm run test:coverage
```

## 主题系统说明

-   主题状态由 `src/stores/setting.ts` 管理，持久化键为 `setting.theme`
-   支持三种模式：
    -   `light`
    -   `dark`
    -   `system`（默认）
-   启动时在 `src/main.ts` 自动应用主题：
    -   注入 `element-plus/theme-chalk/dark/css-vars.css`
    -   切换 `document.documentElement.classList.dark`
    -   监听系统主题变化（`prefers-color-scheme`）

## 权限系统说明

### 指令用法

```vue
<el-button v-permission="'adminUser:add'">新增</el-button>
```

### 组合式函数

```ts
import { usePermission } from '@/composables/usePermission'

const { checkPermission, getButtonInfoFull } = usePermission()
```

## 环境变量

示例（`.env.development`）：

```env
VITE_APP_TITLE=X-L-Admin (dev)
VITE_BASE_URL=http://127.0.0.1:9001
VITE_BASE_API=/admin
VITE_BASE_STATIC=/static
```

## 目录结构（简版）

```text
x-l-admin-vue3/
├── src/
│   ├── api/                # API 定义
│   ├── assets/             # 样式与静态资源
│   ├── components/         # 通用组件
│   ├── composables/        # 组合式函数（含测试）
│   ├── directives/         # 自定义指令
│   ├── layout/             # 后台布局
│   ├── modules/            # 业务模块（service/model/useXxx）
│   ├── router/             # 路由配置与守卫
│   ├── stores/             # Pinia 状态
│   ├── test/               # 测试初始化
│   ├── utils/              # 工具函数（含测试）
│   ├── views/              # 页面
│   ├── App.vue
│   └── main.ts
├── vite.config.js
├── vitest.config.ts
└── README.md
```

## 贡献指南

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/xxx`
3. 提交代码：`git commit -m "feat: xxx"`
4. 推送分支并发起 PR

建议遵循 Conventional Commits：`feat` / `fix` / `docs` / `refactor` / `test` / `chore`。

## 许可证

[MIT](./LICENSE)

## 仓库与反馈

-   前端仓库（当前）：https://github.com/wannanbigpig/go-admin-ui
-   后端仓库：https://github.com/wannanbigpig/gin-layout
-   Issue：https://github.com/wannanbigpig/go-admin-ui/issues
