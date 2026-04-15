import { useAuthStore } from '@/stores/auth'
import { hasButtonPermission } from '@/modules/auth/permission'

// ==================== 常量定义 ====================
/** Token 在 localStorage 中的存储键名 */
const TokenKey = 'X-L-Admin-Token'

// ==================== Token 操作方法 ====================
/**
 * 获取 Token
 * @returns {string|null} Token 字符串，如果不存在则返回 null
 */
export function getToken() {
  return localStorage.getItem(TokenKey)
}

/**
 * 设置 Token
 * @param {string} token - Token 字符串
 */
export function setToken(token) {
  localStorage.setItem(TokenKey, token)
}

/**
 * 移除 Token
 */
export function removeToken() {
  localStorage.removeItem(TokenKey)
}

// ==================== 权限检查方法 ====================
/**
 * 检查用户是否有指定按钮权限
 * @param {string|string[]} permission - 权限标识，可以是单个字符串或字符串数组
 * @param {boolean} checkShow - 是否检查按钮的显示状态（is_show），默认为 false
 * @returns {boolean} 是否有权限
 */
export function hasPermission(permission, checkShow = false) {
  const authStore = useAuthStore()
  return hasButtonPermission(authStore.buttonPermissionMap, authStore.buttonPermissions, permission, checkShow)
}
