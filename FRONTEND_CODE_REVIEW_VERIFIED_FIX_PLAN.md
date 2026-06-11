# FRONTEND_CODE 审查文档核对后修复方案

> 核对日期：2026-06-11
> 基准：当前工作区代码，而不是审查文档生成时的历史快照
> 范围：`FRONTEND_CODE*` 审查文档、认证、上传、Mock、Layout、测试、性能、a11y、i18n 相关源码

---

## 1. 核对结论

原审查文档总体方向是对的，但部分状态已经滞后：有些问题已被修复或部分修复，最终总结仍把它们归入未修复；也有少量统计描述不自洽。后续修复应以当前代码为准，先处理仍真实存在且影响最大的项。

### 1.1 已确认仍存在的高优先级问题

| 优先级 | 问题                                         | 当前证据                                                                                                                       | 影响                                    |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | --------- | ---------------- |
| P0     | 登录表单缺少可访问 label                     | `src/views/login/index.vue` 的 username/password/captcha 三个 `el-form-item` 只有 `prop`，无 `label`/`aria-label` 绑定         | 屏幕阅读器无法可靠识别输入项            |
| P0     | Nginx 缺少安全头、HTTPS、限速、WebSocket map | `nginx.conf.final` 仅 `listen 80`，无 CSP / HSTS / `X-Frame-Options` / `limit_req` / `map $http_upgrade $connection_upgrade`   | 部署安全风险                            |
| P1     | 退出登录 API 失败不清理本地状态              | `src/layout/header/right.vue:151-169` 中 `logout()` API 失败时仅 `Logger.error`                                                | 用户可能卡在登录态                      |
| P1     | Token 过期未通知服务端吊销 refresh_token     | `src/stores/auth.ts:245` 的 `handleTokenExpired()` 只弹窗并本地 logout                                                         | refresh_token 仍可能有效                |
| P1     | 通知 `action_url` 未校验                     | `src/layout/header/notificationCenter.vue:182-188` 直接 `router.push(item.action_url)`；toast 点击中也直接 push                | 路径注入、异常跳转                      |
| P1     | Token 仍持久化在 localStorage                | `src/stores/auth.ts` persistedstate 持久化 access token，且 refresh token 单独写 localStorage                                  | XSS 后凭据可被读取                      |
| P1     | `lastUploadOptions` 共享变量仍会被覆盖       | `src/views/system/composables/useFileUploadFlow.ts:21,51,66,209` 仍使用模块内共享变量                                          | 重试可能使用错误上传上下文              |
| P1     | `clearTasks` 不取消正在上传请求              | `src/composables/useFileUpload.ts` 中 `clearTasks` 仍只是清空数组                                                              | 后台请求继续占用资源，UI 与实际状态脱节 |
| P1     | Mock handler 异常仍被伪装为未匹配            | `src/mock/index.ts` catch 后 `return null`，`request.ts` 显示 404 未匹配                                                       | Mock 开发时误判根因                     |
| P1     | 文件下载 Mock 路径仍未特殊处理 Blob          | `request.ts` Mock 路径不区分 `responseType: 'blob'`                                                                            | Mock 模式下载不可用或类型错误           |
| P1     | i18n 收尾仍未完成                            | `monitor/index.vue` 大量中文；`role/index.vue`、`role/model.ts`、`notification/index.vue` 仍硬编码中文；`avatarUpload` 有 `t() |                                         | fallback` | 英文环境仍混中文 |
| P1     | 无障碍基础仍缺失                             | 全局未发现 `aria-live`/Skip Link；FileGrid 卡片缺少键盘操作入口；登录页 toolbar/captcha 是 `div` 点击                          | 键盘和读屏体验不完整                    |

### 1.2 已修复或部分修复，文档状态需注意

