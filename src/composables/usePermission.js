import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/auth'

/**
 * 权限相关的组合式函数
 * 使用方法：
 * const { checkPermission, buttonPermissions, getButtonInfo } = usePermission()
 *
 * // 在模板中使用
 * <el-button v-if="checkPermission('adminUser:edit')">编辑</el-button>
 *
 * // 获取按钮信息（图标或名称）
 * const buttonInfo = getButtonInfo('adminUser:edit')
 */
export function usePermission() {
  const authStore = useAuthStore()

  // 获取所有按钮权限列表
  const buttonPermissions = computed(() => authStore.buttonPermissions || [])

  // 检查权限的方法
  const checkPermission = (permission) => {
    return hasPermission(permission)
  }

  // 获取按钮信息（图标或名称）
  const getButtonInfo = (code) => {
    return authStore.getButtonInfo(code)
  }

  // 获取完整的按钮信息对象（包括 icon, title, is_show）
  const getButtonInfoFull = (code) => {
    return authStore.getButtonInfoFull(code)
  }

  // 检查按钮是否应该显示（有权限且 is_show 为 true）
  const shouldShowButton = (code) => {
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
