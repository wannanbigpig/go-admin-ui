import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { bindAdminUserRoles, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { ADMIN_USER_SUBMIT_DELAY, isRootAdminUser } from '@/modules/adminUser/model'
import { fetchRolePage } from '@/modules/permission/service'
import { isSuperAdminRole, SUPER_ADMIN_ROLE_CODE } from '@/modules/role/model'

export function useAdminUserRoleBinding({ refreshList }) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref()
    const isBindingRole = ref(false)
    const currentAdminUserName = ref('')
    const roleOptions = ref([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    const bindRoleData = reactive({
        id: 0,
        role_ids: [],
    })
    const currentUserIsRootAdmin = ref(false)
    const superAdminRoleId = ref(null)

    const filterRole = (query, item) => item.name.toLowerCase().includes(query.toLowerCase())

    const getRoleOptions = async () => {
        const result = await fetchRolePage({ per_page: 999 })
        roleOptions.value = Array.isArray(result.list) ? result.list : []
        const superAdminRole = roleOptions.value.find((role) => isSuperAdminRole(role) || role?.code === SUPER_ADMIN_ROLE_CODE)
        superAdminRoleId.value = superAdminRole?.id ?? null
        return result.list
    }

    const handleBindRole = async (row) => {
        if (!row || typeof row.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }

        currentAdminUserName.value = row.nickname || row.username || ''
        currentUserIsRootAdmin.value = isRootAdminUser(row)
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
            if (Array.isArray(userData.role_list)) {
                bindRoleData.role_ids = userData.role_list
            } else if (Array.isArray(userData.role_ids)) {
                bindRoleData.role_ids = userData.role_ids
            } else if (Array.isArray(userData.roles)) {
                bindRoleData.role_ids = userData.roles.map((role) => (typeof role === 'object' ? role.id : role))
            }

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
            const roleIds = Array.isArray(bindRoleData.role_ids) ? [...bindRoleData.role_ids] : []
            if (currentUserIsRootAdmin.value && superAdminRoleId.value && !roleIds.includes(superAdminRoleId.value)) {
                roleIds.push(superAdminRoleId.value)
            }

            await bindAdminUserRoles({
                id: bindRoleData.id,
                role_ids: roleIds,
            })
            ElMessage.success('绑定角色成功')
            showBindRoleDrawer.value = false
            await refreshList()
        } catch (error) {
            console.error('绑定角色失败:', error)
        } finally {
            setTimeout(() => {
                isBindingRole.value = false
            }, ADMIN_USER_SUBMIT_DELAY)
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
