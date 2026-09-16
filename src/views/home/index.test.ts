import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Home from './index.vue'
const mocks = vi.hoisted(() => ({ monitor: vi.fn(), overview: vi.fn(), statistics: vi.fn() }))
vi.mock('@/api/dashboard', () => ({ getDashboardMonitor: mocks.monitor }))
vi.mock('@/modules/dashboard/service', () => ({ fetchDashboardOverview: mocks.overview, fetchDashboardStatistics: mocks.statistics }))
vi.mock('@/modules/dashboard/echarts', () => ({ initDashboardChart: () => ({ setOption: vi.fn(), dispose: vi.fn(), resize: vi.fn() }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ userInfo: {} }) }))
vi.mock('@/stores/setting', () => ({ useSettingStore: () => ({ locale: 'zh-CN' }) }))
vi.mock('@/utils/auth', () => ({ hasPermission: () => true }))
vi.mock('@/utils/helper', () => ({ formatFileSize: () => '0 B' }))
vi.mock('@/utils/logger', () => ({ Logger: { warn: vi.fn() } }))

describe('home monitor lifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers()
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
})
