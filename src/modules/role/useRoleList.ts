import { reactive, ref } from 'vue'
import { useListPage } from '@/composables/useListPage'
import { normalizeListData } from '@/modules/shared/response'
import { getRoleList } from '@/api/permission'
import type { Role } from '@/types/role'
import type { FormInstance } from 'element-plus'

export function useRoleList() {
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        name: '',
        code: '',
        page: 1,
        per_page: 10,
    })

    const {
        loading,
        items: roleList,
        pagination,
        getList,
        handleSearch,
        handleReset,
    } = useListPage<Role, typeof queryWhere>({
        query: queryWhere,
        queryFormRef,
        transformParams: (query) => ({
            ...query,
            name: query.name?.trim() || '',
            code: query.code?.trim() || '',
        }),
        fetcher: async (params) => {
            const response = await getRoleList(params)
            return normalizeListData<Role>(response)
        },
    })

    return {
        loading,
        roleList,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        handleSearch,
        handleReset,
    }
}
