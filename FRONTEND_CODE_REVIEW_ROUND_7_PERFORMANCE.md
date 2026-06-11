# 第 7 轮前端专项 Code Review：性能优化

---

## 1. 本轮审查范围

**懒加载与代码分割**

- `src/router/componentMap.ts`、`src/router/constantRoutes.ts`
- `src/locales/index.ts`
- `src/views/home/index.vue`（ECharts）
- `src/mock/index.ts`
- `vite.config.js`（manualChunks）

**重渲染与内存管理**

- `src/components/proTable/index.vue`（搜索模型同步）
- `src/views/system/components/FileGrid.vue`（选择查找）
- `src/layout/header/notificationCenter.vue`（DOM 操作、watch）
- `src/views/system/file/index.vue`（滚动加载、数据拼接）
- `src/stores/notification.ts`（WebSocket、定时器）
- `src/composables/useIntervalPolling.ts`（轮询清理）
- `src/directives/permission.ts`（事件监听清理）
- `src/views/login/index.vue`（动画清理）
- `src/views/home/index.vue`（ECharts 清理）
- `src/utils/apiCache.ts`（缓存管理）

**网络请求与缓存**

- `src/utils/request.ts`（请求封装）
- `src/composables/useDictOptions.ts`（字典缓存）
- `src/composables/useFileUpload.ts`（上传并发）
- `src/modules/system/service.ts`（存储配置缓存）
- `src/modules/shared/pagination.ts`

---

## 2. 调用链说明

### 文件上传请求链路

```
runUploadQueue(tasks, options)
  → fetchStorageConfig()          ← 第 1 次请求
  → 文件大小校验
  → runLocalBatchUpload() 或 runDirectBatchUpload() 或 fallback
    → uploadOneTask(task, options)
      → fetchStorageConfig()      ← 第 2+ 次请求（重复！）
      → SHA256 哈希
      → 判断存储驱动
      → 上传
```

### 懒加载链路

```
main.ts（同步）
  → App.vue（同步）
    → Layout（同步，根布局必须）
      → sidebar/header/main（同步，Layout 子组件）
    → 路由守卫 → 动态路由注册
      → componentMap → () => import('views/xxx/index.vue')（懒加载）
        → 页面组件内部 → 按需导入 ECharts/Element Plus 等
```

### 缓存链路

```
useDictOptions.load()
  → dictOptionsCache.get()        ← 内存缓存（30 分钟 TTL）
  → localStorage.getItem()        ← localStorage 缓存（30 分钟 TTL）
  → fetchDictOptions()            ← 网络请求（带 pending dedup）
  → 写入 dictOptionsCache + localStorage

apiCache.get(key)
  → 命中？→ LRU 刷新 + 返回
  → 过期？→ 删除 + 返回 null
  → apiCache.getPending(key)      ← 请求去重
  → 网络请求
  → apiCache.set(key, data) + apiCache.setPending(key, promise)
```

---

## 3. 已确认问题

### 问题 1：`fetchStorageConfig` 在上传流程中重复调用

- **严重等级**：Medium
- **文件**：`src/composables/useFileUpload.ts`
- **代码位置**：第 181 行（uploadOneTask）、第 535 行（runUploadQueue）
- **问题描述**：`runUploadQueue` 开头调用 `fetchStorageConfig()` 做文件大小校验，随后调用 `uploadOneTask`，`uploadOneTask` 内部再次调用 `fetchStorageConfig()`。批量上传 10 个文件时，如果 fallback 到逐个上传，最多发出 11 次相同请求。`fetchStorageConfig` 本身无缓存。
- **触发条件**：任何批量文件上传
- **影响范围**：上传前的网络开销
- **证据**：

    ```typescript
    // useFileUpload.ts 第 535 行
    const runUploadQueue = async (...) => {
        const storageConfig = await fetchStorageConfig()  // ← 第 1 次
        // ...
        await uploadOneTask(task, options)
    }

    // useFileUpload.ts 第 181 行
    const uploadOneTask = async (...) => {
        const storageConfig = await fetchStorageConfig()  // ← 第 2+ 次
    }
    ```

- **修复建议**：将 `fetchStorageConfig` 的调用提升到 `runUploadQueue` 层，结果通过 `options` 传递给 `uploadOneTask`。或为 `fetchStorageConfig` 添加内存缓存（类似 `cachedSystemFileUploadDriver`）。

---

### 问题 2：i18n 双语包同步全量加载

- **严重等级**：Medium
- **文件**：`src/locales/index.ts`
- **代码位置**：第 10-13 行
- **问题描述**：`zh-CN` 和 `en-US` 两套语言包通过同步 `import` 全部导入（合计约 109KB 源码），即使用户只使用其中一种。Vite/Rollup 对纯数据对象的 tree-shake 效果有限，翻译字符串几乎会完整保留在最终产物中。
- **触发条件**：应用初始化
- **影响范围**：初始 bundle 大小（约多 50KB）
- **证据**：

    ```typescript
    // locales/index.ts 第 10-13 行
    import zhCN from './zh-CN' // ← 同步导入
    import enUS from './en-US' // ← 同步导入

    export const localeMessages = {
        'zh-CN': zhCN,
        'en-US': enUS,
    }
    ```

