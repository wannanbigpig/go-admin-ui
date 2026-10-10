export function normalizeRedirectPath(redirect: unknown, fallback = '/') {
    if (typeof redirect !== 'string') return fallback
    const trimmed = redirect.trim()
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
    if (trimmed === '/login' || trimmed.startsWith('/login?') || trimmed.startsWith('/login/')) return fallback
    return trimmed
}
