import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { fetchRequestLogList, fetchRequestLogDetail } from '@/modules/log/service'
import { createRequestLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import type { RequestLog } from '@/types/log'
import type { FormInstance } from 'element-plus'

export function useRequestLogPage() {
    const loading = ref(false)
    const logList = ref([]) as Ref<RequestLog[]>
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createRequestLogQuery())
    const dateRange = ref<[string, string] | null>(null)

    const showDetailDrawer = ref(false)
    const currentDetail = ref<RequestLog | null>(null)
    const detailLoading = ref(false)

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

    const openDetail = async (row: RequestLog) => {
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
        openDetail,
    }
}
