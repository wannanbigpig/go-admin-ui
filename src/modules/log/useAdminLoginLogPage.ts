import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { fetchLoginLogList, fetchLoginLogDetail } from '@/modules/log/service'
import { createAdminLoginLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJwtToken } from '@/modules/log/helpers'
import type { LoginLog } from '@/types/log'
import type { FormInstance } from 'element-plus'

export function useAdminLoginLogPage() {
    const loading = ref(false)
    const logList = ref([]) as Ref<LoginLog[]>
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createAdminLoginLogQuery())
    const dateRange = ref<[string, string]>([] as unknown as [string, string])

    const showDetailDrawer = ref(false)
    const currentDetail = ref<LoginLog | null>(null)
    const detailLoading = ref(false)
    const activeCollapse = ref(['accessToken'])
    const accessTokenFormatted = ref(true)
    const refreshTokenFormatted = ref(true)

    const getList = async () => {
        loading.value = true
        try {
            applyDateRangeToQuery(queryWhere, dateRange.value)
            const result = await fetchLoginLogList({
                ...queryWhere,
                page: pagination.page,
                per_page: pagination.pageSize,
            })
            pagination.total = result.total
            logList.value = result.list
        } catch (error) {
            console.error('获取登录日志失败:', error)
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

    const openDetailDrawer = async (row: LoginLog) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        try {
            currentDetail.value = await fetchLoginLogDetail(row.id)
            // 重置为默认格式化状态
            accessTokenFormatted.value = true
            refreshTokenFormatted.value = true
        } catch (error) {
            console.error('获取详情失败:', error)
        } finally {
            detailLoading.value = false
        }
    }

    const toggleTokenFormat = (type: 'accessToken' | 'refreshToken') => {
        if (type === 'accessToken') {
            accessTokenFormatted.value = !accessTokenFormatted.value
        } else {
            refreshTokenFormatted.value = !refreshTokenFormatted.value
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
        activeCollapse,
        accessTokenFormatted,
        refreshTokenFormatted,
        formatIpAddress,
        toggleTokenFormat,
        formatJwtToken,
        openDetailDrawer,
    }
}
