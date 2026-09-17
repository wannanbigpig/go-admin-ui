import { describe, expect, it } from 'vitest'
import { isManualTodo, sortActiveTodos } from './service'
import type { TodoItem } from '@/types/todo'

const todo = (overrides: Partial<TodoItem>): TodoItem => ({
    id: 1,
    title: 'todo',
    priority: 'normal',
    status: 'pending',
    ...overrides,
})

describe('modules/todo/service', () => {
    it('keeps only active todos and sorts overdue, priority, then due date', () => {
        const result = sortActiveTodos([
            todo({ id: 1, status: 'completed', is_overdue: true }),
            todo({ id: 2, priority: 'urgent', due_at: '2026-09-20 10:00:00' }),
            todo({ id: 3, priority: 'low', is_overdue: true, due_at: '2026-09-16 10:00:00' }),
            todo({ id: 4, priority: 'high', is_overdue: true, status: 'processing', due_at: '2026-09-16 11:00:00' }),
            todo({ id: 5, priority: 'normal', due_at: '2026-09-18 10:00:00' }),
        ])

        expect(result.map((item) => item.id)).toEqual([4, 3, 2, 5])
    })

    it('treats only manual or missing sources as editable', () => {
        expect(isManualTodo(todo({ source_type: 'manual' }))).toBe(true)
        expect(isManualTodo(todo({ source: 'business' }))).toBe(false)
        expect(isManualTodo(todo({}))).toBe(true)
    })
})
