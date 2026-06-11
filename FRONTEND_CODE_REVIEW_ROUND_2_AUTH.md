# 第 2 轮前端专项 Code Review：登录与权限

---

## 1. 本轮审查范围

实际阅读的文件清单：

**路由与守卫**

- `src/router/index.ts`
- `src/router/guard.ts`
- `src/router/constantRoutes.ts`
- `src/router/dynamicRoutes.ts`
- `src/router/componentMap.ts`

**认证 Store 与模型**

- `src/stores/auth.ts`
- `src/stores/index.ts`
- `src/stores/setting.ts`
- `src/stores/notification.ts`
- `src/modules/auth/service.ts`
- `src/modules/auth/model.ts`
- `src/modules/auth/permission.ts`
- `src/types/auth.d.ts`

**请求与工具**

- `src/utils/request.ts`
- `src/utils/env.ts`
- `src/utils/auth.ts`
- `src/utils/redirect.ts`
- `src/modules/shared/constants.ts`
- `src/modules/shared/response.ts`

**权限指令与组合式函数**

- `src/directives/permission.ts`
- `src/composables/usePermission.ts`

**页面与布局**

- `src/views/login/index.vue`
- `src/layout/header/right.vue`
- `src/layout/header/notificationCenter.vue`

**API 层**

- `src/api/auth.ts`
- `src/api/login.ts`

---

## 2. 调用链说明

### 2.1 项目启动后如何初始化用户态

```
main.ts
  → createApp + use(pinia) + use(router) + use(i18n)
  → auth store 从 localStorage 恢复 access_token / expires_at / userInfo / menu（persistedstate）
  → auth store 初始化时调用 restoreRefreshToken() 从 localStorage 恢复 refresh_token
  → router.beforeEach 触发 guard.ts
```

### 2.2 路由守卫如何判断登录态

```
guard.ts beforeEach(to)
  → NProgress.start()
  → 如果 to.name === 'Login'：已登录则重定向到 firstPath，未登录放行
  → 如果 authStore.token 为空（过期或未登录）：redirectToLogin(to)
  → refreshUserInfoIfNeeded()：检查 userInfo/routerData 是否为空
      → 为空则调用 authStore.refreshUserInfo()（并发控制：共享 refreshingPromise）
      → 失败则 resetAuthStore + redirectToLogin
  → handleDynamicRoutes()：检查 checkDynamicRouteExists()
      → 未注册则调用 addDynamicRoutes(authStore.routerData)
      → 已注册则直接放行（return undefined）
  → 根路径 '/' 且 matched.length <= 1 时重定向到 firstPath
```

### 2.3 权限数据如何加载

```
authStore.refreshUserInfo()
  → Promise.all([fetchCurrentUser(), fetchUserMenuTree()])
  → userInfo.value = userInfoRes
  → menu.value = menuListRes
  → authStateVersion.value++（触发 routerData / buttonPermissionMap 等 computed 重算）
  → syncDynamicRoutesFromMenu(menuListRes)
```

### 2.4 动态路由如何生成

```
authStore.routerData (computed)
  → convertRoute(menu.value)
  → 递归遍历菜单树，过滤 type=3 的按钮节点
  → 通过 componentMap 解析 component_key → 懒加载组件
  → router.addRoute('Layout', route) 逐个注册
```

### 2.5 按钮权限如何判断

```
authStore.buttonPermissions (computed)
  → extractButtonPermissions(menu)：递归提取所有 type=3 节点的 code

authStore.buttonPermissionMap (computed)
  → buildButtonPermissionMap(menu)：构建 Map<code, {icon, title, is_show}>

hasPermission(code, checkShow)
  → buttonPermissions.includes(code) && (checkShow ? map.get(code).is_show : true)

v-permission 指令
  → mounted/updated 时调用 hasPermission()
  → 无权限时：hide(disable/hide/remove)
```

### 2.6 Token 过期如何处理

```
请求拦截器：authStore.token（computed，过期返回 ''）→ 不注入 Authorization 头
  → 后端返回 401（HTTP 或业务码）
  → 响应拦截器调用 authStore.handleTokenExpired()
  → isTokenExpiredModalShown 防重入
  → ElMessageBox.alert 提示用户
  → 用户确认 → authStore.logout() → resetAuthStore() + router.push(Login)

Token 滑动刷新：
  → 响应头 refresh-access-token / refresh-exp
  → authStore.updateToken() → 单调递增校验 exp > expires_at
```

