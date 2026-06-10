import type { MockRoute } from '../index'

// 模拟系统字典选项
const dictOptionsMap: Record<string, unknown[]> = {
    common_status: [
        { label: '正常', value: 1, tag_type: 'success' },
        { label: '禁用', value: 0, tag_type: 'danger' },
    ],
    yes_no: [
        { label: '是', value: 1, tag_type: 'success' },
        { label: '否', value: 0, tag_type: 'info' },
    ],
    task_kind: [
        { label: 'Cron', value: 'cron' },
        { label: 'Delay', value: 'delay' },
    ],
    task_source: [
        { label: 'System', value: 'system' },
        { label: 'Manual', value: 'manual' },
    ],
}

// 模拟存储配置
const storageConfig = {
    driver: 'local',
    config: {
        max_file_size_mb: 50,
        allowed_extensions: ['jpg', 'png', 'gif', 'zip', 'pdf', 'txt'],
    },
}

export const systemMock: MockRoute[] = [
    {
        pattern: /^\/v1\/system\/dict\/options$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = params as Record<string, unknown>
            const raw = p['type_code']
            const typeCode = typeof raw === 'string' ? raw : ''
            return dictOptionsMap[typeCode] || []
        },
    },
    {
        pattern: /^\/v1\/system\/config\/list$/,
        method: 'GET',
        handler: () => ({
            list: [
                {
                    id: 1,
                    config_key: 'sys.name',
                    config_name: '系统名称',
                    config_value: 'X-L-Admin (Mock)',
                    value_type: 'string',
                    group_code: 'sys',
                    is_sensitive: 0,
                    status: 1,
                    sort: 10,
                    updated_at: new Date().toISOString(),
                },
                {
                    id: 2,
                    config_key: 'sys.storage.active',
                    config_name: '当前存储驱动',
                    config_value: 'local',
                    value_type: 'string',
                    group_code: 'storage',
                    is_sensitive: 0,
                    status: 1,
                    sort: 20,
                    updated_at: new Date().toISOString(),
                },
            ],
            total: 2,
        }),
    },
    {
        pattern: /^\/v1\/system\/config\/value$/,
        method: 'GET',
        handler: (params: unknown) => {
            const paramObj = params as Record<string, unknown>
            const rawKey = paramObj?.config_key
            const key = typeof rawKey === 'string' ? rawKey : ''
            if (key === 'sys.storage.active') {
                return { value: 'local' }
            }
            return { value: '' }
        },
    },
    {
        pattern: /^\/v1\/common\/ws-ticket$/,
        method: 'POST',
        handler: () => ({
            ticket: 'mock-ws-ticket-uuid-123456789',
        }),
    },
    {
        pattern: /^\/v1\/system\/storage\/config$/,
        method: 'GET',
        handler: () => storageConfig,
    },
    {
        pattern: /^\/v1\/system\/notification\/unread-count$/,
        method: 'GET',
        handler: () => ({
            unread_count: 0,
        }),
    },
    {
        pattern: /^\/v1\/system\/notification\/list$/,
        method: 'GET',
        handler: () => ({
            list: [],
            total: 0,
        }),
    },
]
