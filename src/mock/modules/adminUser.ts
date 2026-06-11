import type { MockRoute } from '../index'

// 简单的管理员列表模拟数据
const adminUserList = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    username: `admin${i + 1}`,
    nickname: `管理员 ${i + 1}`,
    avatar: '',
    role_ids: [1],
    dept_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
}))

export const adminUserMock: MockRoute[] = [
    {
        pattern: /^\/v1\/admin-user\/list$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = (params || {}) as { [key: string]: unknown }
            const page = Number((p['page'] as string) || '1')
            const pageSize = Number((p['pageSize'] as string) || '10')
            const start = (page - 1) * pageSize
            const end = start + pageSize
            return {
                total: adminUserList.length,
                list: adminUserList.slice(start, end),
            }
        },
    },
    {
        pattern: /^\/v1\/admin-user\/options$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = (params || {}) as { [key: string]: unknown }
            const keyword = ((p['keyword'] as string) || '').toLowerCase()
            return adminUserList.filter((u) => u.username.toLowerCase().includes(keyword) || u.nickname.toLowerCase().includes(keyword)).map((u) => ({ id: u.id, username: u.username, nickname: u.nickname }))
        },
    },
    {
        pattern: /^\/v1\/admin-user\/get$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = (params || {}) as { [key: string]: unknown }
            const id = Number(p['id'] as string)
            return adminUserList.find((u) => u.id === id) || null
        },
    },
    {
        pattern: /^\/v1\/product\/list$/,
        method: 'GET',
        handler: () => ({
            list: [
                {
                    id: 1,
                    name: '专业版 ERP 授权',
                    description: '适用于大中型企业的 ERP 套件',
                    price: 9999.0,
                    status: 1,
                    status_name: '销售中',
                    dept_id: 2,
                    dept_name: '研发部',
                    created_by: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    id: 2,
                    name: '标准版 CRM 订阅',
                    description: 'SaaS 模式的高效客户关系管理系统',
                    price: 299.0,
                    status: 1,
                    status_name: '销售中',
                    dept_id: 3,
                    dept_name: '市场部',
                    created_by: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ],
            total: 2,
        }),
    },
]
