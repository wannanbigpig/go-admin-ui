import { get, post } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { TodoGroup, TodoItem, TodoListQuery, TodoReminderPreference, TodoReminderPreferencePayload, TodoStatus, TodoSummary, TodoWritePayload } from '@/types/todo'

export const getTodoList = (params?: TodoListQuery) => get<PageData<TodoItem> & { summary?: TodoSummary | null }>('/v1/todo/list', params as Record<string, unknown>)
export const getTodoSummary = (groupID?: number) =>
    groupID === undefined ? get<TodoSummary>('/v1/todo/summary') : get<TodoSummary>('/v1/todo/summary', { group_id: groupID })
export const getTodoGroups = () => get<{ groups: TodoGroup[] }>('/v1/todo/groups')
export const createTodoGroup = (name: string) => post<TodoGroup>('/v1/todo/group/create', { name })
export const renameTodoGroup = (id: number, name: string) => post<TodoGroup>('/v1/todo/group/rename', { id, name })
export const deleteTodoGroup = (id: number) => post<unknown>('/v1/todo/group/delete', { id })
export const moveTodoGroup = (id: number | string, group_id: number) => post<TodoItem>('/v1/todo/group/move', { id, group_id })
export const getTodoReminderPreference = () => get<TodoReminderPreference>('/v1/todo/reminder-preference')
export const updateTodoReminderPreference = (data: TodoReminderPreferencePayload) => post<TodoReminderPreference>('/v1/todo/reminder-preference', data)
export const createTodo = (data: TodoWritePayload) => post<TodoItem>('/v1/todo/create', data)
export const updateTodo = (data: TodoWritePayload & { id: number | string }) => post<TodoItem>('/v1/todo/update', data)
export const updateTodoStatus = (data: { id: number | string; status: TodoStatus }) => post<TodoItem>('/v1/todo/status', data)
export const deleteTodo = (data: { id: number | string }) => post<unknown>('/v1/todo/delete', data)
