import Layout from '@/layout/index.vue'

export default [
  {
    path: '/',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: 'Home',
        meta: {
          title: '首页',
          icon: 'https://doc-image.zhangwj.com/img/go-admin.png',
          show: true,
        },
        redirect: '/home3',
        children: [
          {
            path: '/home2',
            name: 'Home2',
            meta: {
              title: '首页2',
              icon: 'ep:home-filled',
              show: true,
            },
            children: [
              {
                path: '/home3',
                name: 'Home3',
                component: () => import('@/views/home/index.vue'),
                meta: {
                  title: '首页3',
                  // icon: 'ep:home-filled',
                  show: true,
                },
              },
            ],
          },
          {
            path: 'ab',
            name: 'ab',
            component: () => import('@/views/about/index.vue'),
            meta: {
              title: '关于4',
              icon: 'ep:home-filled',
              show: true,
            },
            children: [
              {
                path: 'abb',
                name: 'abb',
                component: () => import('@/views/about/index.vue'),
                meta: {
                  title: 'abb',
                  icon: 'ep:home-filled',
                  show: true,
                  target: '_blank',
                },
              },
              {
                path: 'https://baidu.com',
                name: 'abbc',
                meta: {
                  title: '百度外',
                  icon: 'ep:home-filled',
                  show: true,
                  isNewWindow: true,
                },
              },
              {
                path: 'https://blog.csdn.net/u010324331',
                name: 'abbcd',
                meta: {
                  title: '百度内',
                  icon: 'ep:home-filled',
                  show: true,
                  isNewWindow: false,
                },
              },
            ],
          },
        ],
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: {
          title: '关于',
          icon: 'ep:circle-check',
          menu: true,
        },
      },
      {
        path: '/refresh',
        name: 'refresh',
        component: () => import('@/views/other/refresh.vue'),
      },
      {
        path: '/iframe',
        name: 'iframe',
        component: () => import('@/views/other/iframe.vue'),
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
