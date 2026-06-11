# 第 3 轮前端专项 Code Review：文件上传、请求封装与 Mock 系统

---

## 1. 本轮审查范围

**文件上传核心**

- `src/composables/useFileUpload.ts`
- `src/views/system/composables/useFileUploadFlow.ts`
- `src/views/system/composables/useFileOperations.ts`
- `src/views/system/composables/useFileFolder.ts`
- `src/views/system/composables/useFileCategory.ts`
- `src/views/system/composables/useFileExport.ts`
- `src/modules/system/service.ts`（SHA256、上传、存储配置相关部分）

**请求封装与 Mock**

- `src/utils/request.ts`
- `src/mock/index.ts`
- `src/mock/modules/auth.ts`
- `src/mock/modules/system.ts`
- `src/mock/modules/adminUser.ts`
- `src/modules/shared/response.ts`
- `src/api/system.ts`

**文件管理页面与组件**

- `src/views/system/file/index.vue`
- `src/views/system/components/FileExplorerLayout.vue`
- `src/views/system/components/FileGrid.vue`
- `src/views/system/components/FileSidebar.vue`
- `src/views/system/components/FileToolbar.vue`
- `src/views/system/components/FileUploadQueue.vue`
- `src/views/system/components/FileDetailDrawer.vue`
- `src/components/filePicker/index.vue`

---

## 2. 调用链说明

### 文件上传流程

```
用户选择文件 → createUploadTask(file) → uploadTasks.value = tasks
  → runUploadQueue(tasks, options)
    → 获取 fetchStorageConfig() → 校验文件大小
    → SHA256 哈希计算（Web Worker / SubtleCrypto 降级）
    → 判断存储驱动：
        本地存储 → runLocalBatchUpload() → upload() 批量上传
        云端存储 → runDirectBatchUpload() → credential → 上传 → complete
        大文件 → uploadMultipart() → 分片 PUT → completeMultipartUpload
    → 更新 task.status / task.progress
    → releaseCompletedTaskFile() 释放 File 引用
```

### 目录上传流程

```
用户选择目录 → extractRelativeFolderPath() 提取相对路径
  → buildFolderIndex() 建立已有文件夹索引
  → 按深度排序创建文件夹 → ensureFolderPathExists()（含并发防护）
  → 为每个文件设置 targetFolderId → createUploadTask(file, { folderId })
  → runUploadQueue()
```

### 请求封装流程

```
get/post/upload/request
  → Mock 开启？→ tryGetMock() → getMockFallback()
      → URL 清洗 → pattern 匹配 → handler(dataOrParams)
      → 命中：返回 {code:0, data} 或 reject
      → 未命中：返回 null → request() 弹 404 错误并 reject
  → Mock 未开启？→ axios service.request()
      → 请求拦截器：注入 Authorization / Accept-Language / Content-Type
      → 响应拦截器：204 / Blob JSON / 业务码 401 / 错误码 / 网络错误
```

---

## 3. 已确认问题

### 问题 1：`lastUploadOptions` 模块级变量被目录上传覆盖，重试普通文件时使用错误选项

- **严重等级**：High
- **文件**：`src/views/system/composables/useFileUploadFlow.ts`
- **代码位置**：第 21、51、66、209 行
- **问题描述**：`lastUploadOptions` 是模块作用域变量。普通文件上传时设置 `{ folderId: selectedFolderId, enableMultipart: true }`（第 51 行），目录上传时覆盖为 `{ enableMultipart: true }`（第 209 行，无 folderId）。当用户先上传普通文件到 A 文件夹，再上传目录文件，然后重试之前在 A 文件夹上传失败的任务时，`retryUploadTask`（第 66 行）使用被覆盖的 `lastUploadOptions`（无 folderId），文件会被上传到默认位置（根目录）而非 A 文件夹。
- **触发条件**：上传普通文件 → 上传目录文件 → 重试之前普通文件上传中失败的任务
- **影响范围**：重试的文件被上传到错误的文件夹
- **证据**：

    ```typescript
    // 行 21：模块级共享状态
    let lastUploadOptions: UploadOptions = {}

    // 行 51：普通文件上传设置 folderId
    lastUploadOptions = { folderId: options.selectedFolderId.value, enableMultipart: true }

    // 行 209：目录上传覆盖，无 folderId
    lastUploadOptions = { enableMultipart: true }

    // 行 66：重试使用被覆盖的值
    await uploadOneTask(task, lastUploadOptions)
    ```

