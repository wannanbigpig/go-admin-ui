import { defineComponent, h, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    permissions: new Set<string>(),
    route: { path: '/system/config', query: {} as Record<string, unknown> },
    routerReplace: vi.fn(),
    getList: vi.fn().mockResolvedValue(undefined),
    loadDict: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: () => mocks.route,
    useRouter: () => ({ replace: mocks.routerReplace }),
}))
vi.mock('@/composables/usePermission', () => ({
    usePermission: () => ({
        checkPermission: (permission: string) => mocks.permissions.has(permission),
        getButtonInfoFull: () => null,
    }),
}))
vi.mock('@/composables/useDictOptions', () => ({
    useDictOptions: () => ({ options: ref([]), tagMap: ref({}), load: mocks.loadDict }),
}))
vi.mock('@/composables/useListPage', () => ({
    useListPage: () => ({
        loading: ref(false),
        items: ref([]),
        pagination: reactive({ page: 1, pageSize: 15, total: 0 }),
        getList: mocks.getList,
        handleSearch: vi.fn(),
        handleReset: vi.fn(),
    }),
}))
vi.mock('@/modules/system/service', () => ({
    fetchSystemConfigList: vi.fn(),
    fetchSystemConfigDetail: vi.fn(),
    addSystemConfig: vi.fn(),
    modifySystemConfig: vi.fn(),
    removeSystemConfig: vi.fn(),
    refreshSystemConfig: vi.fn(),
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

import ConfigPage from './index.vue'

const TabsStub = defineComponent({
    name: 'ElTabs',
    props: ['modelValue'],
    setup(_, { slots }) {
        return () => h('div', { 'data-testid': 'tabs' }, slots.default?.())
    },
})

const TabPaneStub = defineComponent({
    name: 'ElTabPane',
    props: ['name', 'label'],
    template: '<div class="tab-pane" :data-name="name">{{ label }}</div>',
})

const ProTableStub = defineComponent({
    name: 'XlProTable',
    props: ['columns'],
    setup(_, { slots }) {
        return () => h('div', { 'data-testid': 'normal-panel' }, slots.operation?.({ row: { id: 1, is_system: 1, manage_tab: '' }, $index: 0 }))
    },
})

const ActionButtonsStub = defineComponent({
    name: 'XlActionButtons',
    props: ['buttons', 'scope'],
    template: '<div />',
})

const TableColumnStub = defineComponent({
    name: 'ElTableColumn',
    setup(_, { slots }) {
        return () => h('div', slots.default?.({ row: { id: 1, is_system: 1, manage_tab: '' }, $index: 0 }))
    },
})

const mountPage = () =>
    mount(ConfigPage, {
        global: {
            config: { warnHandler: vi.fn() },
            directives: { permission: () => undefined },
            stubs: {
                ElTabs: TabsStub,
                ElTabPane: TabPaneStub,
                XlProTable: ProTableStub,
                XlActionButtons: ActionButtonsStub,
                XlActionButton: true,
                XlDrawer: true,
                XlI18nInput: true,
                ElTableColumn: TableColumnStub,
                ElForm: true,
                SystemStorageConfigPanel: { template: '<div data-testid="storage-panel" />' },
                RequestLogMaskConfigPanel: { template: '<div data-testid="mask-panel" />' },
            },
        },
    })

describe('system config permission tabs', () => {
    beforeEach(() => {
        mocks.permissions.clear()
        mocks.route.query = {}
        vi.clearAllMocks()
    })

    it('shows only authorized tabs and falls back from an unauthorized query tab', async () => {
        mocks.permissions.add('storage:config')
        mocks.route.query = { tab: 'audit_mask' }

        const wrapper = mountPage()
        await flushPromises()

        expect(wrapper.findAll('.tab-pane').map((item) => item.attributes('data-name'))).toEqual(['storage'])
        expect(wrapper.find('[data-testid="storage-panel"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="mask-panel"]').exists()).toBe(false)
        expect(mocks.getList).not.toHaveBeenCalled()
        expect(mocks.loadDict).not.toHaveBeenCalled()
    })

    it('loads normal configuration data only when the normal tab is authorized and active', async () => {
        mocks.permissions.add('sysConfig:list')

        const wrapper = mountPage()
        await flushPromises()

        expect(wrapper.findAll('.tab-pane').map((item) => item.attributes('data-name'))).toEqual(['normal'])
        expect(wrapper.find('[data-testid="normal-panel"]').exists()).toBe(true)
        expect(mocks.getList).toHaveBeenCalledTimes(1)
        expect(mocks.loadDict).toHaveBeenCalledTimes(2)
    })

    it('normalizes an invalid query when the normal tab is already the fallback', async () => {
        mocks.permissions.add('sysConfig:list')
        mocks.route.query = { tab: 'unknown', source: 'shortcut' }

        mountPage()
        await flushPromises()

        expect(mocks.routerReplace).toHaveBeenCalledWith({ path: '/system/config', query: { source: 'shortcut' } })
    })

    it('hides delete for every protected system configuration row', async () => {
        mocks.permissions.add('sysConfig:list')

        const wrapper = mountPage()
        await flushPromises()
        const deleteAction = wrapper.findComponent(ActionButtonsStub).props('buttons')[1]

        expect(deleteAction.visible({ is_system: 1, manage_tab: '' })).toBe(false)
        expect(deleteAction.visible({ is_system: 0, manage_tab: '' })).toBe(true)
    })
})
