import { describe, expect, it, vi } from 'vitest'

vi.mock('@/layout/index.vue', () => ({ default: {} }))

import constantRoutes from './constantRoutes'

describe('router/constantRoutes', () => {
    it('权限管理页面不应注册为静态路由绕过后端菜单授权', () => {
        const paths = constantRoutes.flatMap((route) => [route.path, ...(route.children || []).map((child) => child.path)])
        expect(paths).not.toContain('/system/notification-manage')
    })

    it('为任意登录用户提供只访问本人数据的请求日志路由', () => {
        const layout = constantRoutes.find((route) => route.name === 'Layout')
        const personalLogRoute = layout?.children?.find((route) => route.path === '/my-request-log')

        expect(personalLogRoute).toMatchObject({
            name: 'MyRequestLog',
            props: { mode: 'self' },
            meta: { show: false },
        })
    })

    it('业务待办依赖后端动态菜单，不注册静态路由绕过菜单边界', () => {
        const paths = constantRoutes.flatMap((route) => [route.path, ...(route.children || []).map((child) => child.path)])
        expect(paths).not.toContain('/todo/list')
    })
})
