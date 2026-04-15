import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { bindDepartmentRoles, fetchDepartmentDetail } from '@/modules/department/service'
import { DEPARTMENT_SUBMIT_DELAY } from '@/modules/department/model'
import { fetchRolePage } from '@/modules/permission/service'

export function useDepartmentRoleBinding({ refreshList }) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref()
    const isBindingRole = ref(false)
    const currentDepartmentName = ref('')
    const roleOptions = ref([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    const bindRoleData = reactive({
        id: 0,
        role_ids: [],
    })

    const filterRole = (query, item) => item.name.toLowerCase().includes(query.toLowerCase())

    const getRoleOptions = async () => {
        const result = await fetchRolePage({ page: 1, per_page: 9999 })
        roleOptions.value = Array.isArray(result.list) ? result.list : []
        return roleOptions.value
    }

    const handleBindRole = async (row) => {
        if (!row || typeof row.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }

        currentDepartmentName.value = row.name || ''
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
                    ElMessage.error('获取角色列表失败')
                })
                .finally(() => {
                    roleOptionsLoading.value = false
                })
        }

        try {
            const deptData = await fetchDepartmentDetail(row.id)
            if (Array.isArray(deptData.role_list)) {
                bindRoleData.role_ids = deptData.role_list
            } else if (Array.isArray(deptData.role_ids)) {
                bindRoleData.role_ids = deptData.role_ids
            } else if (Array.isArray(deptData.roles)) {
                bindRoleData.role_ids = deptData.roles.map((role) => role.id)
            }
        } catch (error) {
            console.error('获取部门详情失败:', error)
        }
    }

    const bindRoleConfirmSubmit = async () => {
        if (isBindingRole.value) return
        isBindingRole.value = true

        try {
            await bindDepartmentRoles({
                id: bindRoleData.id,
                role_ids: Array.isArray(bindRoleData.role_ids) ? bindRoleData.role_ids : [],
            })
            ElMessage.success('绑定角色成功')
            showBindRoleDrawer.value = false
            await refreshList()
        } catch (error) {
            console.error('绑定角色失败:', error)
        } finally {
            setTimeout(() => {
                isBindingRole.value = false
            }, DEPARTMENT_SUBMIT_DELAY)
        }
    }

    return {
        showBindRoleDrawer,
        bindRoleFormRef,
        isBindingRole,
        currentDepartmentName,
        roleOptions,
        roleOptionsLoading,
        bindRoleData,
        filterRole,
        handleBindRole,
        bindRoleConfirmSubmit,
    }
}
