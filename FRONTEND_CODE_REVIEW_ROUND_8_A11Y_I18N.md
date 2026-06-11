# 第 8 轮前端专项 Code Review：无障碍（Accessibility）与 i18n 收尾

---

## 1. 本轮审查范围

**i18n 完整性**

- src/views/ 全部页面（硬编码中文搜索）
- src/components/ 全部组件
- src/modules/ 全部业务模块
- src/directives/ 全部指令
- src/locales/zh-CN/ 和 en-US/ 全部翻译文件

**无障碍（Accessibility）**

- src/views/login/index.vue
- src/layout/sidebar/sidebarMenu.vue、sidebarItem.vue
- src/layout/header/right.vue、notificationCenter.vue
- src/components/proTable/index.vue、actionButton/index.vue、actionButtons/index.vue、pagination/index.vue、filePicker/index.vue
- src/views/system/file/index.vue、FileGrid.vue、FileToolbar.vue
- src/assets/styles/reset.scss

**代码一致性**

- normalizeFolderId 多处实现
- formatFileSize / formatDate 多处实现
- isEmpty 多处语义
- 分页组件事件传播
- actionButtons 定义方式
- i18n fallback 模式

---

## 2. 调用链说明

### i18n 架构

```
main.ts → use(i18n) → createI18n({ legacy: false, globalInjection: false })
  → localeMessages: { 'zh-CN': zhCN, 'en-US': enUS }
  → FALLBACK_LOCALE: 'zh-CN'

组件内 → useI18n() → t('namespace.key')
非组件 → translate('namespace.key')

Element Plus → <el-config-provider :locale="elementLocale">
  → zh-cn / en 语言包根据 settingStore.locale 切换

路由标题 → resolveRouteTitle({ titleKey }) → i18n.t(titleKey)
后端字段 → mergeI18nField(field, field_i18n)
```

### 无障碍架构

```
全局：reset.scss 定义 :focus-visible 焦点环
布局：index.html lang="zh-CN"
组件：Element Plus 内置部分 ARIA（el-form-item、el-dialog 等）
自定义组件：collapseBtn / exportCenter / proTable.eye 正确实现了 role+tabindex+keyboard
其余自定义交互元素：大部分缺少 ARIA 和键盘支持
```

---

## 3. 已确认问题

### 问题 1：i18n — 第 4 轮发现的 7 个问题全部未修复

- **严重等级**：High
- **问题描述**：第 4 轮审查发现的 7 个 i18n 问题均未修复：

| #   | 问题                                 | 文件                                 | 状态   |
| --- | ------------------------------------ | ------------------------------------ | ------ |
| 1   | 整页硬编码中文（30+ 处）             | monitor/index.vue                    | 未修复 |
| 2   | 整页硬编码中文（20+ 处）             | product/index.vue                    | 未修复 |
| 3   | "数据权限"/"自定义部门" 硬编码       | role/index.vue 第 44-50 行           | 未修复 |
| 4   | DATA_SCOPE_OPTIONS 5 个 label 硬编码 | role/model.ts 第 54-58 行            | 未修复 |
| 5   | 超级管理员警告硬编码                 | adminUser/index.vue 第 110 行        | 未修复 |
| 6   | formatTimeAgo 5 处时间格式硬编码     | notification/index.vue 第 262-267 行 | 未修复 |
| 7   | 不存在的 i18n key                    | avatarUpload/index.vue 第 42、47 行  | 未修复 |

- **影响范围**：英文环境下约 75 处用户可见的中文文本

---

### 问题 2：i18n — `t(key) || '硬编码'` 模式是 dead code

- **严重等级**：Medium
- **文件**：多个组件（12 处）
- **问题描述**：`vue-i18n` 的 `t()` 在 key 不存在时返回 key 本身（如 `'common.actions.collapse'`），而非空字符串。因此 `t('key') || '硬编码'` 中的 `|| '硬编码'` **永远不会生效**。如果翻译缺失，用户会看到原始 key 字符串而非中文 fallback。
- **证据**：
    ```typescript
    // FileUploadQueue.vue 第 20 行
    t('common.actions.collapse') || '收起'
    // 如果 key 缺失，显示 'common.actions.collapse' 而非 '收起'
    ```
- **修复建议**：确保所有 key 在 i18n 资源文件中存在，删除 `|| '硬编码'` fallback。或使用 vue-i18n 的 `missing` handler 统一处理。

---

### 问题 3：无障碍 — 登录表单缺少 label（P0）

- **严重等级**：P0（严重）
- **文件**：`src/views/login/index.vue`
- **代码位置**：第 57、64、71 行
- **问题描述**：三个 `el-form-item`（用户名、密码、验证码）均无 `label` 属性。屏幕阅读器用户无法获知每个输入字段的用途。placeholder 不是 label 的等价物。
- **修复建议**：为每个 `el-form-item` 添加 `:label="t('login.username')"` 等。

