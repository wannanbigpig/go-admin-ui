# 项目优化待办清单

> 生成时间：2026/04/17  
> 项目：x-l-admin-vue3  
> 文件总数：99 个源文件

---

## 执行摘要

整体代码质量良好，架构清晰。共发现 **15 项优化点**，按优先级分类如下：

| 优先级          | 数量 | 预计工时 |
| --------------- | ---- | -------- |
| P0 - 紧急且重要 | 4    | 1 小时   |
| P1 - 性能提升   | 3    | 1 小时   |
| P2 - 长期维护   | 3    | 2 小时   |
| P3 - 可选优化   | 5    | 按需     |

---

## P0 - 紧急且重要（建议优先处理）

### 1. 合并重复的类型定义

**问题**: `types/adminUser.d.ts` 和 `types/adminUser.ts` 内容几乎完全相同

**文件**:

-   `/src/types/adminUser.d.ts`
-   `/src/types/adminUser.ts`

**建议**: 保留 `adminUser.ts`，删除 `adminUser.d.ts`

**影响**: 无，仅内部类型定义

---

### 2. 确认并移除未使用的依赖

**问题**: 以下依赖包在代码中未找到引用

**文件**: `package.json`

**待确认依赖**:

```json
"clipboard": "^2.0.11"      // 未找到 import 或 require
"sortablejs": "^1.15.6"     // 未找到 import 或 require
```

**操作**:

1. 全局搜索 `import ... from 'clipboard'` 和 `import ... from 'sortablejs'`
2. 确认未使用后执行 `npm uninstall clipboard sortablejs`

---

### 3. 移除冗余的工具函数

**问题**: `utils/auth.ts` 的功能已被 `stores/auth.ts` 完全替代

**文件**: `/src/utils/auth.ts`

**当前引用**: 仅 `src/stores/auth.ts` 导入

**建议**:

-   将 `utils/auth.ts` 中的 `getToken`, `setToken`, `removeToken` 逻辑移入 `stores/auth.ts`
-   或直接删除（如 stores/auth.ts 已自包含）

---

### 4. 收紧 ESLint 规则

**问题**: 当前配置过松，允许 `var` 和 props 直接修改

**文件**: `eslint.config.js`

**建议添加规则**:

```javascript
'no-var': 'error',
'vue/no-mutating-props': 'error',
'@typescript-eslint/no-explicit-any': 'warn', // 改为警告
```

---

## P1 - 性能提升（建议第二批处理）

### 5. 清理生产环境的 console.log

**问题**: 共发现 48 处 console 输出，部分应仅保留在开发环境

**分布**:
| 文件 | 数量 | 建议 |
|------|------|------|
| `src/modules/adminUser/useAdminUserList.ts` | 2 | 移除或改用日志工具 |
| `src/modules/adminUser/useAdminUserForm.ts` | 2 | 移除或改用日志工具 |
| `src/layout/header/right.vue` | 3 | 保留 error，移除 log |
| `src/router/guard.ts` | 3 | 保留 error/warn |
| `src/router/dynamicRoutes.ts` | 3 | 保留 error/warn |
| `src/main.ts` | 3 | 保留（全局错误拦截） |
| 其他文件 | 32 | 清理 |

**建议**: 引入 `vite-plugin-remove-console` 或统一使用日志工具

---

### 6. 合并样式文件

**问题**: `animation.scss` 仅 14 行，可合并

**文件**:

-   `/src/assets/styles/animation.scss`
-   `/src/assets/styles/global.scss`

**建议**: 将 `animation.scss` 内容合并到 `global.scss`，删除原文件

---

### 7. 检查未使用的静态资源

**问题**: 以下资源可能未使用

**文件**:

-   `/src/assets/images/bigpig.jpg` - 需确认使用场景

**操作**: 全局搜索 `bigpig` 关键词

---

## P2 - 长期维护（可逐步处理）

### 8. 核实 TypeScript 版本

**问题**: `typescript: ^6.0.3` 版本号异常高

**文件**: `package.json`

**建议**: 确认是否为笔误，当前稳定版为 `5.x`

---

### 9. 优化 SCSS 文件命名

**问题**: `global.scss` 与 `global-var.scss` 命名易混淆

**文件**:

