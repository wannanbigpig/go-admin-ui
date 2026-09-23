import type { UserPermission } from '@/types/auth'

const BUTTON_TYPE = 3
const BUTTON_TYPE_TEXT = 'button'
const SHOW_STATUS = 1

function isButtonType(type: unknown): boolean {
    if (typeof type === 'number') return type === BUTTON_TYPE
    if (typeof type === 'string') return type === BUTTON_TYPE_TEXT || Number(type) === BUTTON_TYPE
    return false
}

export interface ButtonPermissionInfo {
    icon: string
    title: string
    is_show: boolean
    [key: string]: unknown
}

export function extractButtonPermissions(menuTree: UserPermission[] = []): string[] {
    const permissions: string[] = []

    const walk = (items?: UserPermission[]) => {
        if (!Array.isArray(items)) return
        items.forEach((item) => {
            if (isButtonType(item?.type)) {
                if (item.code) {
                    permissions.push(item.code)
                }
            }
            walk(item?.children)
        })
    }

    walk(menuTree)
    return permissions
}

export function buildButtonPermissionMap(menuTree: UserPermission[] = []): Map<string, ButtonPermissionInfo> {
    const map = new Map<string, ButtonPermissionInfo>()

    const walk = (items?: UserPermission[]) => {
        if (!Array.isArray(items)) return
        items.forEach((item) => {
            if (isButtonType(item?.type)) {
                if (item.code) {
                    map.set(item.code, {
                        icon: item.icon || '',
                        title: item.title || '',
                        is_show: Number(item.is_show) === SHOW_STATUS,
                    })
                }
            }
            walk(item?.children)
        })
    }

    walk(menuTree)
    return map
}

/**
 * 按钮权限判定。
 * checkShow=true 时要求 `is_show===true`（UI 可见）；false 时仅要求权限码存在（API 权威语义）。
 * `v-permission` 默认 checkShow=true，属展示层约定，不是安全边界。
 */
export function hasButtonPermission(permissionMap: Map<string, ButtonPermissionInfo>, permissionList: string[], permission: unknown, checkShow = false): boolean {
    if (permission === null || permission === undefined) return false

    let targetPerms: string[]
    if (typeof permission === 'string') {
        const trimmed = permission.trim()
        if (trimmed === '') return false
        targetPerms = [trimmed]
    } else if (Array.isArray(permission)) {
        const clean = permission.filter((p): p is string => typeof p === 'string' && p.trim() !== '')
        if (clean.length === 0) return false
        targetPerms = clean
    } else {
        return false
    }

    const permissions = Array.isArray(permissionList) ? permissionList : []
    const matcher = (perm: string) => {
        const hasPerm = permissions.includes(perm)
        if (!hasPerm || !checkShow) return hasPerm
        return permissionMap.get(perm)?.is_show === true
    }

    return targetPerms.every(matcher)
}
