import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/auth'

/**
 * 权限相关的组合式函数。
 *
 * 设计取向：
 * - 直接代理 authStore 提供的查询能力，不在 composable 层做缓存。
 *   authStore.buttonPermissionMap 已经是 Map，O(1) 查找；
 *   多层缓存会让 `is_show` 变更后的可见态滞后，因此移除原本的 buttonInfoCache。
 */
export function usePermission() {
    const authStore = useAuthStore()

    const buttonPermissions = computed(() => authStore.buttonPermissions || [])

    const checkPermission = (permission: string | string[], checkShow = false) => {
        return hasPermission(permission, checkShow)
    }

    const getButtonInfo = (code: string) => {
        return authStore.getButtonInfo(code)
    }

    const getButtonInfoFull = (code: string) => {
        return authStore.getButtonInfoFull(code) || null
    }

    const shouldShowButton = (code: string) => {
        return authStore.shouldShowButton(code)
    }

    const invalidatePermissionCache = async () => {
        await authStore.refreshUserInfo({ force: true })
    }

    return {
        buttonPermissions,
        checkPermission,
        getButtonInfo,
        getButtonInfoFull,
        shouldShowButton,
        invalidatePermissionCache,
    }
}
