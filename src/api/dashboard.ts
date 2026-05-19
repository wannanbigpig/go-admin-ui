import { get } from '@/utils/request'

export function getDashboardOverview() {
    return get('/v1/dashboard/overview')
}

export function getDashboardStatistics() {
    return get('/v1/dashboard/statistics')
}
