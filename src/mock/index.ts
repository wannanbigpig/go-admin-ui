import { authMock } from './modules/auth'
import { systemMock } from './modules/system'
import { adminUserMock } from './modules/adminUser'

export interface MockRoute {
    pattern: RegExp
    method: string
    handler: (params: unknown, data?: unknown) => unknown
}

// 扁平化所有模块的 Mock 路由定义
const mockRoutes: MockRoute[] = [...authMock, ...systemMock, ...adminUserMock]

/**
 * 匹配并执行开发环境网络不通的本地 Mock 降级路由
 * @param url 完整请求路径
 * @param method 请求方法（GET, POST, PUT, DELETE等）
 * @param dataOrParams 请求体负载或查询参数
 */
export function getMockFallback(url: string, method: string, dataOrParams: unknown): { code: number; msg: string; data: unknown } | null {
    // 过滤掉 API 前缀和 query 字符串
    const cleanUrl = url.split('?')[0].replace(/^\/admin/, '')
    const targetMethod = method.toUpperCase()

    // 匹配对应的规则
    const route = mockRoutes.find((r) => r.pattern.test(cleanUrl) && r.method.toUpperCase() === targetMethod)
    if (!route) {
        return null
    }

    try {
        const mockData = route.handler(dataOrParams)
        return {
            code: 0,
            msg: '[Mock Fallback Success]',
            data: mockData,
        }
    } catch (error) {
        console.error('[Mock Fallback Error]:', error)
        return null
    }
}