- **修复建议**：改为按需动态加载语言包。`createI18n` 时只传入当前语言包，切换语言时通过 `i18n.global.setLocaleMessage()` 动态加载另一种。

---

### 问题 3：proTable 双向 watch 每次创建新对象导致不必要的 diff 计算

- **严重等级**：Medium
- **文件**：`src/components/proTable/index.vue`
- **代码位置**：第 263 行、第 281 行
- **问题描述**：两个 watch 的 source 都使用浅拷贝 `{ ...searchModel }` / `{ ...localModel }` 创建新对象。即使值未变化，新引用也会触发 watch 回调，然后通过 `isModelValueEqual` 做完整 diff 遍历来判断是否有实际变化。每次双向同步都执行完整遍历。
- **触发条件**：任何搜索字段变化
- **影响范围**：搜索交互的响应速度
- **证据**：
    ```typescript
    // 第 263 行 — 每次触发都创建新对象
    watch(
        () => (props.searchModel ? { ...props.searchModel } : null),
        // ...
    )
    // 第 281 行 — 同理
    watch(
        (): ({ ...localModel }),
        // ...
    )
    ```
- **修复建议**：使用版本号 counter 或 `JSON.stringify` 作为 watch source，避免每次都创建新对象。或改用 `watchEffect` 简化双向同步逻辑。

---

### 问题 4：FileGrid 中 `isFileSelected` 使用 O(n) 线性查找

- **严重等级**：Medium
- **文件**：`src/views/system/components/FileGrid.vue`
- **代码位置**：第 170-172 行
- **问题描述**：在 `v-for` 循环中，每个文件项的渲染都会调用 `isFileSelected`，对 `selectedFiles` 数组做 `some()` 线性查找。当选中文件较多且文件列表也较大时，这是 O(n×m) 复杂度。
- **触发条件**：文件列表较大且有选中项
- **影响范围**：网格视图渲染性能
- **证据**：
    ```typescript
    // 第 170-172 行
    const isFileSelected = (file: SystemFile) => {
        return props.selectedFiles.some((f) => f.id === file.id) // ← O(n)
    }
    ```
- **修复建议**：用 `computed` 构建 `Set<id>` 做 O(1) 查找：
    ```typescript
    const selectedFileIds = computed(() => new Set(props.selectedFiles.map((f) => f.id)))
    const isFileSelected = (file: SystemFile) => selectedFileIds.value.has(file.id)
    ```

---

### 问题 5：file/index.vue 网格模式滚动加载每次创建新数组

- **严重等级**：Low
- **文件**：`src/views/system/file/index.vue`
- **代码位置**：第 351 行
- **问题描述**：每次加载更多都使用展开运算符创建全新数组 `allFilesList.value = [...allFilesList.value, ...result.list]`。当文件数量增多时，数组拷贝开销线性增长。
- **触发条件**：滚动加载更多文件
- **影响范围**：大数据量场景下的内存分配
- **证据**：
    ```typescript
    // 第 351 行
    allFilesList.value = [...allFilesList.value, ...result.list] // ← 每次全量拷贝
    ```
- **修复建议**：改为 `allFilesList.value.push(...result.list)` 就地追加。

---

### 问题 6：notificationCenter 对 computed 做 deep watch

- **严重等级**：Low
- **文件**：`src/layout/header/notificationCenter.vue`
- **代码位置**：第 197-203 行
- **问题描述**：`previewNotifications` 是 computed（每次 notifications 变化都返回新数组），对 computed 的返回值做 `deep: true` watch 是冗余的。`slice(0, 5)` 每次都返回新引用，引用层面的变化已经足够触发 watch。
- **触发条件**：任何通知变化
- **影响范围**：通知面板的不必要深层遍历
- **修复建议**：移除 `{ deep: true }`。

---

### 问题 7：notificationCenter checkOverflow 使用全局 DOM 选择器

- **严重等级**：Low
- **文件**：`src/layout/header/notificationCenter.vue`
- **代码位置**：第 107 行
- **问题描述**：`document.querySelectorAll('.notification-item__message')` 查询全局 DOM 而非组件内 DOM。虽然当前只有一个通知面板实例，但这是一个脆弱的设计。
- **触发条件**：通知面板打开或通知变化
- **影响范围**：DOM 查询范围过大
- **修复建议**：用模板 ref 限定查询范围。

---

## 4. 疑似问题

### 疑似 1：`useListPage` 首次加载 350ms 固定延迟

