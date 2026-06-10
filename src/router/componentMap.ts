import type { Component } from 'vue'

/**
 * 前端组件映射表
 * key 为语义化标识（冒号分隔），value 为懒加载函数
 * 后端菜单表 component 字段存储此 key，前端通过映射表解析为真实组件
 *
 * 策略：显式映射优先 + import.meta.glob 自动补充
 * 1. 显式映射：非 index.vue 页面（如 permission/role.vue）必须手动注册
 * 2. 自动补充：views 下的 index.vue 按目录推导 key
 * 3. 显式映射优先级高于自动推导，避免覆盖特殊页面
 */

// 显式映射：后端 menu.component_key 的语义契约不能因为前端目录迁移而变化。
const explicitMap: Record<string, () => Promise<Component>> = {
    'home:index': () => import('@/views/home/index.vue'),
    'about:index': () => import('@/views/about/index.vue'),
    profile: () => import('@/views/profile/index.vue'),
    'permission:adminUser': () => import('@/views/permission/adminUser/index.vue'),
    'permission:api': () => import('@/views/permission/api/index.vue'),
    'permission:department': () => import('@/views/permission/department/index.vue'),
    'permission:menuList': () => import('@/views/permission/menuList/index.vue'),
    'permission:role': () => import('@/views/permission/role/index.vue'),
    'log:adminLogin': () => import('@/views/log/adminLogin/index.vue'),
    'log:request': () => import('@/views/log/request/index.vue'),
    'log:session': () => import('@/views/log/session/index.vue'),
    'system:config': () => import('@/views/system/config/index.vue'),
    'system:dict': () => import('@/views/system/dict/index.vue'),
    'system:file': () => import('@/views/system/file/index.vue'),
    'system:notificationManage': () => import('@/views/system/notificationManage/index.vue'),
    'system:task': () => import('@/views/system/task/index.vue'),
    'system:taskStats': () => import('@/views/system/taskStats/index.vue'),
    'product:index': () => import('@/views/business/product/index.vue'),
    'other:notFound': () => import('@/views/other/notFound/index.vue'),
}

// 自动扫描 views 下的 index.vue 文件
const globModules: Record<string, () => Promise<Component>> = import.meta.glob('../views/**/index.vue', { import: 'default' })

// 从 glob 路径推导语义化 key
function deriveKeyFromPath(path: string): string | null {
    // 兼容 Vite 可能返回的 ../views、/src/views 或 @/views 路径形式。
    const match = path.match(/(?:\.\.\/views\/|\/src\/views\/|@\/views\/)(.+)\/index\.vue$/)
    if (!match) return null
    // 将路径分隔符 / 替换为冒号 :
    return match[1].replace(/\//g, ':')
}

// 构建自动映射
const autoMap: Record<string, () => Promise<Component>> = {}
for (const [path, loader] of Object.entries(globModules)) {
    const key = deriveKeyFromPath(path)
    if (key) {
        autoMap[key] = loader
    }
}

// 合并映射：显式映射优先级高于自动推导
const componentMap: Record<string, () => Promise<Component>> = {
    ...autoMap,
    ...explicitMap,
}

export default componentMap
