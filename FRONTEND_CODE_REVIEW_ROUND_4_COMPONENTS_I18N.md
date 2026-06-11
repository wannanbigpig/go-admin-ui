# 第 4 轮前端专项 Code Review：通用组件、列表页模式与 i18n 完整性

---

## 1. 本轮审查范围

**通用组件**

- `src/components/proTable/index.vue`
- `src/components/tableList/index.vue`
- `src/components/pagination/index.vue`
- `src/components/actionButton/index.vue`
- `src/components/actionButtons/index.vue`
- `src/components/breadcrumb/index.vue`
- `src/components/errorBoundary/index.vue`
- `src/components/DeptTreeSelect.vue`
- `src/components/filePicker/index.vue`（已在第 3 轮审查，本轮仅复核）

**组合式函数**

- `src/composables/useListPage.ts`
- `src/composables/useDictOptions.ts`
- `src/composables/useSubmitLock.ts`
- `src/composables/useClipboard.ts`
- `src/composables/useIntervalPolling.ts`
- `src/modules/shared/pagination.ts`

**列表页**

- `src/views/permission/adminUser/index.vue`
- `src/views/permission/role/index.vue`
- `src/views/permission/department/index.vue`
- `src/views/permission/menuList/index.vue`
- `src/views/permission/api/index.vue`
- `src/views/permission/components/MenuEditDrawer.vue`
- `src/views/log/adminLogin/index.vue`
- `src/views/log/request/index.vue`
- `src/views/log/session/index.vue`
- `src/views/system/config/index.vue`
- `src/views/system/dict/index.vue`
- `src/views/system/notificationManage/index.vue`
- `src/views/system/task/index.vue`
- `src/views/home/index.vue`

**i18n**

- `src/locales/index.ts`
- `src/locales/zh-CN/` 全部 13 个子模块
- `src/locales/en-US/` 全部 13 个子模块
- `src/utils/routeTitle.ts`
- `src/modules/shared/i18n.ts`
- `src/modules/role/model.ts`
- `src/views/system/monitor/index.vue`
- `src/views/business/product/index.vue`
- `src/views/system/notification/index.vue`

---

## 2. 调用链说明

### 列表页标准模式

```
useListPage({ fetcher, query, queryFormRef })
  → runFetch()：requestVersion 竞态控制、首次 350ms 延迟
  → pagination = createPaginationState(runFetch)：含 pageSizeChange/pageChange 回调
  → handleSearch()：重置 page=1 → runFetch()
  → handleReset()：resetFields + JSON 深拷贝恢复初始值 → handleSearch()

页面使用：
  <xl-pro-table :pagination="pagination" @search="onSearch" @reset="handleReset">
    → xl-table-list 内部：emit('size-change') + pagination.pageSizeChange()
    → xl-pro-table 透传 emit 到父组件
```

### 分页事件流

```
el-pagination @size-change
  → pagination/index.vue handleSizeChange()
    → emit('size-change') + props.pageSizeChange?.()
  → tableList/index.vue handlePageSizeChange()
    → emit('size-change') + props.pagination?.pageSizeChange?.()
  → proTable/index.vue 模板 @size-change
    → emit('size-change') 到父组件
```

### i18n 架构

```
main.ts → use(i18n) → createI18n({ legacy: false, globalInjection: false })
App.vue → <el-config-provider :locale="elementLocale">
组件内 → useI18n() → t('key') 或 translate('key')（非组件场景）
路由标题 → resolveRouteTitle({ titleKey }) → i18n.t(titleKey)
后端字段 → mergeI18nField(field, field_i18n)
```

---

## 3. 已确认问题

### 问题 1：分页组件 emit + 函数 props 双重触发可能导致重复请求

- **严重等级**：High
- **文件**：`src/components/pagination/index.vue`、`src/components/tableList/index.vue`、`src/modules/shared/pagination.ts`
- **代码位置**：pagination/index.vue 第 63-70 行、tableList/index.vue 第 159-167 行、pagination.ts 第 22-28 行
- **问题描述**：`createPaginationState` 创建的 `pageSizeChange` 回调会直接调用 `runFetch()`。`tableList` 收到分页事件后同时执行 `emit('size-change')` 和 `props.pagination.pageSizeChange(size)`。`proTable` 透传 `emit('size-change')` 到父组件。如果父组件同时监听了 `@size-change` 事件并在 handler 中调用 `getList()`，同一分页操作会触发两次 `runFetch()`。
- **触发条件**：父组件同时使用 `pagination.pageSizeChange` 回调（通过 `useListPage`）和监听 `@size-change` 事件
- **影响范围**：所有使用 ProTable + useListPage 的列表页
- **证据**：

    ```typescript
    // pagination.ts 第 22-28 行 — pageSizeChange 直接调用 fetcher
    pageSizeChange: (value: number) => {
        pagination.pageSize = value
        pagination.page = 1
        fetcher() // ← 直接调用 runFetch()
    }

    // tableList/index.vue 第 159-162 行 — 同时 emit 和调用函数 prop
    const handlePageSizeChange = (size: number) => {
        emit('size-change', size) // ← emit 到 proTable
        props.pagination?.pageSizeChange?.(size) // ← 直接调用 runFetch()
    }

    // pagination/index.vue 第 63-70 行 — 也同时 emit 和调用函数 prop
    const handleSizeChange = (size: number) => {
        emit('size-change', size)
        emit('update:pageSize', size)
        if (props.pageSizeChange) {
            props.pageSizeChange(size) // ← 第三条路径
        }
    }
    ```

