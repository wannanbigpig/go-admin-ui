import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import ActionButton from './index.vue'

const hoisted = vi.hoisted(() => ({
    mockGetButtonInfoFull: vi.fn(),
}))

hoisted.mockGetButtonInfoFull.mockImplementation(() => ({
    title: '列表',
    icon: '',
    is_show: true,
}))

vi.mock('@/composables/usePermission', () => ({
    usePermission: () => ({
        getButtonInfoFull: hoisted.mockGetButtonInfoFull,
    }),
}))

vi.mock('@iconify/vue', () => ({
    Icon: defineComponent({ template: '<span />' }),
}))

describe('components/actionButton/index.vue', () => {
    it('显式 text 应优先于权限标题显示', () => {
        const wrapper = mount(ActionButton, {
            props: {
                code: 'task:list',
                text: '下载',
                showIcon: false,
            },
            global: {
                stubs: {
                    ElButton: defineComponent({ template: '<button><slot /></button>' }),
                    ElTooltip: defineComponent({ template: '<span><slot /></span>' }),
                    ElIcon: true,
                },
            },
        })

        expect(wrapper.text()).toContain('下载')
        expect(wrapper.text()).not.toContain('列表')
    })
})
