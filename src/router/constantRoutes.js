import Layout from '@/layout/index.vue'

export default [
    {
        path: '/',
        name: 'Layout',
        component: Layout,
        children: [
            // {
            //   path: '',
            //   name: 'Home',
            //   component: () => import('@/views/home/index.vue'),
            //   meta: {
            //     title: '首页',
            //     icon: 'ant-design:home-outlined',
            //     show: true,
            //   },
            // },
            // {
            //   path: 'permission',
            //   name: 'Permission',
            //   meta: {
            //     title: '权限管理',
            //     icon: 'ant-design:lock-outlined',
            //     show: true,
            //   },
            //   redirect: '',
            //   children: [
            //     {
            //       path: 'permission',
            //       name: 'PermissionList',
            //       component: () => import('@/views/permission/index.vue'),
            //       meta: {
            //         title: '接口列表',
            //         icon: 'ant-design:api-outlined',
            //         show: true,
            //         animate_enter: 'animate__fadeInLeft',
            //         animate_leave: 'animate__fadeOutRight',
            //       },
            //     },
            //     {
            //       path: 'menu-list',
            //       name: 'MenuList',
            //       component: () => import('@/views/permission/menuList.vue'),
            //       meta: {
            //         title: '菜单列表',
            //         icon: 'ep:menu',
            //         show: true,
            //         animate_enter: 'animate__fadeInLeft',
            //         animate_leave: 'animate__fadeOutRight',
            //       },
            //     },
            //   ],
            // },
            // {
            //   path: '/about',
            //   name: 'About',
            //   component: () => import('@/views/about/index.vue'),
            //   meta: {
            //     title: '关于',
            //     icon: 'ep:circle-check',
            //     show: true,
            //   },
            // },
            // {
            //   path: 'https://blog.csdn.net/u010324331',
            //   name: 'csdn',
            //   meta: {
            //     title: 'CSDN',
            //     icon: 'ep:circle-check',
            //     show: true,
            //     isNewWindow: false,
            //   },
            // },
            {
                path: '/refresh',
                name: 'refresh',
                component: () => import('@/views/other/refresh.vue'),
                meta: {
                    title: '刷新',
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
                    title: '个人中心',
                    show: false,
                },
            },
        ],
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue'),
        hidden: true,
        meta: {
            title: '登录',
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