### 2.7 退出登录如何清理状态

```
手动退出（right.vue handleLogout）：
  → await logout(authStore.refreshToken)  // API 调用，传 refresh_token
  → authStore.logout() → resetAuthStore()
      → authSessionVersion++, authStateVersion++
      → 清空 access_token / expires_at / refresh_token / refresh_expires_at / userInfo / menu
      → localStorage.removeItem('auth' / 'refresh_token' / 'refresh_expires_at')
      → removeDynamicRoute()
  → router.push(Login)

Token 过期退出（handleTokenExpired）：
  → authStore.logout() → resetAuthStore()  // 不调用服务端 API

WebSocket 强踢（notification.ts onclose）：
  → stop() + authStore.logout()  // 不调用服务端 API
```

---

## 3. 已确认问题

### 问题 1：退出登录 API 失败时前端状态不清理，用户卡在登录态

- **严重等级**：High
- **文件**：`src/layout/header/right.vue`
- **代码位置**：第 151-169 行
- **问题描述**：手动退出登录时，先调用 `logout(authStore.refreshToken)` API 通知服务端吊销 refresh_token，成功后再调用 `authStore.logout()` 清理前端状态。如果 API 调用失败（网络异常、服务端 500），catch 块仅做 `Logger.error`，**不调用 `authStore.logout()`**。用户停留在当前页面，仍处于登录态，没有任何用户可见的错误提示。
- **触发条件**：退出登录时后端 API 不可用或网络中断
- **影响范围**：用户无法退出登录，无错误提示，体验极差
- **证据**：
    ```typescript
    // right.vue 第 151-169 行
    const handleLogout = async () => {
        try {
            await ElMessageBox.confirm(...)
            await logout(authStore.refreshToken)  // API 调用，可能失败
            authStore.logout(...)  // 失败时不会执行
            ElMessage({ type: 'success', ... })
        } catch (error) {
            if (error !== 'cancel') {
                Logger.error('退出登录失败:', error)  // 仅日志，无用户提示，无状态清理
            }
        }
    }
    ```
- **修复建议**：catch 块中应显示错误提示 `ElMessage.error(t('logout.failed'))`，并提供"强制退出"选项调用 `authStore.logout()` 清理本地状态。

---

### 问题 2：Token 过期和 WebSocket 强踢时未调用服务端吊销 refresh_token

- **严重等级**：High
- **文件**：`src/stores/auth.ts`
- **代码位置**：第 245-262 行（handleTokenExpired）、第 237-240 行（logout）
- **问题描述**：`handleTokenExpired` 中用户确认后直接调用 `authStore.logout()` → `resetAuthStore()`，**不调用服务端 logout API**。同样，`notification.ts` 第 563 行 WebSocket 收到 4001/4002 强踢码时也直接调用 `authStore.logout()`。这意味着 refresh_token 在服务端仍然有效，攻击者若获取该 token 可继续刷新获取新 access_token。
- **触发条件**：(a) access_token 过期用户点确认；(b) WebSocket 收到会话终止码 4001/4002
- **影响范围**：refresh_token 泄露后无法被服务端吊销，在有效期内可被滥用
- **证据**：

    ```typescript
    // auth.ts 第 253-256 行
    if (action === 'confirm') {
        isTokenExpiredModalShown.value = false
        const redirectUrl = router.currentRoute.value.fullPath
        logout(redirectUrl) // 只调用 store 的 logout，不调用 API/auth.ts 的 logout()
    }

    // auth.ts 第 237-240 行 — store 的 logout 方法
    const logout = (redirectUrl?: string) => {
        resetAuthStore() // 只清理前端状态
        router.push({ name: 'Login', query: { redirect: redirectUrl } })
    }
    ```

- **修复建议**：在 `resetAuthStore` 之前，尝试调用 `api/auth.ts` 的 `logout(refresh_token)` 吊销 refresh_token。即使调用失败也应继续清理前端状态（fire-and-forget 模式）。

---

### 问题 3：路由守卫不校验具体路由权限，依赖"未注册即不可访问"的隐式策略

