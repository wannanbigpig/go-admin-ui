import { useAuthStore } from '@/stores/auth'

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
  const permissions = authStore.buttonPermissions || []

  // 如果没有传入权限标识，默认有权限
  if (!permission) {
    return true
  }

  // 如果传入的是数组，需要所有权限都存在
  if (Array.isArray(permission)) {
    return permission.every((perm) => {
      const hasPerm = permissions.includes(perm)
      // 如果权限不存在或不需要检查显示状态，直接返回权限检查结果
      if (!hasPerm || !checkShow) {
        return hasPerm
      }
      // 如果需要检查显示状态，使用 shouldShowButton
      return authStore.shouldShowButton(perm)
    })
  }

  // 单个权限标识
  const hasPerm = permissions.includes(permission)
  // 如果权限不存在或不需要检查显示状态，直接返回权限检查结果
  if (!hasPerm || !checkShow) {
    return hasPerm
  }
  // 如果需要检查显示状态，使用 shouldShowButton
  return authStore.shouldShowButton(permission)
}
