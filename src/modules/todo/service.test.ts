import { afterEach, describe, expect, it, vi } from 'vitest'
import * as todoApi from '@/api/todo'
import { fetchTodoListWithSummary, isManualTodo, isTodoPriority, isTodoStatus, sortActiveTodos } from './service'
import type { TodoItem } from '@/types/todo'

const todo = (overrides: Partial<TodoItem>): TodoItem => ({
    id: 1,
    title: 'todo',
    priority: 'normal',
    status: 'pending',
    ...overrides,
})

describe('modules/todo/service', () => {
    afterEach(() => vi.restoreAllMocks())

    it('一次列表请求同时取得分页和分组汇总', async () => {
        const summary = { total: 3, pending: 2, processing: 1, completed: 0, canceled: 0, overdue: 1, due_today: 0 }
        const getList = vi.spyOn(todoApi, 'getTodoList').mockResolvedValue({ list: [todo({})], total: 1, summary })
        const getSummary = vi.spyOn(todoApi, 'getTodoSummary')

        const result = await fetchTodoListWithSummary({ group_id: 7, status: 'pending' })

        expect(getList).toHaveBeenCalledOnce()
        expect(getList).toHaveBeenCalledWith({ group_id: 7, status: 'pending' })
        expect(getSummary).not.toHaveBeenCalled()
        expect(result).toMatchObject({ total: 1, summary })
    })

    it('旧版列表缺少汇总时按当前分组补查一次', async () => {
        const summary = { total: 1, pending: 1, processing: 0, completed: 0, canceled: 0, overdue: 0, due_today: 0 }
        vi.spyOn(todoApi, 'getTodoList').mockResolvedValue({ list: [], total: 0 })
        const getSummary = vi.spyOn(todoApi, 'getTodoSummary').mockResolvedValue(summary)

        const result = await fetchTodoListWithSummary({ group_id: 0 })

        expect(getSummary).toHaveBeenCalledOnce()
        expect(getSummary).toHaveBeenCalledWith(0)
        expect(result.summary).toEqual(summary)
    })

    it('only accepts known priority and status values for translated labels', () => {
        expect(isTodoPriority('normal')).toBe(true)
        expect(isTodoPriority(undefined)).toBe(false)
        expect(isTodoPriority('unknown')).toBe(false)
        expect(isTodoStatus('pending')).toBe(true)
        expect(isTodoStatus(undefined)).toBe(false)
        expect(isTodoStatus('unknown')).toBe(false)
    })

    it('keeps only active todos and sorts overdue, priority, then due date', () => {
        const result = sortActiveTodos([
            todo({ id: 1, status: 'completed', is_overdue: true }),
            todo({ id: 2, priority: 'urgent', is_overdue: false, due_at: '2026-09-20 10:00:00' }),
            todo({ id: 3, priority: 'low', is_overdue: true, due_at: '2026-09-16 10:00:00' }),
            todo({ id: 4, priority: 'high', is_overdue: true, status: 'processing', due_at: '2026-09-16 11:00:00' }),
            todo({ id: 5, priority: 'normal', is_overdue: false, due_at: '2026-09-18 10:00:00' }),
        ])

        expect(result.map((item) => item.id)).toEqual([4, 3, 2, 5])
    })

    it('treats only manual or missing sources as editable', () => {
        expect(isManualTodo(todo({ source_type: 'manual' }))).toBe(true)
        expect(isManualTodo(todo({ source: 'business' }))).toBe(false)
        expect(isManualTodo(todo({}))).toBe(true)
    })
})
