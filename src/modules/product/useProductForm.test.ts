import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getProductDetail: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
}))

vi.mock('@/api/product', () => ({
    getProductDetail: mocks.getProductDetail,
    createProduct: mocks.createProduct,
    updateProduct: mocks.updateProduct,
}))

vi.mock('@/composables/useSubmitLock', async () => {
    const { ref: createRef } = await import('vue')
    return {
        useSubmitLock: () => {
            const isSubmitting = createRef(false)
            return {
                isSubmitting,
                runWithSubmitLock: async (task: () => Promise<unknown>) => {
                    if (isSubmitting.value) return undefined
                    isSubmitting.value = true
                    try {
                        return await task()
                    } finally {
                        isSubmitting.value = false
                    }
                },
            }
        },
    }
})

vi.mock('@/locales', () => ({
    translate: (key: string) => key,
}))

vi.mock('element-plus', () => ({
    ElMessage: { success: mocks.success },
}))

vi.mock('@/utils/logger', () => ({
    Logger: { error: mocks.error },
}))

import { useProductForm } from '@/modules/product/useProductForm'
import type { Product } from '@/api/product'

const detail: Product = {
    id: 12,
    name: 'server detail',
    description: 'complete description',
    price: 1999,
    status: 1,
    status_name: '启用',
    dept_id: 8,
    dept_name: '研发部',
    created_by: 1,
    created_at: '2026-09-16 10:00:00',
    updated_at: '2026-09-16 10:00:00',
}

describe('useProductForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads product detail instead of editing the list snapshot', async () => {
        mocks.getProductDetail.mockResolvedValue(detail)
        const refreshList = vi.fn().mockResolvedValue(undefined)
        const form = useProductForm({ getDefaultDepartmentId: () => 3, refreshList })
        const listRow = { ...detail, name: 'stale list name', description: 'truncated' }

        await form.openEditDrawer(listRow)

        expect(mocks.getProductDetail).toHaveBeenCalledWith({ id: 12 })
        expect(form.formData).toMatchObject({
            id: 12,
            name: 'server detail',
            description: 'complete description',
            price: 1999,
            dept_id: 8,
        })
        expect(form.isEditMode.value).toBe(true)
        expect(form.showDrawer.value).toBe(true)
    })

    it('allows only one create request while a submission is pending', async () => {
        let resolveCreate!: () => void
        mocks.createProduct.mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveCreate = resolve
                })
        )
        const refreshList = vi.fn().mockResolvedValue(undefined)
        const form = useProductForm({ getDefaultDepartmentId: () => 3, refreshList })
        form.formDataRef.value = {
            validate: vi.fn().mockResolvedValue(true),
            clearValidate: vi.fn(),
        } as never
        form.openCreateDrawer()
        form.formData.name = '测试产品'

        const firstSubmit = form.handleSubmit()
        const secondSubmit = form.handleSubmit()
        await Promise.resolve()
        await Promise.resolve()

        expect(mocks.createProduct).toHaveBeenCalledTimes(1)
        expect(mocks.createProduct).toHaveBeenCalledWith({
            name: '测试产品',
            description: '',
            price: 0,
            status: 1,
            dept_id: 3,
        })
        expect(form.isSubmitting.value).toBe(true)

        resolveCreate()
        await Promise.all([firstSubmit, secondSubmit])

        expect(refreshList).toHaveBeenCalledTimes(1)
        expect(form.showDrawer.value).toBe(false)
        expect(form.isSubmitting.value).toBe(false)
    })

    it('submits the id from detail when updating', async () => {
        mocks.getProductDetail.mockResolvedValue(detail)
        mocks.updateProduct.mockResolvedValue(undefined)
        const refreshList = vi.fn().mockResolvedValue(undefined)
        const form = useProductForm({ getDefaultDepartmentId: () => 3, refreshList })
        form.formDataRef.value = { validate: vi.fn().mockResolvedValue(true), clearValidate: vi.fn() } as never

        await form.openEditDrawer({ ...detail, id: 99 })
        await form.handleSubmit()

        expect(mocks.updateProduct).toHaveBeenCalledWith({
            id: 12,
            name: 'server detail',
            description: 'complete description',
            price: 1999,
            status: 1,
            dept_id: 8,
        })
    })
})
