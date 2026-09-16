import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises, type VueWrapper } from '@vue/test-utils'
import Login from './index.vue'
import { formValidator } from '@/test/formValidation'
const login = vi.hoisted(() => vi.fn())
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ loginWithCredentials: login, resetAuthStore: vi.fn(), routerData: [], menu: [] }) }))
vi.mock('@/modules/auth/service', () => ({ fetchCaptcha: vi.fn().mockResolvedValue({ id: 'captcha', b64s: '' }) }))
vi.mock('@/stores/setting', () => ({ useSettingStore: () => ({ locale: 'zh-CN', theme: 'light' }) }))
vi.mock('@/locales', () => ({ LOCALE_OPTIONS: [], ENABLE_I18N: false }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/router', () => ({ default: { currentRoute: { value: { query: {} } }, push: vi.fn() } }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }))

describe('login credential limits', () => {
    let wrapper: VueWrapper
    afterEach(() => {
        wrapper?.unmount()
        vi.restoreAllMocks()
    })
    it.each([
        [20, 32, true],
        [21, 32, false],
        [20, 33, false],
        [3, 6, true],
    ] as const)('username %d password %d allowed=%s', async (userLength, passwordLength, allowed) => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
        wrapper = shallowMount(Login, { global: { config: { warnHandler: vi.fn() } } })
        await flushPromises()
        const vm = wrapper.vm as unknown as { loginForm: { username: string; password: string; captcha: string }; validateRules: object; handleLogin: (form: ReturnType<typeof formValidator>) => Promise<void> }
        Object.assign(vm.loginForm, { username: 'a'.repeat(userLength), password: '密'.repeat(passwordLength), captcha: '1234' })
        await vm.handleLogin(formValidator(vm.validateRules, vm.loginForm))
        expect(login).toHaveBeenCalledTimes(allowed ? 1 : 0)
    })
})
