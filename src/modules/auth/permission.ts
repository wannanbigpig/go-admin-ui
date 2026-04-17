import type { UserPermission } from '@/types/auth'

const BUTTON_TYPE = 3
const SHOW_STATUS = 1

export interface ButtonPermissionInfo {
    icon: string
    title: string
    is_show: boolean
}

export function extractButtonPermissions(menuTree: UserPermission[] = []): string[] {
    const permissions: string[] = []

    const walk = (items?: UserPermission[]) => {
        if (!Array.isArray(items)) return
        items.forEach((item) => {
            if (item?.type === ('button' as any) || item?.type === BUTTON_TYPE) {
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
            if (item?.type === ('button' as any) || item?.type === BUTTON_TYPE) {
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

export function hasButtonPermission(permissionMap: Map<string, ButtonPermissionInfo>, permissionList: string[], permission: string | string[], checkShow = false): boolean {
    if (!permission) return true

    const permissions = Array.isArray(permissionList) ? permissionList : []
    const matcher = (perm: string) => {
        const hasPerm = permissions.includes(perm)
        if (!hasPerm || !checkShow) return hasPerm
        return permissionMap.get(perm)?.is_show === true
    }

    return Array.isArray(permission) ? permission.every(matcher) : matcher(permission)
}
