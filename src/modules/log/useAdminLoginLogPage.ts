import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { useListPage } from '@/composables/useListPage'
import { fetchLoginLogList, fetchLoginLogDetail } from '@/modules/log/service'
import { createAdminLoginLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJwtToken } from '@/modules/log/helpers'
import type { LoginLog } from '@/types/log'
import type { FormInstance } from 'element-plus'

export function useAdminLoginLogPage() {
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createAdminLoginLogQuery())
    const dateRange = ref<[string, string] | []>([])

    const showDetailDrawer = ref(false)
    const currentDetail = ref<LoginLog | null>(null)
    const detailLoading = ref(false)
    const activeCollapse = ref(['accessToken'])
    const accessTokenFormatted = ref(true)
    const refreshTokenFormatted = ref(true)

    const {
        loading,
        items: logList,
        pagination,
        getList,
        handleSearch,
    } = useListPage<LoginLog, typeof queryWhere>({
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
                return await fetchLoginLogList(params)
            } catch (error) {
                Logger.error('获取登录日志失败:', error)
                return {
                    list: [],
                    total: 0,
                    page: params.page ?? 1,
                    pageSize: params.per_page ?? 10,
                }
            }
        },
    })

    const openDetailDrawer = async (row: LoginLog) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        try {
            currentDetail.value = await fetchLoginLogDetail(row.id)
            // 重置为默认格式化状态
            accessTokenFormatted.value = true
            refreshTokenFormatted.value = true
        } catch (error) {
            Logger.error('获取详情失败:', error)
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
