import type { Menu } from '@/types/menu'

export function createMenuForm(): Menu {
    return {
        id: 0,
        parent_id: 0,
        title: '',
        code: '',
        name: '',
        type: MENU_TYPE.MENU,
        icon: '',
        path: '',
        component: '',
        redirect: '',
        is_show: 1,
        is_auth: 1,
        is_new_window: 0,
        is_external_links: MENU_SWITCH_VALUE.NO,
        sort: 100,
        status: 1,
        description: '',
        animate_duration: 0,
        animate_enter: '',
        animate_leave: '',
        api_list: [],
        created_at: '',
        updated_at: '',
    }
}

export const MENU_TYPE = {
    DIRECTORY: 1,
    MENU: 2,
    BUTTON: 3,
}

export const MENU_TYPE_OPTIONS = [
    { label: '目录', value: MENU_TYPE.DIRECTORY, type: 'info' as const },
    { label: '菜单', value: MENU_TYPE.MENU, type: 'success' as const },
    { label: '按钮', value: MENU_TYPE.BUTTON, type: 'warning' as const },
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
    BASIC_INFO: 1,
    PERMISSION: 2,
}

export const MENU_STATUS = {
    DISABLED: 0,
    ENABLED: 1,
    ALL: 2,
}

export const MENU_STATUS_OPTIONS = [
    { label: '禁用', value: MENU_STATUS.DISABLED, type: 'danger' as const },
    { label: '启用', value: MENU_STATUS.ENABLED, type: 'success' as const },
]

export function getMenuStatusLabel(status: number) {
    return MENU_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || '未知'
}

export const MENU_SWITCH_VALUE = {
    NO: 0,
    YES: 1,
}

export const MENU_SUBMIT_DEBOUNCE_TIME = 3000

export const MENU_PERMISSION_QUERY_PARAMS = {
    page: 1,
    per_page: 9999,
    is_auth: 1,
}

export const MENU_CASCADER_PROPS = {
    checkStrictly: true,
    expandTrigger: 'hover',
    label: 'title',
    value: 'id',
    emitPath: false,
    disabled: 'disabled',
}

export function createMenuQuery() {
    return {
        keyword: null,
        is_auth: null,
        status: MENU_STATUS.ALL,
    }
}
