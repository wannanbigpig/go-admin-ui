import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { fetchRequestLogList, fetchRequestLogDetail } from '@/modules/log/service'
import { createRequestLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJsonContent } from '@/modules/log/helpers'
import type { RequestLog } from '@/types/log'
import type { FormInstance } from 'element-plus'

export function useRequestLogPage() {
    const loading = ref(false)
    const logList = ref([]) as Ref<RequestLog[]>
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createRequestLogQuery())
    const dateRange = ref<[string, string]>([] as unknown as [string, string])

    const showDetailDrawer = ref(false)
    const currentDetail = ref<RequestLog | null>(null)
    const detailLoading = ref(false)
    const activeCollapse = ref(['requestBody', 'responseBody'])

    const getList = async () => {
        loading.value = true
        try {
            applyDateRangeToQuery(queryWhere, dateRange.value)
            const result = await fetchRequestLogList({
                ...queryWhere,
                page: pagination.page,
                per_page: pagination.pageSize,
            })
            pagination.total = result.total
            logList.value = result.list
        } catch (error) {
            console.error('获取请求日志失败:', error)
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

    const openDetailDrawer = async (row: RequestLog) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        try {
            currentDetail.value = await fetchRequestLogDetail(row.id)
        } catch (error) {
            console.error('获取详情失败:', error)
        } finally {
            detailLoading.value = false
        }
    }

    const getMethodTagType = (method: string) => {
        const types: Record<string, string> = {
            GET: 'success',
            POST: '',
            PUT: 'warning',
            DELETE: 'danger',
            PATCH: 'info',
        }
        return types[method] || ''
    }

    const getResponseStatusTagType = (status: number) => {
        if (status >= 200 && status < 300) return 'success'
        if (status >= 400 && status < 500) return 'warning'
        if (status >= 500) return 'danger'
        return 'info'
    }

    return {
        loading,
        logList,
        queryFormRef,
        queryWhere,
        dateRange,
        pagination,
        getList,
        handleSearch,
        showDetailDrawer,
        currentDetail,
        detailLoading,
        activeCollapse,
        formatJson: formatJsonContent,
        formatIpAddress,
        getMethodTagType,
        getResponseStatusTagType,
        openDetailDrawer,
    }
}
