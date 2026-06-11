import { authMock } from './modules/auth'
import { systemMock } from './modules/system'
import { adminUserMock } from './modules/adminUser'
import { Logger } from '@/utils/logger'

export interface MockRoute {
    pattern: RegExp
    method: string
    handler: (params: unknown, data?: unknown) => unknown
}

export type MockFallbackResult = { matched: true; response: { code: number; msg: string; data: unknown } } | { matched: false } | { matched: true; error: Error }

// 扁平化所有模块的 Mock 路由定义
const mockRoutes: MockRoute[] = [...authMock, ...systemMock, ...adminUserMock]

/**
 * 匹配并执行开发环境网络不通的本地 Mock 降级路由
 * @param url 完整请求路径
 * @param method 请求方法（GET, POST, PUT, DELETE等）
 * @param dataOrParams 请求体负载或查询参数
 */
export function getMockFallback(url: string, method: string, dataOrParams: unknown): MockFallbackResult {
    // 过滤掉 API 前缀和 query 字符串
    let cleanUrl = url.split('?')[0]
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        try {
            cleanUrl = new URL(cleanUrl).pathname
        } catch {
            // ignore
        }
    }
    cleanUrl = cleanUrl.replace(/^\/admin/, '')
    const targetMethod = method.toUpperCase()

    // 匹配对应的规则
    const route = mockRoutes.find((r) => r.pattern.test(cleanUrl) && r.method.toUpperCase() === targetMethod)
    if (!route) {
        return { matched: false }
    }

    try {
        const mockData = route.handler(dataOrParams)
        return {
            matched: true,
            response: {
                code: 0,
                msg: '[Mock Fallback Success]',
                data: mockData,
            },
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        Logger.error('[Mock Fallback Error]:', err)
        return {
            matched: true,
            error: err,
        }
    }
}
