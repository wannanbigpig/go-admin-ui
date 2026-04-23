import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

// 静态路由 meta 约定：title 是兜底标题，titleKey 仅用于前端静态路由国际化，show=false 表示不显示在侧边菜单。
const constantRoutes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Layout',
        component: Layout,
        children: [
            {
                path: '/refresh',
                name: 'refresh',
                component: () => import('@/views/other/refresh.vue'),
                meta: {
                    title: 'Refresh',
                    titleKey: 'common.actions.refresh',
                    show: false,
                },
            },
            {
                path: '/iframe',
                name: 'iframe',
                component: () => import('@/views/other/iframe.vue'),
                meta: {
                    title: 'iframe',
                    show: false,
                },
            },
            {
                path: '/profile',
                name: 'Profile',
                component: () => import('@/views/profile/index.vue'),
                meta: {
                    title: 'Profile',
                    titleKey: 'layout.profile',
                    show: false,
                },
            },
        ],
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue'),
        meta: {
            title: 'Login',
            titleKey: 'login.login',
        },
    },
    // 所有未定义路由，全部重定向到404页
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/other/404.vue'),
        meta: {
            title: '404',
        },
    },
]

export default constantRoutes
