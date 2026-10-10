import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import { ElForm, ElFormItem, ElInput } from 'element-plus'
import { useDepartmentForm } from './useDepartmentForm'
import { useAdminUserForm } from '@/modules/adminUser/useAdminUserForm'
import type { Department } from '@/types/department'
const api = vi.hoisted(() => ({ department: vi.fn(), admin: vi.fn() }))
vi.mock('./service', () => ({ fetchDepartmentDetail: api.department, createDepartmentItem: vi.fn(), updateDepartmentItem: vi.fn() }))
vi.mock('@/modules/adminUser/service', () => ({ fetchAdminUserDetail: api.admin, createAdminUserItem: vi.fn(), updateAdminUserItem: vi.fn() }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))

const setups = [
    {
        name: 'department',
        create: () => {
            const form = useDepartmentForm({ departmentOptions: ref([]), getChildrenIds: () => [], refreshList: vi.fn() })
            return { form, read: () => form.formData.name, change: (value: string) => { form.formData.name = value }, field: 'name', open: (id?: number) => form.openEditDrawer(id ? 2 : 1, id ? { id } as Department : null, 0) }
        },
    },
    {
        name: 'adminUser',
        create: () => {
            const form = useAdminUserForm({ refreshList: vi.fn() })
            return { form, read: () => form.formData.nickname, change: (value: string) => { form.formData.nickname = value }, field: 'nickname', open: (id?: number) => form.openEditDrawer(id ? 2 : 1, id ? { id } : undefined, 0) }
        },
    },
]
for (const { name, create } of setups) {
    describe(`${name} reset baseline`, () => {
        beforeEach(() => {
            vi.clearAllMocks()
            api.department.mockImplementation((id: number) => Promise.resolve({ id, name: `Saved ${id}`, pid: 0, sort: 100 }))
            api.admin.mockImplementation((id: number) => Promise.resolve({ id, nickname: `Saved ${id}`, username: `user${id}`, dept_ids: [id] }))
        })
        it('resets to each loaded detail, refreshes on same-row reopen, and clears for create', async () => {
            const { form, read, change, field, open } = create()
            const wrapper = mount({ setup: () => () => h(ElForm, { ref: form.formDataRef, model: form.formData }, {
                default: () => h(ElFormItem, { prop: field }, { default: () => h(ElInput, { modelValue: read() }) }),
            }) })
            for (const id of [2, 3, 3]) {
                await open(id)
                expect(read()).toBe(`Saved ${id}`)
                change('Unsaved change'); await nextTick()
                form.formDataRef.value!.resetFields(); await nextTick()
                expect(read()).toBe(`Saved ${id}`)
                form.showDrawer.value = false
            }
            await open(); change('New draft'); form.formDataRef.value!.resetFields(); await nextTick()
            expect(read()).toBe('')
            wrapper.unmount()
        })
    })
}

it('a new administrator does not inherit a mutated initial department array', async () => {
    const form = useAdminUserForm({ refreshList: vi.fn() })
    await form.openEditDrawer(1)
    form.formData.dept_ids!.push(7)
    await form.openEditDrawer(1)
    expect(form.formData.dept_ids).toEqual([])
})
