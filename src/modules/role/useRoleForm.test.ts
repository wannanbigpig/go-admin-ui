import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { ElForm, ElFormItem, ElInput, type FormInstance } from 'element-plus'
import { useRoleForm } from './useRoleForm'

const api = vi.hoisted(() => ({ detail: vi.fn(), create: vi.fn(), update: vi.fn(), menus: vi.fn() }))
vi.mock('@/api/permission', () => ({ getRoleDetail: api.detail, createRole: api.create, updateRole: api.update }))
vi.mock('@/modules/permission/service', () => ({ fetchMenuTree: api.menus }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/composables/useSubmitLock', async () => {
    const { ref } = await import('vue')
    return { useSubmitLock: () => ({ isSubmitting: ref(false), runWithSubmitLock: (fn: () => Promise<unknown>) => fn() }) }
})
const deferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (reason: Error) => void
    const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
    return { promise, resolve, reject }
}
const setup = () => {
    const form = useRoleForm({ refreshRoleList: vi.fn().mockResolvedValue(undefined) })
    form.menuTreeRef.value = { setCheckedKeys: vi.fn(), getCheckedKeys: () => [], getHalfCheckedKeys: () => [] }
    form.formDataRef.value = { validate: vi.fn().mockResolvedValue(true), clearValidate: vi.fn(), setInitialValues: vi.fn() } as unknown as FormInstance
    return form
}