- **严重等级**：Medium
- **文件**：`src/router/guard.ts`
- **代码位置**：第 99-105 行（handleDynamicRoutes）
- **问题描述**：路由守卫只检查 (a) token 是否存在、(b) userInfo/routerData 是否为空、(c) 动态路由是否已注册。一旦动态路由注册完成（`checkDynamicRouteExists()` 返回 true），守卫直接放行（return undefined），**不再校验目标路由是否在当前用户的菜单中**。虽然当前架构中"不在菜单中的路由不会被 addRoute 注册，访问会命中 404"，但这是一个**隐式安全策略**，缺少显式的防御层。`meta.isAuth` 在 `dynamicRoutes.ts` 第 94 行被设置，但整个守卫中**没有任何代码读取和使用这个字段**。
- **触发条件**：如果未来 addDynamicRoutes 的实现变化（如注册了全量路由表），或后端返回了错误的菜单数据
- **影响范围**：权限校验完全依赖"路由未注册"这一单点
- **证据**：

    ```typescript
    // guard.ts 第 99-105 行
    async function handleDynamicRoutes(authStore, to, refreshedUserInfo) {
        if (checkDynamicRouteExists()) {
            if (refreshedUserInfo && isNotFoundRoute(to)) {
                return rebuildToRoute(to)
            }
            return undefined  // 直接放行，不检查 to 对应的路由是否在用户菜单中
        }
        // ...
    }

    // dynamicRoutes.ts 第 94 行 — isAuth 被设置但从未被守卫读取
    meta: {
        isAuth: Number(route.is_auth ?? 1) === 1,  // 设置了，但 guard.ts 中无任何使用
    }
    ```

- **修复建议**：在守卫中增加对 `to.meta.isAuth` 的运行时校验，或在 `checkDynamicRouteExists()` 为 true 时验证目标路由名是否存在于 `authStore.routerData` 转换后的路由列表中。

---

### 问题 4：Token 存储在 localStorage，XSS 可窃取全部认证凭据

- **严重等级**：Medium
- **文件**：`src/stores/auth.ts`
- **代码位置**：第 294-298 行（persist 配置）、第 186-188 行（refresh_token 手动存储）
- **问题描述**：`access_token` 通过 pinia-plugin-persistedstate 持久化到 localStorage（key: `'auth'`），`refresh_token` 手动存储到 localStorage（key: `'refresh_token'`）。任何 XSS 漏洞都可通过 `localStorage.getItem('auth')` 和 `localStorage.getItem('refresh_token')` 窃取全部认证凭据。
- **触发条件**：应用存在任何 XSS 漏洞
- **影响范围**：完整的令牌窃取，攻击者可冒充用户身份
- **证据**：

    ```typescript
    // auth.ts 第 294-298 行
    persist: {
        key: AUTH_PERSIST_KEY,  // 'auth'
        storage: localStorage,
        paths: ['access_token', 'expires_at', 'userInfo', 'menu'],
    }

    // auth.ts 第 187-188 行
    refresh_token.value = newRefreshToken
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
    ```

- **修复建议**：这是 SPA + localStorage 认证模式的固有架构风险。若要根治，需改用 httpOnly Cookie 存储 token。作为缓解措施，应确保严格的 CSP 策略和 XSS 防护。

---

### 问题 5：`_skipAuth` 与 `authErrorMode` 无联动，公开接口 401 触发过期弹窗

- **严重等级**：Medium
- **文件**：`src/utils/request.ts`
- **代码位置**：第 144-152 行（请求拦截器）、第 180 行（响应拦截器默认值）
- **问题描述**：当请求设置 `_skipAuth: true` 跳过 Token 注入时，如果该请求返回 HTTP 401，`authErrorMode` 默认为 `'session'`，会触发 `handleTokenExpired()` 弹出过期弹窗并跳转登录页。不需要认证的请求（如获取验证码、公开配置）不应该触发会话过期逻辑。调用方必须同时设置 `authErrorMode: 'credential'` 才能避免弹窗，这是一个容易遗漏的配置组合。
- **触发条件**：使用 `_skipAuth: true` 但未设置 `authErrorMode: 'credential'`，且后端返回 401
- **影响范围**：用户在获取验证码等公开接口 401 时被踢出登录
- **证据**：
    ```typescript
    // request.ts 第 180 行 — 默认值为 'session'
    const authErrorMode =
        (
            response.config as AxiosRequestConfig & {
                authErrorMode?: 'credential' | 'session'
            }
        )?.authErrorMode ?? 'session' // _skipAuth=true 的请求也默认走 session 模式
    ```
