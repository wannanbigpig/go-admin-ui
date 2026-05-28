/**
 * 标准化环境变量值：去除首尾空白，非字符串返回空字符串
 */
export const normalizeEnvValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/**
 * 解析 API 请求 baseURL
 * - 开发环境默认走同源代理（/admin），避免浏览器跨域限制
 * - 生产环境按 VITE_BASE_URL + VITE_BASE_API 组合
 */
export const resolveBaseURL = (): string => {
    const apiPrefixRaw = normalizeEnvValue(import.meta.env.VITE_BASE_API)
    const apiPrefix = apiPrefixRaw ? (apiPrefixRaw.startsWith('/') ? apiPrefixRaw : `/${apiPrefixRaw}`) : '/admin'

    const useProxyInDev = import.meta.env.DEV && normalizeEnvValue(import.meta.env.VITE_USE_PROXY) !== 'false'
    if (useProxyInDev) {
        return apiPrefix
    }

    const baseHost = normalizeEnvValue(import.meta.env.VITE_BASE_URL).replace(/\/+$/, '')
    if (!baseHost) {
        return apiPrefix
    }

    return `${baseHost}${apiPrefix}`
}
