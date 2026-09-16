import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DateRangePicker from './index.vue'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({ ElMessage: { warning: vi.fn() } }))

describe('date range clear', () => {
    it('emits an empty array on clear and after rejecting an oversized range', async () => {
        const wrapper = mount(DateRangePicker, { global: { stubs: { ElDatePicker: { name: 'ElDatePicker', template: '<div />' } } } })
        const picker = wrapper.findComponent({ name: 'ElDatePicker' })
        picker.vm.$emit('update:modelValue', null)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
        picker.vm.$emit('change', ['2026-01-01', '2026-03-01'])
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
        wrapper.unmount()
    })
})