| 问题                          | 当前状态               | 证据                                                                                                                    |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Mock 未命中非 GET 自动成功    | 已修复                 | `src/utils/request.ts:279-301` 未命中统一返回 404 reject                                                                |
| 目录上传同路径创建竞态        | 部分修复               | `useFileUploadFlow.ts:105-164` 已引入 `pendingPathIds`；仍需检查 `finally` 删除 key 时捕获的 `currentPath` 是否稳定     |
| 失败任务释放 File 句柄        | 已修复                 | `useFileUpload.ts:75-79` 只在 `success/reuse` 释放                                                                      |
| WebSocket 半开连接心跳        | 已修复/需协议确认      | `src/stores/notification.ts` 已有 `HEARTBEAT_INTERVAL_MS`、`HEARTBEAT_TIMEOUT_MS` 和 ping                               |
| ProTable 引用类型比较         | 部分修复               | `src/components/proTable/index.vue` 已有 `isModelValueEqual`，但 `handleReset` 仍依赖 `resetFields()`，重置恢复仍需验证 |
| `fetchStorageConfig` 重复调用 | 仍存在但程度小于原描述 | `runUploadQueue` 调一次，逐个 `uploadOneTask` 仍会再调；不再是“100 次”，但仍是 N+1                                      |
| `isEmpty(0/false)`            | 仍存在                 | `src/utils/helper.ts` 仍将 `0` 和 `false` 判空，最终总结“已修复”不准确                                                  |
| 分页 emit + 函数 prop 双触发  | 仍存在                 | `pagination`、`tableList` 都保留 emit + 函数 props                                                                      |

### 1.3 文档统计需更新但不影响修复

| 项                            | 原最终总结 |                                  当前核对 |
| ----------------------------- | ---------: | ----------------------------------------: |
| Vue 组件                      |         69 |                                        69 |
| 非 `.d.ts` / 非 `.test.ts` TS |        127 |                                       127 |
| 测试文件                      |         22 |                                        22 |
| `src/api` TS 文件             |          9 | 10，含 `permission.test.ts`；排除测试为 9 |
| 根目录 `src/composables`      |          7 |                                         7 |
| `src/utils` TS 文件           |         10 |                         16，排除测试为 11 |
| `i18n 类（3 项）`             |    列 2 项 |      文档内部不自洽，应补 1 项或改为 2 项 |

---

## 2. 推荐修复顺序

### 第 0 步：建立干净验证基线

先运行：

```bash
pnpm run type-check
pnpm run lint
pnpm vitest run src/stores/auth.test.ts src/utils/request.test.ts src/composables/useFileUpload.test.ts src/stores/notification.test.ts
```

如果失败，先记录失败项，不要跳过。当前工作区已有大量未提交改动，修复前要确认失败是既有问题还是新改动引入。

---

## 3. P0/P1 详细修复方案

### 3.1 登录表单可访问 label

**根因**

`el-form-item` 只提供 `prop`，输入框仅依赖 placeholder。placeholder 不是 label，读屏器和自动填充场景都不稳定。

**修改文件**

- `src/views/login/index.vue`

**具体改法**

1. 给三个 `el-form-item` 增加 label：
    - username：`:label="t('login.username')"` 或新增 `login.labels.username`
    - password：`:label="t('login.password')"`
    - captcha：`:label="t('login.captcha')"`
2. 如果视觉上不想显示 label，使用 Element Plus 的可访问 label 方案或项目内统一的 visually-hidden 样式，不要只隐藏 DOM。
3. 给右上角语言/主题 toolbar 的 clickable `div` 增加：
    - `role="button"`
    - `tabindex="0"`
    - `:aria-label`
    - `@keydown.enter`
    - `@keydown.space.prevent`
4. 验证码图片容器改为 `button` 或补同样的键盘事件。
5. `captcha-loading` 建议通过 `aria-live="polite"` 告知状态变化。

**验证**

```bash
pnpm run type-check
pnpm vitest run src/modules/shared/i18n.test.ts
```

手工验证：

