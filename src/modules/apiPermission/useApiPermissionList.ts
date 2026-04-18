import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { normalizeListData } from '@/modules/shared/response'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'
import type { FormInstance } from 'element-plus'

export function useApiPermissionList() {
    const loading = ref(false)
    const permissionList = ref([]) as Ref<ApiPermission[]>
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        keyword: '',
        method: '',
        is_auth: undefined as number | undefined,
        is_effective: undefined as number | undefined,
        page: 1,
        per_page: 10,
    })

    const pagination: PaginationState = createPaginationState(() => getList(), {
        page: queryWhere.page,
        pageSize: queryWhere.per_page,
    })

    const getList = async () => {
        loading.value = true
        try {
            const params = {
                ...queryWhere,
                page: pagination.page,
                per_page: pagination.pageSize,
            }
            const response = await getPermissionList(params)
            const result = normalizeListData<ApiPermission>(response)
            pagination.total = result.total
            permissionList.value = result.list
        } catch (error) {
            console.error('获取接口权限列表失败:', error)
        } finally {
            loading.value = false
        }
    }

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
