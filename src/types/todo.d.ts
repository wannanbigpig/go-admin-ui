import type { WithId } from './common'

export type TodoPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TodoStatus = 'pending' | 'processing' | 'completed' | 'canceled'
export type TodoDueScope = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due'

export interface TodoItem extends WithId {
    title: string
    description?: string
    priority: TodoPriority
    status: TodoStatus
    due_at?: string | null
    source?: string
    source_type?: string
    source_key?: string
    action_url?: string
    is_overdue?: boolean
    can_edit?: boolean
    can_delete?: boolean
    can_update_status?: boolean
    created_at?: string
    updated_at?: string
}

export interface TodoListQuery {
    page?: number
    per_page?: number
    keyword?: string
    status?: TodoStatus | string
    due_scope?: TodoDueScope | string
    order_by?: string
}

export interface TodoSummary {
    pending: number
    processing: number
    overdue: number
    due_today: number
}

export interface TodoWritePayload {
    title: string
    description?: string
    priority: TodoPriority
    due_at?: string
}