- **修复建议**：将 `lastUploadOptions` 存储到每个 UploadTask 上（如 `task.uploadOptions`），重试时从 task 自身读取，而非使用共享变量。

---

### 问题 2：filePicker grid 模式下多选失效，`handleGridItemClick` 无条件覆盖选中项

- **严重等级**：Medium
- **文件**：`src/components/filePicker/index.vue`
- **代码位置**：第 403-404 行
- **问题描述**：grid 模式下 `handleGridItemClick` 总是 `selectedRows.value = [row]`，不检查 `props.multiple`。对比 list 模式的 `handleRowClick`（第 389-395 行）在多选时会 `toggleRowSelection`。导致 `multiple=true` 时 grid 视图只能单选。
- **触发条件**：`props.multiple=true` 且使用 grid 视图
- **影响范围**：多选文件选择器在 grid 模式下无法多选
- **证据**：

    ```typescript
    // 行 389-394：list 模式正确区分单选/多选
    const handleRowClick = (row: SystemFile) => {
        if (!props.multiple) {
            selectedRows.value = [row]
        } else {
            tableRef.value?.toggleRowSelection(row)
        }
    }

    // 行 403-404：grid 模式总是单选覆盖
    const handleGridItemClick = (row: SystemFile) => {
        selectedRows.value = [row] // 未检查 props.multiple
    }
    ```

- **修复建议**：`handleGridItemClick` 中增加 `props.multiple` 判断，多选时应 toggle 选中状态而非覆盖。

---

### 问题 3：Mock `admin-user/get` 路由冲突，adminUserMock 的 handler 永远不执行

- **严重等级**：Medium
- **文件**：`src/mock/modules/auth.ts`（第 2387 行）、`src/mock/modules/adminUser.ts`（第 41 行）
- **代码位置**：`src/mock/index.ts` 第 12 行
- **问题描述**：`authMock` 和 `adminUserMock` 都定义了 `pattern: /^\/v1\/admin-user\/get$/` + `method: 'GET'`。`mockRoutes` 数组顺序为 `[...authMock, ...systemMock, ...adminUserMock]`，`mockRoutes.find()` 返回第一个匹配项。因此 authMock 的 handler 始终优先，adminUserMock 的 handler（支持按 id 查询不同用户）永远不会执行。
- **触发条件**：Mock 模式下请求 `/v1/admin-user/get`
- **影响范围**：Mock 模式下无法模拟不同用户的查询，始终返回固定的 admin 数据
- **证据**：

    ```typescript
    // mock/index.ts 行 12
    const mockRoutes: MockRoute[] = [...authMock, ...systemMock, ...adminUserMock]

    // 行 34：find 返回第一个匹配
    const route = mockRoutes.find((r) => r.pattern.test(cleanUrl) && r.method.toUpperCase() === targetMethod)
    ```

- **修复建议**：从 `authMock` 中移除 `/v1/admin-user/get` 路由，统一由 `adminUserMock` 处理（auth 获取用户信息应走 `/v1/auth/user-info` 等独立路径）。

---

### 问题 4：Mock handler 异常被静默吞掉，错误信息被误导为"未找到 Mock 接口匹配规则"

