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
                ElInputNumber: { props: ['modelValue', 'min', 'max', 'step'], template: '<input type="number" :value="modelValue" :min="min" :max="max" :step="step" />' },
                ElAlert: { props: ['title'], template: '<aside>{{ title }}<slot name="title" /></aside>' },
                ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                ElSkeleton: true,
                'el-icon': true,
            },
        },
    })

describe('todo reminder preference dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchPreference.mockResolvedValue({ in_app_enabled: true, sms_enabled: false, sms_available: true, lead_minutes: 1440 })
        mocks.submitPreference.mockResolvedValue({ in_app_enabled: false, sms_enabled: true, sms_available: true, lead_minutes: 30 })
    })

    it('loads and saves user-level channels and lead time', async () => {
        const wrapper = mountDialog()
        const vm = wrapper.vm as unknown as {
            form: { in_app_enabled: boolean; sms_enabled: boolean; lead_minutes: number }
            load: () => Promise<void>
            save: () => Promise<void>
        }

        await vm.load()
        vm.form.in_app_enabled = false
        vm.form.sms_enabled = true
        vm.form.lead_minutes = 30
        await vm.save()

        expect(mocks.submitPreference).toHaveBeenCalledWith({ in_app_enabled: false, sms_enabled: true, lead_minutes: 30 })
        expect(mocks.success).toHaveBeenCalledWith('todo.reminder.saveSuccess')
    })

    it('disables SMS when no phone is available and links to Profile', async () => {
        mocks.fetchPreference.mockResolvedValue({ in_app_enabled: true, sms_enabled: true, sms_available: false, lead_minutes: 1440 })
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
        expect(mocks.submitPreference).toHaveBeenCalledWith({ in_app_enabled: true, sms_enabled: false, lead_minutes: 1440 })

        vm.goToProfile()
        expect(mocks.push).toHaveBeenCalledWith('/profile')
    })

    it.each([0, 43200])('preserves and saves the historical boundary %i minutes', async (leadMinutes) => {
        mocks.fetchPreference.mockResolvedValue({ in_app_enabled: true, sms_enabled: false, sms_available: true, lead_minutes: leadMinutes })
        const wrapper = mountDialog()
        const vm = wrapper.vm as unknown as { load: () => Promise<void>; save: () => Promise<void> }
        await vm.load()
        await flushPromises()
        await wrapper.findAll('button').find((button) => button.text() === 'todo.reminder.save')!.trigger('click')
        await flushPromises()
        expect(mocks.submitPreference).toHaveBeenCalledWith({ in_app_enabled: true, sms_enabled: false, lead_minutes: leadMinutes })
        wrapper.unmount()
    })

    it('shows an editable lead time and rejects invalid values', async () => {
        const wrapper = mountDialog()
        const vm = wrapper.vm as unknown as { form: { lead_minutes: number }; load: () => Promise<void>; save: () => Promise<void> }
        await vm.load()
        await flushPromises()

        expect(wrapper.text()).toContain('todo.reminder.leadTime')
        expect(wrapper.find('input[type="number"]').exists()).toBe(true)
        expect(wrapper.find('input[type="number"]').attributes('min')).toBe('0')
        expect(wrapper.find('input[type="number"]').attributes('max')).toBe('43200')
        expect(wrapper.find('input[type="number"]').attributes('step')).toBe('1')
        vm.form.lead_minutes = -1
        await vm.save()
        expect(mocks.submitPreference).not.toHaveBeenCalled()
        vm.form.lead_minutes = 43201
        await vm.save()
        expect(mocks.submitPreference).not.toHaveBeenCalled()
        vm.form.lead_minutes = 43200
        await vm.save()
        expect(mocks.submitPreference).toHaveBeenCalledWith({ in_app_enabled: true, sms_enabled: false, lead_minutes: 43200 })
    })
})
