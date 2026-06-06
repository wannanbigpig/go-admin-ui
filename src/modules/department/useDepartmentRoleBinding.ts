import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { bindDepartmentRoles, fetchDepartmentDetail } from '@/modules/department/service'
import { DEPARTMENT_SUBMIT_DELAY } from '@/modules/department/model'
import { getRoleOptions, type RoleOption } from '@/api/permission'
import type { Department } from '@/types/department'
import { translate } from '@/locales'

interface UseDepartmentRoleBindingOptions {
    refreshList: () => Promise<void>
}

export function useDepartmentRoleBinding({ refreshList }: UseDepartmentRoleBindingOptions) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref<FormInstance>()
    const { isSubmitting: isBindingRole, runWithSubmitLock } = useSubmitLock(DEPARTMENT_SUBMIT_DELAY)
    const currentDeptName = ref('')
    const roleOptions = ref<RoleOption[]>([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    const bindRoleData = reactive({
        id: 0 as string | number,
        role_ids: [] as number[],
    })

    const filterRole = (query: string, item: RoleOption) => item.name.toLowerCase().includes(query.toLowerCase())

    const normalizeRoleId = (value: unknown): number | null => {
        if (value === null || value === undefined || value === '') return null
        const roleId = typeof value === 'number' ? value : Number(value)
        return Number.isNaN(roleId) ? null : roleId
    }

    const normalizeRoleIds = (value: unknown): number[] => {
        if (!Array.isArray(value)) return []

        return value
            .map((item) => {
                if (typeof item === 'object' && item !== null) {
                    return normalizeRoleId((item as Record<string, unknown>).id ?? (item as Record<string, unknown>).role_id)
                }
                return normalizeRoleId(item)
            })
            .filter((item): item is number => item !== null)
    }

    const fetchRoleOptions = async () => {
        const list = await getRoleOptions()
        roleOptions.value = list.reduce<RoleOption[]>((result, role) => {
            const roleId = normalizeRoleId(role.id)
            if (roleId === null) return result
            result.push({
                ...role,
                id: roleId,
            })
            return result
        }, [])
        return roleOptions.value
    }

    const handleBindRole = async (row: Department) => {
        if (!row || !row.id) {
            ElMessage.error(translate('validation.department.invalidRow'))
            return
        }

        currentDeptName.value = row.name || ''
        bindRoleData.id = row.id
        bindRoleData.role_ids = []
        showBindRoleDrawer.value = true

        if (!roleOptionsLoaded.value || roleOptions.value.length === 0) {
            roleOptionsLoading.value = true
            fetchRoleOptions()
                .then(() => {
                    roleOptionsLoaded.value = true
                })
                .catch((error) => {
                    Logger.error('获取角色列表失败:', error)
                    roleOptionsLoaded.value = false
                })
                .finally(() => {
                    roleOptionsLoading.value = false
                })
        }

        try {
            const deptData = await fetchDepartmentDetail(row.id)
            bindRoleData.role_ids = normalizeRoleIds(
                (deptData as Department & { role_list?: unknown; roles?: unknown }).role_list ?? deptData.role_ids ?? (deptData as Department & { role_list?: unknown; roles?: unknown }).roles
            )
        } catch (error) {
            Logger.error('获取部门详情失败:', error)
        }
    }

    const bindRoleRules = {
        role_ids: [{ type: 'array', required: true, message: translate('common.placeholders.selectRole'), trigger: 'change' }],
    }

    const bindRoleConfirmSubmit = async () => {
        await bindRoleFormRef.value?.validate().catch(() => {
            /* 校验不通过时静默中断 */
        })
        await runWithSubmitLock(async () => {
            await bindDepartmentRoles(bindRoleData.id, normalizeRoleIds(bindRoleData.role_ids))
            ElMessage.success(translate('common.result.bindRoleSuccess'))
            showBindRoleDrawer.value = false
            await refreshList()
        }).catch((error) => {
            ElMessage.error(translate('common.result.operationFailed'))
            Logger.error('绑定角色失败:', error)
        })
    }

    return {
        showBindRoleDrawer,
        bindRoleFormRef,
        isBindingRole,
        currentDeptName,
        roleOptions,
        roleOptionsLoading,
        bindRoleData,
        bindRoleRules,
        filterRole,
        handleBindRole,
        bindRoleConfirmSubmit,
    }
}
