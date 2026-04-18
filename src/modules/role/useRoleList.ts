import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { normalizeListData } from '@/modules/shared/response'
import { getRoleList } from '@/api/permission'
import type { Role } from '@/types/role'
import type { FormInstance } from 'element-plus'

export function useRoleList() {
    const loading = ref(false)
    const roleList = ref([]) as Ref<Role[]>
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        name: '',
        code: '',
        page: 1,
        per_page: 10,
    })

    const getList = async () => {
        loading.value = true
        try {
            const params = {
                ...queryWhere,
                page: pagination.page,
                per_page: pagination.pageSize,
            }
            const response = await getRoleList(params)
            const result = normalizeListData<Role>(response)
            pagination.total = result.total
            roleList.value = result.list
        } catch (error) {
            console.error('获取角色列表失败:', error)
        } finally {
            loading.value = false
        }
    }

    const pagination: PaginationState = createPaginationState(() => getList(), {
        page: queryWhere.page,
        pageSize: queryWhere.per_page,
    })

    const handleSearch = () => {
        pagination.page = 1
        queryWhere.page = 1
        getList()
    }

    return {
        loading,
        roleList,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        handleSearch,
    }
}
