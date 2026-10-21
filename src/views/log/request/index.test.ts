import { defineComponent, h, isRef, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    mode: null as unknown,
    routeQuery: { detail: '12', operator_account: 'another-user' } as Record<string, string>,
    openDetailDrawer: vi.fn().mockResolvedValue(undefined),
    getList: vi.fn().mockResolvedValue(undefined),
    handleReset: vi.fn().mockResolvedValue(undefined),
    getAdminUserOptions: vi.fn().mockResolvedValue([]),
    permissionBindings: [] as string[],
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({
        t: (key: string, params?: Record<string, unknown>) => {
            if (key === 'log.request.changeSummaryAt') return `${params?.time}，${params?.changes}`
            if (key === 'log.request.changeUpdated') return `${params?.label} 从 ${params?.before} 改为 ${params?.after}`
            if (key === 'log.request.changeCreated') return `${params?.label} 设置为 ${params?.after}`
            if (key === 'log.request.changeRemoved') return `${params?.label} 已移除（原值 ${params?.before}）`
            if (key === 'log.request.changeProtected') return `${params?.label} 已更新`
            if (key === 'log.request.changeOmitted') return `另有 ${params?.count} 项变更未在个人日志中展示`
            if (key === 'log.request.changeCount') return `${params?.count} 项变更`
            if (key === 'log.request.changeSeparator') return '；'
            if (key === 'log.request.viewedOperation') return `查看了${params?.operation}`
            if (key === 'log.request.executedWithoutChange') return `执行了${params?.operation}，未记录字段变更`
            return key
        },
    }),
}))
vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: () => ({ query: mocks.routeQuery }),
}))
vi.mock('@/composables/usePermission', () => ({ usePermission: () => ({ getButtonInfoFull: () => null, checkPermission: () => false }) }))
vi.mock('@/composables/useClipboard', () => ({ useClipboard: () => ({ copyText: vi.fn() }) }))
vi.mock('@/api/adminUser', () => ({ getAdminUserOptions: mocks.getAdminUserOptions }))
vi.mock('@/modules/log/useRequestLogPage', () => ({
    useRequestLogPage: (options: unknown) => {
        mocks.mode = options
        return {
            loading: ref(false),
            logList: ref([]),
            pagination: reactive({ page: 1, pageSize: 10, total: 0 }),
            queryFormRef: ref(),
            queryWhere: reactive({ request_id: '', operator_account: '', operator_id: undefined, request_kind: null, execution_time_scope: null, ip: '', scope: null }),
            dateRange: ref([]),
            showDetailDrawer: ref(false),
            currentDetail: ref({
                id: 1,
                operation_name: 'detail',
                jwt_id: 'private-jwt-id',
                response_body: 'private-response-body',
                change_diff: '{"password":"raw-secret"}',
                created_at: '2026-09-16 20:30:00',
                change_summary: {
                    has_changes: true,
                    items: [
                        { label: '状态', change_type: 'updated', before_text: '禁用', after_text: '启用' },
                        { label: '密码', change_type: 'changed' },
                        { label: '已删除文件（ID 8）', change_type: 'action' },
                        { label: '角色名称', change_type: 'created', after_text: '但是' },
                    ],
                    omitted_count: 1,
                },
            }),
            detailLoading: ref(false),
            activeCollapse: ref([]),
            exporting: ref(false),
            formatJson: (value: string) => value,
            formatIpAddress: vi.fn(),
            getMethodTagType: vi.fn(),
            getRequestKindTagType: vi.fn(),
            getExecutionTimeScopeTagType: vi.fn(),
            getResponseStatusTagType: vi.fn(),
            formatExecutionTimeDisplay: vi.fn(),
            handleSortChange: vi.fn(),
            handleSearch: vi.fn(),
            handleReset: mocks.handleReset,
            getList: mocks.getList,
            openDetailDrawer: mocks.openDetailDrawer,
            openMaskConfigDialog: vi.fn(),
            exportCsv: vi.fn(),
        }
    },
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

import RequestLogPage from './index.vue'

const SlotStub = defineComponent({
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => h('div', slots.default?.())
    },
})

const ProTableStub = defineComponent({
    inheritAttrs: false,
    props: ['tableTitle'],
    setup(_, { slots }) {
        return () =>
            h('div', [
                slots.search?.(),
                slots.actions?.(),
                slots.td?.({
                    item: { prop: 'change_summary' },
                    val: null,
                    row: {
                        id: 1,
                        method: 'POST',
                        operation_name: '新增角色',
                        operation_status: 0,
                        created_at: '2026-09-16 20:30:00',
                        change_summary: {
                            has_changes: true,
                            items: [
                                { label: '角色ID', change_type: 'created', after_text: '2' },
                                { label: '角色名称', change_type: 'created', after_text: '但是' },
                            ],
                            omitted_count: 0,
                        },
                    },
                }),
                slots.td?.({
                    item: { prop: 'change_summary' },
                    val: null,
                    row: {
                        id: 2,
                        method: 'POST',
                        operation_name: '刷新菜单权限缓存',
                        change_summary: {
                            has_changes: true,
                            items: [{ label: '已刷新菜单权限缓存', change_type: 'action' }],
                            omitted_count: 0,
                        },
                    },
                }),
                slots.operation?.(),
            ])
    },
})

const FormItemStub = defineComponent({
    inheritAttrs: false,
    props: ['prop'],
    setup(props, { slots }) {
        return () => h('div', { 'data-field': props.prop }, slots.default?.())
    },
})

const TableColumnStub = defineComponent({
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => h('div', slots.default?.({ row: { id: 1 } }))
    },
})

const EmptyStub = defineComponent({
    inheritAttrs: false,
    setup() {
        return () => h('div')
    },
})

describe('personal request-log page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.mode = null
        mocks.routeQuery = { detail: '12', operator_account: 'another-user' }
        mocks.permissionBindings = []
    })

    it('uses self mode without admin filters, exports or permission-gated detail', async () => {
        const wrapper = mount(RequestLogPage, {
            props: { mode: 'self' },
            global: {
                config: { warnHandler: vi.fn() },
                directives: {
                    permission: { mounted: (_el, binding) => mocks.permissionBindings.push(binding.value) },
                    loading: () => undefined,
                },
                stubs: {
                    XlProTable: ProTableStub,
                    XlCollapsibleSearchBtn: EmptyStub,
                    XlDateRangePicker: EmptyStub,
                    XlActionButton: { props: ['text'], template: '<button>{{ text }}</button>' },
                    ElForm: SlotStub,
                    ElRow: SlotStub,
                    ElCol: SlotStub,
                    ElFormItem: FormItemStub,
                    ElInput: true,
                    ElSelect: SlotStub,
                    ElOption: true,
                    ElTableColumn: TableColumnStub,
                    ElDrawer: SlotStub,
                    ElDivider: SlotStub,
                    ElCollapse: SlotStub,
                    ElCollapseItem: SlotStub,
                },
            },
        })
        await flushPromises()

        expect(isRef((mocks.mode as { mode: unknown }).mode)).toBe(true)
        expect((mocks.mode as { mode: { value: string } }).mode.value).toBe('self')
        expect(wrapper.find('[data-field="operator_account"]').exists()).toBe(false)
        expect(wrapper.find('[data-field="operator_id"]').exists()).toBe(false)
        expect(wrapper.find('[data-field="operation_name"]').exists()).toBe(true)
        expect(wrapper.find('[data-field="operation_status"]').exists()).toBe(true)
        expect(wrapper.find('[data-field="dateRange"]').exists()).toBe(true)
        for (const field of ['request_id', 'base_url', 'is_high_risk', 'has_change_diff', 'method', 'request_kind', 'execution_time_scope']) {
            expect(wrapper.find(`[data-field="${field}"]`).exists()).toBe(false)
        }
        expect(wrapper.find('[data-field="ip"]').exists()).toBe(true)
        expect(wrapper.find('[data-field="scope"]').exists()).toBe(true)
        expect(
            wrapper
                .findComponent(ProTableStub)
                .props('tableTitle')
                .map((column: { prop: string }) => column.prop)
        ).toEqual(['operation_name', 'change_summary', 'operation_status', 'self_terminal', 'self_tags', 'created_at'])
        for (const label of [
            'log.request.requestId',
            'log.request.operationApi',
            'log.request.requestKind',
            'log.request.executionTimeScope',
            'log.request.responseCode',
            'log.request.operatorAccount',
            'log.request.operatorName',
            'log.request.jwtId',
            'log.request.userAgent',
        ]) {
            expect(wrapper.findAll('dt').some((item) => item.text() === label)).toBe(false)
        }
        for (const label of ['log.request.operationName', 'log.request.operationStatus', 'log.request.duration', 'common.labels.ipAddress', 'log.login.os', 'log.login.browser', 'log.request.createdAt']) {
            expect(wrapper.findAll('dt').some((item) => item.text() === label)).toBe(true)
        }
        expect(wrapper.text()).not.toContain('log.request.export')
        expect(wrapper.text()).not.toContain('log.request.maskConfig')
        expect(wrapper.text()).not.toContain('private-jwt-id')
        expect(wrapper.text()).not.toContain('private-response-body')
        expect(wrapper.text()).not.toContain('raw-secret')
        expect(wrapper.findAll('[data-testid="self-list-summary"]').map((item) => item.text())).toEqual(['2 项变更', '已刷新菜单权限缓存'])
        expect(wrapper.findAll('[data-testid="self-change-summary"] li').map((item) => item.text())).toEqual(['状态 从 禁用 改为 启用', '密码 已更新', '已删除文件（ID 8）', '角色名称 设置为 但是'])
        expect(wrapper.text()).toContain('另有 1 项变更未在个人日志中展示')
        expect(mocks.getAdminUserOptions).not.toHaveBeenCalled()
        expect(mocks.openDetailDrawer).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }))
    })

    it('keeps the rendered controls in sync when mode changes', async () => {
        mocks.routeQuery = {}
        const wrapper = mount(RequestLogPage, {
            props: { mode: 'admin' },
            global: {
                config: { warnHandler: vi.fn() },
                directives: {
                    permission: { mounted: (_el, binding) => mocks.permissionBindings.push(binding.value) },
                    loading: () => undefined,
                },
                stubs: {
                    XlProTable: ProTableStub,
                    XlCollapsibleSearchBtn: EmptyStub,
                    XlDateRangePicker: EmptyStub,
                    XlActionButton: { props: ['text'], template: '<button>{{ text }}</button>' },
                    ElForm: SlotStub,
                    ElRow: SlotStub,
                    ElCol: SlotStub,
                    ElFormItem: FormItemStub,
                    ElInput: true,
                    ElSelect: SlotStub,
                    ElOption: true,
                    ElTableColumn: TableColumnStub,
                    ElDrawer: SlotStub,
                    ElDivider: SlotStub,
                    ElCollapse: SlotStub,
                    ElCollapseItem: SlotStub,
                },
            },
        })
        await flushPromises()

        expect(wrapper.find('[data-field="operator_account"]').exists()).toBe(true)
        expect(wrapper.find('[data-field="request_id"]').exists()).toBe(true)
        expect(wrapper.find('[data-field="base_url"]').exists()).toBe(true)
        expect(wrapper.findAll('dt').some((item) => item.text() === 'log.request.requestId')).toBe(true)
        expect(wrapper.findAll('dt').some((item) => item.text() === 'log.request.operationApi')).toBe(true)
        expect((mocks.mode as { mode: { value: string } }).mode.value).toBe('admin')
        expect(mocks.permissionBindings).toEqual(expect.arrayContaining(['requestLog:export', 'requestLog:maskConfig', 'requestLog:detail']))
        expect(wrapper.text()).toContain('raw-secret')

        await wrapper.setProps({ mode: 'self' })
        await flushPromises()

        expect(wrapper.find('[data-field="operator_account"]').exists()).toBe(false)
        expect((mocks.mode as { mode: { value: string } }).mode.value).toBe('self')
        expect(wrapper.text()).not.toContain('private-jwt-id')
        expect(wrapper.text()).not.toContain('private-response-body')
        expect(wrapper.text()).not.toContain('raw-secret')
        expect(wrapper.text()).not.toContain('角色名称 设置为 但是')
        expect(mocks.handleReset).toHaveBeenCalledTimes(1)
    })
})
