import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { ElButton, ElDrawer } from 'element-plus'
import Drawer from './index.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/logger', () => ({ Logger: { warn: vi.fn(), error: vi.fn() } }))

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
const render = (props: Record<string, unknown> = {}) => {
    const wrapper = mount(Drawer, {
        props: { modelValue: true, title: 'Edit profile', ...props },
        attachTo: document.body,
        global: { components: { ElDrawer, ElButton }, stubs: { teleport: true } },
    })
    wrappers.push(wrapper)
    return wrapper
}

describe('shared drawer interaction', () => {
    it('associates the visible custom header with its dialog', async () => {
        const wrapper = render()
        await flushPromises()
        const dialog = wrapper.get('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Edit profile')
        const title = wrapper.get('h4')
        expect(title.attributes('id')).toBeTruthy()
        expect(title.text()).toBe('Edit profile')
    })

    it('runs the same closing guard for the footer and drawer dismissal', async () => {
        let close: (() => void) | undefined
        const guard = vi.fn((done: () => void) => {
            close = done
        })
        const wrapper = render({ beforeClose: guard })
        await flushPromises()
        await wrapper.getComponent(ElButton).trigger('click') // reset does not close
        const cancel = wrapper.findAllComponents(ElButton).find((button) => button.text() === 'common.actions.cancel')!
        await cancel.trigger('click')
        expect(guard).toHaveBeenCalledOnce()
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        close!()
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
        const dismiss = vi.fn()
        wrapper.getComponent(ElDrawer).props('beforeClose')!(dismiss)
        expect(guard).toHaveBeenCalledTimes(2)
        close!()
        expect(dismiss).toHaveBeenCalledOnce()
    })

    it('blocks reset and submit during detail loading without labeling it as submitting', async () => {
        const submit = vi.fn()
        const reset = vi.fn()
        const wrapper = render({ loading: true, onConfirm: submit, onReset: reset })
        await flushPromises()
        const buttons = wrapper.findAllComponents(ElButton)
        expect(buttons[0].props('disabled')).toBe(true)
        expect(buttons[1].props('disabled')).not.toBe(true)
        expect(buttons[2].props('disabled')).toBe(true)
        expect(buttons[2].text()).toBe('common.actions.submit')
        await buttons[0].trigger('click')
        await buttons[2].trigger('click')
        expect(submit).not.toHaveBeenCalled()
        expect(reset).not.toHaveBeenCalled()
    })
})
