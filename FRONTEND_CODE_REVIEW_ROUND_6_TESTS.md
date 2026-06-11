# 第 6 轮前端专项 Code Review：测试覆盖率与测试质量

---

## 1. 本轮审查范围

**测试文件（22 个）**

| 目录            | 文件                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| stores/         | `auth.test.ts`、`notification.test.ts`                                                                                                                  |
| router/         | `componentMap.test.ts`、`dynamicRoutes.test.ts`                                                                                                         |
| utils/          | `request.test.ts`、`helper.test.ts`、`redirect.test.ts`、`apiCache.test.ts`、`iframe.test.ts`、`logger.test.ts`                                         |
| composables/    | `useListPage.test.ts`、`useFileUpload.test.ts`、`useDictOptions.test.ts`、`useClipboard.test.ts`、`useSubmitLock.test.ts`、`useIntervalPolling.test.ts` |
| components/     | `actionButton/index.test.ts`、`actionButtons/index.test.ts`、`avatarUpload/index.test.ts`                                                               |
| api/            | `permission.test.ts`                                                                                                                                    |
| modules/shared/ | `response.test.ts`、`i18n.test.ts`                                                                                                                      |

**测试配置**

- `vitest.config.ts`
- `src/test/setup.ts`

---

## 2. 测试统计总览

| 指标                 | 数量    |
| -------------------- | ------- |
| 总测试文件数         | 22      |
| 总测试用例数（估算） | ~95 个  |
| 覆盖的源文件数       | ~22 个  |
| 未覆盖的关键模块数   | ~30+ 个 |

### 按目录分布

| 目录            | 测试文件数 | 质量评级                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| composables/    | 6          | 优秀（useListPage、useIntervalPolling、useDictOptions、useSubmitLock 覆盖全面） |
| utils/          | 6          | 良好（request.test.ts 覆盖率最高，helper.test.ts 有大量未测导出函数）           |
| components/     | 3          | 不足（每个仅 1-2 个用例）                                                       |
| stores/         | 2          | 不足（auth 仅测 3 个场景，notification 覆盖较好）                               |
| modules/shared/ | 2          | 良好（response 和 i18n 覆盖全面）                                               |
| router/         | 2          | 不足（componentMap 仅 1 个契约测试，dynamicRoutes 仅 2 个集成测试）             |
| api/            | 1          | 严重不足（15 个 API 方法仅测 1 个）                                             |

---

## 3. 已确认问题

### 问题 1：`auth.test.ts` 仅覆盖 refreshUserInfo，核心 actions 完全未测

- **严重等级**：High
- **文件**：`src/stores/auth.test.ts`
- **代码位置**：全文（仅 3 个测试用例）
- **问题描述**：auth store 是整个应用认证体系的核心（300 行源码），但测试仅覆盖 `refreshUserInfo` 的 3 个场景。以下关键路径完全未测：
    - `loginWithCredentials`：登录流程（resetAuthStore → submitLogin → updateToken → refreshUserInfo）
    - `logout`：退出清理（resetAuthStore + router.push）
    - `handleTokenExpired`：token 过期弹窗和回调
    - `updateToken`：单调递增校验（exp > expires_at）
    - `resetAuthStore`：完整重置逻辑
    - 所有 computed getters：isTokenExpired、token、refreshToken、routerData、firstPath、buttonPermissions、shouldShowButton
- **触发条件**：任何登录/退出/权限相关的代码变更
- **影响范围**：认证体系无测试保护，重构或修复 bug 时容易引入回归
- **修复建议**：补充 loginWithCredentials 成功/失败、logout 清理完整性、handleTokenExpired 弹窗确认、updateToken 单调递增、所有 computed getters 的测试。

---

### 问题 2：`useFileUpload.test.ts` 仅 1 个用例，750 行源码几乎无保护

