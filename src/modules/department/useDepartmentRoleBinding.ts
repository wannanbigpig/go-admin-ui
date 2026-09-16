import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { bindDepartmentRoles, fetchDepartmentDetail } from '@/modules/department/service'
import { getRoleOptions, type RoleOption } from '@/api/permission'
import type { Department } from '@/types/department'
import { translate } from '@/locales'
import { validateFormSafely } from '@/modules/shared/form'

interface UseDepartmentRoleBindingOptions {
    refreshList: () => Promise<void>
}

export function useDepartmentRoleBinding({ refreshList }: UseDepartmentRoleBindingOptions) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref<FormInstance>()
    const { isSubmitting: isBindingRole, runWithSubmitLock } = useSubmitLock()
    const currentDeptName = ref('')
    const roleOptions = ref<RoleOption[]>([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    let detailLoaded = false
    let loadVersion = 0
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

        const requestVersion = ++loadVersion
        detailLoaded = false
        roleOptionsLoading.value = true
        try {
            const [data] = await Promise.all([
                fetchDepartmentDetail(row.id),
                roleOptionsLoaded.value
                    ? Promise.resolve()
                    : fetchRoleOptions().then(() => {
                          roleOptionsLoaded.value = true
                      }),
            ])
            if (requestVersion !== loadVersion || !showBindRoleDrawer.value) return
            bindRoleData.role_ids = normalizeRoleIds((data as Department & { role_list?: unknown; roles?: unknown }).role_list ?? data.role_ids ?? (data as Department & { role_list?: unknown; roles?: unknown }).roles)
            detailLoaded = true
        } catch (error) {
            if (requestVersion === loadVersion) showBindRoleDrawer.value = false
            Logger.error('获取部门角色绑定数据失败:', error)
        } finally {
            if (requestVersion === loadVersion) roleOptionsLoading.value = false
        }
    }

    const bindRoleRules = {
        role_ids: [{ type: 'array', required: true, message: translate('common.placeholders.selectRole'), trigger: 'change' }],
    }

    const bindRoleConfirmSubmit = async () => {
        if (isBindingRole.value || roleOptionsLoading.value || !detailLoaded || !showBindRoleDrawer.value) return
        const requestVersion = loadVersion
        const valid = await validateFormSafely(bindRoleFormRef.value, translate('common.placeholders.selectRole'))
        if (!valid || requestVersion !== loadVersion || !showBindRoleDrawer.value) return
        await runWithSubmitLock(async () => {
            await bindDepartmentRoles(bindRoleData.id, normalizeRoleIds(bindRoleData.role_ids))
            ElMessage.success(translate('common.result.bindRoleSuccess'))
            showBindRoleDrawer.value = false
            await refreshList()
        }).catch((error) => {
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
