import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Logger } from '@/utils/logger'
import { useListPage } from '@/composables/useListPage'
import { fetchRequestLogList, fetchRequestLogDetail, fetchRequestLogMaskConfig, saveRequestLogMaskConfig, exportRequestLog } from '@/modules/log/service'
import { createRequestLogQuery } from '@/modules/log/model'
import { applyDateRangeToQuery, formatIpAddress, formatJsonContent } from '@/modules/log/helpers'
import type { RequestLog } from '@/types/log'
import type { RequestLogMaskConfig } from '@/types/system'
import { translate } from '@/locales'

const MASK_CONFIG_FIELDS: Array<keyof RequestLogMaskConfig> = ['common', 'request_header', 'request_body', 'response_header', 'response_body']

function parseMaskConfigText(text: string) {
    return text
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item !== '')
}

export function useRequestLogPage() {
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createRequestLogQuery())
    const dateRange = ref<[string, string] | []>([])

    const showDetailDrawer = ref(false)
    const currentDetail = ref<RequestLog | null>(null)
    const detailLoading = ref(false)
    const activeCollapse = ref(['requestBody', 'responseBody'])

    const showMaskConfigDialog = ref(false)
    const maskConfigLoading = ref(false)
    const savingMaskConfig = ref(false)
    const exporting = ref(false)
    const maskConfigText = reactive<Record<keyof RequestLogMaskConfig, string>>({
        common: '',
        request_header: '',
        request_body: '',
        response_header: '',
        response_body: '',
    })

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

    const loadMaskConfig = async () => {
        maskConfigLoading.value = true
        try {
            const config = await fetchRequestLogMaskConfig()
            MASK_CONFIG_FIELDS.forEach((field) => {
                maskConfigText[field] = (config[field] || []).join('\n')
            })
        } catch (error) {
            Logger.error('获取请求日志脱敏配置失败:', error)
        } finally {
            maskConfigLoading.value = false
        }
    }

    const openMaskConfigDialog = async () => {
        showMaskConfigDialog.value = true
        await loadMaskConfig()
    }

    const saveMaskConfig = async () => {
        if (savingMaskConfig.value) return

        savingMaskConfig.value = true
        try {
            const payload = {
                common: parseMaskConfigText(maskConfigText.common),
                request_header: parseMaskConfigText(maskConfigText.request_header),
                request_body: parseMaskConfigText(maskConfigText.request_body),
                response_header: parseMaskConfigText(maskConfigText.response_header),
                response_body: parseMaskConfigText(maskConfigText.response_body),
            }
            await saveRequestLogMaskConfig(payload)
            ElMessage.success(translate('common.result.updateSuccess'))
            showMaskConfigDialog.value = false
        } catch (error) {
            Logger.error('更新请求日志脱敏配置失败:', error)
        } finally {
            savingMaskConfig.value = false
        }
    }

    const exportCsv = async () => {
        if (exporting.value) return

        exporting.value = true
        try {
            const params = buildQueryParams(queryWhere)
            const exportParams = Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page'))
            const blob = await exportRequestLog({ ...exportParams, limit: 1000 })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `request-log-${Date.now()}.csv`
            link.click()
            window.URL.revokeObjectURL(url)
            ElMessage.success(translate('common.result.operationSuccess'))
        } catch (error) {
            Logger.error('导出请求日志失败:', error)
        } finally {
            exporting.value = false
        }
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
        showMaskConfigDialog,
        maskConfigLoading,
        savingMaskConfig,
        maskConfigText,
        exporting,
        formatJson: formatJsonContent,
        formatIpAddress,
        getMethodTagType,
        getResponseStatusTagType,
        openDetailDrawer,
        openMaskConfigDialog,
        saveMaskConfig,
        exportCsv,
    }
}
