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

const SlotStub = defineComponent({
    inheritAttrs: false,
    setup:
        (_, { slots }) =>
        () =>
            h('div', slots.default?.()),
})
const DrawerStub = defineComponent({
    props: ['modelValue', 'title'],
    setup:
        (props, { slots }) =>
        () =>
            props.modelValue ? h('section', { role: 'dialog', 'aria-label': props.title }, slots.default?.()) : null,
})

describe('notification keyboard navigation', () => {
    it.each(['Enter', ' '])('opens a named mobile detail drawer using %j and can close it with Space', async (key) => {
        vi.stubGlobal('innerWidth', 600)
        mocks.list.mockResolvedValue({ list: [{ id: '1', title: '通知标题', message: '通知全文', read: true, category: 'system' }], total: 1 })
        const wrapper = mount(NotificationPage, {
            global: {
                stubs: {
                    XlCollapsibleSearchBtn: SlotStub,
                    ElForm: SlotStub,
                    ElFormItem: SlotStub,
                    ElRow: SlotStub,
                    ElCol: SlotStub,
                    ElSelect: true,
                    ElOption: true,
                    ElButton: SlotStub,
                    ElScrollbar: SlotStub,
                    ElTag: SlotStub,
                    ElPagination: true,
                    ElSkeleton: true,
                    ElEmpty: true,
                    ElIcon: true,
                    ElDrawer: DrawerStub,
                    IEpCheck: true,
                    IEpSetting: true,
                    IEpClock: true,
                    IEpArrowRight: true,
                    IEpClose: true,
                    ILucideMailOpen: true,
                },
            },
        })
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

describe('notification request ordering', () => {
    it('分页与重新查询使用统一页码，标记已读失败可恢复未读展示', async () => {
        const record = { id: 'unread', title: 'Unread notification', category: 'system', read: false }
        mocks.list.mockResolvedValue({ list: [{ ...record }], total: 20 })
        mocks.markRead.mockResolvedValueOnce(false)
        const wrapper = mount(NotificationPage, { global: { stubs: { ElSelect: true, ElOption: true, ElPagination: true, ElDrawer: true } } })
        try {
            await flushPromises()
            await wrapper.get('.notification-item').trigger('click')
            await flushPromises()
            expect(wrapper.get('.notification-item').classes()).toContain('is-unread')
            const state = (wrapper.vm.$ as unknown as { setupState: { handlePageChange: (page: number) => Promise<void>; handleSearch: () => Promise<void> } }).setupState
            await state.handlePageChange(2)
            expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, per_page: 15 }))
            await state.handleSearch()
            expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, per_page: 15 }))
        } finally {
            wrapper.unmount()
        }
    })
    it.each(['success', 'failure'])('ignores a stale %s after a newer filter has completed', async (outcome) => {
        mocks.list.mockResolvedValue({ list: [], total: 0 })
        const wrapper = mount(NotificationPage, { global: { stubs: { ElSelect: true, ElOption: true, ElPagination: true, ElDrawer: true } } })
        try {
            await flushPromises()
            const state = (wrapper.vm.$ as unknown as { setupState: { queryParams: { category: string }; fetchList: () => Promise<void> } }).setupState
            let resolveOld!: (value: unknown) => void
            let rejectOld!: (reason: Error) => void
            mocks.list.mockImplementationOnce(
                () =>
                    new Promise((resolve, reject) => {
                        resolveOld = resolve
                        rejectOld = reject
                    })
            )
            state.queryParams.category = 'system'
            const old = state.fetchList()
            mocks.list.mockResolvedValueOnce({ list: [{ id: 'new', title: 'Newest export result', category: 'export', read: true }], total: 1 })
            state.queryParams.category = 'export'
            await state.fetchList()
            if (outcome === 'success') resolveOld({ list: [{ id: 'old', title: 'Stale system result', category: 'system', read: true }], total: 1 })
            else rejectOld(new Error('Stale failure'))
            await old
            await flushPromises()
            expect(state.queryParams.category).toBe('export')
            expect(wrapper.text()).toContain('Newest export result')
            expect(wrapper.text()).not.toContain('Stale system result')
        } finally {
            wrapper.unmount()
        }
    })
})