- **严重等级**：Medium
- **文件**：`src/mock/index.ts`
- **代码位置**：第 39-49 行
- **问题描述**：`getMockFallback` 中 handler 抛异常时 catch 块返回 `null`。`request.ts` 第 288-301 行将 `null` 解释为"未匹配到路由"，弹出 "未找到 Mock 接口匹配规则" 错误。开发者看到的错误信息与实际原因（handler 内部报错）不符，难以定位问题。
- **触发条件**：Mock handler 执行过程中抛出异常（数据未初始化、类型转换失败等）
- **影响范围**：Mock 开发调试效率降低
- **证据**：

    ```typescript
    // mock/index.ts 行 39-49
    try {
        const mockData = route.handler(dataOrParams)
        return { code: 0, msg: '[Mock Fallback Success]', data: mockData }
    } catch (error) {
        console.error('[Mock Fallback Error]:', error)
        return null // ← 返回 null，被 request.ts 当作"未匹配"
    }

    // request.ts 行 288-301
    if (fallback) {
        // ... 处理成功
    } else {
        const mockErr: ApiResponse = {
            code: 404,
            msg: `未找到 Mock 接口匹配规则: [${targetMethod}] ${url}`, // ← 误导性信息
        }
        ElMessage({ message: mockErr.msg, type: 'error' })
        return Promise.reject(mockErr)
    }
    ```

- **修复建议**：`getMockFallback` 区分"未匹配"（返回 null）和"handler 异常"（返回 `{ code: 500, msg: error.message }`），`request.ts` 对后者显示真实的错误信息。

---

### 问题 5：Mock 模式下文件下载返回 JS 对象而非 Blob

- **严重等级**：Medium
- **文件**：`src/utils/request.ts`、`src/modules/system/service.ts`
- **代码位置**：request.ts 第 280-302 行、service.ts 第 722-736 行
- **问题描述**：`downloadSystemFileBlob` 调用 `request('...', 'GET', { responseType: 'blob' })`。Mock 路径中 `getMockFallback` 返回的 `fallback.data` 是 JS 对象，`request()` 直接 `return fallback.data as T`（类型断言为 Blob 但实际是对象）。下游 `URL.createObjectURL(blob)` 会失败或产生意外行为。
- **触发条件**：Mock 模式下进行文件下载
- **影响范围**：文件下载在 Mock 模式下完全不可用
- **证据**：
    ```typescript
    // request.ts 行 284-285
    if (fallback.code === 0) {
        return fallback.data as T // ← JS 对象被断言为 Blob
    }
    ```
- **修复建议**：`request()` 中对 `responseType: 'blob'` 的请求，在 Mock 路径下跳过 Mock 降级，直接走真实请求；或在 Mock handler 中返回真实的 Blob 对象。

---

### 问题 6：`clearTasks` 不取消正在进行的上传，后台继续消耗带宽

- **严重等级**：Medium
- **文件**：`src/composables/useFileUpload.ts`
- **代码位置**：第 577-579 行
- **问题描述**：`clearTasks` 仅将 `uploadTasks.value = []`，不取消正在执行的上传 Promise。`runUploadQueue` 中的 worker 继续运行直到完成，但 task 对象已不在响应式数组中，UI 无反馈。`uploading` computed 立即变为 false（数组为空），可能导致 `uploadFinished` 误判。
- **触发条件**：上传进行中调用 clearTasks
- **影响范围**：后台继续执行网络请求但无 UI 反馈，浪费带宽
- **证据**：
    ```typescript
    // 行 577-579
    const clearTasks = () => {
        uploadTasks.value = [] // 仅清空数组，不取消 Promise
    }
    ```
- **修复建议**：`useFileUpload` 应维护一个 `AbortController`，`clearTasks` 时调用 `controller.abort()` 取消所有进行中的请求。`uploadOneTask` 和 `uploadMultipart` 应检查 `signal.aborted`。

---

### 问题 7：目录上传中文件夹创建失败后的竞态可能导致重复文件夹

