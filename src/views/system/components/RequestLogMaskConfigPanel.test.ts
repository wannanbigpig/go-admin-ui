import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('@/modules/system/service', () => ({
    fetchRequestLogMaskConfig: vi.fn().mockResolvedValue({
        common: [],
        request_header: [],
        request_body: [],
        response_header: [],
        response_body: [],
    }),
    updateRequestLogMaskConfig: vi.fn(),
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

import RequestLogMaskConfigPanel from './RequestLogMaskConfigPanel.vue'

const ActionButtonStub = defineComponent({
    name: 'XlActionButton',
    props: ['code'],
    template: '<button />',
})

describe('request log mask config permissions', () => {
    it('binds save button to the mask configuration permission', async () => {
        const wrapper = mount(RequestLogMaskConfigPanel, {
            global: {
                config: { warnHandler: vi.fn() },
                directives: { permission: () => undefined },
                stubs: { XlActionButton: ActionButtonStub },
            },
        })
        await flushPromises()

        const codes = wrapper.findAllComponents(ActionButtonStub).map((button) => button.props('code'))
        expect(codes).toEqual(['requestLog:maskConfig'])
    })
})