- 只用键盘可切换语言、主题、刷新验证码并提交登录。
- 浏览器无明显 a11y warning。

---

### 3.2 Nginx 部署安全加固

**根因**

`nginx.conf.final` 是功能可用配置，但缺少生产安全配置：HTTPS、基础安全响应头、接口限速，以及 WebSocket `Connection` 变量定义。

**修改文件**

- `nginx.conf.final`

**具体改法**

1. 在 `http` 级别或文件可用位置增加 WebSocket map：

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

如果当前文件只能放 `server` 块，需在部署侧主 nginx 配置中加，不能硬塞进 `server`。

2. 增加限速区：

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=addr_limit:10m;
```

3. `server` 增加安全头：

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ws: wss: http: https:;" always;
```

4. HTTPS：
    - 新增 `listen 443 ssl http2;`
    - 配置 `ssl_certificate`、`ssl_certificate_key`
    - 80 端口 server 做 301 跳转
    - HTTPS server 增加 `Strict-Transport-Security`

5. `/admin/` 增加：

```nginx
limit_req zone=api_limit burst=20 nodelay;
limit_conn addr_limit 20;
```

6. 将 `proxy_read_timeout 3600s` 拆分：普通 API 不应 3600s，WebSocket 单独 location 才使用长超时。

**验证**

```bash
nginx -t -c /path/to/nginx.conf
curl -I https://your-domain/
```

重点确认响应头、HTTPS 跳转、WebSocket 连接都正常。

---

### 3.3 退出登录失败仍清理本地状态

**根因**

当前流程把“通知服务端 logout 成功”作为“清理本地登录态”的前置条件。一旦 API 失败，本地状态不清理。

**修改文件**

- `src/layout/header/right.vue`
- 可选：`src/stores/auth.ts`

**具体改法**

1. 用户确认退出后，先保存当前路径：

```ts
const redirectUrl = router.currentRoute.value.fullPath
```

2. 调用服务端 logout 失败时仍继续本地 logout：

```ts
try {
    await logout(authStore.refreshToken)
} catch (error) {
    Logger.error('退出登录接口失败，继续清理本地状态:', error)
    ElMessage.warning(t('layout.logoutLocalOnly'))
} finally {
    authStore.logout(redirectUrl)
}
```

3. 不要把 `ElMessageBox` 的 cancel 和 API error 混在一个 catch 中；建议拆成两段：
    - 第一段只处理用户确认/取消
    - 第二段处理服务端 logout
4. 新增 i18n key：`layout.logoutLocalOnly`。

**验证**

- Mock `logout()` reject，断言仍调用 `authStore.logout()`。
- 手工断网点击退出，应跳转登录页并清理 token。

建议补测试：

```bash
pnpm vitest run src/stores/auth.test.ts
```

如果逻辑留在组件内，需要新增组件测试或把流程抽成 composable。

---

### 3.4 Token 过期时服务端吊销 refresh_token

**根因**

`handleTokenExpired()` 只做本地清理，没有让服务端吊销 refresh token。若 refresh token 仍有效，风险窗口延长。

**修改文件**

- `src/stores/auth.ts`
- `src/api/auth.ts`

**具体改法**

1. 在 `resetAuthStore()` 清空前保存 refresh token：

```ts
const tokenToRevoke = refreshToken.value
```

2. 增加一个不阻塞 UI 的吊销方法：

```ts
const revokeRefreshToken = (token?: string) => {
    if (!token) return
    void logoutApi(token).catch((error) => {
        Logger.error('吊销 refresh_token 失败:', error)
    })
}
```

注意避免命名和 store 的 `logout` 冲突，可将 API import 命名为 `logoutApi`。

3. 在 `handleTokenExpired()` 用户确认重新登录前调用：

```ts
const tokenToRevoke = refreshToken.value
revokeRefreshToken(tokenToRevoke)
logout(redirectUrl)
```

