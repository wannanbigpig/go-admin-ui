import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminUserForm } from './useAdminUserForm'
import { formValidator } from '@/test/formValidation'
const create = vi.hoisted(() => vi.fn())
vi.mock('@/modules/adminUser/service', () => ({ createAdminUserItem: create, updateAdminUserItem: vi.fn(), fetchAdminUserDetail: vi.fn() }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/composables/useSubmitLock', async () => {
    const { ref } = await import('vue')
    return { useSubmitLock: () => ({ isSubmitting: ref(false), runWithSubmitLock: (fn: () => Promise<unknown>) => fn() }) }
})

describe('admin credential contract', () => {
    beforeEach(() => create.mockResolvedValue(undefined))
    it.each([
        [20, 32, true],
        [21, 32, false],
        [20, 33, false],
        [2, 6, false],
        [3, 5, false],
    ] as const)('username %d, password %d allowed=%s', async (usernameLength, passwordLength, allowed) => {
        const page = useAdminUserForm({ refreshList: vi.fn().mockResolvedValue(undefined) })
        Object.assign(page.formData, { nickname: 'tester', username: 'a'.repeat(usernameLength), password: '密'.repeat(passwordLength), confirm_password: '密'.repeat(passwordLength) })
        page.formDataRef.value = formValidator(page.getDynamicRules(0), page.formData)
        await page.editConfirmSubmit()
        expect(create).toHaveBeenCalledTimes(allowed ? 1 : 0)
    })
})