- **文件**：`src/composables/useListPage.ts` 第 98-101 行
- **描述**：每次首次加载固定等待 350ms（避让路由过渡动画），对所有列表页一刀切。对于不需要动画的页面（如从侧边栏直接点击菜单），这是固定的额外延迟。**需要确认**：是否可以缩短到 150-200ms，或仅在检测到路由动画存在时才延迟。

### 疑似 2：`file/index.vue` 的 `allFilesList` 使用 `ref` 而非 `shallowRef`

- **文件**：`src/views/system/file/index.vue` 第 526 行
- **描述**：`allFilesList` 使用 `ref<SystemFile[]>`，每次赋值都触发深层响应式代理。对比 `useListPage.ts` 第 75 行正确使用了 `shallowRef`。如果 `SystemFile` 对象不需要深层响应式，改用 `shallowRef` 可减少代理开销。**需要确认**：是否有代码直接修改 `SystemFile` 对象的属性并依赖响应式更新。

### 疑似 3：字典数据缺少预加载机制

- **文件**：`src/composables/useDictOptions.ts`
- **描述**：多个组件分别调用 `useDictOptions` 和 `load()`，首次进入页面时可能产生 8+ 个并行字典请求。虽然有 pending dedup 防止同一 typeCode 重复请求，但不同 typeCode 的请求仍然是独立的。**需要确认**：是否需要在应用初始化时预加载常用字典。

---

## 5. 建议优先修复顺序

### P0 — 立即修复

1. **`fetchStorageConfig` 重复调用**（问题 1）：提升到 `runUploadQueue` 层或添加缓存

### P1 — 尽快修复

2. **i18n 双语包同步加载**（问题 2）：按需动态加载语言包
3. **FileGrid O(n) 选择查找**（问题 4）：用 Set 替代 Array.some
4. **proTable 双向 watch 效率**（问题 3）：优化 watch source

### P2 — 计划修复

5. **file/index.vue 数组拷贝**（问题 5）：改为 push 就地追加
6. **notificationCenter deep watch**（问题 6）：移除 deep: true
7. **notificationCenter 全局 DOM 查询**（问题 7）：改用组件 ref

---

## 6. 建议补充测试

| 测试场景                                                | 对应问题 | 测试文件建议                                   |
| ------------------------------------------------------- | -------- | ---------------------------------------------- |
| 批量上传 10 个文件时 `fetchStorageConfig` 只调用 1-2 次 | 问题 1   | `src/composables/useFileUpload.test.ts`        |
| 切换语言后新语言包被正确加载                            | 问题 2   | `src/locales/index.test.ts`                    |
| searchModel 变化时 localModel 正确同步（无不必要 diff） | 问题 3   | `src/components/proTable/index.test.ts`        |
| FileGrid 大量文件+选中项时渲染性能                      | 问题 4   | `src/views/system/components/FileGrid.test.ts` |

---

## 7. 总体评估

**做得好的部分：**

- 路由懒加载完整无遗漏，所有页面组件都使用动态 `import()`
- ECharts 使用 tree-shaking 级别的按需导入 + 动态加载双重保障
- 图标系统通过 `unplugin-icons` 实现全自动按需加载
- Element Plus 通过 `unplugin` 系列实现组件和样式按需导入
- Mock 模块实现运行时按需动态加载
- `useDictOptions` 三级缓存（内存 + localStorage + 网络）设计完善
- 所有事件监听器、定时器、ECharts、ResizeObserver、MutationObserver 均有正确的清理逻辑，**未发现内存泄漏**
- 文件上传并发控制（worker pool + 分片并发 + 批量合并）设计合理
- `useIntervalPolling` 的 AbortController 管理和 visibilitychange 处理规范

**需优化的部分：**

- `fetchStorageConfig` 在上传流程中重复调用（最值得修复的性能问题）
- i18n 双语包同步全量加载增加约 50KB bundle
- proTable 双向 watch 每次创建新对象触发不必要的 diff
- FileGrid 选择查找使用 O(n) 线性扫描
- `notificationCenter` 对 computed 做冗余的 deep watch

---

## 8. 下一轮建议

### 建议 1：无障碍（Accessibility）与 i18n 收尾

**原因**：第 4 轮发现 2 个整页未做 i18n 的页面（monitor、product）和 5 个部分硬编码中文的页面。需完成 i18n 收尾工作，同时审查 ARIA 属性、键盘导航、屏幕阅读器兼容性、focus 管理等无障碍需求。

### 建议 2：代码一致性与架构规范审查

**原因**：多轮审查发现的架构层面问题（分页 emit+函数 prop 双重触发、normalizeFolderId 两处实现不一致、日期格式化函数重复实现、isEmpty 语义不一致等）需要系统性审查代码一致性，制定统一规范。

### 建议 3：全项目安全加固收尾

**原因**：多轮审查发现的安全问题（Nginx 缺少安全头/HTTPS、Logger.error 泄露敏感信息、action_url 未校验、Token 存储在 localStorage 等）需要统一收尾修复，形成安全加固清单。
