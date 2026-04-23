import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MESSAGE_ERROR_DURATION } from '@/modules/shared/constants'

const hoisted = vi.hoisted(() => {
    const mockAuthStore = {
        token: '',
        updateToken: vi.fn(),
        handleTokenExpired: vi.fn(),
    }
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

import { ElMessage } from 'element-plus'
import service, { get, post, request, upload } from '@/utils/request'

const getCallback = <T>(value: T | undefined, name: string): T => {
    if (!value) {
        throw new Error(`回调未初始化: ${name}`)
    }
    return value
}

describe('utils/request.ts', () => {
    beforeEach(() => {
        hoisted.mockAuthStore.token = ''
        hoisted.mockSettingStore.locale = 'zh-CN'
        hoisted.mockService.request.mockReset()
        hoisted.mockAuthStore.updateToken.mockClear()
        hoisted.mockAuthStore.handleTokenExpired.mockClear()
        hoisted.mockLogger.error.mockClear()
        hoisted.mockLogger.warn.mockClear()
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
        expect(lastCall.headers).toEqual({ 'Content-Type': 'multipart/form-data' })
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
        const onFulfilled = getCallback(hoisted.callbacks.responseOnFulfilled, 'responseOnFulfilled')
        const payload = { code: 401, msg: 'unauthorized' }
        await expect(
            onFulfilled({
                headers: {},
                data: payload,
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

    it('响应错误拦截器应处理 401、网络错误、超时和兜底错误', async () => {
        const onRejected = getCallback(hoisted.callbacks.responseOnRejected, 'responseOnRejected')

        const http401Error = { response: { status: 401 }, message: 'unauthorized' }
        await expect(onRejected(http401Error)).rejects.toBe(http401Error)
        expect(hoisted.mockAuthStore.handleTokenExpired).toHaveBeenCalled()

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
})
