import { describe, expect, it, vi } from 'vitest'

vi.mock('@/layout/index.vue', () => ({ default: {} }))

import constantRoutes from './constantRoutes'

describe('router/constantRoutes', () => {
    it('权限管理页面不应注册为静态路由绕过后端菜单授权', () => {
        const paths = constantRoutes.flatMap((route) => [route.path, ...(route.children || []).map((child) => child.path)])
        expect(paths).not.toContain('/system/notification-manage')
    })
})
