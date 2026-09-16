const AUTH_EXPIRED_CODES = new Set([401, 20048])

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object'

const hasAuthExpiredCode = (value: unknown) => {
    if (!isRecord(value)) return false
    return typeof value.code === 'number' && AUTH_EXPIRED_CODES.has(value.code)
}

/** 仅识别后端明确返回的登录态失效，网络错误、超时和 5xx 不应清理本地认证状态。 */
export const isAuthExpiredError = (error: unknown) => {
    if (!isRecord(error)) return false
    if (hasAuthExpiredCode(error)) return true

    const response = error.response
    if (!isRecord(response)) return false
    if (response.status === 401) return true
    return hasAuthExpiredCode(response.data)
}
