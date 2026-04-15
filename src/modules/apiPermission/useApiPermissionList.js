import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { filterNullUndefined } from '@/utils/helper'
import { fetchPermissionPage } from '@/modules/permission/service'
import { createApiPermissionQuery } from '@/modules/apiPermission/model'
import { useListPage } from '@/composables/useListPage'

export function useApiPermissionList() {
    const queryFormRef = ref(null)
    const queryWhere = reactive(createApiPermissionQuery())
    const {
        loading,
        items: permissionList,
        pagination,
        getList: fetchList,
        handleSearch,
    } = useListPage({
        query: queryWhere,
        fetcher: fetchPermissionPage,
        transformParams: (query) => filterNullUndefined(query),
    })

    const loadList = async () => {
        try {
            await fetchList()
        } catch (error) {
            console.error('获取权限列表失败:', error)
            ElMessage.error('获取权限列表失败')
        }
    }

    return {
        loading,
        permissionList,
        pagination,
        queryFormRef,
        queryWhere,
        handleSearch,
        loadList,
    }
}