- **严重等级**：Medium
- **文件**：`src/views/system/composables/useFileUploadFlow.ts`
- **代码位置**：第 135-162 行
- **问题描述**：`ensureFolderPathExists` 通过 `pendingPathIds` Map 防护并发创建。但当 `addSystemFileFolder` 抛异常时，catch 块重新加载文件夹树并重建索引，`finally` 块删除 `pendingPathIds` 中的 entry。后续并发调用者发现既没有 `createdPathIds` 也没有 `pendingPathIds`，会再次尝试创建，可能导致同名文件夹被重复创建。
- **触发条件**：两个同级文件需要创建同一个父文件夹，且第一次创建失败（网络错误等）
- **影响范围**：可能出现重复的同名文件夹
- **证据**：
    ```typescript
    // 行 135-162
    const createFolderPromise = (async () => {
        try {
            // ... 创建文件夹
        } catch (error) {
            await options.loadFolderTree()
            // 重建索引，但 createdPathIds 未设置
        } finally {
            pendingPathIds.delete(currentPath) // 删除 pending 标记
            // 后续调用者发现既无 pending 也无 created，会再次创建
        }
    })()
    ```
- **修复建议**：catch 块中在重建索引后检查文件夹是否已存在（被其他并发调用者创建），若存在则写入 `createdPathIds` 而非重新创建。

---

### 问题 8：`uploadTasks` 替换丢失上一批正在上传的任务追踪

- **严重等级**：Medium
- **文件**：`src/views/system/composables/useFileUploadFlow.ts`
- **代码位置**：第 49 行
- **问题描述**：`uploadFilesInQueue` 第 49 行 `uploadTasks.value = currentTasks` 直接替换整个数组。如果上一批上传任务仍在后台执行，它们从响应式数组中消失，状态更新不再反映到 UI。上一批任务的 `onResult` 回调可能在错误时机执行。
- **触发条件**：在上一批文件尚未上传完成时，用户触发新的文件上传
- **影响范围**：丢失上一批任务的进度追踪
- **证据**：
    ```typescript
    // 行 48-49
    const currentTasks = files.map((file) => createUploadTask(file))
    uploadTasks.value = currentTasks // ← 直接替换，旧任务丢失
    ```
- **修复建议**：新任务应追加到现有数组而非替换：`uploadTasks.value = [...uploadTasks.value, ...currentTasks]`。或在替换前检查是否有进行中的任务并提示用户。

---

### 问题 9：SHA256 哈希计算降级到 SubtleCrypto 时将整个大文件加载到主线程内存

- **严重等级**：Medium
- **文件**：`src/modules/system/service.ts`
- **代码位置**：第 465 行
- **问题描述**：当 Web Worker 计算 SHA256 失败时，降级逻辑执行 `await file.arrayBuffer()`，将整个文件内容加载到主线程内存。对于大文件（数百 MB），可能导致页面 OOM。Worker 方案的初衷就是分块流式处理，降级方案完全违背了设计意图。
- **触发条件**：Worker 创建失败（CSP 限制等）+ 上传大文件
- **影响范围**：主线程内存飙升，页面可能卡死或崩溃
- **证据**：
    ```typescript
    // service.ts 行 465
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    // ← file.arrayBuffer() 将整个文件加载到内存
    ```
- **修复建议**：降级方案应使用分块读取 + 增量哈希（如 `crypto.subtle.digest` 的 streaming polyfill），或限制降级方案仅适用于小文件（如 < 50MB）。

---

### 问题 10：`fetchStorageConfig` 在批量上传中每个文件调用一次

- **严重等级**：Medium
- **文件**：`src/composables/useFileUpload.ts`
- **代码位置**：第 181 行、第 535 行
- **问题描述**：`uploadOneTask`（第 181 行）和 `runUploadQueue`（第 535 行）都各自调用 `fetchStorageConfig()`。当 `runUploadQueue` 调用 `uploadOneTask` 时，存储配置被获取两次。批量上传 50 个文件会发送 100 次配置请求。
- **触发条件**：批量上传多个文件
- **影响范围**：不必要的 API 请求，增加服务器压力和上传延迟
- **证据**：

    ```typescript
    // 行 181：uploadOneTask 每次获取
    const storageConfig = await fetchStorageConfig()

    // 行 535：runUploadQueue 也获取
    const storageConfig = await fetchStorageConfig()
    ```