4. WebSocket 收到强踢时也应走同一个本地退出流程，并尝试吊销。
5. 如果后端 401 已代表 refresh token 失效，吊销失败只记录日志，不阻塞跳转。

**验证**

- `handleTokenExpired()` confirm 后调用 logout API 一次。
- logout API reject 不影响跳转登录页。
- WebSocket close code 4001/4002 不无限重连。

---

### 3.5 通知 action_url 白名单校验

**根因**

通知数据来自接口和 WebSocket，`action_url` 直接用于 `router.push`。即使 Vue Router 不会执行 `javascript:`，也会产生异常跳转、外链混淆和路由注入风险。

**修改文件**

- `src/stores/notification.ts`
- `src/layout/header/notificationCenter.vue`
- `src/views/system/notification/index.vue`
- 可选新增：`src/utils/notificationAction.ts`

**具体改法**

1. 新增统一函数：

```ts
export function normalizeNotificationActionUrl(value?: string): string | undefined {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed.startsWith('/')) return undefined
    if (trimmed.startsWith('//')) return undefined
    if (trimmed.includes('\\')) return undefined
    return trimmed
}
```

2. 在 `normalizeNotification()` 中归一化：

```ts
const actionURL = normalizeNotificationActionUrl(input.action_url)
```

3. 所有点击入口只处理归一化后的内部路径：

```ts
const target = normalizeNotificationActionUrl(item.action_url)
if (!target) return
await router.push(target)
```

4. toast `onClick` 同样使用这个函数。
5. 如果业务确实需要外链，改成后端返回白名单 key，前端映射 URL，不直接信任任意 URL。

**验证**

- `javascript:alert(1)`、`https://example.com`、`//example.com` 不跳转。
- `/task/center?tab=export` 正常跳转。
- 补 `notification.test.ts` 覆盖归一化。

---

### 3.6 Token 存储安全

**根因**

access token 和 refresh token 都在 localStorage 里。前端一旦发生 XSS，凭据可直接被读取。

**推荐路线**

这是前后端联动项，不建议只在前端“换个 key”或简单加密。正确方案是：

1. refresh token 改为服务端设置 `HttpOnly; Secure; SameSite=Lax/Strict` Cookie。
2. access token 尽量只放内存；刷新页面后通过 refresh cookie 换取新 access token。
3. Pinia persistedstate 不再持久化 `access_token`。
4. 前端请求改为 `withCredentials: true`，并处理 CSRF：
    - SameSite 足够时仍建议对写操作加 CSRF token；
    - 后端校验 Origin/Referer。
5. logout 时由后端清 cookie，前端只清内存状态。

**过渡方案**

如果后端暂时不能改：

1. 保留现状但补强 CSP、安全头和 XSS 防护。
2. 减短 access token 有效期。
3. refresh token 单独存储仍有风险，文档中必须标记“未彻底修复”。

**验证**

- 刷新页面能恢复会话。
- logout 后 Cookie/内存状态清理。
- XSS payload 不能通过 JS 读取 refresh token。

---

### 3.7 上传重试 `lastUploadOptions` 覆盖

**根因**

`lastUploadOptions` 是 `useFileUploadFlow()` 内共享变量。普通文件上传、目录上传都会覆盖它；失败任务重试时读取的是最近一次上传的 options，而不是任务自己的 options。

**修改文件**

- `src/composables/useFileUpload.ts`
- `src/views/system/composables/useFileUploadFlow.ts`
- 相关测试：`src/composables/useFileUpload.test.ts`

**具体改法**

1. 给 `UploadTask` 增加可选字段：

```ts
uploadOptions?: UploadOptions
```

2. `createUploadTask` 支持写入 options：

```ts
const createUploadTask = (
    file: File,
    overrides?: { name?: string; folderId?: number | string | null; uploadOptions?: UploadOptions }
) => ({
    ...
    uploadOptions: overrides?.uploadOptions,
})
```

