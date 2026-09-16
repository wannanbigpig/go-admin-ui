import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { FormInstance } from 'element-plus'
import type { Department } from '@/types/department'
import type { AdminUser } from '@/types/adminUser'
import { useDepartmentRoleBinding } from './useDepartmentRoleBinding'
import { useAdminUserRoleBinding } from '@/modules/adminUser/useAdminUserRoleBinding'

const mocks = vi.hoisted(() => ({ detail: vi.fn(), bind: vi.fn(), options: vi.fn() }))
vi.mock('@/modules/department/service', () => ({ fetchDepartmentDetail: mocks.detail, bindDepartmentRoles: mocks.bind }))
vi.mock('@/modules/adminUser/service', () => ({ fetchAdminUserDetail: mocks.detail, updateAdminUserRoles: mocks.bind }))
vi.mock('@/api/permission', () => ({ getRoleOptions: mocks.options }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn(), warning: vi.fn(), success: vi.fn() } }))
vi.mock('@/composables/useSubmitLock', async () => {
    const { ref } = await import('vue')
    return { useSubmitLock: () => ({ isSubmitting: ref(false), runWithSubmitLock: (fn: () => Promise<unknown>) => fn() }) }
})

for (const [name, create] of [
    ['department', useDepartmentRoleBinding],
    ['adminUser', useAdminUserRoleBinding],
] as const) {
    describe(`${name} role binding`, () => {
        beforeEach(() => {
            vi.resetAllMocks()
            mocks.options.mockResolvedValue([{ id: 2, name: 'editor' }])
            mocks.bind.mockResolvedValue(undefined)
        })
        const setup = () => {
            const binding = create({ refreshList: vi.fn().mockResolvedValue(undefined) })
            binding.bindRoleFormRef.value = { validate: vi.fn().mockResolvedValue(true) } as unknown as FormInstance
            const open = (id: number) => binding.handleBindRole({ id, name: 'dept', username: 'admin' } as Department & AdminUser)
            return { binding, open }
        }
        it('blocks submission until detail has loaded, and after a failed detail fetch', async () => {
            const { binding, open } = setup()
            let reject!: (error: Error) => void
            mocks.detail.mockReturnValue(
                new Promise((_, r) => {
                    reject = r
                })
            )
            const pending = open(10)
            await flushPromises()
            await binding.bindRoleConfirmSubmit()
            expect(mocks.bind).not.toHaveBeenCalled()
            reject(new Error('network'))
            await pending
            await binding.bindRoleConfirmSubmit()
            expect(mocks.bind).not.toHaveBeenCalled()
        })
        it('does not submit when validation fails or form is absent', async () => {
            const { binding, open } = setup()
            mocks.detail.mockResolvedValue({ role_ids: [2] })
            await open(10)
            vi.mocked(binding.bindRoleFormRef.value!.validate).mockRejectedValue(new Error('invalid'))
            await binding.bindRoleConfirmSubmit()
            expect(mocks.bind).not.toHaveBeenCalled()
            vi.mocked(binding.bindRoleFormRef.value!.validate).mockResolvedValue(false)
            await binding.bindRoleConfirmSubmit()
            expect(mocks.bind).not.toHaveBeenCalled()
            binding.bindRoleFormRef.value = undefined
            await binding.bindRoleConfirmSubmit()
            expect(mocks.bind).not.toHaveBeenCalled()
        })
        it('ignores old detail responses and saves only the current entity roles', async () => {
            const { binding, open } = setup()
            let resolveOld!: (value: unknown) => void
            mocks.detail
                .mockReturnValueOnce(
                    new Promise((resolve) => {
                        resolveOld = resolve
                    })
                )
                .mockResolvedValueOnce({ role_ids: [2] })
            const pending = open(10)
            await open(20)
            resolveOld({ role_ids: [9] })
            await pending
            await binding.bindRoleConfirmSubmit()
            expect(mocks.bind).toHaveBeenCalledWith(20, [2])
        })
    })
}