- **修复建议**：当 `_skipAuth: true` 时，`authErrorMode` 应默认为 `'credential'` 而非 `'session'`。或在请求拦截器中自动设置。

---

### 问题 6：Token 滑动刷新时 `refresh-exp` 缺失导致 token 更新静默失败

- **严重等级**：Medium
- **文件**：`src/utils/request.ts`
- **代码位置**：第 99-101 行
- **问题描述**：当后端返回 `refresh-access-token` 响应头但未返回 `refresh-exp` 响应头时，`Number(undefined)` = `NaN`。`updateToken` 中 `NaN > expires_at` 永远为 `false`，token 不会被更新，且无任何日志。用户已获取新 token 但前端未存储，后续请求继续使用旧 token，最终过期后被迫重新登录。
- **触发条件**：后端响应头包含 `refresh-access-token` 但缺少 `refresh-exp`
- **影响范围**：用户会话意外过期，需要重新登录
- **证据**：

    ```typescript
    // request.ts 第 99-101 行
    if (response.headers['refresh-access-token']) {
        authStore.updateToken(
            response.headers['refresh-access-token'],
            Number(response.headers['refresh-exp'])  // undefined → NaN
        )
    }

    // auth.ts 第 182 行
    if (exp > expires_at.value) {  // NaN > 任何数 = false，token 不更新
    ```

- **修复建议**：在 `updateToken` 入口校验 `exp` 是否为有效数字，NaN 时记录警告日志并跳过更新。

---

### 问题 7：`v-permission` 指令仅做 UI 层控制，可被 DevTools 绕过

- **严重等级**：Medium（架构性问题，实际安全取决于后端）
- **文件**：`src/directives/permission.ts`
- **代码位置**：第 64-93 行（disableElement / hideElement / removeElement）
- **问题描述**：`v-permission` 通过 CSS `display:none`、`pointer-events` 和 click 拦截实现按钮级权限控制。攻击者可通过 DevTools 恢复元素可见性和可交互性。这是前端权限控制的固有限制，但需要确认后端 API 是否对每个操作做了独立的权限校验。
- **触发条件**：用户打开 DevTools 操作 DOM
- **影响范围**：所有受 v-permission 保护的按钮
- **证据**：
    ```typescript
    // permission.ts 第 80-87 行 — 仅 CSS 隐藏
    function hideElement(el) {
        el.style.display = 'none'
        el.setAttribute('data-permission-hidden', 'true')
    }
    ```
- **修复建议**：确认后端 API 对每个写操作都有独立的权限校验（不依赖前端隐藏）。前端权限仅作为 UX 辅助。

---

### 问题 8：并发请求同时 401 时，多个 catch 块可能产生重复错误提示

- **严重等级**：Low
- **文件**：`src/utils/request.ts` + `src/stores/auth.ts`
- **代码位置**：request.ts 第 115 行、第 212 行；auth.ts 第 245-247 行
- **问题描述**：`handleTokenExpired` 的 `isTokenExpiredModalShown` 防重入机制可防止重复弹窗。但被 reject 的 Promise 会触发各自调用方的 catch 处理，如果调用方在 catch 中显示错误消息（如 `ElMessage.error`），用户会看到多条错误提示。
- **触发条件**：5+ 个并发请求同时返回 401
- **影响范围**：用户体验，非安全问题
- **证据**：
    ```typescript
    // request.ts 第 120-124 行 — 业务码 401 reject 时带错误消息
    if (code !== 0) {
        showApiErrorMessage(response.data, config) // 可能弹出错误消息
        return Promise.reject(response.data)
    }
    ```
- **修复建议**：在 401 场景下，`showApiErrorMessage` 应检查 `isTokenExpiredModalShown` 状态，避免在过期弹窗期间显示额外的错误消息。

---

### 问题 9：`resetAuthStore` 与 `ElMessageBox` 回调之间存在竞态

