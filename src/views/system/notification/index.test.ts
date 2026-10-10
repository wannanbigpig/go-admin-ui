import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import NotificationPage from './index.vue'

const mocks = vi.hoisted(() => ({ list: vi.fn(), markRead: vi.fn().mockResolvedValue(true) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/api/system', () => ({ getNotificationList: mocks.list }))
vi.mock('@/stores/notification', () => ({
    normalizeNotification: (value: unknown) => value,
    useNotificationStore: () => ({ markRead: mocks.markRead }),
}))
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))
vi.mock('@/composables/usePermission', () => ({ usePermission: () => ({ checkPermission: () => false }) }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

const SlotStub = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) })
const DrawerStub = defineComponent({
    props: ['modelValue', 'title'],
    setup: (props, { slots }) => () => props.modelValue ? h('section', { role: 'dialog', 'aria-label': props.title }, slots.default?.()) : null,
})

describe('notification keyboard navigation', () => {
    it.each(['Enter', ' '])('opens a named mobile detail drawer using %j and can close it with Space', async (key) => {
        vi.stubGlobal('innerWidth', 600)
        mocks.list.mockResolvedValue({ list: [{ id: '1', title: '通知标题', message: '通知全文', read: true, category: 'system' }], total: 1 })
        const wrapper = mount(NotificationPage, { global: { stubs: {
            XlCollapsibleSearchBtn: SlotStub,
            ElForm: SlotStub, ElFormItem: SlotStub, ElRow: SlotStub, ElCol: SlotStub,
            ElSelect: true, ElOption: true, ElButton: SlotStub, ElScrollbar: SlotStub,
            ElTag: SlotStub, ElPagination: true, ElSkeleton: true, ElEmpty: true, ElIcon: true,
            ElDrawer: DrawerStub, IEpCheck: true, IEpSetting: true, IEpClock: true, IEpArrowRight: true,
            IEpClose: true, ILucideMailOpen: true,
        } } })
        await flushPromises()
        const item = wrapper.get('.notification-item')
        expect(item.attributes('role')).toBe('button')
        expect(item.attributes('tabindex')).toBe('0')
        await item.trigger('keydown', { key })
        expect(item.attributes('aria-pressed')).toBe('true')
        expect(wrapper.get('[role="dialog"]').attributes('aria-label')).toBe('通知标题')
        await wrapper.get('.drawer-close-btn').trigger('keydown', { key: ' ' })
        expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
        wrapper.unmount()
        vi.unstubAllGlobals()
    })
})
