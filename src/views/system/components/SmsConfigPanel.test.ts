import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    fetchConfig: vi.fn(),
    updateConfig: vi.fn(),
    testConfig: vi.fn(),
    validateForm: vi.fn(),
    prompt: vi.fn(),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('@/modules/shared/form', () => ({ validateFormSafely: mocks.validateForm }))
vi.mock('@/modules/system/service', () => ({
    fetchSmsConfig: mocks.fetchConfig,
    updateSmsConfig: mocks.updateConfig,
    testSmsConnection: mocks.testConfig,
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn() }, ElMessageBox: { prompt: mocks.prompt } }))

import SmsConfigPanel from './SmsConfigPanel.vue'
import { registerSmsProviderForm } from './smsProviders/registry'

const ActionButtonStub = defineComponent({
    name: 'XlActionButton',
    props: ['code'],
    template: '<button />',
})

const InputStub = defineComponent({
    name: 'ElInput',
    props: ['modelValue', 'readonly'],
    template: '<input :value="modelValue" :readonly="readonly" />',
})

const SelectStub = defineComponent({
    name: 'ElSelect',
    props: ['modelValue'],
    template: '<select><slot /></select>',
})

const ExampleProviderForm = defineComponent({
    name: 'ExampleSmsProviderForm',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div data-testid="example-provider" />',
})

const config = {
    enabled: true,
    providers: {
        aliyun: {
            enabled: true,
            access_key_id: 'key-id',
            access_key_secret: '********',
            endpoint: 'https://dysmsapi.aliyuncs.com',
        },
    },
    templates: {
        aliyun: {
            login_otp: { sign_name: '示例签名', template_code: 'SMS_123', variables: ['code'] },
            todo_due: { sign_name: '待办签名', template_code: 'SMS_456', variables: ['title', 'due_at'] },
        },
    },
    routes: {
        login_otp: { provider: 'aliyun', template: 'login_otp' },
        todo_due: { provider: 'aliyun', template: 'todo_due' },
    },
    otp: { ttl_seconds: 300, resend_interval_seconds: 60, max_attempts: 5, ip_limit_per_10_minutes: 10, phone_daily_limit: 8, global_daily_limit: 1000 },
}

const mountPanel = () =>
    mount(SmsConfigPanel, {
        global: {
            config: { warnHandler: vi.fn() },
            directives: { permission: () => undefined },
            stubs: { XlActionButton: ActionButtonStub, ElForm: { template: '<form><slot /></form>' }, ElInput: InputStub, ElSelect: SelectStub },
        },
    })

