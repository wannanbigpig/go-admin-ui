import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { updateAdminUserRoles, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { getRoleList } from '@/api/permission'
import { normalizeListData } from '@/modules/shared/response'
import type { Role } from '@/types/role'
import type { AdminUser } from '@/types/adminUser'

interface UseAdminUserRoleBindingOptions {
    refreshList: () => Promise<void>
}

export function useAdminUserRoleBinding({ refreshList }: UseAdminUserRoleBindingOptions) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref<FormInstance>()
    const isBindingRole = ref(false)
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

    const extractRoleList = (response: unknown): Role[] => {
        const normalizedResult = normalizeListData<Role>(response as Parameters<typeof normalizeListData<Role>>[0])
        if (normalizedResult.list.length > 0) {
            return normalizedResult.list
        }

        const payload = (response as { data?: unknown })?.data
        if (!payload || typeof payload !== 'object') return []

        const rawPayload = payload as Record<string, unknown>
        if (Array.isArray(rawPayload.list)) {
            return rawPayload.list as Role[]
        }
        if (rawPayload.data && typeof rawPayload.data === 'object' && Array.isArray((rawPayload.data as Record<string, unknown>).list)) {
            return (rawPayload.data as Record<string, unknown>).list as Role[]
        }
        if (Array.isArray(rawPayload.data)) {
            return rawPayload.data as Role[]
        }

        return []
    }

    const getRoleOptions = async () => {
        const response = await getRoleList({ page: 1, per_page: 999 })
        const list = extractRoleList(response)
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
            ElMessage.error('无效的行数据')
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
                    console.error('获取角色列表失败:', error)
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
            console.error('获取管理员详情失败:', error)
        }
    }

    const bindRoleConfirmSubmit = async () => {
        if (isBindingRole.value) return
        isBindingRole.value = true

        try {
            const roleIds = normalizeRoleIds(bindRoleData.role_ids)
            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !roleIds.includes(superAdminRoleId.value)) {
                roleIds.push(superAdminRoleId.value)
            }

            await updateAdminUserRoles(bindRoleData.id, roleIds)
            ElMessage.success('绑定角色成功')
            showBindRoleDrawer.value = false
            await refreshList()
        } catch (error) {
            console.error('绑定角色失败:', error)
        } finally {
            isBindingRole.value = false
        }
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
