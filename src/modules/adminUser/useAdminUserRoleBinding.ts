import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { updateAdminUserRoles, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { ADMIN_USER_SUBMIT_DELAY } from '@/modules/adminUser/model'
import { getRoleList } from '@/api/permission'
import { extractListData } from '@/modules/shared/response'
import type { Role } from '@/types/role'
import type { AdminUser } from '@/types/adminUser'
import { translate } from '@/locales'

interface UseAdminUserRoleBindingOptions {
    refreshList: () => Promise<void>
}

export function useAdminUserRoleBinding({ refreshList }: UseAdminUserRoleBindingOptions) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref<FormInstance>()
    const { isSubmitting: isBindingRole, runWithSubmitLock } = useSubmitLock(ADMIN_USER_SUBMIT_DELAY)
    const currentAdminUserName = ref('')
    const roleOptions = ref<Role[]>([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    const bindRoleData = reactive({
        id: 0 as string | number,
        role_ids: [] as number[],
    })
    const currentUserIsRootAdmin = ref(false)
    const superAdminRoleId = ref<number | null>(null)

    const filterRole = (query: string, item: Role) => item.name.toLowerCase().includes(query.toLowerCase())

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

    const getRoleOptions = async () => {
        const response = await getRoleList({ page: 1, per_page: 999 })
        const list = extractListData<Role>(response)
        roleOptions.value = list.reduce<Role[]>((result, role) => {
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

        if (!roleOptionsLoaded.value || roleOptions.value.length === 0) {
            roleOptionsLoading.value = true
            getRoleOptions()
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
            const userData = await fetchAdminUserDetail(row.id)
            const detailData = userData as AdminUser & {
                role_list?: unknown
                roles?: unknown
            }
            bindRoleData.role_ids = normalizeRoleIds(detailData.role_list ?? detailData.role_ids ?? detailData.roles)

            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !bindRoleData.role_ids.includes(superAdminRoleId.value)) {
                bindRoleData.role_ids = [...bindRoleData.role_ids, superAdminRoleId.value]
            }
        } catch (error) {
            Logger.error('获取管理员详情失败:', error)
        }
    }

    const bindRoleConfirmSubmit = async () => {
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
        filterRole,
        handleBindRole,
        bindRoleConfirmSubmit,
    }
}
