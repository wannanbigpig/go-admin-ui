import * as todoApi from '@/api/todo'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import type { TodoItem, TodoListQuery, TodoReminderPreference, TodoReminderPreferencePayload, TodoStatus, TodoSummary, TodoWritePayload } from '@/types/todo'

const EMPTY_SUMMARY: TodoSummary = { pending: 0, processing: 0, overdue: 0, due_today: 0 }

export const fetchTodoList = async (params?: TodoListQuery) => normalizeListData<TodoItem>(await todoApi.getTodoList(params))
export const fetchTodoSummary = async () => normalizeDetailData<TodoSummary>(await todoApi.getTodoSummary(), EMPTY_SUMMARY)
export const fetchTodoReminderPreference = async () =>
    normalizeDetailData<TodoReminderPreference>(await todoApi.getTodoReminderPreference(), {
        in_app_enabled: true,
        sms_enabled: false,
        sms_available: false,
    })
export const submitTodoReminderPreference = (data: TodoReminderPreferencePayload) => todoApi.updateTodoReminderPreference(data)
export const submitTodoCreate = (data: TodoWritePayload) => todoApi.createTodo(data)
export const submitTodoUpdate = (data: TodoWritePayload & { id: number | string }) => todoApi.updateTodo(data)
export const submitTodoStatus = (id: number | string, status: TodoStatus) => todoApi.updateTodoStatus({ id, status })
export const submitTodoDelete = (id: number | string) => todoApi.deleteTodo({ id })

export const isManualTodo = (todo: Pick<TodoItem, 'source' | 'source_type'>) => (todo.source_type || todo.source || 'manual') === 'manual'

export const isTodoOverdue = (todo: Pick<TodoItem, 'status' | 'due_at' | 'is_overdue'>) => {
    if (typeof todo.is_overdue === 'boolean') return todo.is_overdue
    const dueTime = todo.due_at ? new Date(todo.due_at.replace(' ', 'T')).getTime() : Number.NaN
    return Boolean((todo.status === 'pending' || todo.status === 'processing') && Number.isFinite(dueTime) && dueTime < Date.now())
}

export const sortActiveTodos = (items: TodoItem[]) =>
    items
        .filter((item) => item.status === 'pending' || item.status === 'processing')
        .sort((left, right) => {
            if (isTodoOverdue(left) !== isTodoOverdue(right)) return isTodoOverdue(left) ? -1 : 1
            const priorityWeight = { urgent: 0, high: 1, normal: 2, low: 3 }
            const priorityResult = priorityWeight[left.priority] - priorityWeight[right.priority]
            if (priorityResult !== 0) return priorityResult
            const leftTime = left.due_at ? new Date(left.due_at.replace(' ', 'T')).getTime() : Number.POSITIVE_INFINITY
            const rightTime = right.due_at ? new Date(right.due_at.replace(' ', 'T')).getTime() : Number.POSITIVE_INFINITY
            return leftTime - rightTime
        })
