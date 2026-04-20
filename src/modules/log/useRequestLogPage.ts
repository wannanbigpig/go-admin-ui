import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { useListPage } from '@/composables/useListPage'
import { fetchRequestLogList, fetchRequestLogDetail } from '@/modules/log/service'
import { createRequestLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJsonContent } from '@/modules/log/helpers'
import type { RequestLog } from '@/types/log'
import type { FormInstance } from 'element-plus'

export function useRequestLogPage() {
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createRequestLogQuery())
    const dateRange = ref<[string, string] | []>([])

    const showDetailDrawer = ref(false)
    const currentDetail = ref<RequestLog | null>(null)
    const detailLoading = ref(false)
    const activeCollapse = ref(['requestBody', 'responseBody'])

    const {
        loading,
        items: logList,
        pagination,
        getList,
        handleSearch,
    } = useListPage<RequestLog, typeof queryWhere>({
        query: queryWhere,
        queryFormRef,
        transformParams: (query) => {
            const params = { ...query }
            const selectedDateRange = dateRange.value.length === 2 ? dateRange.value : null
            applyDateRangeToQuery(params, selectedDateRange)
            return params
        },
        fetcher: async (params) => {
            try {
                return await fetchRequestLogList(params)
            } catch (error) {
                Logger.error('获取请求日志失败:', error)
                return {
                    list: [],
                    total: 0,
                    page: params.page ?? 1,
                    pageSize: params.per_page ?? 10,
                }
            }
        },
    })

    const openDetailDrawer = async (row: RequestLog) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        try {
            currentDetail.value = await fetchRequestLogDetail(row.id)
        } catch (error) {
            Logger.error('获取详情失败:', error)
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
