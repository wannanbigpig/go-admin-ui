import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useSettingStore } from '@/stores/setting'
import type { ApiResponse } from '@/types/common'
import { MESSAGE_ERROR_DURATION, REQUEST_TIMEOUT } from '@/modules/shared/constants'
import { Logger } from '@/utils/logger'
import { DEFAULT_LOCALE, translate } from '@/locales'

const normalizeEnvValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const LANGUAGE_HEADER = 'Accept-Language'

/**
 * 解析请求 baseURL
 * - 开发环境默认走同源代理（/admin），避免浏览器跨域限制
 * - 生产环境按 VITE_BASE_URL + VITE_BASE_API 组合
 */
const resolveBaseURL = () => {
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

// ==================== 创建 axios 实例 ====================
/**
 * 创建 axios 实例
 * baseURL = VITE_BASE_URL + VITE_BASE_API
 */
const service = axios.create({
    baseURL: resolveBaseURL(),
    timeout: REQUEST_TIMEOUT,
})

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
        // 添加认证 token
        if (authStore.token) {
            config.headers['Authorization'] = `Bearer ${authStore.token}`
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
    (response: AxiosResponse<ApiResponse<unknown>>) => {
        if (response.config?.responseType === 'blob' || response.data instanceof Blob) {
            return response.data as unknown as AxiosResponse
        }

        const authStore = useAuthStore()

        // 处理 token 刷新
        if (response.headers['refresh-access-token']) {
            authStore.updateToken(response.headers['refresh-access-token'], Number(response.headers['refresh-exp']))
        }

        const code = response.data.code

        // 处理 401 未授权
        if (code === 401) {
            authStore.handleTokenExpired()
            return Promise.reject(response.data)
        }

        // 处理业务错误（code !== 0）
        if (code !== 0) {
            ElMessage({
                message: response.data.msg || translate('request.failed'),
                type: 'error',
            })
            return Promise.reject(response.data)
        }

        // 返回业务数据，避免将 AxiosResponse 结构透传到业务层
        return response.data.data as unknown as AxiosResponse
    },
    (error) => {
        const authStore = useAuthStore()

        // 处理 HTTP 401 未授权
        if (error.response?.status === 401) {
            authStore.handleTokenExpired()
            return Promise.reject(error)
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

        // 处理其他错误
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
export const upload = <T = unknown>(url: string, files: File | File[], extra: Record<string, unknown> = {}): Promise<T> => {
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
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export default service
