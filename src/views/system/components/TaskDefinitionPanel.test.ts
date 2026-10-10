import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import ElementPlus from 'element-plus'

const mocks = vi.hoisted(() => ({ fetchList: vi.fn(), save: vi.fn() }))
vi.mock('@/modules/system/service', () => ({ fetchTaskList: mocks.fetchList, modifyTaskOperationConfig: mocks.save, modifyTaskRecordPolicy: vi.fn(), triggerTaskNow: vi.fn() }))
vi.mock('@/composables/useDictOptions', () => ({ useDictOptions: () => ({ options: ref([]), tagMap: ref({}), load: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/components/actionButton/index.vue', () => ({ default: { props: ['text'], template: '<button>{{ text }}</button>' } }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('vue-i18n', async (original) => ({ ...await original<typeof import('vue-i18n')>(), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))

import TaskDefinitionPanel from './TaskDefinitionPanel.vue'

describe('TaskDefinitionPanel high-risk cron retry policy', () => {
    afterEach(() => vi.unstubAllGlobals())

    it.each([1, 0])('normalizes legacy retry configuration only for high-risk cron=%i', async (highRisk) => {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0 })
        mocks.fetchList.mockResolvedValue({ list: [{ id: 1, code: 'cron:demo', kind: 'cron', is_high_risk: highRisk, status: 1, allow_retry: 1, allow_manual: 1, cron_spec: '0 * * * * *' }], total: 1 })
        mocks.save.mockResolvedValue({})
        const wrapper = mount(TaskDefinitionPanel, {
            props: { active: false },
            global: { plugins: [ElementPlus], directives: { permission: () => { /* Test rows are authorized. */ } }, stubs: { teleport: true, ElSelect: true, ElOption: true, IEpArrowDown: true, IEpArrowUp: true } },
        })
        try {
            await flushPromises()
            await wrapper.findAll('button').find((button) => button.text() === 'system.task.operationConfig')!.trigger('click')
            await flushPromises()
            const item = wrapper.findAll('.el-form-item').find((item) => item.text().includes('system.task.allowRetry'))!
            expect(item.get('input').attributes('disabled') !== undefined).toBe(Boolean(highRisk))
            expect(item.get<HTMLInputElement>('input').element.checked).toBe(!highRisk)
            expect(item.text().includes('system.task.highRiskCronRetryHint')).toBe(Boolean(highRisk))
            await wrapper.findAll('button').find((button) => button.text() === 'system.task.saveOperationConfig')!.trigger('click')
            await flushPromises()
            expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ task_code: 'cron:demo', allow_retry: highRisk ? 0 : 1 }))
        } finally {
            wrapper.unmount()
        }
    })
})
