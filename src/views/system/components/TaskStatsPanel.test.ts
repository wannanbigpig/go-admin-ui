import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { ref } from 'vue'

const mocks = vi.hoisted(() => ({
    fetchStats: vi.fn(),
    fetchTrend: vi.fn(),
    routerPush: vi.fn(),
    chartDispose: vi.fn(),
}))

vi.mock('@/modules/system/service', () => ({
    fetchTaskRunStats: mocks.fetchStats,
    fetchTaskRunStatsTrend: mocks.fetchTrend,
}))
vi.mock('@/composables/useDictOptions', () => ({ useDictOptions: () => ({ options: ref([]), load: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/modules/system/dictOptions', () => ({
    SYSTEM_DICT_TYPES: { taskKind: 'task_kind', taskSource: 'task_source' },
    taskKindFallbackOptions: [],
    taskSourceFallbackOptions: [],
}))
vi.mock('@/modules/dashboard/echarts', () => ({ initDashboardChart: () => ({ setOption: vi.fn(), resize: vi.fn(), dispose: mocks.chartDispose }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.routerPush }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

import TaskStatsPanel from './TaskStatsPanel.vue'

describe('TaskStatsPanel drilldown', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchStats.mockResolvedValue({
            task_code: 'report:export',
            kind: 'async',
            source: 'queue',
            detail_time_basis: 'finished_at',
            detail_start_time: '2026-09-10 09:00:00',
            detail_end_time: '2026-09-10 10:59:59',
            total_count: 12,
            success_count: 7,
            failed_count: 2,
            canceled_count: 1,
            timeout_count: 1,
            interrupted_count: 1,
            sampled_success_count: 3,
            duration_total_ms: 3600,
            duration_max_ms: 1500,
            duration_avg_ms: 300,
            success_rate: 58.3,
        })
        mocks.fetchTrend.mockResolvedValue([])
    })

    it('drills a failed total into execution records with the exact detail window', async () => {
        const wrapper = shallowMount(TaskStatsPanel)
        await flushPromises()

        await wrapper.find('[data-testid="task-stats-failed"]').trigger('click')

        expect(mocks.routerPush).toHaveBeenCalledWith({
            path: '/task/center',
            query: {
                tab: 'run',
                task_code: 'report:export',
                kind: 'async',
                source: 'queue',
                status: 'failed',
                time_basis: 'finished_at',
                detail_start_time: '2026-09-10 09:00:00',
                detail_end_time: '2026-09-10 10:59:59',
            },
        })
        wrapper.unmount()
    })
})
