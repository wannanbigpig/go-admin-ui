import { reactive, ref } from 'vue'
import { type FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Logger } from '@/utils/logger'
import { useListPage } from '@/composables/useListPage'
import { fetchRequestLogList, fetchRequestLogDetail } from '@/modules/log/service'
import { submitRequestLogExportTask } from '@/modules/exportCenter/service'
import { useExportTaskSubmitter } from '@/modules/exportCenter/useExportTaskSubmitter'
import { createRequestLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJsonContent } from '@/modules/log/helpers'
import type { RequestLog } from '@/types/log'

export function useRequestLogPage() {
    const router = useRouter()
    const { t } = useI18n()
    const { submitExportTask } = useExportTaskSubmitter()
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createRequestLogQuery())
    const dateRange = ref<[string, string] | []>([])

    const showDetailDrawer = ref(false)
    const currentDetail = ref<RequestLog | null>(null)
    const detailLoading = ref(false)
    const activeCollapse = ref(['requestBody', 'responseBody'])

    const exporting = ref(false)

    const buildQueryParams = (query: typeof queryWhere) => {
        const params = { ...query }
        const selectedDateRange = dateRange.value.length === 2 ? dateRange.value : null
        applyDateRangeToQuery(params, selectedDateRange)
        return params
    }

    const {
        loading,
        items: logList,
        pagination,
        getList,
        handleSearch,
    } = useListPage<RequestLog, typeof queryWhere>({
        query: queryWhere,
        queryFormRef,
        transformParams: buildQueryParams,
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

    const openMaskConfigDialog = async () => {
        await router.push({ path: '/system/config', query: { tab: 'audit_mask' } })
    }

    const exportCsv = async () => {
        const params = buildQueryParams(queryWhere)
        const exportParams = Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page'))
        await submitExportTask({
            loading: exporting,
            submitter: () => submitRequestLogExportTask(exportParams),
            successMessage: t('system.task.exportSubmitSuccess'),
            onError: (error) => {
                Logger.error('导出请求日志失败:', error)
            },
        })
    }

    const getMethodTagType = (method: string) => {
        const types: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
            GET: 'success',
            POST: 'primary',
            PUT: 'warning',
            DELETE: 'danger',
            PATCH: 'info',
        }
        return types[method] || 'info'
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
        exporting,
        formatJson: formatJsonContent,
        formatIpAddress,
        getMethodTagType,
        getResponseStatusTagType,
        openDetailDrawer,
        openMaskConfigDialog,
        exportCsv,
    }
}
