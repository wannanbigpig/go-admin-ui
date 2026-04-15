import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { filterNullUndefined } from '@/utils/helper'
import { fetchRequestLogDetail, fetchRequestLogPage } from '@/modules/log/service'
import { createRequestLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJsonContent } from '@/modules/log/helpers'
import { useListPage } from '@/composables/useListPage'

export function useRequestLogPage() {
    const queryFormRef = ref(null)
    const dateRange = ref(null)
    const showDetailDrawer = ref(false)
    const currentDetail = ref(null)
    const activeCollapse = ref([])
    const detailLoading = ref(false)
    const queryWhere = reactive(createRequestLogQuery())

    const {
        loading,
        items: logList,
        pagination,
        getList: fetchList,
        handleSearch: runSearch,
    } = useListPage({
        query: queryWhere,
        fetcher: fetchRequestLogPage,
        transformParams: (query) => filterNullUndefined(query),
    })

    const getMethodTagType = (method) => {
        const typeMap = {
            GET: 'success',
            POST: 'primary',
            PUT: 'warning',
            DELETE: 'danger',
            PATCH: 'info',
        }
        return typeMap[method] || ''
    }

    const getResponseStatusTagType = (status) => {
        if (!status) return ''
        if (status === 200) return 'success'
        if ([400, 404].includes(status)) return 'warning'
        if ([401, 403, 500].includes(status)) return 'danger'
        return ''
    }

    const handleSearch = async () => {
        applyDateRangeToQuery(queryWhere, dateRange.value)

        return runSearch()
    }

    const loadList = async () => {
        try {
            await fetchList()
        } catch (error) {
            console.error('获取请求日志列表失败:', error)
            ElMessage.error('获取请求日志列表失败')
        }
    }

    const openDetailDrawer = async (row) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        activeCollapse.value = []
        currentDetail.value = null

        try {
            currentDetail.value = await fetchRequestLogDetail(row.id)
        } catch (error) {
            console.error('获取请求日志详情失败:', error)
            ElMessage.error('获取请求日志详情失败')
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
        formatJson: formatJsonContent,
        formatIpAddress,
        getMethodTagType,
        getResponseStatusTagType,
        handleSearch,
        loadList,
        openDetailDrawer,
    }
}
