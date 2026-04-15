const BUTTON_TYPE = 3
const SHOW_STATUS = 1

export function extractButtonPermissions(menuTree = []) {
    const permissions = []

    const walk = (items) => {
        if (!Array.isArray(items)) return
        items.forEach((item) => {
            if (item?.type === BUTTON_TYPE && item.code) {
                permissions.push(item.code)
            }
            walk(item?.children)
        })
    }

    walk(menuTree)
    return permissions
}

export function buildButtonPermissionMap(menuTree = []) {
    const map = new Map()

    const walk = (items) => {
        if (!Array.isArray(items)) return
        items.forEach((item) => {
            if (item?.type === BUTTON_TYPE && item.code) {
                map.set(item.code, {
                    icon: item.icon || '',
                    title: item.title || '',
                    is_show: item.is_show === SHOW_STATUS,
                })
            }
            walk(item?.children)
        })
    }

    walk(menuTree)
    return map
}

export function hasButtonPermission(permissionMap, permissionList, permission, checkShow = false) {
    if (!permission) return true

    const permissions = Array.isArray(permissionList) ? permissionList : []
    const matcher = (perm) => {
        const hasPerm = permissions.includes(perm)
        if (!hasPerm || !checkShow) return hasPerm
        return permissionMap.get(perm)?.is_show === true
    }

    return Array.isArray(permission) ? permission.every(matcher) : matcher(permission)
}
