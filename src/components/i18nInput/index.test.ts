import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { ElButton, ElInput, ElTag } from 'element-plus'
import { describe, expect, it, vi } from 'vitest'
import I18nInput from './index.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/locales', () => ({
    ENABLE_I18N: true,
    DEFAULT_LOCALE: 'zh-CN',
    LOCALE_OPTIONS: [{ value: 'zh-CN', label: '中文' }, { value: 'en-US', label: 'English' }],
}))

const DialogStub = defineComponent({
    props: ['modelValue'],
    setup(props, { slots }) {
        return () => props.modelValue ? h('section', [slots.default?.(), slots.footer?.()]) : null
    },
})

describe('i18n field labels', () => {
    it('associates each visible language label with a unique input across editor instances', async () => {
        const wrapper = mount(defineComponent({
            setup: () => () => h('div', [h(I18nInput, { modelValue: {} }), h(I18nInput, { modelValue: {} })]),
        }), { global: { components: { ElInput, ElButton, ElTag }, stubs: { ElDialog: DialogStub } } })
        for (const editor of wrapper.findAllComponents(I18nInput)) {
            await editor.get('button').trigger('click')
        }
        const labels = wrapper.findAll('label')
        expect(labels.map((label) => label.text())).toEqual(['中文', 'English', '中文', 'English'])
        const ids = labels.map((label) => label.attributes('for'))
        expect(new Set(ids).size).toBe(4)
        for (const id of ids) {
            expect(wrapper.findAll('input').some((input) => input.attributes('id') === id)).toBe(true)
        }
        wrapper.unmount()
    })
})
