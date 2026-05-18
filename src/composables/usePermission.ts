import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/auth'

/**
 * 权限相关的组合式函数。
 *
 * @returns 提供按钮权限列表与权限判断方法
 */
export function usePermission() {
    const authStore = useAuthStore()
    const buttonInfoCache = new Map<string, Record<string, unknown>>()

    const buttonPermissions = computed(() => authStore.buttonPermissions || [])

    const checkPermission = (permission: string | string[]) => {
        return hasPermission(permission)
    }

    const getButtonInfo = (code: string) => {
        return authStore.getButtonInfo(code)
    }

    const createLiveButtonInfo = (code: string) => {
        return {
            get icon() {
                return authStore.getButtonInfoFull(code)?.icon || ''
            },
            get title() {
                return authStore.getButtonInfoFull(code)?.title || ''
            },
            get is_show() {
                return authStore.getButtonInfoFull(code)?.is_show === true
            },
        }
    }

    const getButtonInfoFull = (code: string) => {
        if (!buttonInfoCache.has(code)) {
            buttonInfoCache.set(code, createLiveButtonInfo(code))
        }
        return buttonInfoCache.get(code) || null
    }

    const shouldShowButton = (code: string) => {
        return authStore.shouldShowButton(code)
    }

    return {
        buttonPermissions,
        checkPermission,
        getButtonInfo,
        getButtonInfoFull,
        shouldShowButton,
    }
}