- **修复建议**：统一事件传播机制。`tableList` 应只通过函数 prop 或只通过 emit 通知分页变化，不要两者兼用。推荐只保留函数 prop 路径（因为 `useListPage` 已通过 `createPaginationState` 封装了回调），移除 `tableList` 中的 `emit('size-change')` 和 `emit('current-change')`。

---

### 问题 2：ProTable `handleReset` 依赖 `resetFields` 但 `localModel` 可能不被正确恢复

- **严重等级**：Medium
- **文件**：`src/components/proTable/index.vue`
- **代码位置**：第 322-325 行
- **问题描述**：`handleReset` 调用 `searchFormRef.value?.resetFields()` 后 emit `reset`。但 `resetFields` 只能恢复到 el-form 首次渲染时 model 的快照值。如果父组件在 `reset` handler 中没有正确清空 `searchModel`，`localModel` 会在下一个 tick 通过 watcher 重新同步到残留值。
- **触发条件**：父组件监听 `@reset` 事件但未清空 `searchModel`
- **影响范围**：搜索表单重置后残留旧值
- **证据**：
    ```typescript
    // 第 322-325 行
    const handleReset = () => {
        searchFormRef.value?.resetFields() // 只能恢复到初始快照
        emit('reset') // 依赖父组件正确处理
    }
    ```
- **修复建议**：`handleReset` 中在 `resetFields` 之后显式清空 `localModel` 的所有字段为默认值（空字符串/空数组），不完全依赖父组件。

---

### 问题 3：`Object.assign(queryWhere, model)` 搜索参数合并导致旧参数残留

- **严重等级**：Medium
- **文件**：`src/views/permission/adminUser/index.vue`、`src/views/permission/role/index.vue`、`src/views/permission/api/index.vue`
- **代码位置**：adminUser/index.vue 第 172-175 行
- **问题描述**：`Object.assign(queryWhere, model)` 将搜索模型合并到查询对象中，但不会清除上一次搜索中存在而本次搜索中不存在的参数。例如先按 `username: "admin"` 搜索，再清除 username 仅按 `status: 1` 搜索，`queryWhere` 会变成 `{username: "admin", status: 1}`。
- **触发条件**：用户先使用某个搜索条件搜索，清除该条件后使用其他条件搜索
- **影响范围**：搜索结果不准确，旧参数影响后端过滤
- **证据**：
    ```typescript
    // adminUser/index.vue 第 172-175 行
    const onSearch = (model: Record<string, unknown>) => {
        Object.assign(queryWhere, model) // ← 不清除旧参数
        handleSearch()
    }
    ```
- **修复建议**：搜索前先重置 `queryWhere` 到默认值，再合并新参数：`Object.assign(queryWhere, defaultQuery, model)`。或使用 `useListPage` 的 `handleSearch` 直接接收参数。

---

### 问题 4：`useSubmitLock` 任务失败后仍强制等待最短锁定时间

- **严重等级**：Medium
- **文件**：`src/composables/useSubmitLock.ts`
- **代码位置**：第 15-31 行
- **问题描述**：无论 task 成功还是失败，`finally` 块都会等待 `remaining = duration - elapsed` 毫秒后才释放锁。task 在 100ms 内失败时，用户必须再等待 2900ms 才能重试。
- **触发条件**：表单提交快速失败（网络错误、400/401 等）
- **影响范围**：所有使用 `useSubmitLock` 的表单提交场景
- **证据**：
    ```typescript
    // 第 21-29 行
    try {
        return await task()
    } finally {
        const elapsed = Date.now() - startTime
        const remaining = duration - elapsed
        if (remaining > 0) {
            await sleep(remaining) // ← 失败也等待
        }
        isSubmitting.value = false
    }
    ```
- **修复建议**：将等待逻辑移到 `try` 块的成功路径中，或在 `catch` 中跳过等待。失败时应立即释放锁，允许用户重试。

---

### 问题 5：系统监控页面完全未做 i18n（40+ 处硬编码中文）