describe('role edit sessions', () => {
    beforeEach(() => { vi.clearAllMocks(); api.menus.mockResolvedValue([]); api.update.mockResolvedValue(undefined) })
    afterEach(() => vi.restoreAllMocks())

    it('ignores a late previous role before mutating the current identity', async () => {
        const a = deferred<object>(), b = deferred<object>()
        api.detail.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
        const form = setup()
        const first = form.openEditDrawer({ id: 2 }, 0)
        const second = form.openEditDrawer({ id: 3 }, 1)
        b.resolve({ id: 3, name: 'Current role', code: 'current' }); await second
        a.resolve({ id: 2, name: 'Stale role', code: 'stale' }); await first
        expect(form.formData).toMatchObject({ id: 3, name: 'Current role' })
        await form.editConfirmSubmit()
        expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
    })

    it('does not submit an identity before its detail is ready or after it was closed', async () => {
        const detail = deferred<object>(); api.detail.mockReturnValue(detail.promise)
        const form = setup(); const opening = form.openEditDrawer({ id: 2 }, 0)
        await form.editConfirmSubmit()
        expect(api.update).not.toHaveBeenCalled()
        form.showDrawer.value = false
        detail.resolve({ id: 2, name: 'Closed role' }); await opening
        expect(form.formData.id).toBe(0)
        await form.editConfirmSubmit()
        expect(api.update).not.toHaveBeenCalled()
    })

    it('does not submit another role when the editor switches during validation', async () => {
        api.detail.mockImplementation(({ id }: { id: number }) => Promise.resolve({ id, name: `Role ${id}` }))
        const form = setup(); await form.openEditDrawer({ id: 2 }, 0)
        const validation = deferred<boolean>(); form.formDataRef.value!.validate = vi.fn(() => validation.promise)
        const saving = form.editConfirmSubmit(); await form.openEditDrawer({ id: 3 }, 1)
        validation.resolve(true); await saving
        expect(api.update).not.toHaveBeenCalled()
    })

    it('finishing a save does not close the newly opened editor', async () => {
        api.detail.mockImplementation(({ id }: { id: number }) => Promise.resolve({ id, name: `Role ${id}` }))
        const save = deferred<undefined>(); api.update.mockReturnValue(save.promise)
        const form = setup(); await form.openEditDrawer({ id: 2 }, 0)
        const saving = form.editConfirmSubmit(); await flushPromises()
        form.showDrawer.value = false; await form.openEditDrawer({ id: 3 }, 1)
        save.resolve(undefined); await saving
        expect(form.showDrawer.value).toBe(true)
        expect(form.formData.id).toBe(3)
        expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
    })

    it('reset restores the current loaded baseline, then the new-role baseline', async () => {
        api.detail.mockImplementation(({ id }: { id: number }) => Promise.resolve({ id, name: `Role ${id}`, code: `code${id}` }))
        const form = setup()
        const wrapper = mount({ setup: () => () => h(ElForm, { ref: form.formDataRef, model: form.formData }, { default: () => h(ElFormItem, { prop: 'name' }, { default: () => h(ElInput, { modelValue: form.formData.name }) }) }) })
        await form.openEditDrawer({ id: 2 }, 0); form.formData.name = 'Changed'; form.formDataRef.value!.resetFields(); await nextTick()
        expect(form.formData.name).toBe('Role 2')
        await form.openEditDrawer({ id: 3 }, 0); form.formData.name = 'Changed'; form.formDataRef.value!.resetFields(); await nextTick()
        expect(form.formData.name).toBe('Role 3')
        await form.openCreateDrawer(); form.formData.name = 'Draft'; form.formDataRef.value!.resetFields(); await nextTick()
        expect(form.formData.name).toBe('')
        wrapper.unmount()
    })
    it('reset synchronizes permission checkboxes before the next save', async () => {
        api.detail.mockResolvedValue({ id: 2, name: 'Role 2', menu_list: [11] })
        api.menus.mockResolvedValue([{ id: 11, type: 2, status: 1, is_auth: 1 }])
        const form = setup()
        let checked: number[] = []
        form.menuTreeRef.value = { setCheckedKeys: (keys: number[]) => { checked = [...keys] }, getCheckedKeys: () => checked, getHalfCheckedKeys: () => [] }
        const wrapper = mount({ setup: () => () => h(ElForm, { ref: form.formDataRef, model: form.formData }, { default: () => h(ElFormItem, { prop: 'menu_list' }, { default: () => h('div') }) }) })
        await form.openEditDrawer({ id: 2 }, 0)
        checked = []; form.formData.menu_list = []
        await form.resetEditForm()
        expect(checked).toEqual([11])
        await form.editConfirmSubmit()
        expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ id: 2, menu_list: [11] }))
        wrapper.unmount()
    })

    it('rejects a changed form identity before saving', async () => {
        api.detail.mockResolvedValue({ id: 2, name: 'Role 2' })
        const form = setup(); await form.openEditDrawer({ id: 2 }, 0)
        form.formData.id = 99
        await form.editConfirmSubmit()
        expect(api.update).not.toHaveBeenCalled()
        expect(api.create).not.toHaveBeenCalled()
    })

    it.each(['create', 'edit'] as const)('closes %s when the permission tree fails and allows reopening to retry', async (mode) => {
        api.detail.mockResolvedValue({ id: 2, name: 'Role 2', menu_list: [11] })
        api.menus.mockRejectedValueOnce(new Error('Menu request failed'))
            .mockResolvedValue([{ id: 11, type: 2, status: 1, is_auth: 1 }])
        const form = setup()
        let checked: number[] = []
        form.menuTreeRef.value = { setCheckedKeys: (keys: number[]) => { checked = [...keys] }, getCheckedKeys: () => checked, getHalfCheckedKeys: () => [] }
        const open = () => mode === 'edit' ? form.openEditDrawer({ id: 2 }, 0) : form.openCreateDrawer()

        await open()
        await form.editConfirmSubmit()
        expect(api.create).not.toHaveBeenCalled()
        expect(api.update).not.toHaveBeenCalled()
        expect(form.showDrawer.value).toBe(false)
        expect(form.detailLoading.value).toBe(false)
        expect(form.formDataRef.value!.setInitialValues).not.toHaveBeenCalled()
        if (mode === 'edit') expect(form.formData.menu_list).toEqual([11])

        await open()
        expect(api.menus).toHaveBeenCalledTimes(2)
        expect(form.showDrawer.value).toBe(true)
        expect(form.formDataRef.value!.setInitialValues).toHaveBeenCalledTimes(1)
        await form.editConfirmSubmit()
        expect(mode === 'edit' ? api.update : api.create).toHaveBeenCalledTimes(1)
        if (mode === 'edit') expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ id: 2, menu_list: [11] }))
    })

    it('ignores a failed menu request from a closed editor after the next editor is ready', async () => {
        const oldMenus = deferred<never>()
        api.menus.mockReturnValueOnce(oldMenus.promise)
        api.detail.mockResolvedValue({ id: 2, name: 'Role 2' })
        const form = setup()
        const first = form.openCreateDrawer()
        form.showDrawer.value = false
        await form.openEditDrawer({ id: 2 }, 0)
        oldMenus.reject(new Error('Previous menu request failed'))
        await first

        expect(form.showDrawer.value).toBe(true)
        await form.editConfirmSubmit()
        expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
    })

    it('does not let old menu data or loading completion replace the current pending request', async () => {
        const oldMenus = deferred<object[]>(), currentMenus = deferred<object[]>()
        api.menus.mockReturnValueOnce(oldMenus.promise).mockReturnValueOnce(currentMenus.promise)
        api.detail.mockResolvedValue({ id: 2, name: 'Role 2', menu_list: [22] })
        const form = setup()
        const first = form.openCreateDrawer()
        form.showDrawer.value = false
        const second = form.openEditDrawer({ id: 2 }, 0)
        await flushPromises()
        oldMenus.resolve([{ id: 11, type: 2, status: 1, is_auth: 1 }])
        await first
        expect(form.menuTreeData.value).toEqual([])
        expect(form.menuTreeLoading.value).toBe(true)
        expect(form.detailLoading.value).toBe(true)
        expect(form.menuTreeRef.value.setCheckedKeys).not.toHaveBeenCalled()
        await form.editConfirmSubmit()
        expect(api.update).not.toHaveBeenCalled()

        currentMenus.resolve([{ id: 22, type: 2, status: 1, is_auth: 1 }])
        await second
        expect(form.menuTreeData.value.map((menu) => menu.id)).toEqual([22])
        expect(form.menuTreeLoading.value).toBe(false)
        expect(form.detailLoading.value).toBe(false)
        expect(form.menuTreeRef.value.setCheckedKeys).toHaveBeenLastCalledWith([22], false)
    })

})
