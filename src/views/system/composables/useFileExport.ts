import { ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { submitSystemFileExportTask } from '@/modules/exportCenter/service'
import { useExportTaskSubmitter } from '@/modules/exportCenter/useExportTaskSubmitter'
import { buildFileQueryParams } from './fileQuery'
import { Logger } from '@/utils/logger'
import type { SystemFileExportPayload } from '@/types/system'

export interface UseFileExportOptions {
    queryWhere: Record<string, unknown>
    selectedCategory: Ref<string>
    selectedFolderId: Ref<number | string | null>
    dateRange: Ref<[string, string] | []>
}

export function useFileExport(options: UseFileExportOptions) {
    const { t } = useI18n()
    const { submitExportTask } = useExportTaskSubmitter()
    const exporting = ref(false)

    const handleExportList = async () => {
        const params = buildFileQueryParams(options.queryWhere, options.selectedCategory.value, options.selectedFolderId.value, options.dateRange.value)
        const payload = {
            ...Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page')),
            limit: 50_000,
        } as SystemFileExportPayload

        await submitExportTask({
            loading: exporting,
            submitter: () => submitSystemFileExportTask(payload),
            successMessage: t('system.task.exportSubmitSuccess'),
            onError: (error) => {
                Logger.error('提交文件资源导出任务失败:', error)
            },
        })
    }

    return {
        exporting,
        handleExportList,
    }
}
