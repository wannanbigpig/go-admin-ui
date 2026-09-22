import { get, post } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { TodoItem, TodoListQuery, TodoReminderPreference, TodoReminderPreferencePayload, TodoStatus, TodoSummary, TodoWritePayload } from '@/types/todo'

export const getTodoList = (params?: TodoListQuery) => get<PageData<TodoItem>>('/v1/todo/list', params as Record<string, unknown>)
export const getTodoSummary = () => get<TodoSummary>('/v1/todo/summary')
export const getTodoReminderPreference = () => get<TodoReminderPreference>('/v1/todo/reminder-preference')
export const updateTodoReminderPreference = (data: TodoReminderPreferencePayload) => post<TodoReminderPreference>('/v1/todo/reminder-preference', data)
export const createTodo = (data: TodoWritePayload) => post<TodoItem>('/v1/todo/create', data)
export const updateTodo = (data: TodoWritePayload & { id: number | string }) => post<TodoItem>('/v1/todo/update', data)
export const updateTodoStatus = (data: { id: number | string; status: TodoStatus }) => post<TodoItem>('/v1/todo/status', data)
export const deleteTodo = (data: { id: number | string }) => post<unknown>('/v1/todo/delete', data)
