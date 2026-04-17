import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'
import type { FormInstance } from 'element-plus'

export function useApiPermissionList() {
    const loading = ref(false)
    const permissionList = ref([]) as Ref<ApiPermission[]>
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        name: '',
        path: '',
        method: '',
        group_name: '',
        page: 1,
        per_page: 10,
    })

    const getList = async () => {
        loading.value = true
        try {
            const params = {
                ...queryWhere,
                page: pagination.page,
                page_size: pagination.pageSize,
            }
            const response = await getPermissionList(params)
            const result = response.data
            pagination.total = result.total
            permissionList.value = result.list
        } catch (error) {
            console.error('获取接口权限列表失败:', error)
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
        permissionList,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        handleSearch,
    }
}
