import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/request', () => mocks)

import { createTodo, deleteTodo, getTodoList, getTodoSummary, updateTodo, updateTodoStatus } from './todo'

describe('api/todo', () => {
    beforeEach(() => vi.clearAllMocks())

    it('uses the agreed personal todo endpoints and payloads', async () => {
        const payload = { title: 'Review release', priority: 'high' as const }
        await getTodoList({ status: 'pending', due_scope: 'overdue' })
        await getTodoSummary()
        await createTodo(payload)
        await updateTodo({ id: 1, ...payload })
        await updateTodoStatus({ id: 1, status: 'completed' })
        await deleteTodo({ id: 1 })

        expect(mocks.get).toHaveBeenNthCalledWith(1, '/v1/todo/list', { status: 'pending', due_scope: 'overdue' })
        expect(mocks.get).toHaveBeenNthCalledWith(2, '/v1/todo/summary')
        expect(mocks.post).toHaveBeenNthCalledWith(1, '/v1/todo/create', payload)
        expect(mocks.post).toHaveBeenNthCalledWith(2, '/v1/todo/update', { id: 1, ...payload })
        expect(mocks.post).toHaveBeenNthCalledWith(3, '/v1/todo/status', { id: 1, status: 'completed' })
        expect(mocks.post).toHaveBeenNthCalledWith(4, '/v1/todo/delete', { id: 1 })
    })
})
