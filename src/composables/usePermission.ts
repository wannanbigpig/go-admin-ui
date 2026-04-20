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

    const buttonPermissions = computed(() => authStore.buttonPermissions || [])

    const checkPermission = (permission: string | string[]) => {
        return hasPermission(permission)
    }

    const getButtonInfo = (code: string) => {
        return authStore.getButtonInfo(code)
    }

    const getButtonInfoFull = (code: string) => {
        return authStore.getButtonInfoFull(code)
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
