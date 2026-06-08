import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import ActionButtons from '@/components/actionButtons/index.vue'

const hoisted = vi.hoisted(() => ({
    permissionState: {
        isShow: true,
        title: 'Edit',
    },
    mockCheckPermission: vi.fn(),
    mockGetButtonInfoFull: vi.fn(),
}))

hoisted.mockCheckPermission.mockImplementation(() => hoisted.permissionState.isShow)
hoisted.mockGetButtonInfoFull.mockImplementation(() => ({
    title: hoisted.permissionState.title,
    icon: '',
    is_show: hoisted.permissionState.isShow,
}))

const createButtons = () => [{ permission: 'demo:update', text: 'Fallback' }]

vi.mock('@/composables/usePermission', () => ({
    usePermission: () => ({
        checkPermission: hoisted.mockCheckPermission,
        getButtonInfoFull: hoisted.mockGetButtonInfoFull,
    }),
}))

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}))

vi.mock('@iconify/vue', () => ({
    Icon: defineComponent({ template: '<span />' }),
}))

const ActionButtonStub = defineComponent({
    name: 'XlActionButton',
    props: {
        buttonInfo: { type: Object, default: null },
        text: { type: String, default: '' },
    },
    template: '<button>{{ buttonInfo?.title || text }}</button>',
})

describe('components/actionButtons/index.vue', () => {
    it('应按当前权限信息动态显示按钮文案与 is_show', async () => {
        hoisted.permissionState.isShow = true
        hoisted.permissionState.title = 'Edit'
        const wrapper = mount(ActionButtons, {
            props: {
                buttons: createButtons(),
                scope: { row: { id: 1 }, $index: 0 },
            },
            global: {
                stubs: {
                    XlActionButton: ActionButtonStub,
                    ElDropdown: true,
                    ElDropdownItem: true,
                    ElDropdownMenu: true,
                    ElButton: true,
                    ElIcon: true,
                },
            },
        })

        expect(wrapper.text()).toContain('Edit')

        hoisted.permissionState.title = 'Update'
        await wrapper.setProps({ buttons: createButtons() })
        expect(wrapper.text()).toContain('Update')

        hoisted.permissionState.isShow = false
        await wrapper.setProps({ buttons: createButtons() })
        expect(wrapper.text()).not.toContain('Update')
    })
})