-   `/src/assets/styles/global-var.scss`

**建议**: 重命名为 `theme-vars.scss` 或 `css-variables.scss`

---

### 10. 引入技术债务追踪规范

**问题**: 全项目无 TODO/FIXME/HACK 标记

**建议**:

-   制定团队规范，如 `// TODO(姓名): 描述 - 截止日期`
-   使用 ESLint 插件追踪 TODO

---

## P3 - 可选优化（按需处理）

### 11. 优化通用样式类

**问题**: `xl-common.scss` 动态生成 100+ margin 工具类，可能未全部使用

**文件**: `/src/assets/styles/xl-common.scss`

**建议**:

-   按需生成
-   或替换为现成方案（如 `tailwindcss`, `unocss`）

---

### 12. 检查低引用组件

**问题**: 以下组件被引用次数较少，确认是否必要

| 组件                   | 引用次数 | 文件       |
| ---------------------- | -------- | ---------- |
| `breadcrumb/index.vue` | 0        | 可能未使用 |
| `iframe/index.vue`     | 1        | 仅一处使用 |

---

### 13. 统一错误处理模式

**问题**: 多处重复 `console.error('提交失败:', error)` 模式

**建议**: 封装统一的错误处理函数

```typescript
// utils/error-handler.ts
export function handleSubmissionError(error: unknown): void {
    console.error('提交失败:', error)
    // 可在此添加通知逻辑
}
```

---

### 14. 优化 composables 命名

**问题**: `modules/*/service.ts` 命名不统一

**当前模式**:

-   `modules/adminUser/service.ts`
-   `modules/auth/service.ts`
-   `modules/common/service.ts`

**建议**: 统一为 `api.ts` 或保持 `service.ts` 但添加注释说明职责

---

### 15. 添加组件文档

**问题**: 公共组件无文档说明

**建议**: 为 `components/` 下的组件添加 JSDoc 或 README

---

## 无用文件删除清单

执行以下删除操作前，请二次确认：

### 确认后即可删除

| 文件                               | 原因               | 确认步骤                   |
| ---------------------------------- | ------------------ | -------------------------- |
| `src/types/adminUser.d.ts`         | 与 `.ts` 文件重复  | 全局搜索 `.d.ts` 引用      |
| `src/utils/auth.ts`                | 功能被 stores 替代 | 确认仅 stores/auth.ts 引用 |
| `src/assets/styles/animation.scss` | 合并到 global.scss | 合并后删除                 |

### 需进一步确认

| 文件                                  | 待确认内容            |
| ------------------------------------- | --------------------- |
| `package.json` - clipboard            | 全局搜索 `clipboard`  |
| `package.json` - sortablejs           | 全局搜索 `sortablejs` |
| `src/assets/images/bigpig.jpg`        | 全局搜索 `bigpig`     |
| `src/components/breadcrumb/index.vue` | 全局搜索 `breadcrumb` |

---

## 执行建议

### 批次 1（P0，1 小时内完成）

1. 合并类型定义
2. 移除冗余工具函数
3. 收紧 ESLint 规则

### 批次 2（P1，1 小时内完成）

1. 清理 console.log
2. 合并样式文件
3. 删除确认后的无用资源

### 批次 3（P2，2 小时内完成）

1. 核实 TypeScript 版本
2. 优化文件命名
3. 建立 TODO 规范

### 批次 4（P3，按需）

根据团队需求选择执行

---

## 附录：项目统计

### 文件类型分布

-   Vue 组件：37 个
-   TypeScript 文件：50+ 个
-   类型定义：8 个
-   样式文件：10 个
-   配置文件：5 个

### 目录结构

```
src/
├── api/                    # 6 个文件
├── assets/
│   ├── images/            # 3 个文件
│   ├── styles/            # 10 个文件
│   └── svg/               # 3 个文件
├── components/             # 9 个组件
├── composables/            # 2 个文件
├── directives/             # 1 个文件
├── layout/                 # 布局组件
├── modules/                # 业务模块
├── router/                 # 4 个文件
├── stores/                 # 4 个文件
├── types/                  # 8 个文件
├── utils/                  # 3 个文件
└── views/                  # 页面组件
```

---

**下一步**: 请查阅此文档后，告知需要执行哪些优化项。
