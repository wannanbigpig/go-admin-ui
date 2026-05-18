import { get } from '@/utils/request'

export function getDashboardOverview() {
    return get('/v1/dashboard/overview')
}