3. 普通文件上传创建任务时固化 options：

```ts
const uploadOptions = { folderId: options.selectedFolderId.value, enableMultipart: true }
const currentTasks = files.map((file) => createUploadTask(file, { uploadOptions }))
await runUploadQueue(currentTasks, uploadOptions)
```

4. 目录上传创建任务时，每个 task 已有 `folderId`，也固化：

```ts
const uploadOptions = { enableMultipart: true }
createUploadTask(file, { name, folderId: targetFolderId, uploadOptions })
```

5. 删除共享变量 `lastUploadOptions`，重试改为：

```ts
await uploadOneTask(task, task.uploadOptions)
```

6. `uploadOneTask()` 内部用 `task.folderId ?? options?.folderId` 的逻辑保留。

**验证**

- 先在 A 文件夹上传失败，再上传目录，再重试 A 的失败任务，最终 `folder_id` 仍为 A。
- 补单测断言 `uploadSystemFile` 收到正确 `folder_id`。

---

### 3.8 `clearTasks` 真正取消上传

**根因**

`clearTasks()` 只清空响应式数组，正在执行的 `axios` 请求和 worker 流程没有被取消。

**修改文件**

- `src/composables/useFileUpload.ts`
- `src/views/system/composables/useFileUploadFlow.ts`

**具体改法**

1. 在 `useFileUpload()` 内维护批次 controller：

```ts
let uploadAbortController: AbortController | null = null
```

2. `runUploadQueue()` 开始时创建 controller，并合并外部 signal：

```ts
uploadAbortController = new AbortController()
const signal = options?.signal ?? uploadAbortController.signal
```

3. 所有上传路径传入 signal：
    - `uploadSystemFile`
    - `uploadCredentialTarget`
    - `uploadMultipart`
    - `axios.request`
    - abort multipart retry timer
4. worker 循环每次取任务前检查：

```ts
if (signal.aborted) break
```

5. `clearTasks()`：

```ts
uploadAbortController?.abort()
uploadAbortController = null
uploadTasks.value = []
```

6. 被取消任务状态建议设为 `error` 或新增 `cancelled`。如果新增状态，必须同步 UI 和测试。

**验证**

- 上传中调用 `clearTasks()`，axios mock 收到 abort。
- UI 不再显示 uploading。
- 后续重新选择文件可正常上传。

---

### 3.9 Mock handler 异常显示真实错误

**根因**

`getMockFallback()` 把 handler 异常 catch 后返回 `null`，上层无法区分“未匹配”和“handler 报错”。

**修改文件**

- `src/mock/index.ts`
- `src/utils/request.ts`
- 可新增：`src/mock/index.test.ts`

**具体改法**

1. 定义 Mock 结果联合类型：

```ts
type MockFallbackResult = { matched: true; response: { code: number; msg: string; data: unknown } } | { matched: false } | { matched: true; error: Error }
```

2. route 未匹配返回 `{ matched: false }`。
3. handler 抛错返回 `{ matched: true, error }` 或直接 throw 自定义 `MockHandlerError`。
4. `request.ts`：
    - 未匹配：继续返回 404 未匹配；
    - handler error：返回 500，message 包含 route/method 和真实错误 message。
5. 不用 `console.error`，改用 `Logger.error`，并保持测试可 mock。

**验证**

- handler 抛错时错误消息不是“未找到 Mock 接口匹配规则”。
- 未匹配时仍是 404。

---

### 3.10 Mock 文件下载 Blob

**根因**

Mock fallback 默认返回 JS 对象结构；下载接口期望 Blob，导致调用方类型不一致。

**修改文件**

- `src/utils/request.ts`
- `src/mock/modules/system.ts`

**具体改法**

两种可选方案，推荐方案 A。

方案 A：Blob 请求跳过 Mock fallback

```ts
if (isMockEnabled() && options.responseType !== 'blob') {
    ...
}
```

