import { defineStore } from 'pinia'
import { fetchCurrentUser, fetchUserMenuTree, loginWithCredentials as submitLogin } from '@/modules/auth/service'
import { createEmptyUserInfo } from '@/modules/auth/model'
import router from '@/router'
import { removeDynamicRoute, convertRoute } from '@/router/dynamicRoutes'
import { ref, computed } from 'vue'
import { buildButtonPermissionMap, extractButtonPermissions } from '@/modules/auth/permission'
import { ElMessageBox } from 'element-plus'
import { Logger } from '@/utils/logger'
import type { UserInfo, UserPermission } from '@/types/auth'

// ==================== 常量定义 ====================
/** 当前刷新用户信息的 Promise（用于并发控制） */
let refreshingPromise: Promise<void> | null = null

export const useAuthStore = defineStore(
    'auth',
    () => {
        // ==================== State ====================
        const access_token = ref<string>('')
        const expires_at = ref<number>(0)
        const userInfo = ref<UserInfo>(createEmptyUserInfo())
        const menu = ref<UserPermission[]>([])
        const isTokenExpiredModalShown = ref<boolean>(false)

        // ==================== Getters ====================
        /**
         * 检查 token 是否过期
         */
        const isTokenExpired = computed(() => {
            return Date.now() / 1000 >= expires_at.value
        })

        /**
         * 获取 token（如果过期则返回空字符串）
         */
        const token = computed(() => {
            return isTokenExpired.value ? '' : access_token.value
        })

        /**
         * 路由数据（转换为 Vue Router 格式）
         */
        const routerData = computed(() => convertRoute(menu.value))

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
            return buildButtonPermissionMap(menu.value)
        })

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
            updateToken(result.access_token, result.expires_at)
            try {
                await refreshUserInfo()
            } catch (error) {
                Logger.error('登录后刷新用户信息失败:', error)
            }
            return result
        }

        /**
         * 刷新用户信息（支持并发控制，多次调用共享同一个 Promise）
         */
        const refreshUserInfo = async () => {
            // 如果已有刷新请求在进行中，直接返回共享该 Promise
            if (refreshingPromise) {
                return refreshingPromise
            }

            refreshingPromise = (async () => {
                try {
                    const [userInfoRes, menuListRes] = await Promise.all([fetchCurrentUser(), fetchUserMenuTree()])
                    userInfo.value = userInfoRes
                    menu.value = menuListRes
                    removeDynamicRoute()
                } finally {
                    refreshingPromise = null
                }
            })()

            return refreshingPromise
        }

        /**
         * 更新 token
         */
        const updateToken = (token: string, exp: number) => {
            access_token.value = token
            expires_at.value = exp
        }

        /**
         * 重置认证状态
         */
        const resetAuthStore = () => {
            access_token.value = ''
            expires_at.value = 0
            userInfo.value = createEmptyUserInfo()
            menu.value = []
            isTokenExpiredModalShown.value = false
            refreshingPromise = null
            localStorage.removeItem('__persisted__auth')
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
            ElMessageBox.alert('登录状态已过期，请重新登录', '系统提示', {
                type: 'warning',
                confirmButtonText: '重新登陆',
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
            userInfo,
            menu,
            // Getters
            isTokenExpired,
            token,
            routerData,
            buttonPermissions,
            buttonPermissionMap,
            // Actions
            loginWithCredentials,
            refreshUserInfo,
            updateToken,
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
            key: 'auth',
            storage: localStorage,
            paths: ['access_token', 'expires_at', 'userInfo', 'menu'],
        },
    }
)
