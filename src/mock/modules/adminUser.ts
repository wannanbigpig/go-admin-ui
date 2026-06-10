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
            const p = params as { [key: string]: unknown }
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
            const p = params as { [key: string]: unknown }
            const keyword = ((p['keyword'] as string) || '').toLowerCase()
            return adminUserList.filter((u) => u.username.toLowerCase().includes(keyword) || u.nickname.toLowerCase().includes(keyword)).map((u) => ({ id: u.id, username: u.username, nickname: u.nickname }))
        },
    },
    {
        pattern: /^\/v1\/admin-user\/get$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = params as { [key: string]: unknown }
            const id = Number(p['id'] as string)
            return adminUserList.find((u) => u.id === id) || null
        },
    },
]
