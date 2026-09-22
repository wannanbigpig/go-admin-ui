import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    fetchPreference: vi.fn(),
    submitPreference: vi.fn(),
    push: vi.fn(),
    success: vi.fn(),
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/modules/todo/service', () => ({
    fetchTodoReminderPreference: mocks.fetchPreference,
    submitTodoReminderPreference: mocks.submitPreference,
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { success: mocks.success } }))

import TodoReminderPreferenceDialog from './TodoReminderPreferenceDialog.vue'

const DialogStub = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<section><slot /><slot name="footer" /></section>',
})

const mountDialog = () =>
    mount(TodoReminderPreferenceDialog, {
        props: { modelValue: false, 'onUpdate:modelValue': () => undefined },
        global: {
            stubs: {
                ElDialog: DialogStub,
                ElForm: { template: '<form><slot /></form>' },
                ElFormItem: { template: '<label><slot /></label>' },
                ElSwitch: { props: ['modelValue', 'disabled'], template: '<input type="checkbox" :checked="modelValue" :disabled="disabled" />' },
                ElAlert: { props: ['title'], template: '<aside>{{ title }}<slot name="title" /></aside>' },
                ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                ElSkeleton: true,
            },
        },
    })

describe('todo reminder preference dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchPreference.mockResolvedValue({ in_app_enabled: true, sms_enabled: false, sms_available: true })
        mocks.submitPreference.mockResolvedValue({ in_app_enabled: false, sms_enabled: true, sms_available: true })
    })

    it('loads and saves only the user-level channel preferences', async () => {
        const wrapper = mountDialog()
        const vm = wrapper.vm as unknown as {
            form: { in_app_enabled: boolean; sms_enabled: boolean }
            load: () => Promise<void>
            save: () => Promise<void>
        }

        await vm.load()
        vm.form.in_app_enabled = false
        vm.form.sms_enabled = true
        await vm.save()

        expect(mocks.submitPreference).toHaveBeenCalledWith({ in_app_enabled: false, sms_enabled: true })
        expect(mocks.success).toHaveBeenCalledWith('todo.reminder.saveSuccess')
    })

    it('disables SMS when no phone is available and links to Profile', async () => {
        mocks.fetchPreference.mockResolvedValue({ in_app_enabled: true, sms_enabled: true, sms_available: false })
        const wrapper = mountDialog()
        const vm = wrapper.vm as unknown as {
            form: { in_app_enabled: boolean; sms_enabled: boolean }
            load: () => Promise<void>
            save: () => Promise<void>
            goToProfile: () => void
        }

        await vm.load()
        await flushPromises()

        expect(vm.form.sms_enabled).toBe(false)
        expect(wrapper.text()).toContain('todo.reminder.phoneMissing')
        expect(wrapper.findAll('input[type="checkbox"]')[1].attributes()).toHaveProperty('disabled')

        await vm.save()
        expect(mocks.submitPreference).toHaveBeenCalledWith({ in_app_enabled: true, sms_enabled: false })

        vm.goToProfile()
        expect(mocks.push).toHaveBeenCalledWith('/profile')
    })

    it('explains that lead time is managed by the administrator instead of exposing an unsupported field', async () => {
        const wrapper = mountDialog()
        await (wrapper.vm as unknown as { load: () => Promise<void> }).load()
        await flushPromises()

        expect(wrapper.text()).toContain('todo.reminder.systemLeadHint')
        expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    })
})
