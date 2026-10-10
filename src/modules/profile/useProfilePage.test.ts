import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { ElMessageBox, type MessageBoxData } from 'element-plus'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { formValidator } from '@/test/formValidation'
import { useProfilePage } from './useProfilePage'
import type { UserInfo } from '@/types/auth'

const mocks = vi.hoisted(() => ({ auth: { sessionVersion: 1, userInfo: { id: 1, nickname: 'tester', username: 'tester' }, resetAuthStore: vi.fn() }, fetch: vi.fn(), modify: vi.fn(), security: vi.fn(), code: vi.fn(), changePhone: vi.fn(), replace: vi.fn() }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/router', () => ({ default: { replace: mocks.replace } }))
vi.mock('@/modules/profile/service', () => ({ fetchProfile: mocks.fetch, modifyProfile: mocks.modify, fetchProfileSecurityOptions: mocks.security, requestProfileCode: mocks.code, submitPhoneChange: mocks.changePhone }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))

describe('profile session and password boundaries', () => {
    let wrapper: VueWrapper
    let page: ReturnType<typeof useProfilePage>
    const setup = () => {
        wrapper = mount(
            defineComponent({
                setup() {
                    page = useProfilePage()
                    page.formDataRef.value = formValidator(page.formRules, page.formData)
                    return () => null
                },
            })
        )
    }
    beforeEach(() => {
        mocks.auth.sessionVersion = 1
        mocks.auth.userInfo = { id: 1, nickname: 'tester', username: 'tester' }
        mocks.fetch.mockReset().mockResolvedValue({ ...mocks.auth.userInfo })
        mocks.modify.mockReset().mockResolvedValue(undefined)
        mocks.security.mockReset().mockResolvedValue({ sms_verification_required: false })
        mocks.code.mockReset().mockResolvedValue({ challenge_id: 'test-challenge', retry_after: 60, expires_in: 300 })
        mocks.changePhone.mockReset().mockResolvedValue(undefined)
        mocks.replace.mockReset().mockResolvedValue(undefined)
        mocks.auth.resetAuthStore.mockReset()
    })
    afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })

    it('submits an explicit empty email when clearing the existing address', async () => {
        mocks.fetch.mockResolvedValue({ ...mocks.auth.userInfo, email: 'tester@example.com' })
        setup()
        await flushPromises()
        page.openEditDrawer()
        expect(page.formData.email).toBe('tester@example.com')
        page.formData.email = ''
        await page.editConfirmSubmit()
        expect(mocks.modify).toHaveBeenCalledWith(expect.objectContaining({ email: '' }))
    })

    it.each(['session', 'unmount'])('ignores profile read after %s changes', async (change) => {
        let resolve!: (value: Partial<UserInfo>) => void
        mocks.fetch.mockReturnValue(
            new Promise((r) => {
                resolve = r
            })
        )
        setup()
        if (change === 'session') {
            mocks.auth.sessionVersion = 2
            mocks.auth.userInfo = { id: 2, nickname: 'other', username: 'other' }
        } else wrapper.unmount()
        resolve({ id: 9, nickname: 'stale', username: 'stale' })
        await flushPromises()
        expect(mocks.auth.userInfo.id).toBe(change === 'session' ? 2 : 1)
    })

    it.each(['', 'different-password'])('does not change password with invalid confirmation %s', async (confirm) => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        page.formData.change_password = true
        page.formData.current_password = 'current-password'
        page.formData.password = 'new-password'
        page.formData.confirm_password = confirm
        await page.editConfirmSubmit()
        expect(mocks.modify).not.toHaveBeenCalled()
    })

    it('allows unchanged password and matching 32-character passwords, rejects 33', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        await page.editConfirmSubmit()
        expect(mocks.modify).toHaveBeenCalledWith(expect.not.objectContaining({ current_password: expect.anything(), password: expect.anything() }))
        mocks.modify.mockClear()
        page.openEditDrawer()
        page.formData.change_password = true
        page.formData.current_password = 'current-password'
        page.formData.password = '密'.repeat(32)
        page.formData.confirm_password = page.formData.password
        await page.editConfirmSubmit()
        expect(mocks.modify).toHaveBeenCalledWith(expect.objectContaining({ current_password: 'current-password', password: '密'.repeat(32) }))
        mocks.modify.mockClear()
        page.formData.password += 'x'
        page.formData.confirm_password = page.formData.password
        await page.editConfirmSubmit()
        expect(mocks.modify).not.toHaveBeenCalled()
    })

    it('requires the current password when a new password is submitted', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        page.formData.change_password = true
        page.formData.password = 'new-password'
        page.formData.confirm_password = 'new-password'

        await page.editConfirmSubmit()
        expect(mocks.modify).not.toHaveBeenCalled()

        page.formData.current_password = 'current-password'
        await page.editConfirmSubmit()
        expect(mocks.modify).toHaveBeenCalledWith(expect.objectContaining({ current_password: 'current-password', password: 'new-password' }))
    })

    it('requires the bound-phone code for password changes when SMS login is enabled', async () => {
        mocks.security.mockResolvedValue({ sms_verification_required: true })
        setup()
        await flushPromises()
        page.openEditDrawer()
        page.formData.change_password = true
        page.formData.current_password = 'current-password'
        page.formData.password = 'new-password'
        page.formData.confirm_password = 'new-password'
        await page.editConfirmSubmit()
        expect(mocks.modify).not.toHaveBeenCalled()
        await page.sendPasswordCode()
        page.formData.sms_code = '123456'
        await page.editConfirmSubmit()
        expect(mocks.code).toHaveBeenCalledWith({ purpose: 'password' })
        expect(mocks.modify).toHaveBeenCalledWith(expect.objectContaining({ sms_challenge_id: 'test-challenge', sms_code: '123456' }))
    })

    it('does not submit password fields when change password is unchecked', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        // 未勾选时即使残留了密码值也不应提交
        page.formData.change_password = false
        page.formData.password = 'should-not-submit'
        page.formData.confirm_password = 'should-not-submit'
        page.formData.current_password = 'should-not-submit'

        await page.editConfirmSubmit()

        expect(mocks.modify).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.anything(), current_password: expect.anything() }))
    })

    it('submits password only when change password is checked', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        page.formData.change_password = true
        page.formData.current_password = 'current-password'
        page.formData.password = 'new-password'
        page.formData.confirm_password = 'new-password'

        await page.editConfirmSubmit()

        expect(mocks.modify).toHaveBeenCalledWith(expect.objectContaining({ current_password: 'current-password', password: 'new-password' }))
    })

    it('does not submit phone fields through profile edit', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        await page.editConfirmSubmit()
        expect(mocks.modify).toHaveBeenCalledWith(expect.not.objectContaining({ phone_number: expect.anything() }))
    })

    it('changes phone through the separate operation without SMS when disabled', async () => {
        setup()
        await flushPromises()
        await page.openPhoneDrawer()
        page.phoneDataRef.value = formValidator(page.phoneRules, page.phoneData)
        page.phoneData.phone_number = '13800138000'
        page.phoneData.current_password = 'current-password'
        await page.changePhoneConfirm()
        expect(mocks.changePhone).toHaveBeenCalledWith({ country_code: '86', phone_number: '13800138000', current_password: 'current-password' })
        expect(mocks.auth.resetAuthStore).toHaveBeenCalled()
    })

    it('requires a new-phone code when SMS login is enabled', async () => {
        mocks.security.mockResolvedValue({ sms_verification_required: true })
        setup()
        await flushPromises()
        await page.openPhoneDrawer()
        page.phoneDataRef.value = formValidator(page.phoneRules, page.phoneData)
        page.phoneData.phone_number = '13800138000'
        page.phoneData.current_password = 'current-password'
        await page.changePhoneConfirm()
        expect(mocks.changePhone).not.toHaveBeenCalled()
        await page.sendPhoneCode()
        page.phoneData.sms_code = '123456'
        await page.changePhoneConfirm()
        expect(mocks.changePhone).toHaveBeenCalledWith(expect.objectContaining({ sms_challenge_id: 'test-challenge', sms_code: '123456' }))
    })

    it('hides all password inputs when change password switch is off', async () => {
        mocks.fetch.mockResolvedValue({ ...mocks.auth.userInfo, phone_number: '13800138000' })
        setup()
        await flushPromises()
        page.openEditDrawer()

        expect(page.formData.change_password).toBe(false)
        expect(page.showPasswordFields.value).toBe(false)
        expect(page.showCurrentPassword.value).toBe(false)
    })
    it('closes unchanged profile directly, but preserves edited values when discard is canceled', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        const confirm = vi.spyOn(ElMessageBox, 'confirm').mockRejectedValue('cancel')
        const close = vi.fn()
        await page.confirmProfileClose(close)
        expect(close).toHaveBeenCalledOnce()
        expect(confirm).not.toHaveBeenCalled()
        close.mockClear()
        page.formData.nickname = 'edited nickname'
        await page.confirmProfileClose(close)
        expect(confirm).toHaveBeenCalledOnce()
        expect(close).not.toHaveBeenCalled()
        expect(page.formData.nickname).toBe('edited nickname')
        confirm.mockResolvedValue('confirm' as MessageBoxData)
        await page.confirmProfileClose(close)
        expect(close).toHaveBeenCalledOnce()
    })

    it('does not close a new editor when an older discard confirmation resolves', async () => {
        setup()
        await flushPromises()
        page.openEditDrawer()
        page.formData.email = 'edited@example.com'
        let resolve!: (value: MessageBoxData) => void
        vi.spyOn(ElMessageBox, 'confirm').mockImplementation(() => new Promise((done) => { resolve = done }))
        const close = vi.fn()
        const pending = page.confirmProfileClose(close)
        page.openEditDrawer()
        resolve('confirm' as MessageBoxData)
        await pending
        expect(close).not.toHaveBeenCalled()
    })

})