- **修复建议**：`runUploadQueue` 获取配置后通过 `options` 传递给 `uploadOneTask`，`uploadOneTask` 优先使用传入的配置，未传入时才自行获取。

---

### 问题 11：分片上传失败时 abort 重试的 setTimeout 不尊重 AbortSignal

- **严重等级**：Medium
- **文件**：`src/composables/useFileUpload.ts`
- **代码位置**：第 731-734 行
- **问题描述**：分片上传失败后尝试 `abortMultipartUpload`，重试之间使用 `await new Promise(resolve => setTimeout(resolve, 1000))`，不检查 `options?.signal`。用户取消上传后，1 秒等待仍会继续执行。
- **触发条件**：分片上传失败 + 用户取消 + abort 中止需要重试
- **影响范围**：取消操作后延迟释放资源
- **证据**：
    ```typescript
    // 行 731-734
    } else {
        await new Promise((resolve) => setTimeout(resolve, 1000))  // 不检查 signal
    }
    ```
- **修复建议**：使用 `AbortSignal.timeout(1000)` 或手动检查 `signal.aborted`，取消时立即 resolve。

---

### 问题 12：grid 模式下 `allFilesList` 累积数据可能重复，`noMore` 判断不准

- **严重等级**：Medium
- **文件**：`src/views/system/file/index.vue`
- **代码位置**：第 348-353 行、第 532-534 行
- **问题描述**：`fetcher` 在 grid 模式下将每次请求结果追加到 `allFilesList`。`noMore` 使用 `allFilesList.value.length >= pagination.total` 判断。如果请求失败后重试，或分页参数被外部修改，`allFilesList` 可能累积重复数据，导致 `length > total`，后续加载永远被阻止。
- **触发条件**：网络不稳定导致请求重试
- **影响范围**：滚动加载可能提前终止或加载重复数据
- **证据**：

    ```typescript
    // 行 348-352
    if (params.page === 1 || !params.page) {
        allFilesList.value = result.list
    } else {
        allFilesList.value = [...allFilesList.value, ...result.list] // 累积追加
    }

    // 行 532-534
    const noMore = computed(() => {
        return fileList.value.length === 0 || allFilesList.value.length >= pagination.total
    })
    ```

- **修复建议**：`loadMore` 开始前检查当前页是否已加载（通过 page 缓存 Set），重复页不追加。或在 `handleSearch` 重置时显式清空 `allFilesList`。

---

### 问题 13：`loadMore` 缺少并发锁，快速滚动可能发送重复请求

- **严重等级**：Medium
- **文件**：`src/views/system/file/index.vue`
- **代码位置**：第 540-546 行
- **问题描述**：`loadMore` 检查 `loading.value` 防重入，但 `loading` 在 `rawGetList()` 内部异步设置为 true。如果用户在 `loadMore` 被调用到 `loading` 变为 true 之间的微任务窗口内快速滚动，可能触发多次 `loadMore`，产生并发请求。
- **触发条件**：快速连续滚动到底部
- **影响范围**：可能发送多个相同页码的请求，数据重复累积
- **证据**：
    ```typescript
    const loadMore = async () => {
        if (viewMode.value !== 'grid' || loading.value || noMore.value) return
        // ↑ loading 在 rawGetList() 内部才设为 true，此处检查有竞态窗口
        const nextPage = (queryWhere.page || 1) + 1
        queryWhere.page = nextPage
        pagination.page = nextPage
        await rawGetList()
    }
    ```
- **修复建议**：在 `loadMore` 入口立即设置一个同步锁（如 `isLoadingMore = true`），在 `rawGetList` 完成后释放。

---

### 问题 14：删除文件夹后 `selectedFolderId` 可能指向已删除的子节点