优点是简单，下载走真实后端；缺点是纯 Mock 环境无法模拟下载。

方案 B：Mock handler 支持 Blob

1. 允许 handler 返回 `Blob`。
2. `request.ts` 判断 `options.responseType === 'blob'` 时直接返回 Blob。
3. system mock 为下载接口返回：

```ts
new Blob(['mock file content'], { type: 'application/octet-stream' })
```

**验证**

- Mock 模式下载时业务拿到 `Blob`。
- 普通 JSON Mock 不受影响。

---

### 3.11 i18n 收尾

**根因**

多处页面仍直接写中文，或使用 `t(key) || fallback`。`t()` 缺 key 时通常返回 key 字符串，`|| fallback` 基本是 dead code。

**修改文件**

- `src/views/system/monitor/index.vue`
- `src/views/permission/role/index.vue`
- `src/modules/role/model.ts`
- `src/views/system/notification/index.vue`
- `src/components/avatarUpload/index.vue`
- `src/locales/zh-CN/*.ts`
- `src/locales/en-US/*.ts`

**具体改法**

1. monitor 页面按模块补 key：
    - `system.monitor.cpu`
    - `system.monitor.memory`
    - `system.monitor.disk`
    - `system.monitor.load1m`
    - `system.monitor.runtime`
    - `system.monitor.host`
    - `system.monitor.appStatus`
2. role 数据权限：
    - `permission.role.dataScope`
    - `permission.role.customDept`
    - `permission.role.dataScopeOptions.*`
3. `DATA_SCOPE_OPTIONS` 不直接写中文 label，改成 i18n key：

```ts
{ label: 'permission.role.dataScopeOptions.all', value: DATA_SCOPE.ALL }
```

渲染处统一 `t(option.label)`。

4. `formatTimeAgo` 改成 i18n plural 或简单参数化：

```ts
t('system.notification.minutesAgo', { count: diffMins })
```

5. `avatarUpload` 删除 `t() || fallback`，补齐缺失 key。
6. 跑现有 i18n 测试，必要时扩展测试扫描缺失 key。

**验证**

```bash
pnpm vitest run src/modules/shared/i18n.test.ts src/components/avatarUpload/index.test.ts
pnpm run type-check
```

手工切换 `zh-CN` / `en-US`，monitor、role、notification 页面不应出现硬编码中文。

---

### 3.12 无障碍基础能力

**根因**

项目已有局部 `role/button/tabindex`，但缺少全局状态播报、Skip Link 和若干关键交互的键盘支持。

**修改文件**

- `src/layout/index.vue` 或实际 Layout 根组件
- `src/layout/main/index.vue`
- `src/stores/notification.ts`
- `src/layout/header/notificationCenter.vue`
- `src/views/system/components/FileGrid.vue`
- `src/views/login/index.vue`

**具体改法**

1. Layout 顶部增加 Skip Link：

```vue
<a class="skip-link" href="#main-content">{{ t('layout.skipToMain') }}</a>
```

主内容容器加：

```vue
<main id="main-content" tabindex="-1">
```

2. 增加全局 `aria-live` 区域：

```vue
<div class="sr-only" aria-live="polite">{{ notificationStore.latestAnnouncement }}</div>
```

3. notification store 在新通知、连接断开、重连成功时更新 announcement。
4. 通知铃铛 reference 加 `role="button"`、`tabindex="0"`、`aria-label`、Enter/Space 触发。
5. FileGrid：
    - 文件卡片加 `role="button"` 或 `role="gridcell"`；
    - 可聚焦；
    - Enter 打开/预览；
    - Space 切换选择；
    - 右键菜单功能提供键盘等价入口。
6. 全局检查 `outline: none`，若存在必须补 `:focus-visible`。

**验证**

- Tab 顺序可进入主内容。
- 键盘可操作通知、FileGrid、登录页工具栏。
- 新通知有读屏播报区域变化。

