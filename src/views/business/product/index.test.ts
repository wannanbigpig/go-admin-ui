import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getList: vi.fn().mockResolvedValue(undefined),
    openCreateDrawer: vi.fn(),
    openEditDrawer: vi.fn(),
    handleSubmit: vi.fn(),
    localeRef: null as { value: string } | null,
}))

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => ({ userInfo: { dept_id: 3 } }),
}))

vi.mock('vue-i18n', async (importOriginal) => {
    const locale = ref('zh-CN')
    mocks.localeRef = locale
    return {
        ...(await importOriginal<typeof import('vue-i18n')>()),
        useI18n: () => ({ t: (key: string) => `${locale.value}:${key}` }),
    }
})

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

vi.mock('@/modules/product/useProductForm', () => ({
    useProductForm: () => ({
        showDrawer: ref(false),
        isEditMode: ref(false),
        isSubmitting: ref(false),
        formDataRef: ref(),
        formData: reactive({ id: 0, name: '', description: '', price: 0, status: 1, dept_id: 3 }),
        openCreateDrawer: mocks.openCreateDrawer,
        openEditDrawer: mocks.openEditDrawer,
        handleSubmit: mocks.handleSubmit,
    }),
}))

vi.mock('@/api/product', () => ({
    getProductList: vi.fn(),
    deleteProduct: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({
    Logger: { error: vi.fn() },
}))

import ProductPage from '@/views/business/product/index.vue'

const ProTableStub = defineComponent({
    name: 'XlProTableStub',
    props: ['columns'],
    setup(_, { slots }) {
        return () => h('div', [slots.actions?.(), slots.operation?.()])
    },
})

const TableColumnStub = defineComponent({
    name: 'ElTableColumnStub',
    setup(_, { slots }) {
        return () => h('div', slots.default?.({ row: { id: 12, name: 'product' }, $index: 0 }))
    },
})

const ActionButtonStub = defineComponent({
    name: 'XlActionButtonStub',
    props: ['code'],
    template: '<button />',
})

const ActionButtonsStub = defineComponent({
    name: 'XlActionButtonsStub',
    props: ['buttons', 'scope'],
    template: '<div />',
})

describe('product page permissions', () => {
    beforeEach(() => {
        if (mocks.localeRef) mocks.localeRef.value = 'zh-CN'
        vi.clearAllMocks()
    })

    it('binds create, update and delete actions to their backend permission codes', () => {
        const wrapper = mount(ProductPage, {
            global: {
                directives: { permission: () => undefined },
                stubs: {
                    xlProTable: ProTableStub,
                    xlActionButton: ActionButtonStub,
                    xlActionButtons: ActionButtonsStub,
                    ElTableColumn: TableColumnStub,
                    ElDrawer: true,
                    ElForm: true,
                },
            },
        })

        expect(wrapper.findComponent(ActionButtonStub).props('code')).toBe('product:create')
        expect(wrapper.findComponent(ActionButtonsStub).props('buttons').map((button: { permission: string }) => button.permission)).toEqual(['product:update', 'product:delete'])
    })

    it('updates table and action labels when the active locale changes', async () => {
        const wrapper = mount(ProductPage, {
            global: {
                directives: { permission: () => undefined },
                stubs: {
                    xlProTable: ProTableStub,
                    xlActionButton: ActionButtonStub,
                    xlActionButtons: ActionButtonsStub,
                    ElTableColumn: TableColumnStub,
                    ElDrawer: true,
                    ElForm: true,
                },
            },
        })

        const initialColumns = wrapper.findComponent(ProTableStub).props('columns')
        const initialButtons = wrapper.findComponent(ActionButtonsStub).props('buttons')
        expect(initialColumns[1].h_label).toBe('zh-CN:product.name')
        expect(initialButtons[0].text).toBe('zh-CN:common.actions.edit')

        mocks.localeRef!.value = 'en-US'
        await nextTick()

        const updatedColumns = wrapper.findComponent(ProTableStub).props('columns')
        const updatedButtons = wrapper.findComponent(ActionButtonsStub).props('buttons')
        expect(updatedColumns[1].h_label).toBe('en-US:product.name')
        expect(updatedButtons[0].text).toBe('en-US:common.actions.edit')
    })
})
