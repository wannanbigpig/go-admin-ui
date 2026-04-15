import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'

export const MENU_TYPE = {
    DIRECTORY: 1,
    MENU: 2,
    BUTTON: 3,
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

export const MENU_SWITCH_VALUE = {
    NO: 0,
    YES: 1,
}

export const MENU_SUBMIT_DEBOUNCE_TIME = DEFAULT_SUBMIT_DELAY

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

export function createMenuForm() {
    return {
        id: 0,
        title: '',
        pid: 0,
        path: '',
        redirect: '',
        name: '',
        component: '',
        code: '',
        is_external_links: 0,
        icon: '',
        sort: 100,
        type: MENU_TYPE.MENU,
        is_auth: 1,
        status: 1,
        is_show: 1,
        is_new_window: 0,
        animate_duration: 0,
        animate_enter: '',
        animate_leave: '',
        description: '',
        api_list: [],
    }
}

export function processMenuItem(item, currentId) {
    const menuItem = { ...item }

    if (item.id === currentId || item.type === MENU_TYPE.BUTTON) {
        menuItem.disabled = true
    }

    if (item.children?.length > 0) {
        menuItem.children = item.children.map((child) => processMenuItem(child, currentId))
    }

    return menuItem
}

export function createSelectableMenuTree(menuList, currentMenuId) {
    const processedList = Array.isArray(menuList) ? menuList.map((item) => processMenuItem(item, currentMenuId)) : []
    return [{ title: '顶级菜单', id: 0 }, ...processedList]
}
