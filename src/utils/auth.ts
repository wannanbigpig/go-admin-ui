import { useAuthStore } from '@/stores/auth'
import { hasButtonPermission } from '@/modules/auth/permission'

// ==================== 权限检查方法 ====================
export function hasPermission(permission: string | string[], checkShow = false): boolean {
    const authStore = useAuthStore()
    return hasButtonPermission(authStore.buttonPermissionMap, authStore.buttonPermissions, permission, checkShow)
}
