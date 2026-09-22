import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    permissions: new Set<string>(),
    routerPush: vi.fn(),
    notificationStart: vi.fn(),
    notificationStop: vi.fn(),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({ t: (key: string) => key, locale: ref('zh-CN') }),
}))
vi.mock('@/utils/auth', () => ({ hasPermission: (permission: string) => mocks.permissions.has(permission) }))
vi.mock('@/router', () => ({
    default: {
        push: mocks.routerPush,
        currentRoute: ref({ fullPath: '/', path: '/', name: 'Home', meta: {} }),
    },
}))
vi.mock('@/stores/auth', () => ({
    useAuthStore: () => ({
        token: 'token',
        userInfo: { nickname: 'Admin', username: 'admin', avatar: '' },
        refreshUserInfo: vi.fn(),
        logout: vi.fn(),
    }),
}))
vi.mock('@/stores/setting', () => ({
    useSettingStore: () => ({ locale: 'zh-CN', theme: 'light', setTheme: vi.fn(), setLocale: vi.fn() }),
}))
vi.mock('@/stores/notification', () => ({
    useNotificationStore: () => ({
        unreadCount: 0,
        notifications: [],
        connectionStatus: 'idle',
        start: mocks.notificationStart,
        stop: mocks.notificationStop,
        loadNotifications: vi.fn(),
        refreshUnreadCount: vi.fn(),
        markRead: vi.fn(),
        markAllRead: vi.fn(),
    }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))
vi.mock('@/utils/helper', () => ({ getImageUrl: () => '' }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/utils/routeTitle', () => ({ resolveRouteTitle: () => '' }))

import HeaderRight from './right.vue'
import NotificationCenter from './notificationCenter.vue'

const SlotStub = defineComponent({
    setup(_, { slots }) {
        return () => h('div', [slots.reference?.(), slots.default?.(), slots.dropdown?.()])
    },
})

const ButtonStub = defineComponent({
    setup(_, { slots }) {
        return () => h('button', slots.default?.())
    },
})

describe('header permission entries', () => {
    beforeEach(() => {
        mocks.permissions.clear()
        vi.clearAllMocks()
    })

    it('shows personal exports without task operations permission', () => {
        const withoutPermission = mount(HeaderRight, {
            global: { stubs: { NotificationCenter: true }, config: { warnHandler: vi.fn() } },
        })
        expect(withoutPermission.find('[aria-label="layout.exportCenter"]').exists()).toBe(true)
    })

    it.each(['file:list', 'requestLog:export'])('keeps personal exports visible for %s', (permission) => {
        mocks.permissions.add(permission)
        const wrapper = mount(HeaderRight, {
            global: { stubs: { NotificationCenter: true }, config: { warnHandler: vi.fn() } },
        })

        expect(wrapper.find('[aria-label="layout.exportCenter"]').exists()).toBe(true)
    })

    it('shows notification management only to users who can send notifications', () => {
        const mountCenter = () =>
            mount(NotificationCenter, {
                global: {
                    config: { warnHandler: vi.fn() },
                    stubs: {
                        ElPopover: SlotStub,
                        ElBadge: SlotStub,
                        ElButton: ButtonStub,
                        ElEmpty: true,
                    },
                },
            })

        const withoutPermission = mountCenter()
        expect(withoutPermission.text()).not.toContain('system.notification.manageEntry')
        withoutPermission.unmount()

        mocks.permissions.add('notification:send')
        const withPermission = mountCenter()
        expect(withPermission.text()).toContain('system.notification.manageEntry')
        withPermission.unmount()
    })
})
