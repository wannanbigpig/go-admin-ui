import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import ElementPlus from 'element-plus'

const mocks = vi.hoisted(() => ({ fetchList: vi.fn(), fetchDetail: vi.fn(), fetchEvents: vi.fn(), replace: vi.fn() }))
vi.mock('@/modules/system/service', () => ({
    fetchTaskRunList: mocks.fetchList,
    fetchTaskRunDetail: mocks.fetchDetail,
    fetchTaskRunEvents: mocks.fetchEvents,
    retryTaskByRunId: vi.fn(),
    cancelTaskByRunId: vi.fn(),
}))
vi.mock('@/composables/useDictOptions', () => ({ useDictOptions: () => ({ options: ref([]), tagMap: ref({}), load: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/components/actionButtons/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('vue-router', () => ({
    useRouter: () => ({ replace: mocks.replace }),
    useRoute: () => ({ query: { tab: 'run', task_code: 'report:export', status: 'failed', time_basis: 'finished_at', detail_start_time: '2026-09-10 00:00:00', detail_end_time: '2026-09-10 23:59:59' } }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))

import TaskRunPanel from './TaskRunPanel.vue'
import type { TaskRun, TaskRunEvent } from '@/types/system'

const polls = vi.hoisted(() => [] as Array<{ run: (ctx: { signal: AbortSignal }) => Promise<void>; options: { when?: () => boolean }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }>)
vi.mock('@/composables/useIntervalPolling', () => ({ useIntervalPolling: (run: (ctx: { signal: AbortSignal }) => Promise<void>, options: { when?: () => boolean }) => {
    const polling = { run, options, start: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() }
    polls.push(polling)
    return polling
} }))
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done }); return { promise, resolve } }
interface DetailVM { handleRunDetail: (row: TaskRun) => Promise<void>; currentRunDetail: TaskRun | null; runEvents: TaskRunEvent[]; runEventsLoading: boolean; showRunDetailDrawer: boolean }
const run = (id: number) => ({ id, status: 'running' } as TaskRun)
const event = (id: number) => ({ id } as TaskRunEvent)
const mountDetailPanel = () => mount(TaskRunPanel, { props: { active: true }, global: { plugins: [ElementPlus], stubs: { XlTableList: true, XlActionButtons: true, ElDrawer: true, IEpArrowDown: true, IEpArrowUp: true } } })

beforeEach(() => {
    vi.clearAllMocks()
    polls.length = 0
    mocks.fetchList.mockResolvedValue({ list: [], total: 0 })
    mocks.fetchDetail.mockImplementation(async (id: number) => run(id))
    mocks.fetchEvents.mockResolvedValue([])
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0 })
})

describe('TaskRunPanel detail ownership', () => {
    it('does not let an older detail response replace the newly opened run', async () => {
        const older = deferred<TaskRun>()
        mocks.fetchDetail.mockImplementation((id: number) => id === 1 ? older.promise : Promise.resolve(run(id)))
        const wrapper = mountDetailPanel()
        const vm = wrapper.vm as unknown as DetailVM
        const a = vm.handleRunDetail(run(1))
        await vm.handleRunDetail(run(2))
        older.resolve(run(1))
        await a
        expect(vm.currentRunDetail?.id).toBe(2)
        expect(mocks.fetchEvents).not.toHaveBeenCalledWith(1)
        wrapper.unmount()
    })

    it('keeps events and loading owned by the latest detail request', async () => {
        const older = deferred<TaskRunEvent[]>()
        const latest = deferred<TaskRunEvent[]>()
        mocks.fetchEvents.mockImplementation((id: number) => id === 1 ? older.promise : latest.promise)
        const wrapper = mountDetailPanel()
        const vm = wrapper.vm as unknown as DetailVM
        const a = vm.handleRunDetail(run(1))
        await flushPromises()
        const b = vm.handleRunDetail(run(2))
        await flushPromises()
        older.resolve([event(101)])
        await a
        expect(vm.runEvents).toEqual([])
        expect(vm.runEventsLoading).toBe(true)
        latest.resolve([event(202)])
        await b
        expect(vm.runEvents).toEqual([event(202)])
        expect(vm.runEventsLoading).toBe(false)
        wrapper.unmount()
    })

    it('invalidates pending details on close and ignores polls belonging to another run', async () => {
        const wrapper = mountDetailPanel()
        const vm = wrapper.vm as unknown as DetailVM
        await vm.handleRunDetail(run(1))
        const oldPoll = deferred<TaskRun>()
        mocks.fetchDetail.mockImplementation((id: number) => id === 1 ? oldPoll.promise : Promise.resolve(run(id)))
        const polling = polls[1].run({ signal: new AbortController().signal })
        await vm.handleRunDetail(run(2))
        oldPoll.resolve(run(1))
        await polling
        expect(vm.currentRunDetail?.id).toBe(2)
        const pending = deferred<TaskRun>()
        mocks.fetchDetail.mockReturnValueOnce(pending.promise)
        const opening = vm.handleRunDetail(run(3))
        vm.showRunDetailDrawer = false
        await flushPromises()
        pending.resolve(run(3))
        await opening
        expect(vm.showRunDetailDrawer).toBe(false)
        expect(vm.runEventsLoading).toBe(false)
        expect(mocks.fetchEvents).not.toHaveBeenCalledWith(3)
        await wrapper.setProps({ active: false })
        expect(polls[1].options.when?.()).toBe(false)
        wrapper.unmount()
    })
})

describe('TaskRunPanel reset after statistics drilldown', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('clears drilldown filters in the URL, visible form, and list request', async () => {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0 })
        mocks.fetchList.mockResolvedValue({ list: [], total: 0 })
        mocks.replace.mockResolvedValue(undefined)
        const wrapper = mount(TaskRunPanel, {
            props: { active: false },
            global: { plugins: [ElementPlus], stubs: { XlTableList: true, XlActionButtons: true, IEpArrowDown: true, IEpArrowUp: true } },
        })
        try {
            await flushPromises()
            expect(mocks.fetchList).toHaveBeenLastCalledWith(expect.objectContaining({ task_code: 'report:export', status: 'failed', time_basis: 'finished_at' }))
            await wrapper.findAll('button').find((button) => button.text() === 'common.actions.reset')!.trigger('click')
            await flushPromises()
            expect(mocks.replace).toHaveBeenCalledWith({ query: { tab: 'run' } })
            expect(mocks.fetchList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, task_code: null, status: null, time_basis: null, start_time: null, end_time: null }))
            expect(wrapper.get<HTMLInputElement>('input[placeholder="system.task.codePlaceholder"]').element.value).toBe('')
        } finally {
            wrapper.unmount()
        }
    })
})
