import type { Menu } from '@/types/menu'

export function createMenuDefault(): Menu {
    return {
        id: '',
        parent_id: 0,
        title: '',
        code: '',
        name: '',
        type: 1, // 1: 目录, 2: 菜单, 3: 按钮
        icon: '',
        path: '',
        component: '',
        redirect: '',
        is_show: 1,
        is_auth: 1,
        is_new_window: 0,
        is_external_links: 0,
        sort: 0,
    }
}

// 别名
export const createMenuForm = createMenuDefault

export const MENU_TYPE = {
    DIRECTORY: 1,
    MENU: 2,
    BUTTON: 3,
}

export const MENU_TYPE_OPTIONS = [
    { label: '目录', value: MENU_TYPE.DIRECTORY, type: 'info' },
    { label: '菜单', value: MENU_TYPE.MENU, type: 'success' },
    { label: '按钮', value: MENU_TYPE.BUTTON, type: 'warning' },
]

export function getMenuTypeLabel(type: number) {
    return MENU_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || '未知'
}

export function getMenuTypeTag(type: number) {
    return MENU_TYPE_OPTIONS.find((opt) => opt.value === type)?.type || 'info'
}

export const MENU_OPERATION_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const MENU_STEP = {
    BASIC: 0,
    ADVANCED: 1,
}

export const MENU_SUBMIT_DEBOUNCE_TIME = 300
export const MENU_SWITCH_VALUE = {
    OPEN: 1,
    CLOSE: 0,
}
