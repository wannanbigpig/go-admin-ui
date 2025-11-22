# X-L-Admin-Vue3

<div align="center">

![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-5.3+-646CFF?style=flat-square&logo=vite)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.7+-409EFF?style=flat-square&logo=element)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

一个基于 Vue 3 + Vite + Element Plus 的现代化后台管理系统

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [开发指南](#-开发指南)

</div>

## 📸 项目截图

<div align="center">

![X-L-Admin 后台管理系统](./screenshot.png)

_管理员管理页面 - 完整的权限管理系统_

</div>

> 💡 **添加截图**：
>
> 1. 将截图保存为 `screenshot.png` 放在项目根目录
> 2. 或使用在线图片链接：`![截图描述](https://your-image-url.com/screenshot.png)`
> 3. 或使用 GitHub 的 raw 链接：`![截图描述](https://raw.githubusercontent.com/wannanbigpig/go-admin-ui/main/screenshot.png)`

## ✨ 功能特性

### 🎯 核心功能

-   ✅ **权限管理** - 完整的 RBAC 权限控制系统

    -   管理员管理
    -   部门管理
    -   角色管理
    -   菜单管理
    -   接口权限管理

-   ✅ **日志管理** - 完善的日志记录和查询

    -   登录日志
    -   请求日志

-   ✅ **用户中心** - 个人信息管理

### 🎨 界面特性

-   🎨 **现代化 UI** - 基于 Element Plus 的精美界面设计
-   🌙 **响应式布局** - 完美适配各种屏幕尺寸
-   🎭 **路由动画** - 流畅的页面切换动画效果
-   💧 **水印功能** - 可配置的水印显示
-   🎯 **权限控制** - 细粒度的按钮级权限控制

### 🛠️ 技术特性

-   ⚡ **Vite 构建** - 极速的开发体验和构建速度
-   🔥 **组合式 API** - 全面使用 Vue 3 Composition API
-   📦 **自动导入** - 组件、API、图标自动导入，无需手动引入
-   🎯 **TypeScript 友好** - 完善的类型提示（可选）
-   📝 **代码规范** - ESLint + Prettier 代码格式化
-   🔐 **状态持久化** - Pinia 状态自动持久化到 localStorage

## 🚀 快速开始

### 环境要求

-   Node.js >= 18.0.0
-   npm >= 9.0.0 或 yarn >= 1.22.0 或 pnpm >= 8.0.0

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install

# 使用 pnpm
pnpm install
```

### 开发运行

```bash
# 开发环境
npm run dev

# 本地环境
npm run local

# 生产环境预览
npm run prod
```

### 构建部署

```bash
# 开发环境构建
npm run build:dev

# 生产环境构建
npm run build:production
```

### 代码检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

## 📁 项目结构

```
x-l-admin-vue3/
├── public/                 # 静态资源目录
│   ├── favicon.svg        # 网站图标
│   └── vite.svg          # Vite 图标
├── src/
│   ├── api/              # API 接口定义
│   │   ├── adminUser.js  # 管理员接口
│   │   ├── auth.js       # 认证接口
│   │   ├── department.js # 部门接口
│   │   ├── log.js        # 日志接口
│   │   ├── login.js      # 登录接口
│   │   └── permission.js # 权限接口
│   ├── assets/           # 资源文件
│   │   ├── images/       # 图片资源
│   │   ├── styles/       # 样式文件
│   │   └── svg/          # SVG 图标
│   ├── components/       # 公共组件
│   │   ├── actionButton/      # 操作按钮组件
│   │   ├── actionButtons/     # 操作按钮组组件
│   │   ├── breadcrumb/        # 面包屑组件
│   │   ├── collapsibleSearchBtn/ # 可折叠搜索按钮
│   │   ├── dateRangePicker/   # 日期范围选择器
│   │   ├── drawer/            # 抽屉组件
│   │   ├── iframe/            # iframe 组件
│   │   ├── pagination/        # 分页组件
│   │   └── tableList/         # 表格列表组件
│   ├── composables/      # 组合式函数
│   │   └── usePermission.js  # 权限相关组合式函数
│   ├── directives/       # 自定义指令
│   │   └── permission.js    # 权限指令
│   ├── layout/          # 布局组件
│   │   ├── header/      # 头部组件
│   │   ├── main/        # 主内容区组件
│   │   └── sidebar/     # 侧边栏组件
│   ├── router/          # 路由配置
│   │   ├── constantRoutes.js  # 常量路由
│   │   ├── dynamicRoutes.js   # 动态路由
│   │   ├── guard.js          # 路由守卫
│   │   └── index.js          # 路由入口
│   ├── stores/          # Pinia 状态管理
│   │   ├── auth.js      # 认证状态
│   │   ├── refresh.js   # 刷新状态
│   │   ├── routes.js    # 路由状态
│   │   ├── setting.js   # 设置状态
│   │   └── index.js     # Store 入口
│   ├── utils/           # 工具函数
│   │   ├── auth.js      # 认证工具
│   │   ├── helper.js    # 辅助函数
│   │   └── request.js   # 请求封装
│   ├── views/           # 页面组件
│   │   ├── about/       # 关于页面
│   │   ├── home/        # 首页
│   │   ├── log/         # 日志页面
│   │   ├── login/       # 登录页面
│   │   ├── other/       # 其他页面（404等）
│   │   ├── permission/  # 权限管理页面
│   │   └── profile/    # 个人中心页面
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── .github/             # GitHub 配置
├── .env.development     # 开发环境配置
├── .env.production      # 生产环境配置
├── index.html           # HTML 模板
├── package.json         # 项目配置
├── vite.config.js       # Vite 配置
└── README.md           # 项目说明
```

## 🛠️ 技术栈

### 核心框架

-   **[Vue 3](https://vuejs.org/)** - 渐进式 JavaScript 框架
-   **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
-   **[Vue Router](https://router.vuejs.org/)** - Vue.js 官方路由管理器
-   **[Pinia](https://pinia.vuejs.org/)** - Vue 的状态管理库

### UI 组件库

-   **[Element Plus](https://element-plus.org/)** - 基于 Vue 3 的组件库
-   **[@iconify/vue](https://iconify.design/)** - 丰富的图标库

### 工具库

-   **[Axios](https://axios-http.com/)** - HTTP 客户端
-   **[Animate.css](https://animate.style/)** - CSS 动画库
-   **[NProgress](https://github.com/rstacruz/nprogress)** - 页面加载进度条
-   **[SortableJS](https://sortablejs.github.io/Sortable/)** - 拖拽排序库

### 开发工具

-   **[ESLint](https://eslint.org/)** - 代码检查工具
-   **[Prettier](https://prettier.io/)** - 代码格式化工具
-   **[Sass](https://sass-lang.com/)** - CSS 预处理器

## 📖 开发指南

### 环境变量配置

项目支持多环境配置，通过 `.env` 文件管理：

**`.env.development`** - 开发环境

```env
VITE_APP_TITLE=X-L-Admin (dev)
VITE_BASE_URL=http://127.0.0.1:9001
VITE_BASE_API=/admin
VITE_BASE_STATIC=/static
```

**`.env.production`** - 生产环境

```env
VITE_APP_TITLE=X-L-Admin
VITE_BASE_URL=http://112.124.53.17
VITE_BASE_API=/admin
VITE_BASE_STATIC=/static
```

### 权限系统

项目实现了完整的 RBAC 权限控制系统：

#### 1. 按钮权限

使用 `v-permission` 指令控制按钮显示：

```vue
<el-button v-permission="'adminUser:add'">新增</el-button>
```

#### 2. 权限组合式函数

```javascript
import { usePermission } from '@/composables/usePermission'

const { checkPermission, getButtonInfoFull } = usePermission()

// 检查权限
if (checkPermission('adminUser:edit')) {
    // 有权限的操作
}

// 获取按钮信息
const buttonInfo = getButtonInfoFull('adminUser:add')
```

### 路由配置

#### 动态路由

系统支持从后端获取动态路由配置，自动生成菜单和路由。

#### 路由动画

每个路由可以配置独立的进入和离开动画：

```javascript
{
  path: '/example',
  meta: {
    animate_enter: 'animate__fadeInLeft',
    animate_leave: 'animate__fadeOutRight',
    animate_duration: '0.5'
  }
}
```

### 组件使用

#### 操作按钮组件

```vue
<xl-action-button v-permission="'adminUser:add'" :button-info="addButtonInfo" type="primary" @click="handleAdd" />
```

#### 表格列表组件

```vue
<xl-table-list :data="tableData" :tableTitle="tableTitle" :pagination="pagination">
  <template #operation>
    <!-- 自定义操作列 -->
  </template>
</xl-table-list>
```

## 🔧 配置说明

### 水印配置

在 `src/stores/setting.js` 中配置水印：

```javascript
// 是否显示水印
settingStore.watermarkEnabled = true

// 水印内容
settingStore.watermarkContent = ['github.com/wannanbigpig']
```

### 侧边栏配置

侧边栏支持折叠、固定等配置，在 `src/stores/setting.js` 中管理。

## 📝 代码规范

项目使用 ESLint + Prettier 进行代码规范检查：

-   **ESLint** - 代码质量检查
-   **Prettier** - 代码格式化
-   **自动修复** - 运行 `npm run lint:fix` 自动修复可修复的问题

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

-   `feat`: 新功能
-   `fix`: 修复 bug
-   `docs`: 文档更新
-   `style`: 代码格式调整
-   `refactor`: 代码重构
-   `perf`: 性能优化
-   `test`: 测试相关
-   `chore`: 构建/工具链相关

## 📄 许可证

本项目采用 [MIT](./LICENSE) 许可证。

## 👤 作者

**皖南大花猪 (wannanbigpig)**

-   GitHub: [@wannanbigpig](https://github.com/wannanbigpig)
-   项目地址: [https://github.com/wannanbigpig/go-admin-ui](https://github.com/wannanbigpig/go-admin-ui)

## 🙏 致谢

感谢以下优秀的开源项目：

-   [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
-   [Element Plus](https://element-plus.org/) - 基于 Vue 3 的组件库
-   [Vite](https://vitejs.dev/) - 下一代前端构建工具
-   [Pinia](https://pinia.vuejs.org/) - Vue 的状态管理库

## 📞 联系方式

如有问题或建议，欢迎：

-   提交 [Issue](https://github.com/wannanbigpig/go-admin-ui/issues)
-   发起 [Pull Request](https://github.com/wannanbigpig/go-admin-ui/pulls)
-   发送邮件或通过其他方式联系

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by [皖南大花猪](https://github.com/wannanbigpig)

</div>
