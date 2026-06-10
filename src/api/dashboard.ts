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

export interface CPUInfo {
    usage_percent: number
    cores: number
}

export interface MemoryInfo {
    total: number
    used: number
    available: number
    usage_percent: number
}

export interface DiskInfo {
    total: number
    used: number
    free: number
    usage_percent: number
}

export interface LoadInfo {
    load1: number
    load5: number
    load15: number
}

export interface HostInfo {
    cpu: CPUInfo
    memory: MemoryInfo
    disk: DiskInfo
    load: LoadInfo
    uptime: number
    hostname: string
    os: string
    platform: string
    updated_at: string
}

export interface RuntimeInfo {
    goroutines: number
    heap_alloc: number
    heap_inuse: number
    heap_sys: number
    heap_released: number
    gc_cycles: number
    gc_pause_total_ns: number
    go_version: string
}

export interface AppInfo {
    online_sessions: number
    ws_online: number
    queue_pending: number
    queue_retrying: number
    queue_running: number
}

export interface DashboardMonitor {
    host: HostInfo
    runtime: RuntimeInfo
    app: AppInfo
}

export function getDashboardOverview() {
    return get<DashboardOverview>('/v1/dashboard/overview')
}

export function getDashboardStatistics() {
    return get<DashboardStatistics>('/v1/dashboard/statistics')
}

export function getDashboardMonitor() {
    return get<DashboardMonitor>('/v1/dashboard/monitor')
}
