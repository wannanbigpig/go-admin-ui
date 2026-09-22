import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Login from './index.vue'
import { formValidator } from '@/test/formValidation'
const login = vi.hoisted(() => vi.fn())
const loginSms = vi.hoisted(() => vi.fn())
const captcha = vi.hoisted(() => vi.fn())
const loginOptions = vi.hoisted(() => vi.fn())
const sendSmsCode = vi.hoisted(() => vi.fn())
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ loginWithCredentials: login, loginWithSmsCode: loginSms, resetAuthStore: vi.fn(), routerData: [], menu: [] }) }))
vi.mock('@/modules/auth/service', () => ({ fetchCaptcha: captcha, fetchLoginOptions: loginOptions, sendLoginSmsCode: sendSmsCode }))
vi.mock('@/stores/setting', () => ({ useSettingStore: () => ({ locale: 'zh-CN', theme: 'light' }) }))
vi.mock('@/locales', () => ({ LOCALE_OPTIONS: [], ENABLE_I18N: false }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/router', () => ({ default: { currentRoute: { value: { query: {} } }, push: vi.fn() } }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }))

describe('login credential limits', () => {
    let wrapper: VueWrapper
    beforeEach(() => {
        vi.clearAllMocks()
        login.mockResolvedValue(undefined)
        loginSms.mockResolvedValue(undefined)
        captcha.mockResolvedValue({ id: 'captcha', b64s: 'captcha-image' })
        loginOptions.mockResolvedValue({ sms_login_enabled: false })
        sendSmsCode.mockResolvedValue({ challenge_id: 'challenge-id', retry_after: 30, expires_in: 300 })
    })
    afterEach(() => {
        wrapper?.unmount()
        vi.restoreAllMocks()
    })

    it('uses a static background without the animated canvas layer', async () => {
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()

        expect(wrapper.find('canvas.bg-canvas').exists()).toBe(false)
    })

    it.each([
        [20, 32, true],
        [21, 32, false],
        [20, 33, false],
        [3, 6, true],
    ] as const)('username %d password %d allowed=%s', async (userLength, passwordLength, allowed) => {
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as {
            loginError: string
            loginForm: { username: string; password: string; captcha: string }
            validateRules: object
            handleLogin: (form: ReturnType<typeof formValidator>) => Promise<void>
        }
        Object.assign(vm.loginForm, { username: 'a'.repeat(userLength), password: '密'.repeat(passwordLength), captcha: '1234' })
        await vm.handleLogin(formValidator(vm.validateRules, vm.loginForm))
        expect(login).toHaveBeenCalledTimes(allowed ? 1 : 0)
    })

    it('shows an inline retryable state when the captcha cannot be loaded', async () => {
        captcha.mockRejectedValueOnce(new Error('network unavailable'))
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()

        expect(wrapper.text()).toContain('login.retryCaptcha')
        expect(wrapper.find('.captcha-img').classes()).toContain('is-error')
    })

    it('keeps the form visible and reports an authentication failure inline', async () => {
        login.mockRejectedValueOnce(new Error('invalid credentials'))
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as {
            loginError: string
            loginForm: { username: string; password: string; captcha: string }
            validateRules: object
            handleLogin: (form: ReturnType<typeof formValidator>) => Promise<void>
        }
        Object.assign(vm.loginForm, { username: 'admin', password: '123456', captcha: '1234' })

        await vm.handleLogin(formValidator(vm.validateRules, vm.loginForm))
        await flushPromises()

        expect(vm.loginError).toBe('login.loginFailed')
        expect(wrapper.find('.login-form').exists()).toBe(true)
    })

    it('keeps password mode as default and only exposes sms mode when enabled by the server', async () => {
        loginOptions.mockResolvedValueOnce({ sms_login_enabled: true })

        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as { loginMode: string; smsLoginEnabled: boolean }

        expect(vm.smsLoginEnabled).toBe(true)
        expect(vm.loginMode).toBe('password')
    })

    it('sends an sms challenge and invalidates it when the phone changes', async () => {
        loginOptions.mockResolvedValueOnce({ sms_login_enabled: true })
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as {
            loginMode: 'password' | 'sms'
            loginForm: { countryCode: string; phoneNumber: string; captcha: string }
            smsChallengeId: string
            smsRetrySeconds: number
            handleSendSmsCode: (form: { validateField: (fields: string[]) => Promise<boolean> }) => Promise<void>
        }
        vm.loginMode = 'sms'
        Object.assign(vm.loginForm, { countryCode: '86', phoneNumber: '13800138000', captcha: '1234' })
        await nextTick()

        await vm.handleSendSmsCode({ validateField: vi.fn().mockResolvedValue(true) })

        expect(sendSmsCode).toHaveBeenCalledWith({
            country_code: '86',
            phone_number: '13800138000',
            captcha: '1234',
            captcha_id: 'captcha',
        })
        expect(vm.smsChallengeId).toBe('challenge-id')
        expect(vm.smsRetrySeconds).toBe(30)

        vm.loginForm.phoneNumber = '13900139000'
        await nextTick()

        expect(vm.smsChallengeId).toBe('')
        expect(vm.smsRetrySeconds).toBe(0)
    })

    it('submits sms login without password and reuses the auth store login flow', async () => {
        loginOptions.mockResolvedValueOnce({ sms_login_enabled: true })
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as {
            loginMode: 'password' | 'sms'
            loginForm: { countryCode: string; phoneNumber: string; smsCode: string; captcha: string }
            smsChallengeId: string
            validateRules: object
            handleLogin: (form: ReturnType<typeof formValidator>) => Promise<void>
        }
        vm.loginMode = 'sms'
        Object.assign(vm.loginForm, { countryCode: '86', phoneNumber: '13800138000', captcha: '' })
        await nextTick()
        vm.loginForm.smsCode = '123456'
        vm.smsChallengeId = 'challenge-id'

        await vm.handleLogin(formValidator(vm.validateRules, vm.loginForm))

        expect(loginSms).toHaveBeenCalledWith({
            country_code: '86',
            phone_number: '13800138000',
            sms_code: '123456',
            challenge_id: 'challenge-id',
        })
        expect(loginSms.mock.calls[0]?.[0]).not.toHaveProperty('password')
        expect(login).not.toHaveBeenCalled()
    })

    it.each([
        ['12800138000', '123456'],
        ['1380013800', '123456'],
        ['13800138000', '12345'],
        ['13800138000', '1234567'],
    ])('rejects sms credentials outside the backend contract: phone=%s code=%s', async (phoneNumber, smsCode) => {
        loginOptions.mockResolvedValueOnce({ sms_login_enabled: true })
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as {
            loginMode: 'password' | 'sms'
            loginForm: { countryCode: string; phoneNumber: string; smsCode: string; captcha: string }
            smsChallengeId: string
            validateRules: object
            handleLogin: (form: ReturnType<typeof formValidator>) => Promise<void>
        }
        vm.loginMode = 'sms'
        Object.assign(vm.loginForm, { countryCode: '86', phoneNumber, smsCode, captcha: '' })
        vm.smsChallengeId = 'challenge-id'

        await vm.handleLogin(formValidator(vm.validateRules, vm.loginForm))

        expect(loginSms).not.toHaveBeenCalled()
    })
})
