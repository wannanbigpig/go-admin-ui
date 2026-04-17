import { useAuthStore } from '@/stores/auth'
import { hasButtonPermission } from '@/modules/auth/permission'

// ==================== 常量定义 ====================
const TokenKey = 'X-L-Admin-Token'

// ==================== Token 操作方法 ====================
export function getToken(): string | null {
    return localStorage.getItem(TokenKey)
}

export function setToken(token: string): void {
    localStorage.setItem(TokenKey, token)
}

export function removeToken(): void {
    localStorage.removeItem(TokenKey)
}

// ==================== 权限检查方法 ====================
export function hasPermission(permission: string | string[], checkShow = false): boolean {
    const authStore = useAuthStore()
    return hasButtonPermission(authStore.buttonPermissionMap, authStore.buttonPermissions, permission, checkShow)
}
