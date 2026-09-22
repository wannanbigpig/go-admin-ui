import { describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { convertRoute, findFirstValidRoute } from './dynamicRoutes'
import type { UserPermission } from '@/types/auth'

describe('dynamicRoutes', () => {
    it('convertRoute 应该正确处理嵌套的 Task/TaskCenter 路由并能正常跳转', async () => {
        // 模拟数据库里 54 号和 55 号的菜单树
        const menuTree: UserPermission[] = [
            {
                id: 54,
                pid: 0,
                title: 'Task',
                code: '',
                name: 'Task',
                type: 1,
                icon: 'ri:task-line',
                path: 'task',
                redirect: 'TaskCenter',
                component_key: '',
                is_show: 1,
                is_auth: 1,
                is_new_window: 0,
                is_external_links: 0,
                sort: 97,
                children: [
                    {
                        id: 55,
                        pid: 54,
                        title: 'TaskCenter',
                        code: '',
                        name: 'TaskCenter',
                        type: 2,
                        icon: 'ri:task-line',
                        path: 'center',
                        redirect: '',
                        component_key: 'system:task',
                        is_show: 1,
                        is_auth: 1,
                        is_new_window: 0,
                        is_external_links: 0,
                        sort: 100,
                        children: [],
                    },
                ],
            },
        ]

        const routes = convertRoute(menuTree)

        // 验证转换后的父路由组件已被成功定义为占位组件
        expect(routes[0].component).toBeDefined()
        expect(typeof (routes[0].component as { render?: unknown })?.render).toBe('function')
        expect(findFirstValidRoute(routes)).toBe('/task/center')

        // 创建一个真实的路由实例进行测试
        const router = createRouter({
            history: createWebHistory(),
            routes: [
                {
                    path: '/',
                    name: 'Layout',
                    component: { render: () => null },
                    children: [],
                },
                {
                    path: '/:pathMatch(.*)*',
                    name: 'NotFound',
                    component: { render: () => null },
                },
            ],
        })

        // 添加动态路由
        routes.forEach((route) => {
            router.addRoute('Layout', route)
        })

        // 任务运维只保留自身的执行记录 Tab。
        await router.push('/task/center?tab=run')

        expect(router.currentRoute.value.name).not.toBe('NotFound')
        expect(router.currentRoute.value.name).toBe('TaskCenter')
        expect(router.currentRoute.value.query.tab).toBe('run')
    })

    it('findFirstValidRoute 应该支持空 path 首页路由', () => {
        const routes = convertRoute([
            {
                id: 1,
                pid: 0,
                title: '首页',
                code: '',
                name: 'Home',
                type: 2,
                icon: 'ep:menu',
                path: '',
                redirect: '',
                component_key: 'home:index',
                is_show: 1,
                is_auth: 0,
                is_new_window: 0,
                is_external_links: 0,
                sort: 100,
                children: [],
            },
        ])

        expect(findFirstValidRoute(routes)).toBe('')
    })

    it('隐藏菜单应保留为可访问动态路由', () => {
        const routes = convertRoute([
            {
                id: 89,
                pid: 0,
                title: '我的待办',
                code: '',
                name: 'TodoList',
                type: 2,
                icon: 'ep:list',
                path: 'todo/list',
                redirect: '',
                component_key: 'todo:index',
                is_show: 0,
                is_auth: 0,
                is_new_window: 0,
                is_external_links: 0,
                sort: 97,
                children: [],
            },
        ])

        expect(routes).toHaveLength(1)
        expect(routes[0].path).toBe('todo/list')
        expect(routes[0].meta?.show).toBe(false)
        expect(routes[0].component).toBeDefined()
    })

    it('不同父路由下相同相对 path 的子菜单都应保留', () => {
        const child = (id: number, pid: number, name: string): UserPermission => ({
            id,
            pid,
            title: name,
            code: '',
            name,
            type: 2,
            path: 'list',
            component_key: 'home:index',
            is_show: 1,
            sort: 1,
            children: [],
        })
        const parent = (id: number, path: string, childRoute: UserPermission): UserPermission => ({
            id,
            pid: 0,
            title: path,
            code: '',
            name: `${path}Parent`,
            type: 1,
            path,
            component_key: '',
            is_show: 1,
            sort: 1,
            children: [childRoute],
        })

        const routes = convertRoute([parent(1, 'a', child(2, 1, 'AList')), parent(3, 'b', child(4, 3, 'BList'))])

        expect(routes).toHaveLength(2)
        expect(routes[0].children).toHaveLength(1)
        expect(routes[1].children).toHaveLength(1)
    })

    it('合法 HTTP 外链叶子菜单应保留在菜单树中', () => {
        const routes = convertRoute([
            {
                id: 1,
                pid: 0,
                title: '项目文档',
                code: '',
                name: 'Docs',
                type: 2,
                path: 'https://example.com/docs',
                component_key: '',
                is_show: 1,
                is_external_links: 1,
                is_new_window: 1,
                sort: 1,
                children: [],
            },
        ])

        expect(routes).toHaveLength(1)
        expect(routes[0].path).toBe('https://example.com/docs')
        expect(routes[0].component).toBeUndefined()
    })
})
