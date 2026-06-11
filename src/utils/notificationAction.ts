export function normalizeNotificationActionUrl(value?: string): string | undefined {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed.startsWith('/')) return undefined
    if (trimmed.startsWith('//')) return undefined
    if (trimmed.includes('\\')) return undefined
    return trimmed
}