describe('sms config panel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchConfig.mockResolvedValue(structuredClone(config))
        mocks.updateConfig.mockResolvedValue(undefined)
        mocks.testConfig.mockResolvedValue({ success: true, message: 'ok' })
        mocks.validateForm.mockResolvedValue(true)
        mocks.prompt.mockResolvedValue({ value: '+86 13800138000' })
    })

    it('blocks save and test after initial load failure until retry succeeds', async () => {
        mocks.fetchConfig.mockRejectedValueOnce(new Error('temporary load failure'))
        const wrapper = mountPanel()
        await flushPromises()
        const vm = wrapper.vm as unknown as { handleSave: () => Promise<void>; handleTest: () => Promise<void>; loadConfig: () => Promise<void> }
        expect(wrapper.findComponent({ name: 'ElForm' }).exists()).toBe(false)
        await vm.handleSave()
        await vm.handleTest()
        expect(mocks.updateConfig).not.toHaveBeenCalled()
        expect(mocks.testConfig).not.toHaveBeenCalled()
        expect(mocks.validateForm).not.toHaveBeenCalled()
        await vm.loadConfig()
        await flushPromises()
        await vm.handleSave()
        expect(mocks.updateConfig).toHaveBeenCalledWith(expect.objectContaining({ enabled: config.enabled }))
        wrapper.unmount()
    })

    it('binds test and save actions to their dedicated permissions', async () => {
        const wrapper = mountPanel()
        await flushPromises()

        expect(wrapper.findAllComponents(ActionButtonStub).map((button) => button.props('code'))).toEqual(['sms:test', 'sms:update'])
    })

    it('preserves the masked secret placeholder when saving unchanged config', async () => {
        const wrapper = mountPanel()
        await flushPromises()

        expect(wrapper.text()).toContain('code')
        await (wrapper.vm as unknown as { handleSave: () => Promise<void> }).handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(config)
    })

    it('submits an explicitly cleared secret instead of restoring the mask', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        const vm = wrapper.vm as unknown as { formData: typeof config; handleSave: () => Promise<void> }
        vm.formData.enabled = false
        vm.formData.providers.aliyun.access_key_secret = ''

        await vm.handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: false,
                providers: expect.objectContaining({ aliyun: expect.objectContaining({ access_key_secret: '' }) }),
            })
        )
    })

    it('preserves provider, template, and route data that the current UI does not recognize', async () => {
        const extendedConfig = structuredClone(config) as typeof config & {
            providers: typeof config.providers & { custom: Record<string, unknown> }
            templates: typeof config.templates & { custom: Record<string, unknown> }
            routes: typeof config.routes & { custom_notice: { provider: string; template: string } }
        }
        extendedConfig.providers.custom = { enabled: true, api_token: '********', region: 'cn-test' }
        extendedConfig.templates.custom = { notice: { sign_name: 'Custom', template_code: 'NOTICE', variables: ['name'] } }
        extendedConfig.routes.custom_notice = { provider: 'custom', template: 'notice' }
        mocks.fetchConfig.mockResolvedValue(extendedConfig)
        const wrapper = mountPanel()
        await flushPromises()

        await (wrapper.vm as unknown as { handleSave: () => Promise<void> }).handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                providers: expect.objectContaining({ custom: extendedConfig.providers.custom }),
                templates: expect.objectContaining({ custom: extendedConfig.templates.custom }),
                routes: expect.objectContaining({ custom_notice: extendedConfig.routes.custom_notice }),
            })
        )
    })

    it('edits templates through a registered provider without adding provider branches to the panel', async () => {
        const unregister = registerSmsProviderForm({
            key: 'example',
            label: 'Example SMS',
            component: ExampleProviderForm,
            createDefaultConfig: () => ({ enabled: false, api_token: '' }),
            createDefaultTemplates: () => ({
                login_otp: { sign_name: '', template_code: '', variables: ['code'] },
                todo_due: { sign_name: '', template_code: '', variables: ['title', 'due_at'] },
            }),
        })
        try {
            const exampleConfig = structuredClone(config) as typeof config & {
                providers: typeof config.providers & { example: { enabled: boolean; api_token: string } }
            }
            exampleConfig.providers.example = { enabled: true, api_token: '********' }
            mocks.fetchConfig.mockResolvedValue(exampleConfig)
            const wrapper = mountPanel()
            await flushPromises()
            const vm = wrapper.vm as unknown as {
                formData: typeof config
                todoDueRoute: { provider: string; template: string }
                loginTemplateSignName: string
                loginTemplateCode: string
                todoTemplateSignName: string
                todoTemplateCode: string
                handleSceneProviderChange: (scene: 'login_otp' | 'todo_due') => void
                handleSave: () => Promise<void>
            }

            expect(wrapper.find('[data-testid="example-provider"]').exists()).toBe(true)
            vm.formData.routes.login_otp.provider = 'example'
            vm.handleSceneProviderChange('login_otp')
            vm.todoDueRoute.provider = 'example'
            vm.handleSceneProviderChange('todo_due')
            vm.loginTemplateSignName = '新登录签名'
            vm.loginTemplateCode = 'EXAMPLE_LOGIN_V2'
            vm.todoTemplateSignName = '新待办签名'
            vm.todoTemplateCode = 'EXAMPLE_TODO_V2'
            await vm.handleSave()

            expect(mocks.updateConfig).toHaveBeenCalledWith(
                expect.objectContaining({
                    routes: expect.objectContaining({
                        login_otp: { provider: 'example', template: 'login_otp' },
                        todo_due: { provider: 'example', template: 'todo_due' },
                    }),
                    templates: expect.objectContaining({
                        example: {
                            login_otp: { sign_name: '新登录签名', template_code: 'EXAMPLE_LOGIN_V2', variables: ['code'] },
                            todo_due: { sign_name: '新待办签名', template_code: 'EXAMPLE_TODO_V2', variables: ['title', 'due_at'] },
                        },
                    }),
                })
            )
        } finally {
            unregister()
        }
    })

    it('keeps the optional todo route disabled until the administrator enables the scene', async () => {
        const configWithoutTodoRoute = structuredClone(config)
        delete (configWithoutTodoRoute.routes as Partial<typeof config.routes>).todo_due
        mocks.fetchConfig.mockResolvedValue(configWithoutTodoRoute)
        const wrapper = mountPanel()
        await flushPromises()

        await (wrapper.vm as unknown as { handleSave: () => Promise<void> }).handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                templates: expect.objectContaining({ aliyun: expect.objectContaining({ todo_due: expect.objectContaining({ variables: ['title', 'due_at'] }) }) }),
                routes: { login_otp: { provider: 'aliyun', template: 'login_otp' } },
            })
        )
    })

    it('submits the fixed todo_due route after enabling the optional scene', async () => {
        const configWithoutTodoRoute = structuredClone(config)
        delete (configWithoutTodoRoute.routes as Partial<typeof config.routes>).todo_due
        mocks.fetchConfig.mockResolvedValue(configWithoutTodoRoute)
        const wrapper = mountPanel()
        await flushPromises()

        ;(wrapper.vm as unknown as { todoDueEnabled: boolean }).todoDueEnabled = true
        await (wrapper.vm as unknown as { handleSave: () => Promise<void> }).handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(expect.objectContaining({ routes: expect.objectContaining({ todo_due: { provider: 'aliyun', template: 'todo_due' } }) }))
    })

    it('tests the current draft without saving or clearing its dirty state', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        const vm = wrapper.vm as unknown as {
            formData: typeof config
            hasUnsavedChanges: boolean
            handleTest: () => Promise<void>
        }

        vm.formData.templates.aliyun.login_otp.sign_name = '草稿签名'
        await flushPromises()

        await vm.handleTest()

        expect(mocks.prompt).toHaveBeenCalledWith('system.sms.testPrompt', 'system.sms.testTitle', expect.objectContaining({ inputValue: '+86 ' }))
        expect(mocks.testConfig).toHaveBeenCalledWith({
            country_code: '86',
            phone_number: '13800138000',
            config: {
                ...config,
                templates: {
                    ...config.templates,
                    aliyun: {
                        ...config.templates.aliyun,
                        login_otp: { ...config.templates.aliyun.login_otp, sign_name: '草稿签名' },
                    },
                },
            },
        })
        expect(mocks.updateConfig).not.toHaveBeenCalled()
        expect(mocks.fetchConfig).toHaveBeenCalledTimes(1)
        expect(vm.hasUnsavedChanges).toBe(true)
    })

    it('does not prompt or request when local draft validation fails', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        mocks.validateForm.mockResolvedValueOnce(false)

        await (wrapper.vm as unknown as { handleTest: () => Promise<void> }).handleTest()

        expect(mocks.prompt).not.toHaveBeenCalled()
        expect(mocks.testConfig).not.toHaveBeenCalled()
    })

    it('shows that Endpoint is the fixed official API URL', async () => {
        const wrapper = mountPanel()
        await flushPromises()

        const endpoint = wrapper.find('input[readonly]')
        expect(endpoint.attributes('value')).toBe('https://dysmsapi.aliyuncs.com')
        expect(wrapper.text()).toContain('system.sms.endpointHint')
    })

    it('shows both SMS scenes and uses selectors for routing', async () => {
        const wrapper = mountPanel()
        await flushPromises()

        expect(wrapper.text()).toContain('system.sms.loginScene')
        expect(wrapper.text()).toContain('system.sms.todoScene')
        expect(wrapper.text()).toContain('title')
        expect(wrapper.text()).toContain('due_at')
        expect(wrapper.findAllComponents({ name: 'ElSelect' }).length).toBeGreaterThanOrEqual(4)
    })
})
