import { defineStore } from 'pinia'
import { login } from '@/api/login'
import { getUserInfo, getUserMenuList } from '@/api/auth'
import router from '@/router'
import { removeDynamicRoute, convertRoute } from '@/router/dynamicRoutes'
import { ref, computed } from 'vue'

// ==================== 常量定义 ====================
/** 按钮类型标识 */
const BUTTON_TYPE = 3

/** 显示状态值 */
const SHOW_STATUS = {
    YES: 1,
    NO: 0,
}

export const useAuthStore = defineStore(
    'auth',
    () => {
        // ==================== State ====================
        const access_token = ref('')
        const expires_at = ref(0)
        const userInfo = ref({})
        const menu = ref([])
        const isTokenExpiredModalShown = ref(false)
        const isRefreshUserInfo = ref(false)

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
        const routerData = computed(() => convertRoute(menu.value), {
            cache: true,
        })

        /**
         * 提取所有按钮权限的 code 列表（递归处理树形结构）
         */
        const buttonPermissions = computed(() => {
            const permissions = []
            const extractButtonCodes = (items) => {
                if (!Array.isArray(items)) return
                items.forEach((item) => {
                    if (item.type === BUTTON_TYPE && item.code) {
                        permissions.push(item.code)
                    }
                    if (item.children?.length > 0) {
                        extractButtonCodes(item.children)
                    }
                })
            }
            extractButtonCodes(menu.value)
            return permissions
        })

        /**
         * 按钮权限信息映射（code -> {icon, title, is_show}）
         */
        const buttonPermissionMap = computed(() => {
            const map = new Map()
            const extractButtonInfo = (items) => {
                if (!Array.isArray(items)) return
                items.forEach((item) => {
                    if (item.type === BUTTON_TYPE && item.code) {
                        map.set(item.code, {
                            icon: item.icon || '',
                            title: item.title || '',
                            is_show: item.is_show === SHOW_STATUS.YES,
                        })
                    }
                    if (item.children?.length > 0) {
                        extractButtonInfo(item.children)
                    }
                })
            }
            extractButtonInfo(menu.value)
            return map
        })

        /**
         * 根据权限 code 获取按钮信息（图标或名称）
         */
        const getButtonInfo = (code) => {
            const info = buttonPermissionMap.value.get(code)
            if (!info) return null
            return info.icon || info.title || code
        }

        /**
         * 根据权限 code 获取完整的按钮信息对象
         */
        const getButtonInfoFull = (code) => {
            return buttonPermissionMap.value.get(code) || null
        }

        /**
         * 检查按钮是否应该显示（有权限且 is_show 为 true）
         */
        const shouldShowButton = (code) => {
            const info = buttonPermissionMap.value.get(code)
            if (!info) return false
            if (!info.is_show) return false
            return buttonPermissions.value.includes(code)
        }
        // ==================== Actions ====================
        /**
         * 使用凭证登录
         */
        const loginWithCredentials = async (credentials) => {
            resetAuthStore()
            const res = await login(credentials)
            updateToken(res.data.access_token, res.data.expires_at)
            // 登录成功后立即刷新用户信息和菜单，确保路由跳转时数据已准备好
            try {
                await refreshUserInfo()
            } catch (error) {
                console.error('登录后刷新用户信息失败:', error)
                // 即使刷新失败，也允许登录继续，路由守卫会处理
            }
            return res
        }

        /**
         * 刷新用户信息
         */
        const refreshUserInfo = async () => {
            if (isRefreshUserInfo.value) {
                // 如果正在刷新，等待刷新完成
                while (isRefreshUserInfo.value) {
                    await new Promise((resolve) => setTimeout(resolve, 50))
                }
                return
            }

            isRefreshUserInfo.value = true
            try {
                const [userInfoRes, menuListRes] = await Promise.all([getUserInfo(), getUserMenuList()])
                userInfo.value = userInfoRes.data
                menu.value = menuListRes.data
                removeDynamicRoute()
            } finally {
                isRefreshUserInfo.value = false
            }
        }

        /**
         * 更新 token
         */
        const updateToken = (token, exp) => {
            access_token.value = token
            expires_at.value = exp
        }

        /**
         * 重置认证状态
         */
        const resetAuthStore = () => {
            access_token.value = ''
            expires_at.value = 0
            userInfo.value = {}
            menu.value = []
            isTokenExpiredModalShown.value = false
            isRefreshUserInfo.value = false
            localStorage.removeItem('__persisted__auth')
            removeDynamicRoute()
        }

        /**
         * 退出登录
         */
        const logout = (redirectUrl) => {
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
                callback: (action) => {
                    if (action === 'confirm') {
                        isTokenExpiredModalShown.value = false
                        const redirectUrl = router.currentRoute.value.fullPath
                        logout(redirectUrl)
                    } else if (action === 'cancel') {
                        // 如果取消，则重置 isTokenExpiredModalShown 为 false
                        isTokenExpiredModalShown.value = false
                    }
                },
            })
        }

        // ==================== 返回值 ====================
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
