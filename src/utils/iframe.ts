const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

function currentOrigin() {
    return globalThis.location?.origin || 'http://localhost'
}

function normalizeOrigin(value: string) {
    try {
        return new URL(value).origin
    } catch {
        return ''
    }
}

function allowedOrigins() {
    return String(import.meta.env.VITE_IFRAME_ALLOWED_ORIGINS || '')
        .split(',')
        .map((item) => normalizeOrigin(item.trim()))
        .filter(Boolean)
}

export function normalizeIframeURL(raw: unknown, base = currentOrigin()) {
    if (typeof raw !== 'string' || !raw.trim()) return ''

    try {
        const url = new URL(raw, base)
        if (!HTTP_PROTOCOLS.has(url.protocol)) return ''

        const baseOrigin = new URL(base).origin
        if (url.origin === baseOrigin) return url.href

        return allowedOrigins().includes(url.origin) ? url.href : ''
    } catch {
        return ''
    }
}
