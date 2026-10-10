import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/composables/usePermission', () => ({ usePermission: () => ({ getButtonInfoFull: () => null }) }))
vi.mock('@/composables/useDictOptions', () => ({ invalidateDictOptionsCache: vi.fn(), useDictOptions: () => ({ options: ref([]), tagMap: ref({}), load: vi.fn() }) }))
vi.mock('@/composables/useListPage', () => ({ useListPage: () => ({ loading: ref(false), items: ref([]), pagination: {}, getList: vi.fn(), handleSearch: vi.fn(), handleReset: vi.fn(), handleSortChange: vi.fn() }) }))
vi.mock('@/modules/system/service', () => ({ fetchDictTypeList: vi.fn(), fetchDictTypeDetail: vi.fn(), addDictType: vi.fn(), modifyDictType: vi.fn(), removeDictType: vi.fn(), fetchDictItemList: vi.fn(), addDictItem: vi.fn(), modifyDictItem: vi.fn(), removeDictItem: vi.fn() }))
import DictPage from './index.vue'

describe('dictionary tab content', () => {
    it('places the visible list within the corresponding tab panel', async () => {
        const wrapper = mount(DictPage, { global: { plugins: [ElementPlus], directives: { permission: () => undefined }, stubs: {
            XlProTable: { template: '<div data-list />' }, XlDrawer: true, XlActionButton: true, XlActionButtons: true, XlI18nInput: true,
        } } })
        await flushPromises()
        expect(wrapper.get('#pane-type').find('[data-list]').exists()).toBe(true)
        expect(wrapper.findAll('[data-list]')).toHaveLength(1)
        await wrapper.get('#tab-item').trigger('click')
        await flushPromises()
        expect(wrapper.get('#pane-item').find('[data-list]').exists()).toBe(true)
        expect(wrapper.findAll('[data-list]')).toHaveLength(1)
        wrapper.unmount()
    })
})