- **严重等级**：Medium
- **文件**：`src/views/system/composables/useFileFolder.ts`
- **代码位置**：第 98-101 行
- **问题描述**：删除文件夹后只检查 `selectedFolderId === folder.id`（精确匹配）。如果用户在子文件夹中浏览，然后删除其父文件夹，`selectedFolderId` 指向被删除的子节点但不会被重置，导致后续请求使用不存在的 `folder_id`。
- **触发条件**：用户在子文件夹中浏览，然后删除其父文件夹
- **影响范围**：文件列表显示空或报错
- **证据**：
    ```typescript
    // 行 98-101
    if (selectedFolderId.value === folder.id) {
        selectedFolderId.value = null // 只检查精确匹配，不检查后代节点
    }
    ```
- **修复建议**：删除文件夹后检查 `selectedFolderId` 是否是被删除文件夹的后代节点（遍历 folderTree），若是则重置为 null 或被删除文件夹的父节点。

---

### 问题 15：`runLocalBatchUpload` 错误处理可能误标成功任务为失败

- **严重等级**：Medium
- **文件**：`src/composables/useFileUpload.ts`
- **代码位置**：第 305-328 行
- **问题描述**：在 `runLocalBatchUpload` 的 catch 中，先处理 `failures`，再处理 `partialItems`。如果 `failures` + `partialItems` 的数量不匹配实际 task 数量，部分 task 既不在 failures 中也不在 partialItems 中，会走到兜底逻辑被标记为 error。在服务端返回部分成功的批量结果时，可能误标已成功的 task。
- **触发条件**：服务端返回部分成功的批量上传结果，且响应结构不完整
- **影响范围**：已成功上传的文件被错误标记为失败
- **修复建议**：简化错误处理逻辑，明确每个 task 的最终状态判定路径，减少兜底分支。

---

## 4. 疑似问题

### 疑似 1：Web Worker SHA256 计算在 CSP 严格环境下是否可用

- **文件**：`src/modules/system/service.ts`、`src/utils/sha256.worker.ts`
- **描述**：SHA256 计算使用 Web Worker + `import.meta.url` 加载。如果部署环境配置了严格的 CSP（`worker-src 'none'`），Worker 创建会失败，降级到 SubtleCrypto（问题 9）。**需要确认**：生产环境的 CSP 策略是否允许 Worker。

### 疑似 2：`normalizeListData` 对后端返回的 `{data: [], total}` 结构（Laravel 风格）的处理是否正确

- **文件**：`src/modules/shared/response.ts` 第 83-135 行
- **描述**：`normalizeListData` 支持三种分页结构，但第三种 `{data:{list,total}}` 的解包路径（第 120-129 行）可能与后端实际返回的 `{data: [], total, current_page, per_page}` 不完全匹配。**需要确认**：后端分页接口的实际返回结构。

### 疑似 3：`useFileUpload` 中 `releaseCompletedTaskFile` 在并发 worker 模式下的安全性

- **文件**：`src/composables/useFileUpload.ts` 第 75-79 行
- **描述**：`releaseCompletedTaskFile` 将 `task.file = null`。在并发 worker 模式下，如果两个 worker 同时处理同一个 task 的不同阶段（理论上不会，因为 task 粒度是文件级），可能产生竞态。**需要确认**：是否有场景导致同一个 task 被多个 worker 同时处理。

### 疑似 4：`el-scrollbar` 的 `end-reached` 事件在当前 Element Plus 版本中是否支持

- **文件**：`src/views/system/file/index.vue` 第 63 行
- **描述**：`<el-scrollbar :distance="30" @end-reached="handleScrollEnd">` 使用了 `end-reached` 事件。这是 Element Plus 2.4+ 的扩展功能。**需要确认**：`package.json` 中 `element-plus: ^2.7.6` 是否包含此事件。

---

## 5. 建议优先修复顺序

### P0 — 立即修复

1. **`lastUploadOptions` 被目录上传覆盖**（问题 1）：重试时文件被上传到错误文件夹，是实际功能 bug

### P1 — 尽快修复

2. **filePicker grid 多选失效**（问题 2）：多选模式下 grid 视图只能单选
3. **Mock `admin-user/get` 路由冲突**（问题 3）：Mock 调试时无法测试不同用户
4. **Mock handler 异常被误导为 404**（问题 4）：降低 Mock 开发效率
5. **Mock 模式下文件下载不可用**（问题 5）：文件下载功能在 Mock 模式下完全失效
6. **`clearTasks` 不取消进行中的上传**（问题 6）：用户无法真正取消上传
7. **`fetchStorageConfig` 每文件调用一次**（问题 10）：批量上传性能问题

