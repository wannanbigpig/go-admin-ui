import type { Component } from 'vue'

/**
 * 前端组件映射表
 * key 为语义化标识（冒号分隔），value 为懒加载函数
 * 后端菜单表 component 字段存储此 key，前端通过映射表解析为真实组件
 */
const componentMap: Record<string, () => Promise<Component>> = {
    'home:index': () => import('@/views/home/index.vue'),
    'about:index': () => import('@/views/about/index.vue'),
    profile: () => import('@/views/profile/index.vue'),
    'permission:adminUser': () => import('@/views/permission/adminUser.vue'),
    'permission:role': () => import('@/views/permission/role.vue'),
    'permission:department': () => import('@/views/permission/department.vue'),
    'permission:api': () => import('@/views/permission/api.vue'),
    'permission:menuList': () => import('@/views/permission/menuList.vue'),
    'system:config': () => import('@/views/system/config.vue'),
    'system:dict': () => import('@/views/system/dict.vue'),
    'system:file': () => import('@/views/system/file.vue'),
    'system:storage': () => import('@/views/system/storage.vue'),
    'system:task': () => import('@/views/system/task.vue'),
    'system:notification': () => import('@/views/system/notification.vue'),
    'system:notificationManage': () => import('@/views/system/notificationManage.vue'),
    'log:adminLogin': () => import('@/views/log/adminLogin.vue'),
    'log:request': () => import('@/views/log/request.vue'),
    'log:session': () => import('@/views/log/session.vue'),
    'other:iframe': () => import('@/views/other/iframe.vue'),
    'other:notFound': () => import('@/views/other/notFound.vue'),
}

export default componentMap
