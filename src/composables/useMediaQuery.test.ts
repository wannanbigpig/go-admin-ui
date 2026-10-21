import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

describe('responsive viewport state', () => {
    it('uses the initial breakpoint, follows changes and releases its listener', async () => {
        let change!: (event: { matches: boolean }) => void
        const removeEventListener = vi.fn()
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => ({
                matches: true,
                addEventListener: (_: string, listener: typeof change) => {
                    change = listener
                },
                removeEventListener,
            }))
        )
        const wrapper = mount(defineComponent({ setup: () => ({ mobile: useMediaQuery('(max-width: 600px)') }), template: '<span>{{ mobile }}</span>' }))
        try {
            expect(wrapper.text()).toBe('true')
            change({ matches: false })
            await wrapper.vm.$nextTick()
            expect(wrapper.text()).toBe('false')
        } finally {
            wrapper.unmount()
            expect(removeEventListener).toHaveBeenCalledWith('change', change)
            vi.unstubAllGlobals()
        }
    })
})
