import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useSettingStore } from '@/stores/setting'
import type { ApiResponse } from '@/types/common'
import { MESSAGE_ERROR_DURATION, REQUEST_TIMEOUT } from '@/modules/shared/constants'
import { Logger } from '@/utils/logger'
import { DEFAULT_LOCALE, translate } from '@/locales'
import { resolveBaseURL } from '@/utils/env'

declare module 'axios' {
    interface AxiosRequestConfig {
        /** 401 处理模式：'credential' 表示登录凭证失败，'refresh' 表示刷新接口自身，'session' 表示会话失效（默认） */
        authErrorMode?: 'credential' | 'refresh' | 'session'
        /** 跳过 Authorization 头注入 */
        _skipAuth?: boolean
        /** 401 刷新后重放标记 */
        _retry?: boolean
    }
}

const LANGUAGE_HEADER = 'Accept-Language'
const REQUESTED_WITH_HEADER = 'X-Requested-With'
const REQUESTED_WITH_VALUE = 'XMLHttpRequest'
const REFRESH_TOKEN_INVALID_CODE = 20048

/**
 * 静默业务码：响应 code 命中后不弹 ElMessage，由业务侧自行处理。
 * - 11011：未配置/未启用的功能（不弹错误）
 */
export const SILENT_BUSINESS_CODES = [11011] as const

// ==================== 创建 axios 实例 ====================
/**
 * 创建 axios 实例
 * baseURL = VITE_BASE_URL + VITE_BASE_API
 */