- **严重等级**：High
- **文件**：`src/composables/useFileUpload.test.ts`
- **代码位置**：全文（仅 1 个测试用例）
- **问题描述**：useFileUpload 是文件上传的核心 composable（750+ 行），但测试仅覆盖 `runDirectBatchUpload` 的 complete 漏项场景。以下关键路径全部未测：
    - `uploadOneTask`：单文件上传完整生命周期
    - 文件大小超限拒绝逻辑
    - `runLocalBatchUpload`：本地存储批量上传
    - `uploadMultipart`：分片上传（init → 并发 PUT → complete）
    - 分片上传失败时的 abort 重试
    - `reuse` 路径（credential.reuse=true）
    - `clearTasks`、`uploading`、`uploadFinished` 等状态
- **触发条件**：任何文件上传相关的代码变更
- **影响范围**：文件上传功能无测试保护，第 3 轮发现的多个 bug（lastUploadOptions 覆盖、clearTasks 不取消上传等）缺乏回归测试
- **修复建议**：按优先级补充：uploadOneTask 成功/失败、文件大小校验、分片上传、本地批量上传、reuse 路径。

---

### 问题 3：`permission.test.ts` 仅测 1 个 API 的缓存，14 个方法完全未测

- **严重等级**：High
- **文件**：`src/api/permission.test.ts`
- **代码位置**：全文（仅 1 个测试用例）
- **问题描述**：permission.ts 包含 15 个 API 方法，但测试仅验证了 `getMenuList` 的缓存 locale 区分。以下关键路径未测：
    - `createMenu`/`updateMenu`/`deleteMenu` 的缓存失效（`deleteByPrefix`）
    - `getRoleList` 的缓存逻辑
    - `getRoleOptions`/`getApiOptions` 的 ResultResponse 转换
    - pending 去重（并发请求复用）
    - 错误处理（catch + deletePending + throw）
- **触发条件**：权限管理相关的 API 变更
- **影响范围**：权限 API 的缓存一致性和错误处理无保护
- **修复建议**：补充 createMenu/updateMenu/deleteMenu 的缓存失效测试、pending 去重测试、错误回滚测试。

---

### 问题 4：`v-permission` 指令 125 行完全无测试

- **严重等级**：High
- **文件**：`src/directives/permission.ts`（无对应测试文件）
- **问题描述**：`v-permission` 是全局按钮权限控制指令（125 行），包含 mounted/updated/unmounted 生命周期处理、hide/disable/remove 三种模式、or 逻辑、click 拦截等复杂逻辑，但完全没有测试文件。
- **触发条件**：任何权限指令相关的代码变更
- **影响范围**：按钮级权限控制无测试保护
- **修复建议**：新建 `src/directives/permission.test.ts`，覆盖：有权限时正常显示、无权限+.hide 时 display:none、无权限+.remove 时从 DOM 移除、无权限+.disabled 时禁用、.once 修饰符、value 为空时恢复。

---

### 问题 5：`setup.ts` 过于简陋，各测试文件重复 mock 基础 API

- **严重等级**：Medium
- **文件**：`src/test/setup.ts`
- **代码位置**：全文（仅 3 行）
- **问题描述**：setup.ts 仅执行 `vi.clearAllMocks()`，缺少全局 polyfill 和清理。导致：
    - 各测试文件重复 mock `localStorage`（auth.test.ts、useDictOptions.test.ts 等）
    - 缺少 `IntersectionObserver`、`ResizeObserver`、`matchMedia` 的全局 mock
    - 未清理 DOM（`document.body.innerHTML = ''`）
    - 缺少 `requestAnimationFrame` polyfill
- **触发条件**：所有测试运行
- **影响范围**：测试基础设施不完善，增加维护成本
- **修复建议**：在 setup.ts 中添加全局 mock（IntersectionObserver、ResizeObserver、matchMedia、localStorage）、DOM 清理、requestAnimationFrame polyfill。

---

### 问题 6：组件测试覆盖率低（3/15 组件，20%），且每个仅 1-2 个用例

- **严重等级**：Medium
- **文件**：`src/components/` 目录
- **问题描述**：15 个组件中仅 3 个有测试，且每个测试仅 1-2 个用例：
    - `actionButton`：仅测 text prop 优先级，未测点击事件、权限检查、disabled 状态
    - `actionButtons`：仅测权限状态变化时文案更新，未测下拉菜单交互、多按钮渲染
    - `avatarUpload`：仅测文件类型/大小校验，未测上传成功/失败回调
