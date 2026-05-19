import { getDashboardOverview, getDashboardStatistics } from '@/api/dashboard'
import { normalizeDetailData } from '@/modules/shared/response'

export interface DashboardMetric {
    key: string
    value: number
    suffix?: string
    compare?: string
    change?: string
    type?: 'success' | 'warning' | 'info' | 'primary' | 'danger'
}

export interface DashboardActivityItem {
    key: string
    title: string
    desc: string
    time: string
    type: 'success' | 'warning' | 'info' | 'primary' | 'danger'
}

export interface TrendData {
    dates: string[]
    requests: number[]
    errors: number[]
    logins: number[]
}

export interface ResponseTimeBucket {
    label: string
    lower_ms: number
    upper_ms?: number
    count: number
}

export interface ResponseTimeStats {
    buckets: ResponseTimeBucket[]
    avg_ms: number
}

export interface ErrorCodeStat {
    status_code: number
    count: number
}

export interface StorageTypeStat {
    file_type: string
    count: number
    size_bytes: number
}

export interface StorageStats {
    total_count: number
    total_size_bytes: number
    by_type: StorageTypeStat[]
}

export interface DashboardStatisticsSummary {
    total_requests: number
    total_errors: number
    total_logins: number
    avg_response_ms: number
    storage_total_count: number
    storage_total_size_bytes: number
}

export interface DashboardStatisticsTrendDay {
    date: string
    request_count: number
    error_count: number
    login_count: number
}

export interface DashboardStatisticsTrend {
    days: DashboardStatisticsTrendDay[]
}

export interface ErrorCategoryBucket {
    key: string
    title: string
    count: number
}

export interface ErrorDistribution {
    total: number
    categories: ErrorCategoryBucket[]
    status_codes: ErrorCodeStat[]
}

export interface DashboardOverview {
    metrics: DashboardMetric[]
    activities: DashboardActivityItem[]
    user_login?: {
        last_login?: string
        last_ip?: string
    }
    trend?: TrendData
    response_time?: ResponseTimeStats
    error_codes?: ErrorCodeStat[]
    storage?: StorageStats
}

export interface DashboardStatistics {
    window_days: number
    window_start: string
    window_end: string
    generated_at: string
    summary: DashboardStatisticsSummary
    trend: DashboardStatisticsTrend
    response_time?: ResponseTimeStats
    errors: ErrorDistribution
    storage?: StorageStats
}

export async function fetchDashboardOverview() {
    const response = await getDashboardOverview()
    return normalizeDetailData<DashboardOverview>(response, {
        metrics: [],
        activities: [],
    })
}

export async function fetchDashboardStatistics() {
    const response = await getDashboardStatistics()
    return normalizeDetailData<DashboardStatistics>(response, {
        window_days: 0,
        window_start: '',
        window_end: '',
        generated_at: '',
        summary: {
            total_requests: 0,
            total_errors: 0,
            total_logins: 0,
            avg_response_ms: 0,
            storage_total_count: 0,
            storage_total_size_bytes: 0,
        },
        trend: {
            days: [],
        },
        errors: {
            total: 0,
            categories: [],
            status_codes: [],
        },
    })
}
