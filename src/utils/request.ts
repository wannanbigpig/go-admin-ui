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
        /** 401 处理模式：'credential' 表示登录凭证失败（不触发过期弹窗），'session' 表示会话失效（默认） */
        authErrorMode?: 'credential' | 'session'
        /** 跳过 Authorization 头注入（用于 refresh-token 请求） */
        _skipAuth?: boolean
        /** 标记为刷新 Token 请求，避免 401 循环 */
        _isRefreshRequest?: boolean
    }
}

const LANGUAGE_HEADER = 'Accept-Language'

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
})

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

// ==================== Refresh Token 并发控制 ====================
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []
let refreshFailSubscribers: Array<(error: unknown) => void> = []

function subscribeTokenRefresh(onResolved: (token: string) => void, onRejected: (error: unknown) => void) {
    refreshSubscribers.push(onResolved)
    refreshFailSubscribers.push(onRejected)
}

function onTokenRefreshed(newToken: string) {
    const subscribers = [...refreshSubscribers]
    refreshSubscribers = []
    refreshFailSubscribers = []
    subscribers.forEach((cb) => {
        try {
            cb(newToken)
        } catch (e) {
            Logger.error('Token 刷新回调异常:', e)
        }
    })
}

function onTokenRefreshFailed(error: unknown) {
    const subscribers = [...refreshFailSubscribers]
    refreshSubscribers = []
    refreshFailSubscribers = []
    subscribers.forEach((cb) => {
        try {
            cb(error)
        } catch (e) {
            Logger.error('Token 刷新失败回调异常:', e)
        }
    })
}

/**
 * 尝试使用 refresh_token 静默刷新 access_token
 * 返回新的 access_token 或 null（刷新失败）
 */
async function tryRefreshToken(config: AxiosRequestConfig): Promise<string | null> {
    const authStore = useAuthStore()
    const currentRefreshToken = authStore.refreshToken

    // 如果是刷新请求本身返回 401，或没有可用的 refresh_token，直接失败
    if (config._isRefreshRequest || !currentRefreshToken) {
        return null
    }

    if (!isRefreshing) {
        isRefreshing = true
        try {
            // 动态导入避免循环依赖
            const { refreshTokenApi } = await import('@/api/auth')
            const result = await refreshTokenApi(currentRefreshToken)
            authStore.updateToken(result.access_token, result.expires_at, result.refresh_token, result.refresh_expires_at)
            onTokenRefreshed(result.access_token)
            return result.access_token
        } catch (refreshError) {
            onTokenRefreshFailed(refreshError)
            authStore.handleTokenExpired()
            return null
        } finally {
            isRefreshing = false
        }
    } else {
        // 等待正在进行的刷新完成
        return new Promise<string | null>((resolve) => {
            subscribeTokenRefresh(
                (newToken) => resolve(newToken),
                () => resolve(null)
            )
        })
    }
}

const handleApiResponse = async (response: AxiosResponse<ApiResponse<unknown>>, authErrorMode: 'credential' | 'session' = 'session') => {
    const authStore = useAuthStore()

    // 处理 token 滑动刷新（响应头）
    if (response.headers['refresh-access-token']) {
        authStore.updateToken(response.headers['refresh-access-token'], Number(response.headers['refresh-exp']))
    }

    const code = response.data.code

    // 处理 401 未授权 — 先尝试 refresh token 静默刷新
    if (code === 401) {
        // credential 模式（登录请求）：不尝试刷新，直接拒绝
        if (authErrorMode === 'credential') {
            return Promise.reject(response.data)
        }

        const config = response.config as AxiosRequestConfig
        const newToken = await tryRefreshToken(config)
        if (newToken) {
            // 刷新成功，重试原请求
            config.headers = config.headers || {}
            config.headers['Authorization'] = `Bearer ${newToken}`
            return service.request(config)
        }

        // 刷新失败，handleTokenExpired 已在 tryRefreshToken 中调用
        return Promise.reject(response.data)
    }

    // 处理业务错误（code !== 0）
    if (code !== 0) {
        const config = response.config as AxiosRequestConfig & { silent?: boolean; silentCodes?: number[]; authErrorMode?: 'credential' | 'session' }
        const isSilent = config?.silent || (Array.isArray(config?.silentCodes) && config.silentCodes.includes(code)) || (SILENT_BUSINESS_CODES as readonly number[]).includes(code)
        if (!isSilent) {
            ElMessage({
                message: response.data.msg || translate('request.failed'),
                type: 'error',
            })
        }
        return Promise.reject(response.data)
    }

    // 返回业务数据，避免将 AxiosResponse 结构透传到业务层
    return response.data.data
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
 * - 处理 token 刷新
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

        const authErrorMode = (response.config as AxiosRequestConfig & { authErrorMode?: 'credential' | 'session' })?.authErrorMode ?? 'session'

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
        if (error.message === 'Network Error') {
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
        const errorMessage = error.response?.data?.msg || error.message || translate('request.failed')
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
export function request<T = unknown>(url: string, method: string, options: AxiosRequestConfig = {}): Promise<T> {
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
