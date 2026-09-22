import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
}))

vi.mock('@/utils/request', () => mocks)

import { getLoginOptions, loginBySms, sendSmsLoginCode } from './login'

describe('login sms api contract', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads public login options', async () => {
        await getLoginOptions()

        expect(mocks.request).toHaveBeenCalledWith('/v1/login/options', 'GET', { silent: true })
    })

    it('sends the graphical captcha with the sms code request', async () => {
        const payload = {
            country_code: '86',
            phone_number: '13800138000',
            captcha: '1234',
            captcha_id: 'captcha-id',
        }

        await sendSmsLoginCode(payload)

        expect(mocks.post).toHaveBeenCalledWith('/v1/login/sms/send-code', payload)
    })

    it('uses credential error handling for sms login without a password', async () => {
        const payload = {
            country_code: '86',
            phone_number: '13800138000',
            sms_code: '123456',
            challenge_id: 'challenge-id',
        }

        await loginBySms(payload)

        expect(mocks.request).toHaveBeenCalledWith('/v1/login/sms', 'POST', {
            data: payload,
            authErrorMode: 'credential',
        })
        expect(payload).not.toHaveProperty('password')
    })
})
