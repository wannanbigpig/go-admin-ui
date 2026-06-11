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

// 模拟文件资源文件夹
let mockFolders = [
    { id: 1, name: '全部文件', parent_id: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: '图片', parent_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, name: '文档', parent_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

// 模拟文件资源列表
let mockFiles = [
    {
        id: 1,
        uuid: 'file-uuid-1',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 2,
        logical_path: '/全部文件/图片',
        origin_name: '用户头像.png',
        name: 'user_avatar_2026.png',
        path: 'uploads/images/user_avatar_2026.png',
        size: 10240,
        ext: 'png',
        hash: 'hash1',
        mime_type: 'image/png',
        file_type: 'image',
        is_public: 1,
        url: 'https://placehold.co/200x200.png',
        thumbnail_url: 'https://placehold.co/200x200.png',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        uuid: 'file-uuid-2',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 2,
        logical_path: '/全部文件/图片',
        origin_name: '系统背景图.jpg',
        name: 'bg_dashboard.jpg',
        path: 'uploads/images/bg_dashboard.jpg',
        size: 204800,
        ext: 'jpg',
        hash: 'hash2',
        mime_type: 'image/jpeg',
        file_type: 'image',
        is_public: 1,
        url: 'https://placehold.co/800x600.jpg',
        thumbnail_url: 'https://placehold.co/800x600.jpg',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        uuid: 'file-uuid-3',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 3,
        logical_path: '/全部文件/文档',
        origin_name: '2026年年度财务报告.pdf',
        name: 'annual_report_2026.pdf',
        path: 'uploads/docs/annual_report_2026.pdf',
        size: 512000,
        ext: 'pdf',
        hash: 'hash3',
        mime_type: 'application/pdf',
        file_type: 'pdf',
        is_public: 1,
        url: 'https://placehold.co/pdf',
        thumbnail_url: '',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        uuid: 'file-uuid-4',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 3,
        logical_path: '/全部文件/文档',
        origin_name: '员工手册.docx',
        name: 'employee_handbook.docx',
        path: 'uploads/docs/employee_handbook.docx',
        size: 154000,
        ext: 'docx',
        hash: 'hash4',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_type: 'word',
        is_public: 1,
        url: '',
        thumbnail_url: '',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 5,
        uuid: 'file-uuid-5',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 3,
        logical_path: '/全部文件/文档',
        origin_name: '产品价格清单.xlsx',
        name: 'price_list_v2.xlsx',
        path: 'uploads/docs/price_list_v2.xlsx',
        size: 45600,
        ext: 'xlsx',
        hash: 'hash5',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_type: 'excel',
        is_public: 1,
        url: '',
        thumbnail_url: '',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 6,
        uuid: 'file-uuid-6',
        uid: 'user-1',
        uploader_name: '测试用户',
        uploader_username: 'test',
        folder_id: 1,
        logical_path: '/全部文件',
        origin_name: '项目演示视频.mp4',
        name: 'demo_video.mp4',
        path: 'uploads/videos/demo_video.mp4',
        size: 12500000,
        ext: 'mp4',
        hash: 'hash6',
        mime_type: 'video/mp4',
        file_type: 'video',
        is_public: 1,
        url: '',
        thumbnail_url: '',
        storage_driver: 'aliyun_oss',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 7,
        uuid: 'file-uuid-7',
        uid: 'user-1',
        uploader_name: '测试用户',
        uploader_username: 'test',
        folder_id: 1,
        logical_path: '/全部文件',
        origin_name: '会议录音.mp3',
        name: 'meeting_record.mp3',
        path: 'uploads/audios/meeting_record.mp3',
        size: 4500000,
        ext: 'mp3',
        hash: 'hash7',
        mime_type: 'audio/mpeg',
        file_type: 'audio',
        is_public: 0,
        url: '',
        thumbnail_url: '',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 8,
        uuid: 'file-uuid-8',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 1,
        logical_path: '/全部文件',
        origin_name: '临时备忘录.txt',
        name: 'memo.txt',
        path: 'uploads/docs/memo.txt',
        size: 1024,
        ext: 'txt',
        hash: 'hash8',
        mime_type: 'text/plain',
        file_type: 'text',
        is_public: 1,
        url: '',
        thumbnail_url: '',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
]

type MockFolder = (typeof mockFolders)[number] & { children?: MockFolder[] }
type MockFile = (typeof mockFiles)[number]
type MockTrashFile = MockFile & {
    deleted_at: string
    deleted_by: string
    deleted_reason: string
}

const toParams = (params: unknown): Record<string, unknown> => {
    return params && typeof params === 'object' && !Array.isArray(params) ? (params as Record<string, unknown>) : {}
}

// 模拟回收站文件
let mockTrashFiles: MockTrashFile[] = [
    {
        id: 99,
        uuid: 'trash-uuid-1',
        uid: 'user-1',
        uploader_name: '超级管理员',
        uploader_username: 'admin',
        folder_id: 3,
        logical_path: '/全部文件/文档',
        origin_name: '被删除的无效报告.pdf',
        name: 'deleted_report.pdf',
        path: 'uploads/docs/deleted_report.pdf',
        size: 512000,
        ext: 'pdf',
        hash: 'hash99',
        mime_type: 'application/pdf',
        file_type: 'pdf',
        is_public: 0,
        url: 'https://placehold.co/pdf',
        thumbnail_url: '',
        storage_driver: 'local',
        storage_status: 'stored',
        storage_status_name: '已存储',
        reference_count: 0,
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin',
        deleted_reason: '过期清理',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
]

export const systemMock: MockRoute[] = [
    {
        pattern: /^\/v1\/system\/dict\/options$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = (params || {}) as Record<string, unknown>
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
            const paramObj = (params || {}) as Record<string, unknown>
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
    {
        pattern: /^\/v1\/task\/list$/,
        method: 'GET',
        handler: () => ({
            list: [
                { id: 1, name: '演示数据备份', kind: 'cron', spec: '0 0 2 * * ?', payload: '{"backup":true}', status: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, name: '定期清理临时文件', kind: 'cron', spec: '0 0/30 * * * ?', payload: '{"days":7}', status: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ],
            total: 2,
        }),
    },
    {
        pattern: /^\/v1\/system\/dict\/type\/list$/,
        method: 'GET',
        handler: () => ({
            list: [
                { id: 1, type_name: '系统状态', type_code: 'common_status', status: 1, sort: 10, remark: '系统通用状态枚举', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, type_name: '是否状态', type_code: 'yes_no', status: 1, sort: 20, remark: '系统是否枚举', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ],
            total: 2,
        }),
    },
    {
        pattern: /^\/v1\/system\/file\/folder\/tree$/,
        method: 'GET',
        handler: () => {
            const children: MockFolder[] = []
            const root: MockFolder = { ...mockFolders[0], children }
            mockFolders.slice(1).forEach((f) => {
                if (f.parent_id === root.id) {
                    children.push({ ...f })
                }
            })
            return [root]
        },
    },
    {
        pattern: /^\/v1\/system\/file\/list$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = toParams(params)
            const page = Number(p.page || 1)
            const perPage = Number(p.per_page || 10)

            let filtered = [...mockFiles]

            // 1. 按文件类型过滤
            const fileType = p.file_type
            if (fileType) {
                const types = String(fileType).split(',')
                filtered = filtered.filter((f) => types.includes(f.file_type))
            }

            // 2. 按文件夹过滤
            const folderId = p.folder_id !== undefined ? (p.folder_id === null ? null : Number(p.folder_id)) : undefined
            const includeSubfolder = p.include_subfolder !== undefined ? Number(p.include_subfolder) : 0

            if (folderId !== undefined && folderId !== 0) {
                if (includeSubfolder === 1) {
                    if (folderId === 1) {
                        // 全部文件（根目录）且包含子孙目录，不需要针对 folderId 过滤
                    } else {
                        filtered = filtered.filter((f) => f.folder_id === folderId)
                    }
                } else {
                    filtered = filtered.filter((f) => f.folder_id === folderId)
                }
            }

            // 3. 按搜索词（原文件名模糊查询）
            const originName = p.origin_name
            if (originName) {
                const queryStr = String(originName).toLowerCase()
                filtered = filtered.filter((f) => f.origin_name.toLowerCase().includes(queryStr))
            }

            const total = filtered.length
            const start = (page - 1) * perPage
            const end = start + perPage
            const list = filtered.slice(start, end)

            return {
                list,
                total,
            }
        },
    },
    {
        pattern: /^\/v1\/system\/file\/folder\/create$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const newFolder = {
                id: mockFolders.length + 1,
                name: p.name ? String(p.name) : '新建文件夹',
                parent_id: p.parent_id !== undefined && p.parent_id !== null ? Number(p.parent_id) : 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            mockFolders.push(newFolder)
            return newFolder
        },
    },
    {
        pattern: /^\/v1\/system\/file\/folder\/update$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const folder = mockFolders.find((f) => f.id === Number(p.id))
            if (folder) {
                folder.name = p.name ? String(p.name) : folder.name
                folder.parent_id = p.parent_id !== undefined && p.parent_id !== null ? Number(p.parent_id) : folder.parent_id
                folder.updated_at = new Date().toISOString()
                return folder
            }
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/folder\/delete$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            mockFolders = mockFolders.filter((f) => f.id !== Number(p.id))
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/folder\/move$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const folder = mockFolders.find((f) => f.id === Number(p.id))
            if (folder) {
                folder.parent_id = p.target_parent_id !== undefined && p.target_parent_id !== null ? Number(p.target_parent_id) : 1
                folder.updated_at = new Date().toISOString()
            }
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/move$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const ids: number[] = Array.isArray(p.ids) ? p.ids.map(Number) : [Number(p.id)]
            const targetFolderId = p.target_folder_id !== undefined && p.target_folder_id !== null ? Number(p.target_folder_id) : 1
            mockFiles.forEach((f) => {
                if (ids.includes(f.id)) {
                    f.folder_id = targetFolderId
                    f.updated_at = new Date().toISOString()
                }
            })
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/delete$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const id = Number(p.id)
            const file = mockFiles.find((f) => f.id === id)
            if (file) {
                mockTrashFiles.push({
                    ...file,
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'admin',
                    deleted_reason: '用户主动删除',
                })
                mockFiles = mockFiles.filter((f) => f.id !== id)
            }
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/batch-delete$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const ids: number[] = Array.isArray(p.ids) ? p.ids.map(Number) : []
            ids.forEach((id: number) => {
                const file = mockFiles.find((f) => f.id === id)
                if (file) {
                    mockTrashFiles.push({
                        ...file,
                        deleted_at: new Date().toISOString(),
                        deleted_by: 'admin',
                        deleted_reason: '批量删除',
                    })
                }
            })
            mockFiles = mockFiles.filter((f) => !ids.includes(f.id))
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/folder\/stats$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = toParams(params)
            const folderId = Number(p.id)
            const fileCount = mockFiles.filter((f) => f.folder_id === folderId).length
            const childFolderCount = mockFolders.filter((f) => f.parent_id === folderId).length
            return {
                file_count: fileCount,
                child_folder_count: childFolderCount,
            }
        },
    },
    {
        pattern: /^\/v1\/system\/file\/references$/,
        method: 'GET',
        handler: () => [],
    },
    {
        pattern: /^\/v1\/system\/file\/detail$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = toParams(params)
            const id = Number(p.id)
            const file = mockFiles.find((f) => f.id === id) || mockTrashFiles.find((f) => f.id === id)
            return file || {}
        },
    },
    {
        pattern: /^\/v1\/dashboard\/overview$/,
        method: 'GET',
        handler: () => ({
            metrics: [
                { key: 'users', title: '活跃用户', value: 5, compare: '较昨日', change: '+20.0%', type: 'success' },
                { key: 'requests', title: '请求总量', value: 1234, compare: '较昨日', change: '+15.5%', type: 'success' },
                { key: 'errors', title: '异常告警', value: 3, compare: '较昨日', change: '-10.0%', type: 'success' },
                { key: 'tasks', title: '任务完成率', value: 98.5, suffix: '%', compare: '计划完成', change: '+0.0%', type: 'primary' },
            ],
            activities: [
                { key: '1', title: '登录系统', desc: 'super_admin', time: '17:30', type: 'success' },
                { key: '2', title: '更新个人信息', desc: 'super_admin', time: '17:35', type: 'success' },
                { key: '3', title: '新建管理员用户', desc: 'super_admin', time: '17:40', type: 'success' },
                { key: '4', title: '查询系统配置列表', desc: 'super_admin', time: '17:42', type: 'success' },
            ],
            user_login: {
                last_login: new Date().toISOString(),
                last_ip: '127.0.0.1',
            },
            trend: {
                dates: ['06-04', '06-05', '06-06', '06-07', '06-08', '06-09', '06-10'],
                requests: [120, 150, 110, 180, 210, 250, 300],
                errors: [2, 1, 0, 4, 3, 5, 1],
                logins: [5, 8, 6, 7, 9, 10, 5],
            },
            response_time: {
                buckets: [
                    { label: 'lt_100ms', lower_ms: 0, upper_ms: 100, count: 950 },
                    { label: '100_300ms', lower_ms: 100, upper_ms: 300, count: 50 },
                ],
                avg_ms: 25.4,
            },
            error_codes: [
                { status_code: 400, count: 8 },
                { status_code: 401, count: 2 },
            ],
            storage: {
                total_count: 120,
                total_size_bytes: 45000000,
                by_type: [
                    { file_type: 'image', count: 80, size_bytes: 15000000 },
                    { file_type: 'document', count: 40, size_bytes: 30000000 },
                ],
            },
        }),
    },
    {
        pattern: /^\/v1\/dashboard\/statistics$/,
        method: 'GET',
        handler: () => ({
            window_days: 7,
            window_start: '2026-06-04',
            window_end: new Date().toISOString(),
            generated_at: new Date().toISOString(),
            summary: {
                total_requests: 1020,
                total_errors: 15,
                total_logins: 45,
                avg_response_ms: 25.4,
                storage_total_count: 120,
                storage_total_size_bytes: 45000000,
            },
            trend: {
                days: [
                    { date: '06-04', request_count: 120, error_count: 2, login_count: 5 },
                    { date: '06-05', request_count: 150, error_count: 1, login_count: 8 },
                    { date: '06-06', request_count: 110, error_count: 0, login_count: 6 },
                    { date: '06-07', request_count: 180, error_count: 4, login_count: 7 },
                    { date: '06-08', request_count: 210, error_count: 3, login_count: 9 },
                    { date: '06-09', request_count: 250, error_count: 5, login_count: 10 },
                ],
            },
            response_time: {
                buckets: [
                    { label: 'lt_100ms', lower_ms: 0, upper_ms: 100, count: 950 },
                    { label: '100_300ms', lower_ms: 100, upper_ms: 300, count: 50 },
                    { label: '300_1000ms', lower_ms: 300, upper_ms: 1000, count: 15 },
                    { label: '1s_3s', lower_ms: 1000, upper_ms: 3000, count: 5 },
                    { label: 'gt_3s', lower_ms: 3000, upper_ms: 0, count: 0 },
                ],
                avg_ms: 25.4,
            },
            errors: {
                total: 15,
                categories: [
                    { key: 'http_4xx', title: 'HTTP 4xx', count: 10 },
                    { key: 'http_5xx', title: 'HTTP 5xx', count: 2 },
                    { key: 'biz_failure', title: '业务失败', count: 3 },
                ],
                status_codes: [
                    { status_code: 400, count: 8 },
                    { status_code: 401, count: 2 },
                    { status_code: 500, count: 2 },
                ],
                biz_status_codes: [
                    { status_code: 10001, count: 2 },
                    { status_code: 10002, count: 1 },
                ],
            },
            storage: {
                total_count: 120,
                total_size_bytes: 45000000,
                by_type: [
                    { file_type: 'image', count: 80, size_bytes: 15000000 },
                    { file_type: 'video', count: 10, size_bytes: 25000000 },
                    { file_type: 'document', count: 30, size_bytes: 5000000 },
                ],
            },
        }),
    },
    {
        pattern: /^\/v1\/dashboard\/monitor$/,
        method: 'GET',
        handler: () => ({
            host: {
                cpu: { usage_percent: 12.5, cores: 8 },
                memory: { total: 16384, used: 8192, available: 8192, usage_percent: 50.0 },
                disk: { total: 512, used: 256, free: 256, usage_percent: 50.0 },
                load: { load1: 0.5, load5: 0.6, load15: 0.7 },
                uptime: 86400,
                hostname: 'local-mock-server',
                os: 'macOS',
                platform: 'darwin',
                updated_at: new Date().toISOString(),
            },
            runtime: {
                goroutines: 32,
                heap_alloc: 45000000,
                heap_inuse: 60000000,
                heap_sys: 80000000,
                heap_released: 20000000,
                gc_cycles: 120,
                gc_pause_total_ns: 2500000,
                go_version: 'go1.22.0',
            },
            app: {
                online_sessions: 5,
                ws_online: 3,
                queue_pending: 0,
                queue_retrying: 0,
                queue_running: 0,
            },
        }),
    },
    {
        pattern: /^\/v1\/system\/dict\/item\/list$/,
        method: 'GET',
        handler: (params: unknown) => {
            const p = (params || {}) as Record<string, unknown>
            const typeCode = p['type_code'] || 'common_status'
            return {
                list: [
                    { id: 1, type_code: typeCode, label: '正常/是/Cron', value: '1', sort: 10, status: 1, created_at: new Date().toISOString() },
                    { id: 2, type_code: typeCode, label: '禁用/否/Delay', value: '0', sort: 20, status: 1, created_at: new Date().toISOString() },
                ],
                total: 2,
            }
        },
    },
    {
        pattern: /^\/v1\/system\/file\/trash\/list$/,
        method: 'GET',
        handler: () => ({
            list: mockTrashFiles,
            total: mockTrashFiles.length,
        }),
    },
    {
        pattern: /^\/v1\/system\/file\/trash\/restore$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const ids: number[] = Array.isArray(p.ids) ? p.ids.map(Number) : p.id ? [Number(p.id)] : []
            ids.forEach((id: number) => {
                const file = mockTrashFiles.find((f) => f.id === id)
                if (file) {
                    const originalFile = { ...file }
                    delete (originalFile as Partial<MockTrashFile>).deleted_at
                    delete (originalFile as Partial<MockTrashFile>).deleted_by
                    delete (originalFile as Partial<MockTrashFile>).deleted_reason
                    mockFiles.push(originalFile)
                }
            })
            mockTrashFiles = mockTrashFiles.filter((f) => !ids.includes(f.id))
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/trash\/batch-restore$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const ids: number[] = Array.isArray(p.ids) ? p.ids.map(Number) : []
            ids.forEach((id: number) => {
                const file = mockTrashFiles.find((f) => f.id === id)
                if (file) {
                    const originalFile = { ...file }
                    delete (originalFile as Partial<MockTrashFile>).deleted_at
                    delete (originalFile as Partial<MockTrashFile>).deleted_by
                    delete (originalFile as Partial<MockTrashFile>).deleted_reason
                    mockFiles.push(originalFile)
                }
            })
            mockTrashFiles = mockTrashFiles.filter((f) => !ids.includes(f.id))
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/trash\/destroy$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const ids = Array.isArray(p.ids) ? p.ids.map(Number) : p.id ? [Number(p.id)] : []
            mockTrashFiles = mockTrashFiles.filter((f) => !ids.includes(f.id))
            return {}
        },
    },
    {
        pattern: /^\/v1\/system\/file\/trash\/batch-destroy$/,
        method: 'POST',
        handler: (params: unknown) => {
            const p = toParams(params)
            const ids = Array.isArray(p.ids) ? p.ids.map(Number) : []
            mockTrashFiles = mockTrashFiles.filter((f) => !ids.includes(f.id))
            return {}
        },
    },
    {
        pattern: /^\/v1\/log\/request\/list$/,
        method: 'GET',
        handler: () => ({
            list: [
                { id: 1, ip: '127.0.0.1', method: 'GET', path: '/v1/admin-user/get', status: 200, duration_ms: 15, created_at: new Date().toISOString() },
                { id: 2, ip: '127.0.0.1', method: 'POST', path: '/v1/login', status: 200, duration_ms: 45, created_at: new Date().toISOString() },
            ],
            total: 2,
        }),
    },
    {
        pattern: /^\/v1\/log\/login\/list$/,
        method: 'GET',
        handler: () => ({
            list: [{ id: 1, username: 'admin', ip: '127.0.0.1', status: 1, msg: '登录成功', user_agent: 'Mozilla/5.0', created_at: new Date().toISOString() }],
            total: 1,
        }),
    },
    {
        pattern: /^\/v1\/log\/request\/mask-config$/,
        method: 'GET',
        handler: () => ({
            is_enabled: 1,
            masked_fields: ['password', 'token', 'access_token'],
        }),
    },
    {
        pattern: /^\/v1\/auth\/session\/list$/,
        method: 'GET',
        handler: () => ({
            list: [
                {
                    id: 'sess-12345',
                    username: 'admin',
                    nickname: '超级管理员',
                    ip: '127.0.0.1',
                    is_current: 1,
                    location: '本地局域网',
                    user_agent: 'Chrome',
                    login_at: new Date().toISOString(),
                    active_at: new Date().toISOString(),
                },
            ],
            total: 1,
        }),
    },
    {
        pattern: /^\/v1\/system\/export\/list$/,
        method: 'GET',
        handler: () => ({
            total: 2,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            data: [
                {
                    id: 22,
                    export_name: '请求日志',
                    scene: 'request_log',
                    scene_name: '请求日志',
                    task_code: 'export:request-log',
                    task_run_id: 3654,
                    trigger_user_id: 1,
                    status: 'failed',
                    status_name: '导出失败',
                    stage: 'failed',
                    stage_name: '失败',
                    queue: 'export',
                    progress: 0,
                    total_count: 0,
                    processed_count: 0,
                    file_id: 0,
                    file_uuid: '',
                    file_name: '',
                    file_size: 0,
                    file_url: '',
                    download_url: '',
                    has_file: false,
                    download_ready: false,
                    format: 'csv',
                    error_message: 'queue publisher unavailable',
                    fail_reason: 'queue publisher unavailable',
                    can_retry: true,
                    retry_block_reason: '',
                    started_at: null,
                    finished_at: '2026-06-10 16:56:54',
                    created_at: '2026-06-10 16:56:54',
                },
                {
                    id: 14,
                    export_name: '请求日志',
                    scene: 'request_log',
                    scene_name: '请求日志',
                    task_code: 'export:request-log',
                    task_run_id: 1974,
                    trigger_user_id: 1,
                    status: 'success',
                    status_name: '导出成功',
                    stage: 'download_ready',
                    stage_name: '可下载',
                    queue: 'export',
                    progress: 100,
                    total_count: 10,
                    processed_count: 10,
                    file_id: 14,
                    file_uuid: '3181079ac2ea4ea780dc58373adbe656',
                    file_name: 'request_logs_20260610113047.csv',
                    file_size: 3383,
                    file_url: 'http://127.0.0.1:9001/admin/v1/file/3181079ac2ea4ea780dc58373adbe656',
                    download_url: 'http://127.0.0.1:9001/admin/v1/file/3181079ac2ea4ea780dc58373adbe656',
                    has_file: true,
                    download_ready: true,
                    format: 'csv',
                    error_message: '',
                    fail_reason: '',
                    can_retry: false,
                    retry_block_reason: '仅失败导出任务允许重试',
                    started_at: '2026-06-10 11:30:47',
                    finished_at: '2026-06-10 11:30:47',
                    created_at: '2026-06-10 11:16:00',
                },
            ],
        }),
    },
    {
        pattern: /^\/v1\/task\/cron\/state$/,
        method: 'GET',
        handler: () => ({
            total: 0,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            data: [],
        }),
    },
    {
        pattern: /^\/v1\/task\/run\/list$/,
        method: 'GET',
        handler: () => ({
            total: 1,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            data: [
                {
                    id: 3867,
                    task_code: 'cron:demo',
                    kind: 'cron',
                    source: 'cron',
                    source_id: 'demo',
                    queue: '',
                    status: 'success',
                    attempt: 0,
                    max_retry: 0,
                    retry_of_run_id: 0,
                    retry_root_run_id: 0,
                    retry_seq: 0,
                    error_message: '',
                    duration_ms: 21.3433,
                    started_at: new Date().toISOString(),
                    finished_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    trigger_user_id: 0,
                    trigger_account: '',
                    detail_record_mode: 'all',
                    can_retry: false,
                    retry_block_reason: '仅失败、超时或中断任务允许重试',
                    retry_count: 0,
                    latest_retry_run_id: 0,
                    latest_retry_status: '',
                },
            ],
        }),
    },
    {
        pattern: /^\/v1\/task\/run\/stats$/,
        method: 'GET',
        handler: () => ({
            task_code: '',
            kind: '',
            source: '',
            total_count: 100,
            success_count: 98,
            failed_count: 2,
            canceled_count: 0,
            timeout_count: 0,
            interrupted_count: 0,
            sampled_success_count: 10,
            duration_total_ms: 1500,
            duration_max_ms: 50,
            duration_avg_ms: 15,
            success_rate: 98,
        }),
    },
    {
        pattern: /^\/v1\/task\/run\/stats\/trend$/,
        method: 'GET',
        handler: () => ({
            result: [
                {
                    window_start: '2026-06-09 00:00:00',
                    window_size: 'day',
                    total_count: 50,
                    success_count: 49,
                    failed_count: 1,
                    canceled_count: 0,
                    timeout_count: 0,
                    interrupted_count: 0,
                    sampled_success_count: 5,
                    duration_total_ms: 750,
                    duration_max_ms: 45,
                },
                {
                    window_start: '2026-06-10 00:00:00',
                    window_size: 'day',
                    total_count: 50,
                    success_count: 49,
                    failed_count: 1,
                    canceled_count: 0,
                    timeout_count: 0,
                    interrupted_count: 0,
                    sampled_success_count: 5,
                    duration_total_ms: 750,
                    duration_max_ms: 45,
                },
            ],
        }),
    },
    {
        pattern: /^\/v1\/file\/[a-f0-9]{32}$/,
        method: 'GET',
        handler: () => new Blob(['mock file content'], { type: 'text/csv' }),
    },
]
