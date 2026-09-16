import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { updateAdminUserRoles, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { getRoleOptions, type RoleOption } from '@/api/permission'
import type { AdminUser } from '@/types/adminUser'
import { translate } from '@/locales'
import { validateFormSafely } from '@/modules/shared/form'

interface UseAdminUserRoleBindingOptions {
    refreshList: () => Promise<void>
}

export function useAdminUserRoleBinding({ refreshList }: UseAdminUserRoleBindingOptions) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref<FormInstance>()
    const { isSubmitting: isBindingRole, runWithSubmitLock } = useSubmitLock()
    const currentAdminUserName = ref('')
    const roleOptions = ref<RoleOption[]>([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    let detailLoaded = false
    let loadVersion = 0
    const bindRoleData = reactive({
        id: 0 as string | number,
        role_ids: [] as number[],
    })
    const currentUserIsRootAdmin = ref(false)
    const superAdminRoleId = ref<number | null>(null)

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
        const superAdminRole = roleOptions.value.find((role) => role?.code === 'super_admin')
        superAdminRoleId.value = normalizeRoleId(superAdminRole?.id)
        return roleOptions.value
    }

    const handleBindRole = async (row: AdminUser) => {
        if (!row || !row.id) {
            ElMessage.error(translate('validation.adminUser.invalidRow'))
            return
        }

        currentAdminUserName.value = row.nickname || row.username || ''
        currentUserIsRootAdmin.value = row.id === 1 // 假设 ID 1 是 Root Admin
        bindRoleData.id = row.id
        bindRoleData.role_ids = []
        showBindRoleDrawer.value = true

        const requestVersion = ++loadVersion
        detailLoaded = false
        roleOptionsLoading.value = true
        try {
            const [data] = await Promise.all([
                fetchAdminUserDetail(row.id),
                roleOptionsLoaded.value
                    ? Promise.resolve()
                    : fetchRoleOptions().then(() => {
                          roleOptionsLoaded.value = true
                      }),
            ])
            if (requestVersion !== loadVersion || !showBindRoleDrawer.value) return
            const detailData = data as AdminUser & {
                role_list?: unknown
                roles?: unknown
            }
            bindRoleData.role_ids = normalizeRoleIds(detailData.role_list ?? detailData.role_ids ?? detailData.roles)

            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !bindRoleData.role_ids.includes(superAdminRoleId.value)) {
                bindRoleData.role_ids = [...bindRoleData.role_ids, superAdminRoleId.value]
            }
            detailLoaded = true
        } catch (error) {
            if (requestVersion === loadVersion) showBindRoleDrawer.value = false
            Logger.error('获取管理员角色绑定数据失败:', error)
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
            const roleIds = normalizeRoleIds(bindRoleData.role_ids)
            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !roleIds.includes(superAdminRoleId.value)) {
                roleIds.push(superAdminRoleId.value)
            }

            await updateAdminUserRoles(bindRoleData.id, roleIds)
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
        currentAdminUserName,
        currentUserIsRootAdmin,
        superAdminRoleId,
        roleOptions,
        roleOptionsLoading,
        bindRoleData,
        bindRoleRules,
        filterRole,
        handleBindRole,
        bindRoleConfirmSubmit,
    }
}