---

## 4. P2 修复方案

### 4.1 `fetchStorageConfig` N+1

**改法**

1. 给 `UploadOptions` 增加内部字段：

```ts
storageConfig?: Awaited<ReturnType<typeof fetchStorageConfig>>
```

2. `runUploadQueue()` 获取一次后传给 `uploadOneTask()`：

```ts
const nextOptions = { ...options, storageConfig }
await uploadOneTask(task, nextOptions)
```

3. `uploadOneTask()` 优先用 `options.storageConfig`，没有再请求。
4. 或在 service 层加短 TTL cache，并提供刷新方法。

**验证**

批量 10 个文件逐个上传路径中 `fetchStorageConfig` 调用不超过 1 次。

### 4.2 `isEmpty` 语义统一

**改法**

1. 保留 `isEmpty()` 为数据空值语义：`null`、`undefined`、空字符串、空数组、空对象、空 Map/Set。
2. 不再将 `0` 和 `false` 判空。
3. 如需要旧语义，新增 `isBlankOrFalsy()`，并只在明确 UI 场景使用。
4. 更新 `helper.test.ts`。

**验证**

```bash
pnpm vitest run src/utils/helper.test.ts
```

### 4.3 分页双触发

**改法**

1. 新代码统一使用 emit。
2. `pageChange/pageSizeChange` 函数 props 标记 deprecated。
3. `tableList` 不再同时透传 emit 和调用函数 props；短期兼容可加互斥：

```ts
if (hasListener) emit(...)
else props.pagination?.pageChange?.(page)
```

Vue 里不容易直接判断 listener，可更简单地只保留 emit，并批量更新调用方。

**验证**

列表翻页只发一次请求。

### 4.4 ProTable reset 恢复

**改法**

1. 初始化时保存 search schema 的默认值。
2. `handleReset()` 不只依赖 Element Plus `resetFields()`，显式重建 `localModel`。
3. emit `update:searchModel` 和 `reset` 的顺序固定：先同步空模型，再触发 reset。

**验证**

日期范围、select、input 混合搜索后重置，外层 `queryWhere` 不残留旧值。

---

## 5. 测试补齐计划

| 模块                                 | 重点用例                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `auth.test.ts`                       | logout API reject 仍清理；token expired 吊销 refresh token；`updateToken(NaN)` 不覆盖 |
| `request.test.ts`                    | `_skipAuth` 401 行为；Mock 未匹配 404；Mock handler error 500；Blob 请求              |
| `useFileUpload.test.ts`              | 重试使用 task 自身 options；`clearTasks` abort；`fetchStorageConfig` 调用次数         |
| `notification.test.ts`               | action_url 白名单；toast 点击安全跳转；WebSocket close 4001/4002                      |
| 新增 `directives/permission.test.ts` | hide/disable/remove/or/updated/unmounted                                              |
| i18n 测试                            | zh/en key 对齐；monitor/role/notification/avatarUpload 无缺失 key                     |

---

## 6. 最终验收命令

完成上述修复后至少运行：

```bash
pnpm run type-check
pnpm run lint
pnpm run test:run
```

高风险修复完成后再运行：

```bash
pnpm run build:production
```

若只修改 `nginx.conf.final`，还需在目标部署环境运行：

```bash
nginx -t
```

---

## 7. 注意事项

- 不要把 `FRONTEND_CODE_REVIEW_FINAL_SUMMARY.md` 的“已修复/未修复”当成当前事实，必须按当前源码复核。
- Token localStorage 是架构级风险，前端单独改动无法彻底解决，需要后端配合 Cookie/刷新接口。
- Mock 严格失败会暴露更多未补齐 handler，这是正确行为，不应回退为自动成功。
- a11y 修复不能只加 `aria-label`，必须保证键盘路径真实可操作。
- i18n 修复不要新增只在中文存在的 key，必须 zh/en 同步。