- **严重等级**：Low
- **文件**：`src/stores/auth.ts`
- **代码位置**：第 226 行、第 245-262 行
- **问题描述**：`resetAuthStore` 将 `isTokenExpiredModalShown` 重置为 false。如果此时 ElMessageBox 弹窗仍在显示，用户点击确认后 callback 会再次调用 `logout()`，产生重复的路由跳转。
- **触发条件**：token 过期弹窗显示期间，路由守卫因 refreshUserInfo 失败调用了 resetAuthStore
- **影响范围**：重复导航到登录页
- **证据**：

    ```typescript
    // resetAuthStore 第 226 行
    isTokenExpiredModalShown.value = false // 重置标志

    // handleTokenExpired 第 252-256 行 — callback 可能在 resetAuthStore 之后触发
    callback: (action: string) => {
        if (action === 'confirm') {
            isTokenExpiredModalShown.value = false
            logout(redirectUrl) // 可能重复执行
        }
    }
    ```

- **修复建议**：在 ElMessageBox callback 中增加状态校验（如检查 `authStore.token` 是否仍有效），避免在已 resetAuthStore 后重复 logout。

---

### 问题 10：`updateToken` 未对 `refresh_expires_at` 做单调递增校验

- **严重等级**：Low
- **文件**：`src/stores/auth.ts`
- **代码位置**：第 179-195 行
- **问题描述**：`updateToken` 通过 `exp > expires_at.value` 保证 access_token 的单调递增。但对 `refresh_expires_at` 的更新没有类似校验，旧响应可能携带较小的值覆盖当前值，导致 refresh_token 被错误标记为过期。
- **触发条件**：并发请求时旧响应比新响应晚到达
- **影响范围**：refresh_token 可能被错误认为已过期
- **证据**：
    ```typescript
    // auth.ts 第 186-193 行
    if (newRefreshExpiresAt !== undefined) {
        refresh_expires_at.value = newRefreshExpiresAt // 无单调递增校验
        localStorage.setItem(REFRESH_EXPIRES_KEY, String(newRefreshExpiresAt))
    }
    ```
- **修复建议**：增加 `if (newRefreshExpiresAt > refresh_expires_at.value)` 校验。

---

## 4. 疑似问题

### 疑似 1：动态路由并发注册可能产生中间状态不一致

- **文件**：`src/router/dynamicRoutes.ts` 第 162-172 行 + `src/stores/auth.ts` 第 84-91 行
- **描述**：`addDynamicRoutes` 的"检查-清除-注册"非原子操作。`syncDynamicRoutesFromMenu`（auth.ts 第 84 行）和 `handleDynamicRoutes`（guard.ts 第 99 行）两个入口可能并发调用 `addDynamicRoutes`。由于 Vue Router 的 addRoute/removeRoute 是同步操作，且 JS 单线程，实际竞态窗口极小。**需要确认**：在快速连续导航场景下是否存在复现路径。

### 疑似 2：persistedstate 的 HMR 热更新可能导致 resetAuthStore 后数据被恢复

- **文件**：`src/stores/auth.ts` 第 217-232 行
- **描述**：`resetAuthStore` 清理了 localStorage 中的 `'auth'`、`'refresh_token'`、`'refresh_expires_at'`。但如果 HMR 触发 store 重建，persistedstate 可能在 resetAuthStore 之后触发 rehydrate，从已被清理的 localStorage 中读取空值（这是正确的）。**但如果有其他代码在 resetAuthStore 和 HMR 之间写入了旧值**，可能导致数据恢复。**需要确认**：HMR 场景下 store 重建的时序。

### 疑似 3：WebSocket ticket 通过 URL query 传输，可能被日志系统记录

- **文件**：`src/stores/notification.ts` 第 109-124 行
- **描述**：WebSocket 认证 ticket 通过 URL query 参数传输（`?ticket=xxx`）。URL 参数可能被浏览器历史、代理日志、CDN 日志记录。**需要确认**：ticket 是否有极短有效期（秒级）且使用后立即失效。

### 疑似 4：UserInfo 的 `[key: string]: unknown` 索引签名可能导致敏感字段持久化

- **文件**：`src/types/auth.d.ts` 第 35 行
- **描述**：UserInfo 接口的索引签名允许任何额外属性。如果后端返回的用户信息包含内部标记、调试信息等敏感字段，这些会被 persistedstate 一并序列化到 localStorage。**需要确认**：后端 `/v1/admin-user/get` 接口的实际返回字段。

### 疑似 5：refresh_token 双重持久化路径可能导致清理不完全

- **文件**：`src/stores/auth.ts`
- **描述**：access_token 走 persistedstate 自动序列化（key: `'auth'`），refresh_token 手动管理（key: `'refresh_token'`）。两套机制增加了出错可能。`resetAuthStore` 手动清理了三个 key，但如果 persistedstate 在 resetAuthStore 之后触发额外的序列化写入，可能产生残留。**需要确认**：persistedstate 插件在 `$patch` / `$reset` 后是否会异步触发 `beforeRestore` / `afterRestore` 钩子。

