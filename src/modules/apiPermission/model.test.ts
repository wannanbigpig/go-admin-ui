import { describe, expect, it } from 'vitest'
import { toApiPermissionUpdatePayload, type ApiPermission } from './model'

describe('toApiPermissionUpdatePayload', () => {
    it('只提交可编辑元数据，不提交路由和鉴权声明', () => {
        const permission: ApiPermission = {
            id: 7,
            code: 'api-code',
            name: '接口名称',
            description: '接口描述',
            sort: 80,
            route: '/v1/example',
            method: 'POST',
            is_auth: 2,
            is_effective: 1,
            func_path: 'example.Handler',
        }

        expect(toApiPermissionUpdatePayload(permission)).toEqual({
            id: 7,
            name: '接口名称',
            description: '接口描述',
            sort: 80,
        })
    })
})
