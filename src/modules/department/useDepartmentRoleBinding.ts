import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { bindDepartmentRoles, fetchDepartmentDetail } from '@/modules/department/service'
import { DEPARTMENT_SUBMIT_DELAY } from '@/modules/department/model'
import { getRoleList } from '@/api/permission'
import type { Department } from '@/types/department'
import type { Role } from '@/types/role'

interface UseDepartmentRoleBindingOptions {
    refreshList: () => Promise<any>
}

export function useDepartmentRoleBinding({ refreshList }: UseDepartmentRoleBindingOptions) {
    const showBindRoleDrawer = ref(false)
    const bindRoleFormRef = ref<FormInstance>()
    const isBindingRole = ref(false)
    const currentDeptName = ref('')
    const roleOptions = ref<Role[]>([])
    const roleOptionsLoading = ref(false)
    const roleOptionsLoaded = ref(false)
    const bindRoleData = reactive({
        id: 0 as string | number,
        role_ids: [] as number[],
    })

    const filterRole = (query: string, item: Role) => item.name.toLowerCase().includes(query.toLowerCase())

    const getRoleOptions = async () => {
        const response = await getRoleList({ page_size: 999 })
        const result = response.data
        roleOptions.value = Array.isArray(result.list) ? result.list : []
        return result.list
    }

    const handleBindRole = async (row: Department) => {
        if (!row || !row.id) {
            ElMessage.error('无效的行数据')
            return
        }

        currentDeptName.value = row.name || ''
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
            const deptData = await fetchDepartmentDetail(row.id)
            if (Array.isArray(deptData.role_ids)) {
                bindRoleData.role_ids = deptData.role_ids
            }
        } catch (error) {
            console.error('获取部门详情失败:', error)
        }
    }

    const bindRoleConfirmSubmit = async () => {
        if (isBindingRole.value) return
        isBindingRole.value = true

        try {
            await bindDepartmentRoles(bindRoleData.id, bindRoleData.role_ids)
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
        currentDeptName,
        roleOptions,
        roleOptionsLoading,
        bindRoleData,
        filterRole,
        handleBindRole,
        bindRoleConfirmSubmit,
    }
}
