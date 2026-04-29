import { request } from '@/utils/request'
import * as systemApi from '@/api/system'
import * as logApi from '@/api/log'
import { normalizeDetailData, normalizeListData, normalizeArrayData } from '@/modules/shared/response'
import type {
    SystemConfig,
    SystemConfigPayload,
    DictType,
    DictItem,
    DictOption,
    TaskDefinition,
    TaskRun,
    CronTaskState,
    TaskTriggerPayload,
    TaskTriggerResult,
    TaskCancelPayload,
    RequestLogMaskConfig,
} from '@/types/system'

export async function fetchSystemConfigList(params?: Record<string, unknown>) {
    const response = await systemApi.getSystemConfigList(params)
    return normalizeListData<SystemConfig>(response)
}

export async function fetchSystemConfigDetail(id: number | string) {
    const response = await systemApi.getSystemConfigDetail({ id })
    return normalizeDetailData(response, {} as SystemConfig)
}

export async function addSystemConfig(data: SystemConfigPayload) {
    return systemApi.createSystemConfig(data)
}

export async function modifySystemConfig(data: SystemConfigPayload) {
    return systemApi.updateSystemConfig(data)
}

export async function removeSystemConfig(id: number | string) {
    return systemApi.deleteSystemConfig({ id })
}

export async function refreshSystemConfig() {
    return systemApi.refreshSystemConfigCache()
}

export async function fetchDictTypeList(params?: Record<string, unknown>) {
    const response = await systemApi.getDictTypeList(params)
    return normalizeListData<DictType>(response)
}

export async function fetchDictTypeDetail(id: number | string) {
    const response = await systemApi.getDictTypeDetail({ id })
    return normalizeDetailData(response, {} as DictType)
}

export async function addDictType(data: Record<string, unknown>) {
    return systemApi.createDictType(data)
}

export async function modifyDictType(data: Record<string, unknown>) {
    return systemApi.updateDictType(data)
}

export async function removeDictType(id: number | string) {
    return systemApi.deleteDictType({ id })
}

export async function fetchDictItemList(params: Record<string, unknown>) {
    const response = await systemApi.getDictItemList(params)
    return normalizeListData<DictItem>(response)
}

export async function addDictItem(data: Record<string, unknown>) {
    return systemApi.createDictItem(data)
}

export async function modifyDictItem(data: Record<string, unknown>) {
    return systemApi.updateDictItem(data)
}

export async function removeDictItem(id: number | string) {
    return systemApi.deleteDictItem({ id })
}

export async function fetchDictOptions(typeCode: string) {
    const response = await systemApi.getDictOptions({ type_code: typeCode })
    return normalizeArrayData<DictOption>(response)
}

export async function fetchTaskList(params?: Record<string, unknown>) {
    const response = await systemApi.getTaskList(params)
    return normalizeListData<TaskDefinition>(response)
}

export async function fetchTaskRunList(params?: Record<string, unknown>) {
    const response = await systemApi.getTaskRunList(params)
    return normalizeListData<TaskRun>(response)
}

export async function fetchTaskRunDetail(id: number | string) {
    const response = await systemApi.getTaskRunDetail({ id })
    return normalizeDetailData(response, {} as TaskRun)
}

export async function fetchCronTaskStateList(params?: Record<string, unknown>) {
    const response = await systemApi.getCronTaskStateList(params)
    return normalizeListData<CronTaskState>(response)
}

export async function triggerTaskNow(data: TaskTriggerPayload) {
    const response = await systemApi.triggerTask(data)
    return normalizeDetailData(response, {} as TaskTriggerResult)
}

export async function retryTaskByRunId(runId: number | string) {
    const response = await systemApi.retryTaskRun({ run_id: runId })
    return normalizeDetailData(response, {} as TaskTriggerResult)
}

export async function cancelTaskByRunId(runId: number | string, reason = '') {
    const payload: TaskCancelPayload = { run_id: runId }
    if (reason.trim()) {
        payload.reason = reason.trim()
    }
    const response = await systemApi.cancelTaskRun(payload)
    return normalizeDetailData(response, {} as TaskTriggerResult)
}

export async function fetchRequestLogMaskConfig() {
    const response = await logApi.getRequestLogMaskConfig()
    return normalizeDetailData(response, {
        common: [],
        request_header: [],
        request_body: [],
        response_header: [],
        response_body: [],
    } as RequestLogMaskConfig)
}

export async function updateRequestLogMaskConfig(data: RequestLogMaskConfig) {
    const response = await logApi.updateRequestLogMaskConfig(data)
    return normalizeDetailData(response, data)
}

export async function exportRequestLogCsv(params?: Record<string, unknown>) {
    return request<Blob>('/v1/log/request/export', 'GET', {
        params,
        responseType: 'blob',
    })
}
