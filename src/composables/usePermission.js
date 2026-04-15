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

    const buttonPermissions = computed(() => authStore.buttonPermissions || [])

    const checkPermission = (permission) => {
        return hasPermission(permission)
    }

    const getButtonInfo = (code) => {
        return authStore.getButtonInfo(code)
    }

    const getButtonInfoFull = (code) => {
        return authStore.getButtonInfoFull(code)
    }

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
