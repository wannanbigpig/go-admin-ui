import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MESSAGE_ERROR_DURATION } from '@/modules/shared/constants'

const hoisted = vi.hoisted(() => {
    const mockAuthStore = {
        token: '',
        refreshToken: '',
        updateToken: vi.fn(),
        handleTokenExpired: vi.fn(),
    }
    const mockRefreshTokenApi = vi.fn()
    const mockSettingStore = {
        locale: 'zh-CN',
    }

    const mockLogger = {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }

    let requestOnFulfilled: ((config: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>) | undefined
    let requestOnRejected: ((error: unknown) => Promise<never>) | undefined
    let responseOnFulfilled: ((response: Record<string, unknown>) => unknown | Promise<unknown>) | undefined
    let responseOnRejected: ((error: unknown) => Promise<never>) | undefined

    const mockService = {
        interceptors: {
            request: {
                use: vi.fn((onFulfilled, onRejected) => {
                    requestOnFulfilled = onFulfilled
                    requestOnRejected = onRejected
                    return 0
                }),
            },
            response: {
                use: vi.fn((onFulfilled, onRejected) => {
                    responseOnFulfilled = onFulfilled
                    responseOnRejected = onRejected
                    return 0
                }),
            },
        },
        request: vi.fn(),
    }

    return {
        mockAuthStore,
        mockSettingStore,
        mockLogger,
        mockService,
        mockRefreshTokenApi,
        callbacks: {
            get requestOnFulfilled() {
                return requestOnFulfilled
            },
            get requestOnRejected() {
                return requestOnRejected
            },
            get responseOnFulfilled() {
                return responseOnFulfilled
            },
            get responseOnRejected() {
                return responseOnRejected
            },
        },
    }
})

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => hoisted.mockService),
    },
}))

vi.mock('element-plus', () => ({
    ElMessage: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => hoisted.mockAuthStore,
}))

vi.mock('@/stores/setting', () => ({
    useSettingStore: () => hoisted.mockSettingStore,
}))

vi.mock('@/utils/logger', () => ({
    Logger: hoisted.mockLogger,
}))

vi.mock('@/api/auth', () => ({
    refreshTokenApi: hoisted.mockRefreshTokenApi,
}))

import { ElMessage } from 'element-plus'
import service, { get, post, request, upload } from '@/utils/request'
import * as mockModule from '@/mock'

const getCallback = <T>(value: T | undefined, name: string): T => {
    if (!value) {
        throw new Error(`回调未初始化: ${name}`)
    }
    return value
}

