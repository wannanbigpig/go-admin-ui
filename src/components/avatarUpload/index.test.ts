import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import AvatarUpload from '@/components/avatarUpload/index.vue'

vi.mock('element-plus', () => ({
    ElMessage: {
        error: vi.fn(),
    },
}))

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string, params?: Record<string, unknown>) => (params?.size ? `${key}:${params.size}` : key),
    }),
}))

vi.mock('@/api/auth', () => ({
    uploadAvatar: vi.fn(),
}))

const ElUploadStub = defineComponent({
    name: 'ElUpload',
    props: {
        beforeUpload: { type: Function, required: true },
        accept: { type: String, default: '' },
    },
    template: '<div />',
})

describe('components/avatarUpload/index.vue', () => {
    it('应按后端头像规则限制类型和字节大小', () => {
        const wrapper = mount(AvatarUpload, {
            global: {
                stubs: {
                    ElUpload: ElUploadStub,
                    ElImage: true,
                    ElIcon: true,
                    Plus: true,
                },
            },
        })

        const upload = wrapper.findComponent(ElUploadStub)
        const beforeUpload = upload.props('beforeUpload') as (file: File) => boolean

        expect(upload.props('accept')).toBe('image/jpeg,image/png,image/webp')
        expect(beforeUpload(new File(['x'], 'avatar.gif', { type: 'image/gif' }))).toBe(false)
        expect(beforeUpload(new File(['x'], 'avatar.webp', { type: 'image/webp' }))).toBe(true)
        expect(beforeUpload(new File([new Uint8Array(3)], 'avatar.png', { type: 'image/png' }))).toBe(true)
    })

    it('应使用字节单位判断 maxSize', () => {
        const wrapper = mount(AvatarUpload, {
            props: {
                maxSize: 2,
            },
            global: {
                stubs: {
                    ElUpload: ElUploadStub,
                    ElImage: true,
                    ElIcon: true,
                    Plus: true,
                },
            },
        })

        const beforeUpload = wrapper.findComponent(ElUploadStub).props('beforeUpload') as (file: File) => boolean

        expect(beforeUpload(new File([new Uint8Array(3)], 'avatar.png', { type: 'image/png' }))).toBe(false)
    })
})