---

## 5. 建议优先修复顺序

### P0 — 立即修复

1. **退出登录 API 失败时不清理本地状态**（问题 1）：catch 块中增加错误提示和"强制退出"选项
2. **Token 过期 / WebSocket 强踢时未吊销 refresh_token**（问题 2）：在 resetAuthStore 前 fire-and-forget 调用服务端 logout API

### P1 — 尽快修复

3. **`_skipAuth` 与 `authErrorMode` 无联动**（问题 5）：`_skipAuth: true` 时默认 `authErrorMode: 'credential'`
4. **`refresh-exp` 缺失导致 token 更新静默失败**（问题 6）：增加 NaN 校验和警告日志
5. **路由守卫不校验具体路由权限**（问题 3）：增加 `meta.isAuth` 运行时校验或路由名白名单检查

### P2 — 计划修复

6. **`updateToken` 未对 `refresh_expires_at` 做单调递增校验**（问题 10）
7. **`resetAuthStore` 与 ElMessageBox 回调竞态**（问题 9）
8. **并发 401 时重复错误提示**（问题 8）

---

## 6. 建议补充测试

| 测试场景                                                               | 对应问题     | 测试文件建议                       |
| ---------------------------------------------------------------------- | ------------ | ---------------------------------- |
| 退出登录 API 返回 500 时，用户应看到错误提示                           | 问题 1       | `src/stores/auth.test.ts`          |
| 退出登录 API 网络超时时，用户应能强制退出                              | 问题 1       | `src/stores/auth.test.ts`          |
| Token 过期弹窗确认后，应调用服务端 logout API                          | 问题 2       | `src/stores/auth.test.ts`          |
| WebSocket 收到 4001 码后，应调用服务端 logout API                      | 问题 2       | `src/stores/notification.test.ts`  |
| `_skipAuth: true` 请求返回 401 时不应弹过期弹窗                        | 问题 5       | `src/utils/request.test.ts`        |
| 响应头有 `refresh-access-token` 但无 `refresh-exp` 时 token 不应被覆盖 | 问题 6       | `src/utils/request.test.ts`        |
| 快速连续导航（3+ 次）不应导致动态路由重复注册                          | 疑似 1       | `src/router/dynamicRoutes.test.ts` |
| 登录 → 退出 → 再登录后，权限数据应完全更新                             | 架构验证     | `src/stores/auth.test.ts`          |
| 用 A 账号登录后退出，用 B 账号登录，不应看到 A 的权限数据              | 切换账号污染 | `src/stores/auth.test.ts`          |
| `refresh_expires_at` 并发更新时应保持单调递增                          | 问题 10      | `src/stores/auth.test.ts`          |

---

## 7. 下一轮建议

### 建议 1：文件上传与导出模块

**原因**：`src/composables/useFileUpload.ts` 涉及 SHA256 秒传、分片上传、并发控制、失败重试、目录上传竞态。`.aitasks/todo.md` 中已列出 3 个待修复问题（上传失败后重试 File 句柄释放、目录上传并发创建竞态）。`src/views/system/composables/useFileUploadFlow.ts` 和 `src/stores/notification.ts` 中的导出完成通知链路也需审查。

### 建议 2：请求拦截器与 Mock 系统的完整性

**原因**：`src/utils/request.ts` 是所有 API 调用的咽喉，涉及 Mock 降级策略（`VITE_ENABLE_MOCK_FALLBACK`）、Blob JSON 解析、静默业务码、错误消息展示。`src/mock/modules/` 下的 Mock 数据是否与后端真实返回结构一致（`.aitasks/lessons.md` 记录了多次 Mock 字段不对齐问题）。`.aitasks/todo.md` 中有"Mock 未命中非 GET 自动成功"待修复。

### 建议 3：通知 WebSocket 与实时通信安全

**原因**：`src/stores/notification.ts` 的 WebSocket 生命周期管理复杂（ticket 认证、断线重连退避、频道订阅、会话强踢）。ticket 通过 URL query 传输的安全性、心跳保活机制（`.aitasks/todo.md` 中有待补充）、频道订阅的消息分发安全性都需要专项审查。
