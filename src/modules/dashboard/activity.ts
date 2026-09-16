import type { LocationQuery, LocationQueryValue } from 'vue-router'
import type { DashboardActivityItem } from '@/modules/dashboard/service'

type Translate = (key: string, params?: Record<string, unknown>) => string

export interface DashboardActivityView extends DashboardActivityItem {
    requestLogId: number | string
    operator: string
    source: string
    relativeTime: string
    fullTime: string
    statusType: 'success' | 'danger'
    statusLabel: string
    isHighRisk: boolean
    hasChangeDiff: boolean
}

function parseActivityDate(value?: string) {
    if (!value || !value.includes('-')) return null
    const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
    return Number.isNaN(date.getTime()) ? null : date
}

function formatFullTime(date: Date, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date)
}

function formatRelativeTime(date: Date, locale: string, t: Translate, now: Date) {
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return t('home.dashboard.activity.justNow')
    if (diffHours < 1) return t('home.dashboard.activity.minutesAgo', { count: diffMinutes })
    if (diffDays < 1) return t('home.dashboard.activity.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('home.dashboard.activity.daysAgo', { count: diffDays })
    return new Intl.DateTimeFormat(locale, { month: '2-digit', day: '2-digit' }).format(date)
}

function formatOperator(item: DashboardActivityItem) {
    const account = item.operator_account?.trim() || item.desc?.trim() || ''
    const name = item.operator_name?.trim() || ''
    if (name && account && name !== account) return `${name} (${account})`
    return name || account
}

function formatSource(item: DashboardActivityItem) {
    return [item.method?.trim(), item.base_url?.trim()].filter(Boolean).join(' ')
}

function isSuccessful(item: DashboardActivityItem) {
    if (item.operation_status !== undefined && item.operation_status !== null) return Number(item.operation_status) === 0
    return item.type === 'success'
}

export function buildDashboardActivityViews(items: DashboardActivityItem[], locale: string, t: Translate, now = new Date()): DashboardActivityView[] {
    return items
        .map((item, index) => ({ item, index, date: parseActivityDate(item.created_at) }))
        .sort((left, right) => {
            if (!left.date || !right.date) return left.index - right.index
            return right.date.getTime() - left.date.getTime()
        })
        .map(({ item, date }) => {
            const successful = isSuccessful(item)
            const fallbackTime = item.created_at || item.time || '-'
            return {
                ...item,
                requestLogId: item.request_log_id || item.key,
                title: item.operation_name?.trim() || item.title,
                operator: formatOperator(item),
                source: formatSource(item),
                relativeTime: date ? formatRelativeTime(date, locale, t, now) : fallbackTime,
                fullTime: date ? formatFullTime(date, locale) : fallbackTime,
                statusType: successful ? 'success' : 'danger',
                statusLabel: t(successful ? 'home.dashboard.activity.success' : 'home.dashboard.activity.failed'),
                isHighRisk: Number(item.is_high_risk) === 1,
                hasChangeDiff: item.has_change_diff === true,
            }
        })
}

function firstQueryValue(value: LocationQueryValue | LocationQueryValue[]) {
    return Array.isArray(value) ? value[0] : value
}

export function parseRequestLogRouteQuery(query: LocationQuery) {
    const result: { detailId?: number; requestId?: string; operatorAccount?: string } = {}
    const detailValue = firstQueryValue(query.detail)
    const detailId = Number(detailValue)
    if (Number.isInteger(detailId) && detailId > 0) result.detailId = detailId

    const requestId = firstQueryValue(query.request_id)?.trim()
    if (requestId) result.requestId = requestId

    const operatorAccount = firstQueryValue(query.operator_account)?.trim()
    if (operatorAccount) result.operatorAccount = operatorAccount
    return result
}
