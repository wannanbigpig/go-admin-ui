import { getDashboardOverview } from '@/api/dashboard'
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

export interface DashboardOverview {
    metrics: DashboardMetric[]
    activities: DashboardActivityItem[]
    user_login?: {
        last_login?: string
        last_ip?: string
    }
}

export async function fetchDashboardOverview() {
    const response = await getDashboardOverview()
    return normalizeDetailData<DashboardOverview>(response, {
        metrics: [],
        activities: [],
    })
}
