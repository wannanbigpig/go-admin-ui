import { defineStore } from 'pinia'
import { fetchCurrentUser, fetchUserMenuTree, loginWithCredentials as submitLogin } from '@/modules/auth/service'
import { createEmptyUserInfo } from '@/modules/auth/model'
import router from '@/router'
import { removeDynamicRoute, convertRoute, addDynamicRoutes, findFirstValidRoute } from '@/router/dynamicRoutes'
import { ref, computed } from 'vue'
import { buildButtonPermissionMap, extractButtonPermissions } from '@/modules/auth/permission'
import { ElMessageBox } from 'element-plus'
import { Logger } from '@/utils/logger'
import type { UserInfo, UserPermission } from '@/types/auth'
import { translate } from '@/locales'

// ==================== 常量定义 ====================
/** 当前刷新用户信息的 Promise（用于并发控制） */
let refreshingPromise: Promise<void> | null = null
const AUTH_PERSIST_KEY = 'auth'
const REFRESH_TOKEN_KEY = 'refresh_token'
const REFRESH_EXPIRES_KEY = 'refresh_expires_at'

export const useAuthStore = defineStore(
    'auth',
    () => {
        // ==================== State ====================
        const access_token = ref<string>('')
        const expires_at = ref<number>(0)
        const refresh_token = ref<string>('')
        const refresh_expires_at = ref<number>(0)
        const userInfo = ref<UserInfo>(createEmptyUserInfo())
        const menu = ref<UserPermission[]>([])
        const isTokenExpiredModalShown = ref<boolean>(false)
        const authStateVersion = ref(0)
        const authSessionVersion = ref(0)

        // ==================== Getters ====================
        /**
         * 检查 token 是否过期
         */
        const isTokenExpired = computed(() => {
            return Date.now() / 1000 >= expires_at.value
        })

        const token = computed(() => {
            return isTokenExpired.value ? '' : access_token.value
        })

        /**
         * 获取 refresh_token（仅在未过期时返回）
         */
        const refreshToken = computed(() => {
            if (Date.now() / 1000 >= refresh_expires_at.value) return ''
            return refresh_token.value
        })

        /**
         * 路由数据（转换为 Vue Router 格式）
         */
        const routerData = computed(() => {
            // 显式声明依赖版本号，保障响应式刷新
            void authStateVersion.value
            return convertRoute(menu.value)
        })

        /**
         * 第一个可访问的路由路径
         */
        const firstPath = computed(() => findFirstValidRoute(routerData.value))

        /**
         * 提取所有按钮权限的 code 列表
         */
        const buttonPermissions = computed(() => {
            return extractButtonPermissions(menu.value)
        })

        /**
         * 按钮权限信息映射
         */
        const buttonPermissionMap = computed(() => {
            // 显式声明依赖版本号，保障响应式刷新
            void authStateVersion.value
            return buildButtonPermissionMap(menu.value)
        })

        const syncDynamicRoutesFromMenu = (menuList: UserPermission[]) => {
            const routes = convertRoute(menuList)
            if (routes.length === 0) {
                removeDynamicRoute()
                return
            }
            addDynamicRoutes(routes)
        }

        /**
         * 根据权限 code 获取按钮信息
         */
        const getButtonInfo = (code: string) => {
            const info = buttonPermissionMap.value.get(code)
            if (!info) return null
            return info.icon || info.title || code
        }

        /**
         * 根据权限 code 获取完整的按钮信息对象
         */
        const getButtonInfoFull = (code: string) => {
            return buttonPermissionMap.value.get(code) || null
        }

        /**
         * 检查按钮是否应该显示
         */
        const shouldShowButton = (code: string) => {
            const info = buttonPermissionMap.value.get(code)
            if (!info) return false
            if (!info.is_show) return false
            return buttonPermissions.value.includes(code)
        }

        // ==================== Actions ====================
        /**
         * 使用凭证登录
         */
        const loginWithCredentials = async (credentials: Record<string, unknown>) => {
            resetAuthStore()
            const result = await submitLogin(credentials)
            updateToken(result.access_token, result.expires_at, result.refresh_token, result.refresh_expires_at)
            try {
                await refreshUserInfo({ force: true })
            } catch (error) {
                Logger.error('登录后刷新用户信息失败:', error)
                resetAuthStore()
                throw error
            }
            return result
        }

        /**
         * 刷新用户信息（支持并发控制，多次调用共享同一个 Promise）
         * force=true 时跳过共享 promise，强制发起新的请求（用于登录后必须拿到新鲜数据的场景）
         */
        const refreshUserInfo = async ({ force = false }: { force?: boolean } = {}) => {
            // 复用未完成的 promise，避免重复请求
            if (!force && refreshingPromise) {
                return refreshingPromise
            }

            let refreshPromise: Promise<void> | null = null
            refreshPromise = (async () => {
                const requestSessionVersion = authSessionVersion.value
                try {
                    const [userInfoRes, menuListRes] = await Promise.all([fetchCurrentUser(), fetchUserMenuTree()])
                    if (requestSessionVersion !== authSessionVersion.value) {
                        return
                    }
                    userInfo.value = userInfoRes
                    menu.value = menuListRes
                    authStateVersion.value++ // 更新权限相关状态的版本号，触发 Computed 重算
                    syncDynamicRoutesFromMenu(menuListRes)
                } catch (error) {
                    if (refreshingPromise === refreshPromise) {
                        refreshingPromise = null
                    }
                    throw error
                } finally {
                    // 仅清理仍指向当前 promise 的引用，避免覆盖后续 force 调用挂上的新 promise
                    if (refreshingPromise === refreshPromise) {
                        refreshingPromise = null
                    }
                }
            })()

            refreshingPromise = refreshPromise
            return refreshingPromise
        }

        /**
         * 更新 token（支持可选的 refresh_token 参数）
         */
        const updateToken = (token: string, exp: number, newRefreshToken?: string, newRefreshExpiresAt?: number) => {
            // 单调递增校验，防止并发响应旧的刷新 token 覆盖了更新的版本
            // access_token + refresh_token 作为原子对一起更新，避免内存与 localStorage 不同步
            if (exp > expires_at.value) {
                access_token.value = token
                expires_at.value = exp
                authStateVersion.value++
                if (newRefreshToken !== undefined) {
                    refresh_token.value = newRefreshToken
                    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
                }
                if (newRefreshExpiresAt !== undefined) {
                    refresh_expires_at.value = newRefreshExpiresAt
                    localStorage.setItem(REFRESH_EXPIRES_KEY, String(newRefreshExpiresAt))
                }
            }
        }

        /**
         * 从 localStorage 恢复 refresh_token
         */
        const restoreRefreshToken = () => {
            const storedRT = localStorage.getItem(REFRESH_TOKEN_KEY)
            const storedExp = localStorage.getItem(REFRESH_EXPIRES_KEY)
            if (storedRT) {
                refresh_token.value = storedRT
            }
            if (storedExp) {
                refresh_expires_at.value = Number(storedExp)
            }
        }

        // 初始化时恢复
        restoreRefreshToken()

        /**
         * 重置认证状态
         */
        const resetAuthStore = () => {
            authSessionVersion.value++
            authStateVersion.value++
            access_token.value = ''
            expires_at.value = 0
            refresh_token.value = ''
            refresh_expires_at.value = 0
            userInfo.value = createEmptyUserInfo()
            menu.value = []
            isTokenExpiredModalShown.value = false
            refreshingPromise = null
            localStorage.removeItem(AUTH_PERSIST_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            localStorage.removeItem(REFRESH_EXPIRES_KEY)
            removeDynamicRoute()
        }

        /**
         * 退出登录
         */
        const logout = (redirectUrl?: string) => {
            resetAuthStore()
            router.push({ name: 'Login', query: { redirect: redirectUrl } })
        }

        /**
         * 处理 token 过期
         */
        const handleTokenExpired = () => {
            if (isTokenExpiredModalShown.value) return

            isTokenExpiredModalShown.value = true
            ElMessageBox.alert(translate('validation.tokenExpired.content'), translate('validation.tokenExpired.title'), {
                type: 'warning',
                confirmButtonText: translate('validation.tokenExpired.relogin'),
                callback: (action: string) => {
                    if (action === 'confirm') {
                        isTokenExpiredModalShown.value = false
                        const redirectUrl = router.currentRoute.value.fullPath
                        logout(redirectUrl)
                    } else {
                        isTokenExpiredModalShown.value = false
                    }
                },
            })
        }

        return {
            // State
            access_token,
            expires_at,
            refresh_token,
            refresh_expires_at,
            userInfo,
            menu,
            // Getters
            isTokenExpired,
            token,
            refreshToken,
            routerData,
            firstPath,
            buttonPermissions,
            buttonPermissionMap,
            // Actions
            loginWithCredentials,
            refreshUserInfo,
            updateToken,
            resetAuthStore,
            logout,
            handleTokenExpired,
            // Button Permission Helpers
            getButtonInfo,
            getButtonInfoFull,
            shouldShowButton,
        }
    },
    {
        persist: {
            key: AUTH_PERSIST_KEY,
            storage: localStorage,
            paths: ['access_token', 'expires_at', 'userInfo', 'menu'],
        },
    }
)