describe('utils/request.ts', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'false')
        vi.stubEnv('VITE_ENABLE_MOCK_FALLBACK', 'false')
        hoisted.mockAuthStore.token = ''
        hoisted.mockAuthStore.refreshToken = ''
        hoisted.mockSettingStore.locale = 'zh-CN'
        hoisted.mockService.request.mockReset()
        hoisted.mockAuthStore.updateToken.mockClear()
        hoisted.mockAuthStore.handleTokenExpired.mockClear()
        hoisted.mockRefreshTokenApi.mockReset()
        hoisted.mockLogger.error.mockClear()
        hoisted.mockLogger.warn.mockClear()
        vi.mocked(ElMessage).mockClear()
    })

    it('应导出 axios.create 生成的 service 实例并注册拦截器', () => {
        expect(service).toBe(hoisted.mockService as unknown as typeof service)
        expect(hoisted.callbacks.requestOnFulfilled).toBeTypeOf('function')
        expect(hoisted.callbacks.requestOnRejected).toBeTypeOf('function')
        expect(hoisted.callbacks.responseOnFulfilled).toBeTypeOf('function')
        expect(hoisted.callbacks.responseOnRejected).toBeTypeOf('function')
    })

    it('请求拦截器应自动注入 token 与默认 Content-Type', async () => {
        hoisted.mockAuthStore.token = 'access-token'
        const onFulfilled = getCallback(hoisted.callbacks.requestOnFulfilled, 'requestOnFulfilled')
        const config = await onFulfilled({
            headers: {},
            data: { name: 'test' },
        })

        expect(config.headers).toMatchObject({
            Authorization: 'Bearer access-token',
            'Accept-Language': 'zh-CN',
            'Content-Type': 'application/json',
        })
    })

    it('请求拦截器应自动注入当前语言标记头', async () => {
        hoisted.mockSettingStore.locale = 'en-US'
        const onFulfilled = getCallback(hoisted.callbacks.requestOnFulfilled, 'requestOnFulfilled')
        const config = await onFulfilled({
            headers: {},
        })

        expect(config.headers).toMatchObject({
            'Accept-Language': 'en-US',
        })
    })

    it('请求拦截器在无 token 时应移除 Authorization 且不覆盖 FormData Content-Type', async () => {
        const onFulfilled = getCallback(hoisted.callbacks.requestOnFulfilled, 'requestOnFulfilled')
        const config = await onFulfilled({
            headers: {
                Authorization: 'Bearer old-token',
            },
            data: new FormData(),
        })

        expect((config.headers as Record<string, unknown>).Authorization).toBeUndefined()
        expect((config.headers as Record<string, unknown>)['Content-Type']).toBeUndefined()
    })

    it('请求拦截器错误回调应记录日志并透传异常', async () => {
        const onRejected = getCallback(hoisted.callbacks.requestOnRejected, 'requestOnRejected')
        const error = new Error('request interceptor error')
        await expect(onRejected(error)).rejects.toBe(error)
        expect(hoisted.mockLogger.error).toHaveBeenCalledWith('请求拦截器错误:', error)
    })

    it('get 应清洗空查询参数并使用 GET 方法', async () => {
        hoisted.mockService.request.mockResolvedValueOnce({ list: [] })
        await get('/users', {
            page: 1,
            keyword: '',
            nickname: '   ',
            ids: [],
            enabled: false,
        })

        expect(hoisted.mockService.request).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/users',
                method: 'GET',
                params: { page: 1, enabled: false },
            })
        )
    })

    it('request/post/upload 应使用标准请求参数', async () => {
        hoisted.mockService.request.mockResolvedValue({})

        await request('/custom', 'patch', { params: { id: 1 } })
        expect(hoisted.mockService.request).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/custom',
                method: 'PATCH',
                params: { id: 1 },
            })
        )

        await post('/create', { name: 'demo' })
        expect(hoisted.mockService.request).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/create',
                method: 'POST',
                data: { name: 'demo' },
            })
        )

        const file = new File(['content'], 'demo.txt', { type: 'text/plain' })
        await upload('/upload', file, { path: 'avatar' })
        const lastCall = hoisted.mockService.request.mock.calls.at(-1)?.[0] as Record<string, unknown>
        expect(lastCall.url).toBe('/upload')
        expect(lastCall.method).toBe('POST')
        expect(lastCall.headers).toBeUndefined()
        expect(lastCall.data).toBeInstanceOf(FormData)
    })

    it('响应拦截器成功分支应处理 token 刷新与业务数据解包', async () => {
        const onFulfilled = getCallback(hoisted.callbacks.responseOnFulfilled, 'responseOnFulfilled')
        const result = await onFulfilled({
            headers: {
                'refresh-access-token': 'new-token',
                'refresh-exp': '100',
            },
            data: {
                code: 0,
                data: { id: 1 },
            },
        })

        expect(hoisted.mockAuthStore.updateToken).toHaveBeenCalledWith('new-token', 100)
        expect(result).toEqual({ id: 1 })
    })

    it('响应拦截器遇到业务 401 应触发过期处理并拒绝', async () => {
        hoisted.mockAuthStore.refreshToken = 'valid-refresh-token'
        hoisted.mockRefreshTokenApi.mockRejectedValueOnce(new Error('refresh failed'))
        const onFulfilled = getCallback(hoisted.callbacks.responseOnFulfilled, 'responseOnFulfilled')
        const payload = { code: 401, msg: 'unauthorized' }
        await expect(
            onFulfilled({
                headers: {},
                data: payload,
                config: {},
            })
        ).rejects.toEqual(payload)
        expect(hoisted.mockAuthStore.handleTokenExpired).toHaveBeenCalled()
    })

    it('响应拦截器遇到业务错误应提示并拒绝', async () => {
        const onFulfilled = getCallback(hoisted.callbacks.responseOnFulfilled, 'responseOnFulfilled')
        const payload = { code: 500, msg: '业务失败' }
        await expect(
            onFulfilled({
                headers: {},
                data: payload,
            })
        ).rejects.toEqual(payload)
        expect(ElMessage).toHaveBeenCalledWith({
            message: '业务失败',
            type: 'error',
        })
    })

    it('响应拦截器应解析 Blob 中的 JSON 业务错误', async () => {
        hoisted.mockAuthStore.refreshToken = 'valid-refresh-token'
        hoisted.mockRefreshTokenApi.mockRejectedValueOnce(new Error('refresh failed'))
        const onFulfilled = getCallback(hoisted.callbacks.responseOnFulfilled, 'responseOnFulfilled')
        const payload = { code: 401, msg: 'unauthorized', data: null }
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })

        await expect(
            onFulfilled({
                config: { responseType: 'blob' },
                headers: { 'content-type': 'application/json' },
                data: blob,
            })
        ).rejects.toEqual(payload)
        expect(hoisted.mockAuthStore.handleTokenExpired).toHaveBeenCalled()
    })

    it('响应错误拦截器应处理网络错误、超时和兜底错误', async () => {
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')

        const networkError = { message: 'Network Error' }
        await expect(onRejected(networkError)).rejects.toBe(networkError)
        expect(ElMessage).toHaveBeenCalledWith({
            message: '服务器连接异常，请检查服务器！',
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })

        const timeoutError = { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }
        await expect(onRejected(timeoutError)).rejects.toBe(timeoutError)
        expect(ElMessage).toHaveBeenCalledWith({
            message: '请求超时，请稍后重试',
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })

        const fallbackError = { response: { data: { msg: '服务异常' } }, message: 'unknown error' }
        await expect(onRejected(fallbackError)).rejects.toBe(fallbackError)
        expect(ElMessage).toHaveBeenCalledWith({
            message: '服务异常',
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })
    })

    it('响应拦截器应返回 undefined（HTTP 204 No Content）', async () => {
        const onFulfilled = getCallback(hoisted.callbacks.responseOnFulfilled, 'responseOnFulfilled')
        const result = await onFulfilled({
            status: 204,
            headers: {},
            data: '',
            config: {},
        })
        expect(result).toBeUndefined()
    })

    it('HTTP 400 + API payload 应 reject 业务 payload 并弹后端 msg', async () => {
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const payload = { code: 10000, msg: '参数错误', data: null }
        await expect(
            onRejected({
                response: { status: 400, data: payload, headers: {} },
                config: {},
                message: 'Request failed with status code 400',
            })
        ).rejects.toEqual(payload)
        expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({ message: '参数错误', type: 'error' }))
    })

    it('登录接口 HTTP 401 + API payload 应 reject 业务 payload 且不触发 handleTokenExpired', async () => {
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const payload = { code: 20001, msg: '账号或密码错误', data: null }
        await expect(
            onRejected({
                response: { status: 401, data: payload, headers: {} },
                config: { authErrorMode: 'credential' },
                message: 'Request failed with status code 401',
            })
        ).rejects.toEqual(payload)
        expect(hoisted.mockAuthStore.handleTokenExpired).not.toHaveBeenCalled()
        expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({ message: '账号或密码错误', type: 'error' }))
    })

    it('会话失效 HTTP 401 + API payload 应触发 handleTokenExpired 并 reject 业务 payload', async () => {
        hoisted.mockAuthStore.refreshToken = 'valid-refresh-token'
        hoisted.mockRefreshTokenApi.mockRejectedValueOnce(new Error('refresh failed'))
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const payload = { code: 401, msg: '登录已过期', data: null }
        await expect(
            onRejected({
                response: { status: 401, data: payload, headers: {} },
                config: {},
                message: 'Request failed with status code 401',
            })
        ).rejects.toEqual(payload)
        expect(hoisted.mockAuthStore.handleTokenExpired).toHaveBeenCalled()
    })

    it('HTTP 403 + API payload 应 reject 业务 payload 并弹后端 msg', async () => {
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const payload = { code: 403, msg: '权限不足', data: null }
        await expect(
            onRejected({
                response: { status: 403, data: payload, headers: {} },
                config: {},
                message: 'Request failed with status code 403',
            })
        ).rejects.toEqual(payload)
        expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({ message: '权限不足', type: 'error' }))
    })

    it('HTTP 500 + API payload 应 reject 业务 payload 并弹后端 msg', async () => {
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const payload = { code: 500, msg: '服务器内部错误', data: null }
        await expect(
            onRejected({
                response: { status: 500, data: payload, headers: {} },
                config: {},
                message: 'Request failed with status code 500',
            })
        ).rejects.toEqual(payload)
        expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({ message: '服务器内部错误', type: 'error' }))
    })

    it('当开启 Mock 时，匹配的请求应直接返回 Mock 数据而不发起网络请求', async () => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'true')
        const result = await request('/v1/login-captcha', 'GET')
        expect(result).toMatchObject({
            id: 'mock-captcha-id',
            answer: '1234',
        })
        expect(hoisted.mockService.request).not.toHaveBeenCalled()
    })

    it('当开启 Mock 时，未匹配 Mock 的请求应直接拒绝并弹错提示', async () => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'true')
        await expect(request('/v1/non-existent-api', 'GET')).rejects.toMatchObject({
            code: 404,
        })
        expect(hoisted.mockService.request).not.toHaveBeenCalled()
        expect(ElMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('未找到 Mock 接口匹配规则'),
                type: 'error',
            })
        )
    })

    it('当关闭 Mock 时，发生 HTTP 5xx 错误时应直接拒绝，不再走 Mock 降级', async () => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'false')
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const error = {
            response: { status: 500, data: 'Proxy error: ECONNREFUSED', headers: {} },
            config: { url: '/admin/v1/login-captcha', method: 'get' },
            message: 'Request failed with status code 500',
        }
        await expect(onRejected(error)).rejects.toBe(error)
        expect(ElMessage).toHaveBeenCalledWith({
            message: 'Proxy error: ECONNREFUSED',
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })
    })

    it('当关闭 Mock 时，发生网络错误时应直接拒绝，不再走 Mock 降级', async () => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'false')
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')
        const error = {
            config: { url: '/admin/v1/login', method: 'post', data: { username: 'super_admin' } },
            message: 'Network Error',
        }
        await expect(onRejected(error)).rejects.toBe(error)
        expect(ElMessage).toHaveBeenCalledWith({
            message: '服务器连接异常，请检查服务器！',
            type: 'error',
            duration: MESSAGE_ERROR_DURATION,
        })
    })

    it('当开启 Mock 且 Mock 遇到 handler 抛错时应返回 500 并弹后端 msg', async () => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'true')
        const spy = vi.spyOn(mockModule, 'getMockFallback').mockReturnValue({
            matched: true,
            error: new Error('mock handler crash'),
        })

        await expect(request('/v1/crash-api', 'GET')).rejects.toMatchObject({
            code: 500,
            msg: expect.stringContaining('mock handler crash'),
        })
        expect(ElMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('mock handler crash'),
                type: 'error',
            })
        )
        spy.mockRestore()
    })

    it('当开启 Mock 且 options.responseType === "blob" 时应正确返回 Blob 数据', async () => {
        vi.stubEnv('VITE_ENABLE_MOCK', 'true')
        const spy = vi.spyOn(mockModule, 'getMockFallback').mockReturnValue({
            matched: true,
            response: {
                code: 0,
                msg: 'ok',
                data: { content: 'test' },
            },
        })

        const blobResult = await request<Blob>('/v1/blob-api', 'GET', { responseType: 'blob' })
        expect(blobResult).toBeInstanceOf(Blob)
        const text = await blobResult.text()
        expect(text).toBe(JSON.stringify({ content: 'test' }))
        spy.mockRestore()
    })
})
