import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    fetchConfig: vi.fn(),
    fetchSecret: vi.fn(),
    updateConfig: vi.fn(),
    testConfig: vi.fn(),
    validateForm: vi.fn(),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('@/modules/shared/form', () => ({ validateFormSafely: mocks.validateForm }))
vi.mock('@/modules/system/service', () => ({
    fetchStorageConfig: mocks.fetchConfig,
    fetchStorageSecret: mocks.fetchSecret,
    updateStorageConfig: mocks.updateConfig,
    testStorageConnection: mocks.testConfig,
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))
vi.mock('@/utils/auth', () => ({ hasPermission: () => true }))
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn() } }))

import StorageConfigPanel from './StorageConfigPanel.vue'
import type { StorageConfig } from '@/types/system'
import { registerStorageProviderForm } from './storageProviders/registry'

const ActionButtonStub = defineComponent({ name: 'XlActionButton', template: '<button />' })
const SlotStub = defineComponent({ template: '<div><slot /></div>' })

const baseConfig: StorageConfig = {
    active_driver: 'aliyun_oss',
    config: {
        local: { base_path: '/data', public_base_path: '/data/public', private_base_path: '/data/private' },
        aliyun_oss: {
            endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
            region: 'cn-hangzhou',
            bucket: 'assets',
            access_key_id: 'key-id',
            access_key_secret: '******',
        },
        signed_url_ttl_seconds: 300,
        max_file_size_mb: 10,
        allowed_mime_types: [],
        allowed_extensions: ['.png'],
        export_temp_file_ttl_days: 7,
    },
}

const mountPanel = () =>
    mount(StorageConfigPanel, {
        global: {
            config: { warnHandler: vi.fn() },
            directives: { permission: () => undefined },
            stubs: {
                XlActionButton: ActionButtonStub,
                ElForm: SlotStub,
                ElFormItem: SlotStub,
                ElRow: SlotStub,
                ElCol: SlotStub,
                ElDivider: SlotStub,
                ElAlert: SlotStub,
                ElRadioGroup: SlotStub,
                ElRadioButton: SlotStub,
                ElInput: true,
                ElInputNumber: true,
                ElSwitch: true,
                ElSkeleton: true,
                ElIcon: SlotStub,
            },
        },
    })

describe('storage config panel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchConfig.mockResolvedValue(structuredClone(baseConfig))
        mocks.updateConfig.mockResolvedValue(undefined)
        mocks.testConfig.mockResolvedValue({ success: true })
        mocks.validateForm.mockResolvedValue(true)
    })

    it('preserves unknown provider configuration while showing the fallback state', async () => {
        const customConfig = structuredClone(baseConfig)
        customConfig.active_driver = 'custom_s3'
        customConfig.config.custom_s3 = { endpoint: 'https://s3.example.com', secret_key: '******' }
        mocks.fetchConfig.mockResolvedValue(customConfig)
        const wrapper = mountPanel()
        await flushPromises()

        const vm = wrapper.vm as unknown as { activeProviderDefinition: { key: string } | null; handleSave: () => Promise<void> }
        expect(vm.activeProviderDefinition).toBeNull()
        await vm.handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                active_driver: 'custom_s3',
                config: expect.objectContaining({ custom_s3: customConfig.config.custom_s3 }),
            })
        )
    })

    it('renders a registered example provider and preserves its configuration when saving', async () => {
        const ExampleProviderForm = defineComponent({ props: { modelValue: Object }, emits: ['update:modelValue'], template: '<div data-test="example-storage-provider" />' })
        const unregister = registerStorageProviderForm({
            key: 'example_s3',
            label: 'Example S3',
            component: ExampleProviderForm,
            createDefaultConfig: () => ({ endpoint: '', region: '' }),
        })
        try {
            const customConfig = structuredClone(baseConfig)
            customConfig.active_driver = 'example_s3'
            customConfig.config.example_s3 = { endpoint: 'https://s3.example.com', region: 'test-1', custom_option: true }
            mocks.fetchConfig.mockResolvedValue(customConfig)
            const wrapper = mountPanel()
            await flushPromises()

            const vm = wrapper.vm as unknown as { activeProviderDefinition: { key: string } | null; handleSave: () => Promise<void> }
            expect(vm.activeProviderDefinition?.key).toBe('example_s3')
            expect(wrapper.find('[data-test="example-storage-provider"]').exists()).toBe(true)
            await vm.handleSave()

            expect(mocks.updateConfig).toHaveBeenCalledWith(
                expect.objectContaining({
                    active_driver: 'example_s3',
                    config: expect.objectContaining({ example_s3: customConfig.config.example_s3 }),
                })
            )
        } finally {
            unregister()
        }
    })

    it('submits an explicitly cleared OSS secret instead of restoring the mask', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        const vm = wrapper.vm as unknown as { formData: StorageConfig; handleSave: () => Promise<void> }
        vm.formData.active_driver = 'local'
        vm.formData.config.aliyun_oss.access_key_secret = ''

        await vm.handleSave()

        expect(mocks.updateConfig).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining({ aliyun_oss: expect.objectContaining({ access_key_secret: '' }) }) }))
    })
})