const service = axios.create({
    baseURL: resolveBaseURL(),
    timeout: REQUEST_TIMEOUT,
    withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

const isJsonContentType = (contentType: unknown) => {
    return typeof contentType === 'string' && contentType.toLowerCase().includes('application/json')
}

const parseBlobJson = async (response: AxiosResponse<ApiResponse<unknown>>) => {
    const contentType = response.headers?.['content-type']
    if (!(response.data instanceof Blob) || !isJsonContentType(contentType)) {
        return null
    }
    try {
        return JSON.parse(await response.data.text()) as ApiResponse<unknown>
    } catch (error) {
        Logger.error('解析 Blob JSON 响应失败:', error)
        return null
    }
}

/**
 * 判断值是否为 `{ code, msg, data }` 形态的 API payload
 */
export const isApiPayload = (value: unknown): value is ApiResponse => {
    return value !== null && typeof value === 'object' && 'code' in value && 'msg' in value && typeof (value as Record<string, unknown>).code === 'number' && typeof (value as Record<string, unknown>).msg === 'string'
}

const getAxiosRequestConfig = (error: AxiosError): (AxiosRequestConfig & { silent?: boolean; silentCodes?: number[] }) | undefined => {
    return error.config as (AxiosRequestConfig & { silent?: boolean; silentCodes?: number[] }) | undefined
}

const shouldSuppressApiErrorMessage = (config: (AxiosRequestConfig & { silent?: boolean; silentCodes?: number[] }) | undefined, code: number) => {
    return Boolean(config?.silent || (Array.isArray(config?.silentCodes) && config.silentCodes.includes(code)) || (SILENT_BUSINESS_CODES as readonly number[]).includes(code))
}

const showApiErrorMessage = (payload: ApiResponse, config?: AxiosRequestConfig & { silent?: boolean; silentCodes?: number[] }) => {
    if (shouldSuppressApiErrorMessage(config, payload.code)) return
    ElMessage({
        message: payload.msg || translate('request.failed'),
        type: 'error',
    })
}

const isMockEnabled = () => {
    return import.meta.env.DEV && (import.meta.env.VITE_ENABLE_MOCK === 'true' || import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true')
}

const tryGetMock = async (url: string, method: string, dataOrParams: unknown) => {
    if (!isMockEnabled()) return { matched: false } as const

    try {
        const { getMockFallback } = await import('@/mock')
        return getMockFallback(url, method, dataOrParams)
    } catch (e) {
        Logger.error('[Mock] error loading mock module:', e)
    }

    return { matched: false } as const
}

const handleApiResponse = async (response: AxiosResponse<ApiResponse<unknown>>, authErrorMode: 'credential' | 'refresh' | 'session' = 'session') => {
    const code = response.data.code

    // 处理 401 未授权
    if (code === 401) {
        // credential 模式（登录请求）：不触发刷新和过期弹窗，直接拒绝
        if (authErrorMode === 'credential') {
            showApiErrorMessage(response.data, response.config as AxiosRequestConfig & { silent?: boolean; silentCodes?: number[] })
            return Promise.reject(response.data)
        }

        return retryAfterRefresh(response.config, response.data)
    }

    // 处理业务错误（code !== 0）
    if (code !== 0) {
        const config = response.config as AxiosRequestConfig & { silent?: boolean; silentCodes?: number[]; authErrorMode?: 'credential' | 'refresh' | 'session' }
        showApiErrorMessage(response.data, config)
        return Promise.reject(response.data)
    }

    // 返回业务数据，避免将 AxiosResponse 结构透传到业务层
    return response.data.data
}

const isRefreshRequest = (config?: AxiosRequestConfig) => {
    return config?.authErrorMode === 'refresh' || String(config?.url || '').includes('/auth/refresh')
}

const markSessionExpired = () => {
    const authStore = useAuthStore()
    authStore.resetAuthStore()
    authStore.handleTokenExpired()
}

const isRefreshAuthExpiredError = (error: unknown) => {
    if (error && typeof error === 'object') {
        const maybeAxios = error as AxiosError<ApiResponse<unknown>>
        if (maybeAxios.response?.status === 401) return true
        const responseData = maybeAxios.response?.data
        if (responseData && isApiPayload(responseData)) {
            return responseData.code === 401 || responseData.code === REFRESH_TOKEN_INVALID_CODE
        }
        if (isApiPayload(error)) {
            return error.code === 401 || error.code === REFRESH_TOKEN_INVALID_CODE
        }
    }
    return false
}

/**
 * access token 续期入口。
 *
 * 关键约束：
 * - 多个业务请求同时 401 时共享同一个 refreshPromise，避免并发轮换 refresh token。
 * - 只有后端明确返回认证失效（HTTP 401 / code=401 / RefreshTokenInvalid）才清登录态。
 * - 网络错误、超时、5xx 只让当前请求失败，保留本地状态，用户下次操作可重新尝试刷新。
 */
const refreshAccessTokenOnce = async () => {
    if (!refreshPromise) {
        const authStore = useAuthStore()
        refreshPromise = authStore
            .refreshAccessToken()
            .catch((error) => {
                if (isRefreshAuthExpiredError(error)) {
                    markSessionExpired()
                }
                throw error
            })
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

const retryAfterRefresh = async (config: AxiosRequestConfig | undefined, rejectPayload: unknown) => {
    if (!config) {
        markSessionExpired()
        return Promise.reject(rejectPayload)
    }
    if (config.authErrorMode === 'credential' || isRefreshRequest(config)) {
        return Promise.reject(rejectPayload)
    }
    if (config._retry) {
        markSessionExpired()
        return Promise.reject(rejectPayload)
    }

    const nextToken = await refreshAccessTokenOnce()
    // 用新 access token 覆盖原请求头并标记 _retry，防止重放后再次 401 形成递归刷新。
    const retryConfig = {
        ...config,
        _retry: true,
        headers: {
            ...(config.headers || {}),
            Authorization: `Bearer ${nextToken}`,
        },
    }
    return service.request(retryConfig)
}

// ==================== 请求拦截器 ====================
/**
 * 请求拦截器
 * - 自动添加 Authorization token
 * - 设置默认 Content-Type 为 application/json（FormData 除外）
 */
service.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()
        const settingStore = useSettingStore()
        config.headers = config.headers || {}
        // 后端不传语言头时默认中文，这里显式携带当前前端语言。
        config.headers[LANGUAGE_HEADER] = settingStore.locale || DEFAULT_LOCALE
        config.headers[REQUESTED_WITH_HEADER] = REQUESTED_WITH_VALUE
        // 添加认证 token（_skipAuth 标记的请求跳过）
        if (!config._skipAuth) {
            if (authStore.token) {
                config.headers['Authorization'] = `Bearer ${authStore.token}`
            } else {
                delete config.headers['Authorization']
            }
        } else {
            delete config.headers['Authorization']
        }
        // 仅在没有手动设置时才默认使用 application/json
        if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json'
        }
        return config
    },
    (error) => {
        Logger.error('请求拦截器错误:', error)
        return Promise.reject(error)
    }
)

// ==================== 响应拦截器 ====================
/**
 * 响应拦截器
 * - access token 失效后调用 /auth/refresh，并用新 token 重放原请求
 * - 统一处理业务错误码
 * - 处理网络错误
 */
service.interceptors.response.use(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (response: AxiosResponse<ApiResponse<unknown>>): Promise<any> => {
        // 204 No Content
        if (response.status === 204) {
            return undefined
        }

        const authErrorMode = (response.config as AxiosRequestConfig & { authErrorMode?: 'credential' | 'refresh' | 'session' })?.authErrorMode ?? 'session'

        if (response.config?.responseType === 'blob' || response.data instanceof Blob) {
            const jsonPayload = await parseBlobJson(response)
            if (jsonPayload) {
                return handleApiResponse({ ...response, data: jsonPayload }, authErrorMode)
            }
            return response.data
        }

        return handleApiResponse(response, authErrorMode)
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
        // 401 优先处理：无论响应体格式（JSON/HTML/空），都触发过期处理。
        // 反向代理、网关可能返回非 JSON 的 401，必须在 isApiPayload 之前拦截。
        if (error.response?.status === 401) {
            const config = getAxiosRequestConfig(error)
            const authErrorMode = config?.authErrorMode ?? 'session'
            if (error.response.data && isApiPayload(error.response.data)) {
                const syntheticResponse = {
                    ...error.response,
                    data: error.response.data,
                    config: error.config || {},
                    headers: error.response.headers || {},
                } as AxiosResponse<ApiResponse<unknown>>
                return handleApiResponse(syntheticResponse, authErrorMode) as Promise<never>
            }
            if (authErrorMode === 'credential') {
                // 登录凭证失败：不触发过期弹窗，直接拒绝
                return Promise.reject(error.response?.data ?? error)
            }
            return retryAfterRefresh(config, error.response?.data ?? error) as Promise<never>
        }

        // 如果响应体是 API payload（{ code, msg, data }），走 handleApiResponse 统一处理
        if (error.response?.data && isApiPayload(error.response.data)) {
            const config = getAxiosRequestConfig(error)
            const authErrorMode = config?.authErrorMode ?? 'session'
            const syntheticResponse = {
                ...error.response,
                data: error.response.data,
                config: error.config || {},
                headers: error.response.headers || {},
            } as AxiosResponse<ApiResponse<unknown>>
            return handleApiResponse(syntheticResponse, authErrorMode) as Promise<never>
        }

        // 处理网络错误
        if (!error.response && (error.message === 'Network Error' || error.message.includes('ECONNREFUSED'))) {
            ElMessage({
                message: translate('request.networkError'),
                type: 'error',
                duration: MESSAGE_ERROR_DURATION,
            })
            return Promise.reject(error)
        }

        // 处理请求超时
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            ElMessage({
                message: translate('request.timeout'),
                type: 'error',
                duration: MESSAGE_ERROR_DURATION,
            })
            return Promise.reject(error)
        }

        // 处理其他错误（非 API payload）
        const data = error.response?.data
        let responseMsg: string | undefined
        if (typeof data === 'string') {
            responseMsg = data
        } else if (data && typeof data === 'object' && 'msg' in data) {
            const msgVal = (data as unknown as Record<string, unknown>).msg
            if (typeof msgVal === 'string') {
                responseMsg = msgVal
            }
        }
        const errorMessage = responseMsg || error.message || translate('request.failed')
        ElMessage({
            message: errorMessage,
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })

        return Promise.reject(error)
    }
)

// ==================== 请求方法封装 ====================
/**
 * 通用请求方法
 * @param {string} url - 请求地址
 * @param {string} method - HTTP 方法（GET、POST、PUT、DELETE 等）
 * @param {AxiosRequestConfig} options - 请求配置选项（data、params、headers 等）
 * @returns {Promise<T>} 业务数据 Promise (ApiResponse.data)
 */
export async function request<T = unknown>(url: string, method: string, options: AxiosRequestConfig = {}): Promise<T> {
    if (isMockEnabled()) {
        const targetMethod = (method || 'GET').toUpperCase()
        const fallback = await tryGetMock(url, targetMethod, options.data ?? options.params)
        if (fallback.matched) {
            if ('error' in fallback && fallback.error) {
                const mockErr: ApiResponse = {
                    code: 500,
                    msg: `Mock handler 执行出错: [${targetMethod}] ${url} - ${fallback.error.message}`,
                    data: null,
                }
                ElMessage({
                    message: mockErr.msg,
                    type: 'error',
                    duration: MESSAGE_ERROR_DURATION,
                })
                return Promise.reject(mockErr)
            }
            if ('response' in fallback && fallback.response) {
                if (options.responseType === 'blob') {
                    const resData = fallback.response.data
                    if (resData instanceof Blob) {
                        return resData as unknown as T
                    }
                    return new Blob([JSON.stringify(resData)], { type: 'application/json' }) as unknown as T
                }
                return fallback.response.data as T
            }
        }
        const mockErr: ApiResponse = {
            code: 404,
            msg: `未找到 Mock 接口匹配规则: [${targetMethod}] ${url}`,
            data: null,
        }
        ElMessage({
            message: mockErr.msg,
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })
        return Promise.reject(mockErr)
    }

    return service.request<ApiResponse<T>, T>({
        url,
        method: method.toUpperCase(),
        ...options,
    })
}

const isEmptyQueryValue = (value: unknown) => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
}

