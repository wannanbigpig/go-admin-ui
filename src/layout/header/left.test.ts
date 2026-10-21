import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HeaderLeft from './left.vue'

const mocks = vi.hoisted(() => ({ setKey: vi.fn() }))
const refreshStore = reactive({ isRefreshing: false, setKey: mocks.setKey })
vi.mock('vue-i18n', async (original) => ({ ...(await original<typeof import('vue-i18n')>()), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores/refresh', () => ({ useRefreshStore: () => refreshStore }))

describe('header refresh accessibility', () => {
    it('提供独立的移动导航按钮及展开状态', async () => {
        const wrapper = mount(HeaderLeft, {
            props: { mobileNavOpen: false },
            global: { stubs: { XlBreadcrumb: true, ElTooltip: { template: '<span><slot /></span>' }, ElIcon: true, IEpMenu: true, IEpRefresh: true } },
        })
        const button = wrapper.get('button[aria-label="layout.toggleSidebar"]')
        expect(button.attributes('aria-expanded')).toBe('false')
        await button.trigger('click')
        expect(wrapper.emitted('toggle-navigation')).toHaveLength(1)
        await wrapper.setProps({ mobileNavOpen: true })
        expect(button.attributes('aria-expanded')).toBe('true')
        wrapper.unmount()
    })
    it('exposes a named native button and prevents refresh while busy', async () => {
        const wrapper = mount(HeaderLeft, { global: { stubs: { XlBreadcrumb: true, ElTooltip: { template: '<span><slot /></span>' }, ElIcon: true, IEpRefresh: true } } })
        const button = wrapper.get('button[aria-label="layout.refreshPage"]')
        expect(button.attributes('type')).toBe('button')
        expect(button.attributes('aria-label')).toBe('layout.refreshPage')
        await button.trigger('click')
        expect(mocks.setKey).toHaveBeenCalledTimes(1)
        refreshStore.isRefreshing = true
        await wrapper.vm.$nextTick()
        expect(button.attributes('disabled')).toBeDefined()
        await button.trigger('click')
        expect(mocks.setKey).toHaveBeenCalledTimes(1)
        wrapper.unmount()
        refreshStore.isRefreshing = false
    })
})
