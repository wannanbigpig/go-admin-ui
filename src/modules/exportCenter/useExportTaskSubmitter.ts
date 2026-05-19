import type { Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import type { ExportTaskSubmitResult } from '@/types/exportCenter'

interface SubmitExportTaskOptions {
    loading: Ref<boolean>
    submitter: () => Promise<ExportTaskSubmitResult>
    successMessage?: string
    promptToTaskCenter?: boolean
    afterSubmitted?: (result: ExportTaskSubmitResult) => Promise<void> | void
    onError?: (error: unknown) => void
}

export function useExportTaskSubmitter() {
    const { t } = useI18n()
    const router = useRouter()

    const submitExportTask = async (options: SubmitExportTaskOptions) => {
        if (options.loading.value) return null

        options.loading.value = true
        try {
            const result = await options.submitter()
            ElMessage.success(options.successMessage || t('system.task.exportSubmitSuccess'))
            await options.afterSubmitted?.(result)

            if (options.promptToTaskCenter !== false) {
                try {
                    await ElMessageBox.confirm(t('system.task.exportGotoTaskCenterPrompt'), t(CONFIRM_DIALOG_TITLE), {
                        type: 'success',
                        confirmButtonText: t('system.task.exportGotoTaskCenter'),
                        cancelButtonText: t('common.actions.cancel'),
                    })
                    await router.push({ path: '/task/center', query: { tab: 'export' } })
                } catch {
                    // user canceled navigation prompt
                }
            }

            return result
        } catch (error) {
            options.onError?.(error)
            return null
        } finally {
            options.loading.value = false
        }
    }

    return {
        submitExportTask,
    }
}