---

### 问题 4：无障碍 — 全项目无 `aria-live` 属性（P1）

- **严重等级**：P1（高）
- **文件**：全局
- **问题描述**：项目中没有任何 `aria-live` 属性。搜索结果更新、上传进度、ElMessage/ElNotification 弹出提示、v-loading 加载状态等动态内容变化，屏幕阅读器用户完全无法感知。
- **修复建议**：在主布局中添加 `<div aria-live="polite" aria-atomic="true" class="sr-only">` 区域，动态写入通知消息。

---

### 问题 5：无障碍 — 缺少 Skip Navigation 链接（P1）

- **严重等级**：P1（高）
- **文件**：全局布局
- **问题描述**：整个项目没有"跳到主内容"的 Skip Link。键盘用户每次都需要 Tab 穿过整个侧边栏菜单才能到达页面主内容区域。
- **修复建议**：在主布局顶部添加 `<a href="#main-content" class="skip-link">跳到主内容</a>`，CSS 使用 `.sr-only` 隐藏，`:focus` 时显示。

---

### 问题 6：无障碍 — FileGrid 键盘不可操作（P1）

- **严重等级**：P1（高）
- **文件**：`src/views/system/components/FileGrid.vue`
- **代码位置**：第 11、44-51、74-76、99-131 行
- **问题描述**：文件网格项使用 `<div>` + `@click` + `@dblclick`，无 `tabindex`、无 `role="button"`、无键盘事件处理。右键自定义菜单无 `role="menu"`、无键盘导航、无 Escape 关闭。键盘用户完全无法操作文件网格视图。
- **修复建议**：为文件项添加 `role="button" tabindex="0" @keydown.enter`。为右键菜单添加 `role="menu"`、菜单项添加 `role="menuitem"`、支持 Arrow 键和 Escape。

---

### 问题 7：无障碍 — 通知中心铃铛图标不可键盘操作（P1）

- **严重等级**：P1（高）
- **文件**：`src/layout/header/notificationCenter.vue`
- **代码位置**：第 4 行
- **问题描述**：通知中心触发元素 `<div class="notification-bell">` 无 `role`、`tabindex`、`aria-label`，键盘用户无法访问通知面板。
- **修复建议**：添加 `role="button" tabindex="0" :aria-label="t('layout.notification.title')" @keydown.enter="handlePanelOpen"`。

---

### 问题 8：无障碍 — 登录页工具栏按钮和验证码不可键盘操作（P1）

- **严重等级**：P1（高）
- **文件**：`src/views/login/index.vue`
- **代码位置**：第 9、21、86 行
- **问题描述**：语言/主题切换的 `<div class="toolbar-btn">` 无 `role="button"` / `tabindex`。验证码刷新区域 `<div class="captcha-img" @click="refreshCaptcha">` 无键盘等效操作。
- **修复建议**：添加 `role="button" tabindex="0"` 和 `@keydown.enter`。

---

### 问题 9：代码一致性 — `normalizeFolderId` 三处实现不一致

- **严重等级**：Medium
- **文件**：`useFileFolder.ts:33`、`useFileOperations.ts:79`、`filePicker/index.vue:316`、`file/index.vue:479`
- **问题描述**：四处实现行为不同：

| 位置                 | 处理 `''` | 处理 `0` / `'0'` |
| -------------------- | :-------: | :--------------: |
| useFileFolder.ts     |    否     |        否        |
| useFileOperations.ts |    是     |        是        |
| filePicker/index.vue |    否     |        否        |
| file/index.vue       |    是     |        是        |

- **影响范围**：文件夹操作中 `0` 或空字符串表示根目录时，部分路径不会归一化为 null
- **修复建议**：提取到 `src/utils/helper.ts`，统一为最完整版本。

---

### 问题 10：代码一致性 — `formatFileSize` 三处重复实现

- **严重等级**：Medium
- **文件**：`helper.ts:228`、`FileDetailDrawer.vue:170`、`filePicker/index.vue:308`、`ExportRecordsPanel.vue:178`
- **问题描述**：四处实现中 `filePicker` 缺少 `'TB'` 单位，`helper.ts` 是唯一处理负数的版本。
- **修复建议**：统一使用 `import { formatFileSize } from '@/utils/helper'`。

---

### 问题 11：代码一致性 — `formatDateTime` 五处重复实现

- **严重等级**：Medium
- **文件**：`helper.ts:158`、`notificationCenter.vue:170`、`notification/index.vue:243`、`TaskStatsPanel.vue:145`、`dateRangePicker/index.vue:59`
- **问题描述**：各处实现的输入类型、无值返回、精度（秒 vs 分钟）均不一致。
- **修复建议**：统一使用 `helper.ts` 的 `formatDate`，需要精度差异时通过参数控制。

---

### 问题 12：代码一致性 — `isEmpty` 语义不一致

