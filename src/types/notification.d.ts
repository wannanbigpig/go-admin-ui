export type NotificationLevel = 'success' | 'warning' | 'error' | 'info'

export type NotificationSource = 'websocket' | 'export'

export type NotificationConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disabled' | 'error'

export interface AppNotification {
    id: string
    title: string
    message: string
    level: NotificationLevel
    source: NotificationSource
    read: boolean
    created_at: string
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

export interface NotificationReadPayload {
    id: string | number
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
