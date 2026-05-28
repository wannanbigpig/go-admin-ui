import { reactive, ref } from 'vue'
import { useListPage } from '@/composables/useListPage'
import { normalizeListData } from '@/modules/shared/response'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'
import type { FormInstance } from 'element-plus'

export function useApiPermissionList() {
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        keyword: '',
        method: '',
        is_auth: undefined as number | undefined,
        is_effective: undefined as number | undefined,
        page: 1,
        per_page: 10,
    })

    const {
        loading,
        items: permissionList,
        pagination,
        getList,
        handleSearch,
        handleReset,
    } = useListPage<ApiPermission, typeof queryWhere>({
        query: queryWhere,
        queryFormRef,
        transformParams: (query) => ({
            ...query,
            keyword: query.keyword?.trim() || '',
        }),
        fetcher: async (params) => {
            const response = await getPermissionList(params)
            return normalizeListData<ApiPermission>(response)
        },
    })

    return {
        loading,
        permissionList,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        handleSearch,
        handleReset,
    }
}
