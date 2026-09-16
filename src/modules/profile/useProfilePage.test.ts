import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { formValidator } from '@/test/formValidation'
import { useProfilePage } from './useProfilePage'
import type { UserInfo } from '@/types/auth'

const mocks = vi.hoisted(() => ({ auth: { sessionVersion: 1, userInfo: { id: 1, nickname: 'tester', username: 'tester' } }, fetch: vi.fn(), modify: vi.fn() }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/modules/profile/service', () => ({ fetchProfile: mocks.fetch, modifyProfile: mocks.modify }))
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
    })
    afterEach(() => wrapper?.unmount())

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
        expect(mocks.modify).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.anything() }))
        mocks.modify.mockClear()
        page.openEditDrawer()
        page.formData.password = '密'.repeat(32)
        page.formData.confirm_password = page.formData.password
        await page.editConfirmSubmit()
        expect(mocks.modify).toHaveBeenCalledWith(expect.objectContaining({ password: '密'.repeat(32) }))
        mocks.modify.mockClear()
        page.formData.password += 'x'
        page.formData.confirm_password = page.formData.password
        await page.editConfirmSubmit()
        expect(mocks.modify).not.toHaveBeenCalled()
    })
})
