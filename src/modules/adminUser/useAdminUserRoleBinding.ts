import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { updateAdminUserRoles, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { getRoleList } from '@/api/permission'
import type { Role } from '@/types/role'
import type { AdminUser } from '@/types/adminUser'

interface UseAdminUserRoleBindingOptions {
    refreshList: () => Promise<any>
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
    const superAdminRoleId = ref<number | string | null>(null)

    const filterRole = (query: string, item: any) => item.name.toLowerCase().includes(query.toLowerCase())

    const getRoleOptions = async () => {
        const response = await getRoleList({ page_size: 999 })
        const list = response.data.list
        roleOptions.value = Array.isArray(list) ? list : []
        const superAdminRole = roleOptions.value.find((role) => role?.code === 'super_admin')
        superAdminRoleId.value = superAdminRole?.id ?? null
        return list
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

        if (!roleOptionsLoaded.value) {
            roleOptionsLoading.value = true
            getRoleOptions()
                .then(() => {
                    roleOptionsLoaded.value = true
                })
                .catch((error) => {
                    console.error('获取角色列表失败:', error)
                })
                .finally(() => {
                    roleOptionsLoading.value = false
                })
        }

        try {
            const userData = await fetchAdminUserDetail(row.id)
            if (Array.isArray(userData.role_ids)) {
                bindRoleData.role_ids = userData.role_ids
            }

            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !bindRoleData.role_ids.includes(superAdminRoleId.value as number)) {
                bindRoleData.role_ids = [...bindRoleData.role_ids, superAdminRoleId.value as number]
            }
        } catch (error) {
            console.error('获取管理员详情失败:', error)
        }
    }

    const bindRoleConfirmSubmit = async () => {
        if (isBindingRole.value) return
        isBindingRole.value = true

        try {
            const roleIds = Array.isArray(bindRoleData.role_ids) ? [...bindRoleData.role_ids] : []
            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !roleIds.includes(superAdminRoleId.value as number)) {
                roleIds.push(superAdminRoleId.value as number)
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