- **严重等级**：Medium
- **文件**：`helper.ts:101`、`request.ts:311`、`useAdminUserForm.ts:65`
- **问题描述**：`helper.ts` 的 `isEmpty` 将 `0` 和 `false` 视为空值，而 `request.ts` 和 `useAdminUserForm.ts` 的版本不将 `0` 和 `false` 视为空值。
- **修复建议**：在 `helper.ts` 中显式导出两个版本：`isEmpty`（UI 层）和 `isEmptyValue`（数据层），消除重复定义。

---

### 问题 13：代码一致性 — 分页组件 emit + 函数 prop 双重触发

- **严重等级**：Medium
- **文件**：`pagination/index.vue:63-82`、`tableList/index.vue:159-167`
- **问题描述**：`handleSizeChange` 同时 `emit('size-change')` 和 `props.pageSizeChange()`，`tableList` 又同时 `emit` 和调用 `pagination.pageSizeChange()`，可能导致同一操作触发两次请求。
- **修复建议**：统一为一种机制（推荐 emit），将函数 prop 标记为 deprecated。

---

## 4. 疑似问题

### 疑似 1：`prefers-reduced-motion` 媒体查询缺失

- **文件**：全局样式
- **描述**：项目包含大量动画（canvas 背景、CSS transition、animate.css），但没有 `@media (prefers-reduced-motion: reduce)` 查询。**需要确认**：是否有用户反馈动画相关的可访问性问题。

### 疑似 2：`outline: none` 破坏焦点可见性

- **文件**：`actionButtons/index.vue:203`
- **描述**：`.more-button-tooltip-wrapper` 设置了 `outline: none`，会覆盖全局 `reset.scss` 中的 `:focus-visible` 样式。**需要确认**：是否有其他组件也存在类似问题。

### 疑似 3：语义化 HTML 使用不足

- **文件**：全局布局
- **描述**：大部分页面使用 `<div>` 而非 `<header>`/`<main>`/`<nav>`/`<section>`。Element Plus 的 `el-container`/`el-header`/`el-main`/`el-aside` 组件本身有语义，但自定义区域缺少语义标签。**需要确认**：Element Plus 布局组件是否自动添加了语义标签。

---

## 5. 建议优先修复顺序

### P0 — 立即修复

1. **登录表单添加 label**（问题 3）：为三个 `el-form-item` 添加 i18n label

### P1 — 尽快修复

2. **添加 aria-live 区域**（问题 4）：主布局中添加 live region
3. **添加 Skip Link**（问题 5）：主布局顶部添加跳转链接
4. **FileGrid 键盘可达性**（问题 6）：添加 role/tabindex/keyboard 事件
5. **通知中心铃铛可达性**（问题 7）：添加 role/tabindex/aria-label
6. **登录页工具栏可达性**（问题 8）：添加 role/tabindex
7. **i18n 硬编码修复**（问题 1）：monitor/product 整页、role、adminUser、notification

### P2 — 计划修复

8. **`t(key) || '硬编码'` 清理**（问题 2）
9. **`normalizeFolderId` 统一**（问题 9）
10. **`formatFileSize` / `formatDateTime` 统一**（问题 10、11）
11. **`isEmpty` 语义统一**（问题 12）
12. **分页事件机制统一**（问题 13）

---

## 6. 建议补充测试

| 测试场景                                      | 对应问题  | 类型     |
| --------------------------------------------- | --------- | -------- |
| Tab 键可遍历登录页所有交互元素                | 问题 3、8 | 手动测试 |
| 屏幕阅读器可正确朗读登录表单字段              | 问题 3    | 手动测试 |
| Skip Link 点击后焦点跳转到主内容              | 问题 5    | 手动测试 |
| FileGrid 键盘可选择和操作文件                 | 问题 6    | 手动测试 |
| 通知中心铃铛可通过键盘打开                    | 问题 7    | 手动测试 |
| 切换英文 locale 后 monitor 页面文本全部为英文 | 问题 1    | 手动测试 |
| 切换英文 locale 后 product 页面文本全部为英文 | 问题 1    | 手动测试 |
| `normalizeFolderId(0)` 返回 null              | 问题 9    | 单元测试 |
| `formatFileSize(1024^4)` 返回 TB 单位         | 问题 10   | 单元测试 |

---

## 7. 下一轮建议

### 建议 1：全项目安全加固收尾

**原因**：多轮审查发现的安全问题（Nginx 缺少安全头/HTTPS、Logger.error 泄露敏感信息、action_url 未校验、Token 存储在 localStorage 等）需要统一收尾修复，形成安全加固清单。

### 建议 2：全项目 Code Review 总结报告

**原因**：经过 8 轮专项审查，已覆盖认证/权限、文件上传、请求封装、通用组件、Layout、构建部署、测试、性能、无障碍、i18n 等全部模块。应生成一份总结报告，按优先级汇总所有问题，形成可执行的修复路线图。
