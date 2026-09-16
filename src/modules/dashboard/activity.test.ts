import { describe, expect, it } from 'vitest'
import { buildDashboardActivityViews, parseRequestLogRouteQuery } from '@/modules/dashboard/activity'
import type { DashboardActivityItem } from '@/modules/dashboard/service'

const t = (key: string, params?: Record<string, unknown>) => `${key}${params?.count === undefined ? '' : `:${params.count}`}`

describe('dashboard activity presentation', () => {
    it('keeps newest-first order while preserving structured audit context', () => {
        const items: DashboardActivityItem[] = [
            {
                key: '1',
                title: '查询产品列表',
                desc: 'operator-a',
                time: '10:00',
                type: 'success',
                operation_status: 0,
                created_at: '2026-09-16 10:00:00',
                method: 'GET',
                base_url: '/admin/v1/product/list',
            },
            {
                key: '2',
                title: '更新角色',
                desc: 'operator-b',
                time: '10:01',
                type: 'warning',
                request_log_id: 2,
                operation_status: 10001,
                is_high_risk: 1,
                has_change_diff: true,
                created_at: '2026-09-16 10:01:00',
                method: 'POST',
                base_url: '/admin/v1/role/update',
                operator_account: 'operator-b',
                operator_name: 'Operator B',
            },
        ]

        const views = buildDashboardActivityViews(items, 'zh-CN', t, new Date('2026-09-16T10:02:00'))

        expect(views.map((item) => item.key)).toEqual(['2', '1'])
        expect(views[0]).toMatchObject({
            requestLogId: 2,
            title: '更新角色',
            operator: 'Operator B (operator-b)',
            source: 'POST /admin/v1/role/update',
            statusType: 'danger',
            isHighRisk: true,
            hasChangeDiff: true,
            relativeTime: 'home.dashboard.activity.minutesAgo:1',
        })
        expect(views[0].fullTime).toContain('2026')
    })

    it('keeps the legacy five-field response readable', () => {
        const [view] = buildDashboardActivityViews([{ key: '3', title: '登录系统', desc: 'super_admin', time: '17:30', type: 'success' }], 'zh-CN', t)

        expect(view).toMatchObject({
            requestLogId: '3',
            operator: 'super_admin',
            source: '',
            relativeTime: '17:30',
            fullTime: '17:30',
            statusType: 'success',
        })
    })

    it('parses only valid request-log deep-link query values', () => {
        expect(parseRequestLogRouteQuery({ detail: '18', request_id: ' request-1 ', operator_account: 'admin' })).toEqual({
            detailId: 18,
            requestId: 'request-1',
            operatorAccount: 'admin',
        })
        expect(parseRequestLogRouteQuery({ detail: '-1', operator_account: ['  '] })).toEqual({})
    })
})
