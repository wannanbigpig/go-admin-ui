import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Home from './index.vue'
import RecentActivityPanel from './components/RecentActivityPanel.vue'
import TodoCard from './components/TodoCard.vue'
const mocks = vi.hoisted(() => ({
    monitor: vi.fn(),
    personal: vi.fn(),
    overview: vi.fn(),
    statistics: vi.fn(),
    routerPush: vi.fn(),
    permissions: new Set<string>(),
}))
vi.mock('@/api/dashboard', () => ({ getDashboardMonitor: mocks.monitor }))
vi.mock('@/modules/dashboard/service', () => ({ fetchDashboardPersonal: mocks.personal, fetchDashboardOverview: mocks.overview, fetchDashboardStatistics: mocks.statistics }))
vi.mock('@/modules/dashboard/echarts', () => ({ initDashboardChart: () => ({ setOption: vi.fn(), dispose: vi.fn(), resize: vi.fn() }) }))
vi.mock('./components/TodoCard.vue', () => ({ default: { name: 'TodoCard', template: '<div data-testid="todo-card" />' } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.routerPush }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ userInfo: {} }) }))
vi.mock('@/stores/setting', () => ({ useSettingStore: () => ({ locale: 'zh-CN' }) }))
vi.mock('@/utils/auth', () => ({ hasPermission: (permission: string) => mocks.permissions.has(permission) }))
vi.mock('@/utils/helper', () => ({ formatFileSize: () => '0 B' }))
vi.mock('@/utils/logger', () => ({ Logger: { warn: vi.fn() } }))

describe('home monitor lifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        mocks.permissions.clear()
        mocks.permissions.add('dashboard:overview')
        mocks.permissions.add('dashboard:statistics')
        mocks.permissions.add('dashboard:monitor')
        mocks.personal.mockResolvedValue({ activities: [], user_login: {}, summary: { today_operations: 3, today_failures: 1, today_changes: 2, unread_notifications: 4 } })
        mocks.overview.mockResolvedValue(null)
        mocks.statistics.mockResolvedValue(null)
    })
    afterEach(() => vi.useRealTimers())
    it('does not install polling after unmount during initial API requests', async () => {
        let resolve!: (value: unknown) => void
        mocks.monitor.mockReturnValue(
            new Promise((r) => {
                resolve = r
            })
        )
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        expect(mocks.monitor).toHaveBeenCalledTimes(1)
        wrapper.unmount()
        resolve({})
        await flushPromises()
        await vi.advanceTimersByTimeAsync(90000)
        expect(mocks.monitor).toHaveBeenCalledTimes(1)
        expect(vi.getTimerCount()).toBe(0)
    })
    it('does not start API work after unmount while charts are loading', async () => {
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        wrapper.unmount()
        await flushPromises()
        await vi.advanceTimersByTimeAsync(90000)
        expect(mocks.monitor).not.toHaveBeenCalled()
        expect(vi.getTimerCount()).toBe(0)
    })

    it('polls while mounted and clears the interval on unmount', async () => {
        mocks.monitor.mockResolvedValue(null)
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        await vi.advanceTimersByTimeAsync(30000)
        expect(mocks.monitor).toHaveBeenCalledTimes(2)
        wrapper.unmount()
        await vi.advanceTimersByTimeAsync(90000)
        expect(mocks.monitor).toHaveBeenCalledTimes(2)
        expect(vi.getTimerCount()).toBe(0)
    })

    it('loads personal data but skips every protected dashboard request without permissions', async () => {
        mocks.permissions.clear()
        mocks.monitor.mockResolvedValue(null)
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        await vi.advanceTimersByTimeAsync(90000)

        expect(mocks.personal).toHaveBeenCalledTimes(1)
        expect(mocks.overview).not.toHaveBeenCalled()
        expect(mocks.statistics).not.toHaveBeenCalled()
        expect(mocks.monitor).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('3')
        expect(wrapper.text()).toContain('home.dashboard.personal.operations')
        expect(wrapper.text()).not.toContain('home.dashboard.globalTitle')
        expect(wrapper.findComponent(TodoCard).exists()).toBe(true)
        expect(vi.getTimerCount()).toBe(0)
        wrapper.unmount()
    })

    it('shows independent retry states when protected dashboard data fails', async () => {
        mocks.monitor.mockRejectedValueOnce(new Error('monitor unavailable'))
        mocks.overview.mockRejectedValueOnce(new Error('overview unavailable'))
        mocks.statistics.mockRejectedValueOnce(new Error('statistics unavailable'))
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()

        expect(wrapper.html()).toContain('home.dashboard.overviewLoadFailed')
        expect(wrapper.html()).toContain('home.dashboard.statisticsLoadFailed')
        expect(wrapper.html()).toContain('home.dashboard.monitorLoadFailed')
        expect(wrapper.find('.personal-work-row').exists()).toBe(true)
        wrapper.unmount()
    })

    it('keeps only permission-backed shortcuts and opens the personal activity list for every user', async () => {
        mocks.permissions.clear()
        mocks.personal.mockResolvedValue({ activities: [], user_login: {} })
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()

        expect(wrapper.text()).toContain('home.dashboard.shortcut.profile')
        expect(wrapper.text()).not.toContain('home.dashboard.shortcut.users')
        expect(wrapper.text()).toContain('home.dashboard.shortcut.logs')
        expect(wrapper.text()).toContain('home.dashboard.shortcut.todo')

        wrapper.findComponent(RecentActivityPanel).vm.$emit('view-all')
        expect(mocks.routerPush).toHaveBeenCalledWith('/my-request-log')
        wrapper.unmount()
    })

    it('shows the configuration shortcut for any configuration sub-capability', async () => {
        mocks.permissions.clear()
        mocks.permissions.add('storage:config')
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()

        expect(wrapper.text()).toContain('home.dashboard.shortcut.config')
        wrapper.unmount()
    })

    it('opens a structured activity in the matching request-log detail', async () => {
        const activity = {
            key: '27',
            request_log_id: 27,
            request_id: 'request-27',
            title: '更新角色权限',
            desc: 'admin',
            time: '10:00',
            type: 'success' as const,
        }
        mocks.personal.mockResolvedValue({ activities: [activity], user_login: {} })
        mocks.monitor.mockResolvedValue(null)
        const wrapper = shallowMount(Home, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()

        wrapper.findComponent(RecentActivityPanel).vm.$emit('view', activity)

        expect(mocks.routerPush).toHaveBeenCalledWith({ path: '/my-request-log', query: { detail: '27' } })
        wrapper.unmount()
    })
})