- **严重等级**：High
- **文件**：`src/views/system/monitor/index.vue`
- **代码位置**：全文（第 10、22、35、51、56、64、72、88、91-98、105、108-112、123、129、135、141、147、153、233-236 行）
- **问题描述**：整个监控页面完全没有引入 `useI18n` 或 `translate`，所有文本（"核心"、"内存"、"磁盘"、"系统负载"、"Go 运行时"、"主机信息"、"应用状态"等 40+ 处）均为硬编码中文。
- **触发条件**：英文环境下访问监控页面
- **影响范围**：英文用户看到整页中文
- **修复建议**：在 `src/locales/zh-CN/system.ts` 和 `src/locales/en-US/system.ts` 中添加 `monitor` 命名空间，将所有硬编码字符串提取为 i18n key。

---

### 问题 6：产品管理页面完全未做 i18n（30+ 处硬编码中文）

- **严重等级**：High
- **文件**：`src/views/business/product/index.vue`
- **代码位置**：全文（第 5、8、10、11、18、20-36、40、41、102、108-113、176、179、193、197 行）
- **问题描述**：整个产品管理页面完全没有引入 `useI18n` 或 `translate`，所有按钮文本、表单标签、确认消息、操作结果消息均为硬编码中文。
- **触发条件**：英文环境下访问产品管理页面
- **影响范围**：英文用户看到整页中文
- **修复建议**：在翻译文件中添加 `product` 命名空间，提取所有硬编码字符串。

---

### 问题 7：角色管理页面"数据权限"和"自定义部门"表单项硬编码中文

- **严重等级**：Medium
- **文件**：`src/views/permission/role/index.vue`、`src/modules/role/model.ts`
- **代码位置**：role/index.vue 第 44-50 行、role/model.ts 第 53-58 行
- **问题描述**：`label="数据权限"`、`placeholder="请选择数据权限"`、`label="自定义部门"`、`placeholder="请选择部门"` 均为硬编码中文。`DATA_SCOPE_OPTIONS` 的 5 个 label（"全部数据"、"本部门及子级"等）也全部硬编码中文。
- **触发条件**：英文环境下访问角色管理页面
- **影响范围**：英文用户看到部分中文表单项和下拉选项
- **证据**：
    ```typescript
    // role/model.ts 第 53-58 行
    export const DATA_SCOPE_OPTIONS = [
        { value: 1, label: '全部数据' },
        { value: 2, label: '本部门及子级' },
        { value: 3, label: '本部门' },
        { value: 4, label: '仅本人' },
        { value: 5, label: '自定义部门' },
    ]
    ```
- **修复建议**：`DATA_SCOPE_OPTIONS` 的 label 改为 i18n key，在组件内通过 `t()` 翻译。表单项的 label/placeholder 改为 `:label="t('permission.role.dataScope')"` 等。

---

### 问题 8：管理员页面超级管理员警告硬编码中文

- **严重等级**：Medium
- **文件**：`src/views/permission/adminUser/index.vue`
- **代码位置**：第 110 行
- **问题描述**：`title="警告：超级管理员将拥有系统全部权限，请谨慎授权！"` 为硬编码中文。
- **触发条件**：英文环境下查看超级管理员详情
- **影响范围**：英文用户看到中文警告
- **修复建议**：改为 `:title="t('permission.adminUser.superAdminWarning')"`。

---

### 问题 9：通知页面相对时间格式化硬编码中文

- **严重等级**：Medium
- **文件**：`src/views/system/notification/index.vue`
- **代码位置**：第 262-267 行
- **问题描述**：`formatTimeAgo` 函数中的 "刚刚"、"分钟前"、"小时前"、"天前"、"月...日" 均为硬编码中文。
- **触发条件**：英文环境下查看通知列表
- **影响范围**：英文用户看到中文时间格式
- **证据**：
    ```typescript
    // 第 262-267 行
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 30) return `${diffDays}天前`
    return `${month}月${day}日`
    ```
- **修复建议**：使用 i18n key + 参数插值：`t('system.notification.timeAgo.justNow')`、`t('system.notification.timeAgo.minutesAgo', { count: diffMins })` 等。

---

### 问题 10：`avatarUpload` 组件引用不存在的 i18n key

- **严重等级**：Medium
- **文件**：`src/components/avatarUpload/index.vue`
- **代码位置**：第 42、47 行
- **问题描述**：`t('common.messages.invalidImageType')` 和 `t('common.messages.imageTooLarge', { size })` 引用的 key 在翻译文件中不存在（`common.messages` 命名空间不存在）。实际显示的是 `||` 后的 fallback 英文字符串。
- **触发条件**：上传头像时文件类型或大小校验失败
- **影响范围**：中英文环境均显示英文 fallback，而非中文翻译
- **修复建议**：在 `common.ts` 翻译文件中添加 `messages` 命名空间，或将 key 改为已存在的命名空间。

---

## 4. 疑似问题

