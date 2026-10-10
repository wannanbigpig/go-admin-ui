import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDepartmentTreeList } from './useDepartmentTreeList'
import type { Department } from '@/types/department'
const fetchList = vi.hoisted(() => vi.fn())
vi.mock('./service', () => ({ fetchDepartmentList: fetchList }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))
const deferred = () => {
    let resolve!: (value: Department[]) => void
    let reject!: (error: Error) => void
    const promise = new Promise<Department[]>((done, fail) => { resolve = done; reject = fail })
    return { promise, resolve, reject }
}
const dept = (id: number, pid: number, children?: Department[]) => ({ id, pid, name: `Department ${id}`, children } as Department)
describe('department list and descendants', () => {
    beforeEach(() => vi.clearAllMocks())
    it('collects all nested descendants from the real tree response', async () => {
        fetchList.mockResolvedValue([dept(1, 0, [dept(2, 1, [dept(3, 2)])]), dept(4, 0)])
        const page = useDepartmentTreeList(null); await page.getList()
        expect(page.getChildrenIds(1)).toEqual([1, 2, 3])
        expect(page.getChildrenIds('2').map(String)).toEqual(['2', '3'])
        expect(page.departmentOptions.value.map((item) => item.id)).toEqual([1, 2, 3, 4])
    })
    it('supports filtered flat responses too', async () => {
        fetchList.mockResolvedValue([dept(2, 1), dept(3, 2)])
        const page = useDepartmentTreeList(null); await page.getList()
        expect(page.getChildrenIds(2)).toEqual([2, 3])
    })
    it('keeps the newest search data and loading state when requests finish out of order', async () => {
        const old = deferred(), current = deferred(); fetchList.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
        const page = useDepartmentTreeList(null); page.queryWhere.name = 'old'; const first = page.getList()
        page.queryWhere.name = 'current'; const second = page.getList()
        old.resolve([dept(1, 0)]); await first
        expect(page.loading.value).toBe(true)
        expect(page.departmentList.value).toEqual([])
        current.resolve([dept(2, 0)]); await second
        expect(page.departmentList.value.map((item) => item.id)).toEqual([2])
        expect(fetchList.mock.calls[0]?.[0]).toEqual({ name: 'old' })
    })
    it('a failed latest request clears stale rows and options', async () => {
        fetchList.mockResolvedValueOnce([dept(1, 0)]).mockRejectedValueOnce(new Error('unavailable'))
        const page = useDepartmentTreeList(null); await page.getList(); await page.getList()
        expect(page.departmentList.value).toEqual([])
        expect(page.departmentOptions.value).toEqual([])
        expect(page.loading.value).toBe(false)
    })
    it('an obsolete failure cannot clear a newer successful search', async () => {
        const old = deferred(), current = deferred(); fetchList.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
        const page = useDepartmentTreeList(null); const first = page.getList(); const second = page.getList()
        current.resolve([dept(2, 0)]); await second
        old.reject(new Error('obsolete request')); await first
        expect(page.departmentList.value.map((item) => item.id)).toEqual([2])
        expect(page.departmentOptions.value.map((item) => item.id)).toEqual([2])
        expect(page.loading.value).toBe(false)
    })

})
