import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock('@/utils/request', () => ({
    get: mocks.get,
    post: mocks.post,
    request: vi.fn(),
    upload: vi.fn(),
}))

import { getSmsConfig, saveSmsConfig, testSmsConfig } from './system'

const payload = {
    enabled: true,
    providers: { aliyun: { enabled: true, access_key_id: 'key-id', access_key_secret: '******', endpoint: 'https://dysmsapi.aliyuncs.com' } },
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

describe('system sms api contract', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses the dedicated sms config endpoint for loading and saving', async () => {
        await getSmsConfig()
        await saveSmsConfig(payload)

        expect(mocks.get).toHaveBeenCalledWith('/v1/system/sms/config')
        expect(mocks.post).toHaveBeenCalledWith('/v1/system/sms/config', payload)
    })

    it('sends the recipient and current config draft to the dedicated test endpoint', async () => {
        const request = { country_code: '86', phone_number: '13800138000', config: payload }
        await testSmsConfig(request)

        expect(mocks.post).toHaveBeenCalledWith('/v1/system/sms/test', request)
    })
})
