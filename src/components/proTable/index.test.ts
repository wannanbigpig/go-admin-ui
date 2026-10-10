import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import ProTable from './index.vue'
import { applyDateRangeToQuery } from '@/modules/log/helpers'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

describe('ProTable date range search', () => {
    let wrapper: VueWrapper | undefined
    afterEach(() => {
        wrapper?.unmount()
        document.body.innerHTML = ''
    })

    it('searches the whole local day when the user selects today', async () => {
        wrapper = mount(ProTable, {
            attachTo: document.body,
            props: { data: [], searchModel: { dateRange: [] }, searchSchema: [{ prop: 'dateRange', type: 'daterange' }] },
            global: { plugins: [ElementPlus], stubs: { XlTableList: true, IEpArrowDown: true, IEpArrowUp: true, IEpView: true } },
        })
        await wrapper.get('.el-range-input').trigger('click')
        await flushPromises()
        const today = [...document.querySelectorAll<HTMLButtonElement>('.el-picker-panel__shortcut')].find((button) => button.textContent?.trim() === 'common.date.today')
        expect(today).toBeDefined()
        today!.click()
        await flushPromises()
        await wrapper.findAll('button').find((button) => button.text() === 'common.actions.search')!.trigger('click')

        const payload = wrapper.emitted('search')?.at(-1)?.[0] as { dateRange: [string, string] }
        const query: Record<string, unknown> = {}
        applyDateRangeToQuery(query, payload.dateRange)
        const now = new Date()
        expect(query).toEqual({
            start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
            end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
        })
    })
})
