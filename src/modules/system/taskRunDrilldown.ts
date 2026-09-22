import type { TaskRunQuery, TaskRunStats } from '@/types/system'

export type TaskRunDrilldownStatus = 'failed' | 'canceled' | 'timeout' | 'interrupted'

type DrilldownStats = Pick<TaskRunStats, 'task_code' | 'kind' | 'source' | 'detail_time_basis' | 'detail_start_time' | 'detail_end_time'>
type ParsedDrilldownFilters = Pick<TaskRunQuery, 'task_code' | 'kind' | 'source' | 'status' | 'time_basis'>

const TASK_KINDS = new Set(['async', 'cron'])
const TASK_SOURCES = new Set(['queue', 'cron', 'manual'])
const TASK_RUN_STATUSES = new Set(['pending', 'running', 'success', 'failed', 'canceled', 'retrying', 'timeout', 'interrupted'])
const TASK_RUN_TIME_BASES = new Set(['created_at', 'finished_at'])

const queryString = (value: unknown) => {
    if (Array.isArray(value)) return queryString(value[0])
    return typeof value === 'string' && value.trim() ? value.trim() : ''
}

export function buildTaskRunDrilldownQuery(stats: DrilldownStats, status: TaskRunDrilldownStatus): Record<string, string> {
    const query: Record<string, string> = {
        tab: 'run',
        status,
        time_basis: stats.detail_time_basis || 'finished_at',
    }
    if (stats.task_code) query.task_code = stats.task_code
    if (stats.kind) query.kind = stats.kind
    if (stats.source) query.source = stats.source
    if (stats.detail_start_time) query.detail_start_time = stats.detail_start_time
    if (stats.detail_end_time) query.detail_end_time = stats.detail_end_time
    return query
}

export function parseTaskRunDrilldownQuery(query: Record<string, unknown>): { filters: ParsedDrilldownFilters; dateRange: [string, string] | null } {
    const taskCode = queryString(query.task_code)
    const kind = queryString(query.kind)
    const source = queryString(query.source)
    const status = queryString(query.status)
    const timeBasis = queryString(query.time_basis)
    const startTime = queryString(query.detail_start_time)
    const endTime = queryString(query.detail_end_time)
    const filters: ParsedDrilldownFilters = {}

    if (taskCode) filters.task_code = taskCode
    if (TASK_KINDS.has(kind)) filters.kind = kind
    if (TASK_SOURCES.has(source)) filters.source = source
    if (TASK_RUN_STATUSES.has(status)) filters.status = status
    if (TASK_RUN_TIME_BASES.has(timeBasis)) filters.time_basis = timeBasis as NonNullable<TaskRunQuery['time_basis']>

    return {
        filters,
        dateRange: startTime && endTime ? [startTime, endTime] : null,
    }
}
