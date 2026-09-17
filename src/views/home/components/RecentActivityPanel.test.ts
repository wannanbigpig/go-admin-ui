import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string, params?: Record<string, unknown>) => `${key}${params?.count === undefined ? '' : `:${params.count}`}`,
        locale: { value: 'zh-CN' },
    }),
}))

import RecentActivityPanel from '@/views/home/components/RecentActivityPanel.vue'

const activity = {
    key: '12',
    request_log_id: 12,
    title: '更新系统配置',
    desc: 'super_admin',
    time: '10:00',
    type: 'warning' as const,
    operation_status: 10001,
    created_at: '2026-09-16 10:00:00',
    method: 'POST',
    base_url: '/admin/v1/system/config/update',
    operator_account: 'super_admin',
}

describe('RecentActivityPanel', () => {
    const mountPanel = (props: InstanceType<typeof RecentActivityPanel>['$props']) =>
        shallowMount(RecentActivityPanel, {
            props,
            global: {
                config: { warnHandler: vi.fn() },
                stubs: {
                    ElCard: { template: '<section><slot name="header" /><slot /></section>' },
                    ElButton: { template: '<button><slot /></button>' },
                    ElSkeleton: { template: '<div><slot name="template" /></div>' },
                    ElSkeletonItem: { template: '<span />' },
                    ElAlert: { props: ['title'], template: '<div>{{ title }}</div>' },
                    ElTag: { template: '<span><slot /></span>' },
                    ElEmpty: { props: ['description'], template: '<div>{{ description }}<slot name="image" /></div>' },
                    ElIcon: { template: '<span><slot /></span>' },
                },
            },
        })

    it('renders loading and empty states explicitly', async () => {
        const wrapper = mountPanel({ items: [], loading: true, canViewList: false, canViewDetail: false })
        expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)

        await wrapper.setProps({ loading: false })
        expect(wrapper.text()).toContain('home.dashboard.activity.empty')
    })

    it('renders a recoverable load error', async () => {
        const wrapper = mountPanel({ items: [], loading: false, error: true, canViewList: false, canViewDetail: false })

        expect(wrapper.text()).toContain('home.dashboard.activity.loadFailed')
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('retry')).toHaveLength(1)
    })

    it('shows audit semantics and supports keyboard detail navigation', async () => {
        const wrapper = mountPanel({ items: [activity], loading: false, canViewList: true, canViewDetail: true })

        expect(wrapper.text()).toContain('更新系统配置')
        expect(wrapper.text()).not.toContain('super_admin')
        expect(wrapper.text()).not.toContain('POST /admin/v1/system/config/update')
        expect(wrapper.text()).toContain('home.dashboard.activity.failed')
        expect(wrapper.find('time').attributes('datetime')).toBe('2026-09-16 10:00:00')

        const entry = wrapper.find('.activity-entry')
        await entry.trigger('click')
        await entry.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('view')).toHaveLength(2)
        expect(wrapper.emitted('view')?.[0]?.[0]).toMatchObject(activity)
    })

    it('does not expose interactive affordances without request-log permissions', () => {
        const wrapper = mountPanel({ items: [activity], loading: false, canViewList: false, canViewDetail: false })

        expect(wrapper.find('.activity-entry').attributes('tabindex')).toBeUndefined()
        expect(wrapper.find('[data-testid="activity-view-all"]').exists()).toBe(false)
    })
})
