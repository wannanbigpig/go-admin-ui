import { describe, expect, it } from 'vitest'
import componentMap from './componentMap'

const backendMenuComponentKeys = [
    'home:index',
    'about:index',
    'permission:adminUser',
    'permission:api',
    'permission:department',
    'permission:menuList',
    'permission:role',
    'log:adminLogin',
    'log:request',
    'log:session',
    'system:config',
    'system:dict',
    'system:file',
    'system:notificationManage',
    'system:task',
    'system:taskStats',
    'product:index',
    'other:notFound',
]

describe('componentMap', () => {
    it('should keep backend menu component keys mapped', () => {
        for (const key of backendMenuComponentKeys) {
            expect(componentMap[key], key).toBeTypeOf('function')
        }
    })
})