### 疑似 1：`useListPage` 首次加载 350ms 延迟期间竞态导致 loading 卡住

- **文件**：`src/composables/useListPage.ts` 第 92-136 行
- **描述**：首次加载时 `setTimeout(350)` 延迟请求。如果延迟期间 `requestVersion` 变化（用户快速切换 tab），旧请求被丢弃但 `loading` 在 `finally` 中不被重置（因为 `currentVersion !== requestVersion`）。新请求会重新设 `loading=true`，所以最终 loading 会被新请求的 finally 重置。但在新旧请求交替的短暂窗口内，loading 可能短暂卡在 true。**需要确认**：实际使用中是否有可感知的 loading 卡顿。

### 疑似 2：`proTable` 的 `revealMap` 随数据增长无界扩展

- **文件**：`src/components/proTable/index.vue` 第 217-221 行
- **描述**：`revealMap` 是 reactive 对象，每次 `toggleReveal` 添加新 key，数据刷新时不清理旧 key。普通业务页面影响微乎其微，但如果单页数据量极大且频繁刷新，会持续占用内存。**需要确认**：实际使用中数据量级。

### 疑似 3：`useDictOptions` 缓存的 Promise 引用可能阻止 GC

- **文件**：`src/composables/useDictOptions.ts` 第 128 行
- **描述**：`requestCachedDictOptions` 将 `{ request }` 对象（持有 Promise 引用）存入模块级 Map。Promise resolve 后 entry 被替换为结果数据，旧 Promise 引用可被 GC。但如果有大量并发请求且 TTL 未过期，Map 中的 Promise 引用会暂时阻止相关对象 GC。**需要确认**：实际并发量。

---

## 5. 建议优先修复顺序

### P0 — 立即修复

1. **分页双重触发**（问题 1）：统一事件传播机制，避免 `runFetch()` 被调用两次

### P1 — 尽快修复

2. **监控页面未做 i18n**（问题 5）：40+ 处硬编码中文
3. **产品管理页面未做 i18n**（问题 6）：30+ 处硬编码中文
4. **`Object.assign` 搜索参数残留**（问题 3）：影响搜索准确性
5. **`useSubmitLock` 失败后等待**（问题 4）：影响用户体验
6. **ProTable 重置不完整**（问题 2）：搜索表单可能残留旧值

### P2 — 计划修复

7. **角色管理页面硬编码中文**（问题 7）
8. **管理员警告硬编码中文**（问题 8）
9. **通知时间格式硬编码中文**（问题 9）
10. **avatarUpload 不存在的 i18n key**（问题 10）

---

## 6. 建议补充测试

| 测试场景                                     | 对应问题 | 测试文件建议                                   |
| -------------------------------------------- | -------- | ---------------------------------------------- |
| ProTable 分页切换时 `runFetch` 只被调用一次  | 问题 1   | `src/components/proTable/index.test.ts`        |
| ProTable 重置后 localModel 所有字段为空      | 问题 2   | `src/components/proTable/index.test.ts`        |
| 搜索后清除条件再搜索，旧参数不残留           | 问题 3   | `src/views/permission/adminUser/index.test.ts` |
| `useSubmitLock` task 失败后立即可重试        | 问题 4   | `src/composables/useSubmitLock.test.ts`        |
| 切换英文 locale 后监控页面文本全部为英文     | 问题 5   | 手动测试                                       |
| 切换英文 locale 后产品页面文本全部为英文     | 问题 6   | 手动测试                                       |
| 切换英文 locale 后角色页面数据权限选项为英文 | 问题 7   | 手动测试                                       |
| 上传头像时文件类型错误显示正确语言的提示     | 问题 10  | `src/components/avatarUpload/index.test.ts`    |

---

## 7. 下一轮建议

### 建议 1：通知 WebSocket 与实时通信安全

**原因**：`src/stores/notification.ts` 涉及 WebSocket ticket 认证、断线重连退避、频道订阅、会话强踢。`.aitasks/todo.md` 中有待补充的心跳保活机制。ticket 通过 URL query 传输的安全性需专项审查。第 2 轮已初步审查但未深入 WebSocket 连接生命周期和频道消息分发的安全性。

### 建议 2：Layout 系统与全局状态管理

**原因**：`src/layout/` 包含侧边栏菜单渲染、头部导航、通知中心、水印、主题切换。`src/stores/setting.ts` 管理全局设置。需审查菜单渲染的权限过滤是否完整、主题/语言切换的状态同步、水印功能的安全性。

### 建议 3：构建配置与部署安全

**原因**：`vite.config.js` 的 manualChunks 策略、Gzip 压缩、ESLint 配置、环境变量处理、Nginx 配置（`nginx.conf.final`）都需审查。特别关注：生产构建是否正确移除了 console/debugger、环境变量是否被意外暴露到客户端代码、CSP 策略是否合理。
