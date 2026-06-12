export const API_CACHE_PREFIX = {
    MENU_LIST: 'menu:list:',
    ROLE_LIST: 'role:list:',
    ROLE_OPTIONS: 'role:options:',
    API_OPTIONS: 'api:options:',
    DEPARTMENT_LIST: 'dept:list:',
} as const

export function buildApiCacheKey(prefix: string, params?: unknown) {
    return `${prefix}${JSON.stringify(params || {})}`
}