### P2 — 计划修复

8. **目录上传文件夹创建竞态**（问题 7）
9. **`uploadTasks` 替换丢失任务追踪**（问题 8）
10. **SHA256 降级方案 OOM 风险**（问题 9）
11. **abort 重试不尊重 AbortSignal**（问题 11）
12. **grid 滚动加载数据重复**（问题 12）
13. **loadMore 并发竞态**（问题 13）
14. **文件夹删除后 selectedFolderId 悬空**（问题 14）
15. **批量上传错误处理误标**（问题 15）

---

## 6. 建议补充测试

| 测试场景                                                   | 对应问题 | 测试文件建议                                             |
| ---------------------------------------------------------- | -------- | -------------------------------------------------------- |
| 普通文件上传 → 目录上传 → 重试失败任务，验证 folderId 正确 | 问题 1   | `src/composables/useFileUpload.test.ts`                  |
| filePicker `multiple=true` + grid 视图下多选文件           | 问题 2   | `src/components/filePicker/index.test.ts`                |
| Mock 模式下 `/v1/admin-user/get` 返回正确用户数据          | 问题 3   | `src/mock/modules/adminUser.test.ts`                     |
| Mock handler 抛异常时显示真实错误信息而非 404              | 问题 4   | `src/mock/index.test.ts`                                 |
| 上传进行中调用 `clearTasks`，验证网络请求被取消            | 问题 6   | `src/composables/useFileUpload.test.ts`                  |
| 目录上传中文件夹创建失败后重试，验证不创建重复文件夹       | 问题 7   | `src/views/system/composables/useFileUploadFlow.test.ts` |
| 上一批上传未完成时触发新上传，验证旧任务状态可追踪         | 问题 8   | `src/views/system/composables/useFileUploadFlow.test.ts` |
| 50 个文件批量上传，验证 `fetchStorageConfig` 只调用 1-2 次 | 问题 10  | `src/composables/useFileUpload.test.ts`                  |
| 分片上传失败后取消，验证 abort 重试立即终止                | 问题 11  | `src/composables/useFileUpload.test.ts`                  |
| grid 模式滚动加载到第 3 页后搜索，验证从第 1 页开始        | 问题 12  | `src/views/system/file/index.test.ts`                    |
| 快速连续滚动到底部 5 次，验证只发送 1 个请求               | 问题 13  | `src/views/system/file/index.test.ts`                    |
| 在子文件夹中浏览后删除父文件夹，验证 UI 不报错             | 问题 14  | `src/views/system/composables/useFileFolder.test.ts`     |

---

## 7. 下一轮建议

### 建议 1：通知 WebSocket 与实时通信安全

**原因**：`src/stores/notification.ts` 涉及 WebSocket ticket 认证、断线重连退避、频道订阅、会话强踢。`.aitasks/todo.md` 中有待补充的心跳保活机制。ticket 通过 URL query 传输的安全性、频道消息分发的安全性都需专项审查。

### 建议 2：i18n 国际化完整性与样式一致性

**原因**：项目支持 zh-CN / en-US 双语言，14 个命名空间。`.aitasks/lessons.md` 中记录了 "i18n key 缺失" 的历史问题。需审查所有 `t()` 调用是否都有对应的翻译 key，以及 Element Plus 组件的语言包切换是否完整。

### 建议 3：ProTable / TableList 通用组件与列表页模式

**原因**：`src/components/proTable/index.vue` 和 `src/components/tableList/index.vue` 是所有列表页的基础组件，`.aitasks/todo.md` 中有待修复的"搜索模型引用类型比较"问题。`src/composables/useListPage.ts` 是列表页的核心逻辑封装，需审查搜索、分页、刷新、批量操作的完整性和健壮性。