- **未测试的关键组件**：proTable、tableList、pagination、filePicker、drawer、errorBoundary、breadcrumb
- **触发条件**：组件逻辑变更
- **影响范围**：组件行为无测试保护
- **修复建议**：优先补充 pagination（高可测性）、proTable（核心组件）、filePicker（复杂交互）的测试。

---

### 问题 7：`dynamicRoutes.test.ts` 缺少核心过滤和管理逻辑测试

- **严重等级**：Medium
- **文件**：`src/router/dynamicRoutes.test.ts`
- **代码位置**：全文（仅 2 个测试用例）
- **问题描述**：dynamicRoutes.ts 包含路由转换的核心逻辑（186 行），但测试仅覆盖嵌套路由转换和 findFirstValidRoute。以下关键路径未测：
    - `isButtonRouteNode` 过滤（type=3 / type='button'）
    - 路由名称/路径重复去重（seenNames/seenPaths）
    - 空目录过滤（无 component 且无有效子路由）
    - `addDynamicRoutes` / `removeDynamicRoute`
    - `validateRouteComponents`（开发模式校验）
    - redirect 的 path 形式 vs name 形式
- **触发条件**：动态路由相关的代码变更
- **影响范围**：路由过滤和管理逻辑无保护
- **修复建议**：补充按钮节点过滤、去重、空目录过滤、add/remove 路由的测试。

---

### 问题 8：`request.test.ts` 缺少安全和特殊场景测试

- **严重等级**：Medium
- **文件**：`src/utils/request.test.ts`
- **代码位置**：已有 22 个用例但有盲区
- **问题描述**：request.test.ts 是覆盖率最高的测试文件，但以下关键路径未测：
    - `_skipAuth` 标记跳过 token 注入
    - `silent` / `silentCodes` 错误消息抑制
    - `SILENT_BUSINESS_CODES`（11011）静默业务码
    - `upload` 多文件上传（`Array.isArray(files)` 分支）
    - Blob 响应非 JSON content-type 直接返回
- **触发条件**：请求封装相关的代码变更
- **影响范围**：安全和特殊场景无保护
- **修复建议**：补充 \_skipAuth、silent/silentCodes、upload 多文件、Blob 非 JSON 的测试。

---

## 4. 疑似问题

### 疑似 1：`componentMap.test.ts` 与源码不同步

- **文件**：`src/router/componentMap.test.ts`
- **描述**：测试列表包含 19 个 key，但源码 `componentMap.ts` 中还有 `profile`（第 18 行）未在测试列表中。说明测试维护滞后于源码变更。**需要确认**：`profile` key 是否应加入测试列表。

### 疑似 2：覆盖率阈值（60%/50%）可能过低

- **文件**：`vitest.config.ts`
- **描述**：当前覆盖率阈值为 statements/functions/lines=60%、branches=50%。考虑到 22 个测试文件仅覆盖约 22 个源文件，而项目有 100+ 源文件，实际覆盖率可能远低于阈值。**需要确认**：`pnpm test:coverage` 的实际输出。

### 疑似 3：`useDictOptions.test.ts` 第 109 行断言意图不清晰

- **文件**：`src/composables/useDictOptions.test.ts`
- **描述**：测试描述为"不同 locale 分别缓存"，但断言 `zhDict.options.value` 等于 `enOptions`（而非 zhOptions）。这是因为 locale 切换后 watch 触发重新 load 导致 zhDict 也被更新为 enOptions。测试通过但断言意图容易误导。**需要确认**：这是否是有意设计。

---

## 5. 建议优先修复顺序

### P0 — 立即补充

1. **auth store 核心 actions 测试**（问题 1）：loginWithCredentials、logout、handleTokenExpired、updateToken、resetAuthStore
2. **useFileUpload 核心路径测试**（问题 2）：uploadOneTask、分片上传、文件大小校验
3. **v-permission 指令测试**（问题 4）：新建测试文件覆盖三种模式

### P1 — 尽快补充

4. **permission API 缓存失效测试**（问题 3）：createMenu/updateMenu/deleteMenu 的 deleteByPrefix
5. **dynamicRoutes 过滤和管理测试**（问题 7）：按钮过滤、去重、add/remove
6. **setup.ts 增强**（问题 5）：全局 mock 和 DOM 清理

