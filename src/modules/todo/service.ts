import * as todoApi from '@/api/todo'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import { Logger } from '@/utils/logger'
import type { TodoGroup, TodoItem, TodoListQuery, TodoPriority, TodoReminderPreference, TodoReminderPreferencePayload, TodoStatus, TodoSummary, TodoWritePayload } from '@/types/todo'

const EMPTY_SUMMARY: TodoSummary = { total: 0, pending: 0, processing: 0, completed: 0, canceled: 0, overdue: 0, due_today: 0 }
const knownPriorities = new Set<TodoPriority>(['low', 'normal', 'high', 'urgent'])
const knownStatuses = new Set<TodoStatus>(['pending', 'processing', 'completed', 'canceled'])

export const isTodoPriority = (value: unknown): value is TodoPriority => typeof value === 'string' && knownPriorities.has(value as TodoPriority)
export const isTodoStatus = (value: unknown): value is TodoStatus => typeof value === 'string' && knownStatuses.has(value as TodoStatus)

export const fetchTodoList = async (params?: TodoListQuery) => {
    const response = await todoApi.getTodoList(params)
    return { ...normalizeListData<TodoItem>(response), summary: response.summary }
}
export const fetchTodoSummary = async (groupID?: number) => normalizeDetailData<TodoSummary>(await todoApi.getTodoSummary(groupID), EMPTY_SUMMARY)
export const fetchTodoListWithSummary = async (params?: TodoListQuery) => {
    const result = await fetchTodoList(params)
    if (result.summary !== undefined) return result
    // 兼容先更新前端、后更新后端的短暂窗口。
    try {
        return { ...result, summary: await fetchTodoSummary(params?.group_id) }
    } catch (error) {
        Logger.error('获取待办概览失败:', error)
        return { ...result, summary: null }
    }
}
export const fetchTodoGroups = async () => normalizeDetailData<{ groups: TodoGroup[] }>(await todoApi.getTodoGroups(), { groups: [] }).groups
export const submitTodoGroupCreate = (name: string) => todoApi.createTodoGroup(name)
export const submitTodoGroupRename = (id: number, name: string) => todoApi.renameTodoGroup(id, name)
export const submitTodoGroupDelete = (id: number) => todoApi.deleteTodoGroup(id)
export const submitTodoGroupMove = (id: number | string, groupID: number) => todoApi.moveTodoGroup(id, groupID)
export const fetchTodoReminderPreference = async () =>
    normalizeDetailData<TodoReminderPreference>(await todoApi.getTodoReminderPreference(), {
        in_app_enabled: true,
        sms_enabled: false,
        sms_available: false,
        lead_minutes: 1440,
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
