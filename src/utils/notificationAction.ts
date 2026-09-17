export function normalizeInternalActionUrl(value?: string): string | undefined {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed.startsWith('/')) return undefined
    if (trimmed.startsWith('//')) return undefined
    if (trimmed.includes('\\')) return undefined
    return trimmed
}

export const normalizeNotificationActionUrl = normalizeInternalActionUrl
