import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { filterNullUndefined } from '@/utils/helper'
import { fetchAdminLoginLogDetail, fetchAdminLoginLogPage } from '@/modules/log/service'
import { createAdminLoginLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJwtToken } from '@/modules/log/helpers'
import { useListPage } from '@/composables/useListPage'

export function useAdminLoginLogPage() {
    const queryFormRef = ref(null)
    const dateRange = ref(null)
    const showDetailDrawer = ref(false)
    const currentDetail = ref(null)
    const activeCollapse = ref([])
    const detailLoading = ref(false)
    const tokenFormatState = ref({
        accessToken: true,
        refreshToken: true,
    })
    const queryWhere = reactive(createAdminLoginLogQuery())

    const {
        loading,
        items: logList,
        pagination,
        getList: fetchList,
        handleSearch: runSearch,
    } = useListPage({
        query: queryWhere,
        fetcher: fetchAdminLoginLogPage,
        transformParams: (query) => filterNullUndefined(query),
    })

    const toggleTokenFormat = (type) => {
        if (type === 'accessToken') {
            tokenFormatState.value.accessToken = !tokenFormatState.value.accessToken
        } else if (type === 'refreshToken') {
            tokenFormatState.value.refreshToken = !tokenFormatState.value.refreshToken
        }
    }

    const handleSearch = async () => {
        applyDateRangeToQuery(queryWhere, dateRange.value)

        return runSearch()
    }

    const loadList = async () => {
        try {
            await fetchList()
        } catch (error) {
            console.error('获取登录日志列表失败:', error)
            ElMessage.error('获取登录日志列表失败')
        }
    }

    const openDetailDrawer = async (row) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        activeCollapse.value = []
        currentDetail.value = null
        tokenFormatState.value = {
            accessToken: true,
            refreshToken: true,
        }

        try {
            currentDetail.value = await fetchAdminLoginLogDetail(row.id)
        } catch (error) {
            console.error('获取登录日志详情失败:', error)
            ElMessage.error('获取登录日志详情失败')
            showDetailDrawer.value = false
        } finally {
            detailLoading.value = false
        }
    }

    return {
        loading,
        logList,
        pagination,
        queryFormRef,
        queryWhere,
        dateRange,
        showDetailDrawer,
        currentDetail,
        activeCollapse,
        detailLoading,
        tokenFormatState,
        formatIpAddress,
        toggleTokenFormat,
        formatJwtToken,
        handleSearch,
        loadList,
        openDetailDrawer,
    }
}