### P2 — 计划补充

7. **request.test.ts 安全场景**（问题 8）：\_skipAuth、silent/silentCodes
8. **组件测试**（问题 6）：pagination、proTable、filePicker
9. **其他未覆盖模块**：router/guard、stores/setting、utils/env、utils/routeTitle

---

## 6. 建议补充测试场景

### auth store（最高优先级）

| 测试场景                  | 验证点                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- |
| loginWithCredentials 成功 | resetAuthStore 被调用、updateToken 被调用、refreshUserInfo({force:true}) 被调用 |
| loginWithCredentials 失败 | resetAuthStore 被调用、错误被 re-throw                                          |
| logout                    | resetAuthStore 被调用、router.push 到 Login 页                                  |
| handleTokenExpired 确认   | isTokenExpiredModalShown 防重入、ElMessageBox 弹出、确认后 logout               |
| handleTokenExpired 取消   | isTokenExpiredModalShown 被重置为 false                                         |
| updateToken 单调递增      | exp > expires_at 时更新、exp <= expires_at 时不更新                             |
| updateToken refresh_token | newRefreshToken 被写入 localStorage                                             |
| resetAuthStore 完整性     | 所有 state 被清空、localStorage 被清理、动态路由被移除                          |
| token getter 过期         | expires_at < now 时返回空字符串                                                 |
| refreshToken getter 过期  | refresh_expires_at < now 时返回空字符串                                         |
| buttonPermissions         | 从 menu 中提取 type=3 的 code 列表                                              |
| shouldShowButton          | code 存在且 is_show=true 时返回 true                                            |

### useFileUpload（最高优先级）

| 测试场景                     | 验证点                                       |
| ---------------------------- | -------------------------------------------- |
| uploadOneTask 成功           | task.status 变为 success、file 被释放        |
| uploadOneTask 文件超限       | task.status 变为 error、error 消息正确       |
| uploadOneTask reuse          | credential.reuse=true 时跳过上传             |
| runLocalBatchUpload 成功     | 所有 task 标记 success                       |
| runLocalBatchUpload 部分失败 | 失败 task 标记 error、成功 task 标记 success |
| uploadMultipart 成功         | 分片 init → PUT → complete 流程              |
| uploadMultipart 失败 abort   | abortMultipartUpload 被调用                  |
| clearTasks                   | uploadTasks 被清空                           |
| uploading computed           | 有 uploading 状态的 task 时返回 true         |

### v-permission 指令（最高优先级）

| 测试场景         | 验证点                              |
| ---------------- | ----------------------------------- |
| 有权限时正常显示 | 元素可见、可交互                    |
| 无权限+.hide     | display: none                       |
| 无权限+.disabled | pointer-events 被修改、click 被拦截 |
| 无权限+.remove   | 元素从 DOM 移除                     |
| value 为空       | 元素恢复原始状态                    |
| .once 修饰符     | updated 钩子不重新检查              |
| arg='or'         | 数组中任一权限满足即可              |

---

## 7. 下一轮建议

### 建议 1：性能优化专项审查

**原因**：前几轮发现的性能问题（fetchStorageConfig 每文件调用、SHA256 串行计算、debounce 缺失、revealMap 无界增长、isEmpty 将 0 视为空值等）需要系统性审查。同时关注：路由懒加载是否完整、组件是否有不必要的重渲染、大数据量列表的虚拟滚动、图片懒加载、ECharts 实例的正确销毁。

### 建议 2：无障碍（Accessibility）与 i18n 收尾

**原因**：第 4 轮发现 2 个整页未做 i18n 的页面（monitor、product）和 5 个部分硬编码中文的页面。需完成 i18n 收尾工作，同时审查 ARIA 属性、键盘导航、屏幕阅读器兼容性、focus 管理等无障碍需求。

### 建议 3：代码一致性与架构规范审查

**原因**：多轮审查发现的架构层面问题（分页 emit+函数 prop 双重触发、pagination prop 携带函数引用、normalizeFolderId 两处实现不一致、日期格式化函数重复实现、isEmpty 语义不一致等）需要系统性审查代码一致性，制定统一规范。
