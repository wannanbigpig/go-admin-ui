import { get } from '@/utils/request'

export interface DashboardOverview {
    user_count?: number
    request_count?: number
    error_count?: number
    task_count?: number
    [key: string]: unknown
}

export interface DashboardStatistics {
    trend?: Array<{ date: string; count: number }>
    response_time?: Record<string, unknown>
    storage?: Record<string, unknown>
    error_codes?: Array<{ code: string; count: number }>
    [key: string]: unknown
}

export function getDashboardOverview() {
    return get<DashboardOverview>('/v1/dashboard/overview')
}

export function getDashboardStatistics() {
    return get<DashboardStatistics>('/v1/dashboard/statistics')
}