const sanitizeQueryParams = (params?: Record<string, unknown>) => {
    if (!params) return undefined

    const nextParams = Object.fromEntries(Object.entries(params).filter(([, value]) => !isEmptyQueryValue(value)))
    return Object.keys(nextParams).length > 0 ? nextParams : undefined
}

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {Object} params - 查询参数
 * @returns {Promise<T>} 请求 Promise
 */
export const get = <T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> => request<T>(url, 'GET', { params: sanitizeQueryParams(params) })

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求体数据
 * @returns {Promise<T>} 请求 Promise
 */
export const post = <T = unknown>(url: string, data?: unknown): Promise<T> => request<T>(url, 'POST', { data })

/**
 * 文件上传方法（支持单文件/多文件上传）
 * @param {string} url - 上传接口路径
 * @param {File|File[]} files - 单个 File 对象或 File 数组
 * @param {Object} extra - 额外附带的字段（可选）
 * @returns {Promise<T>} 上传请求 Promise
 */
export const upload = <T = unknown>(url: string, files: File | File[], extra: Record<string, unknown> = {}, options: AxiosRequestConfig = {}): Promise<T> => {
    const formData = new FormData()

    // 处理多文件上传
    if (Array.isArray(files)) {
        files.forEach((file) => {
            formData.append('files', file)
        })
    } else {
        // 单文件上传
        formData.append('files', files)
    }

    // 添加额外参数
    Object.entries(extra).forEach(([key, value]) => {
        formData.append(key, value as string | Blob)
    })

    return request<T>(url, 'POST', {
        data: formData,
        ...options,
    })
}

export default service
