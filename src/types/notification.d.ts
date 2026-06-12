export type NotificationLevel = 'success' | 'warning' | 'error' | 'info'

export type NotificationSource = 'websocket' | 'export'

export type NotificationConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disabled' | 'error'

export type NotificationAudienceType = 'all' | 'user_ids'

export interface AppNotification {
    id: string
    title: string
    message: string
    level: NotificationLevel
    source: NotificationSource
    read: boolean
    created_at: string
    category?: string
    topic?: string
    payload?: Record<string, unknown>
    read_at?: string | null
    updated_at?: string
    action_url?: string
    action_label?: string
    meta?: Record<string, unknown>
}

export interface NotificationListQuery {
    page?: number
    per_page?: number
}

export interface NotificationUnreadCount {
    unread_count: number
    count?: number
}

export interface WsTicketResult {
    ticket: string
}

export interface NotificationReadPayload {
    id: string | number
}

export interface NotificationSendPayload {
    title: string
    message: string
    category?: string
    action_url?: string
    action_label?: string
    audience_type: NotificationAudienceType
    user_ids?: number[]
}

export interface NotificationSendResult {
    task_id?: number | string
    batch_id?: string
    total?: number
    success?: number
    failed?: number
    message?: string
}

export interface NotificationSocketMessage extends Partial<AppNotification> {
    type?: string
    event?: string
    category?: string
    topic?: string
    status?: string
    subject?: string
    content?: string
    body?: string
    severity?: string
    message_id?: string | number
    unread_count?: number
    is_read?: boolean
    action_url?: string
    action_label?: string
    message?: Record<string, unknown> | null
    data?: Record<string, unknown> | NotificationSocketMessage[] | null
    list?: NotificationSocketMessage[]
}
