export function normalizeRedirectPath(redirect: unknown, fallback = '/') {
    if (typeof redirect !== 'string') return fallback
    if (!redirect.startsWith('/') || redirect.startsWith('//')) return fallback
    return redirect
}
