import type { Menu } from '@/types/menu'
import { LOCALE_OPTIONS } from '@/locales'

export const MENU_TITLE_LOCALES = LOCALE_OPTIONS.map((option) => option.value)

export function createEmptyTitleI18n(): Record<string, string> {
    return MENU_TITLE_LOCALES.reduce<Record<string, string>>((result, locale) => {
        result[locale] = ''
        return result
    }, {})
}

export function createMenuForm(): Menu {
    return {
        id: 0,
        pid: 0,
        title_i18n: createEmptyTitleI18n(),
        code: '',
        name: '',
        type: MENU_TYPE.MENU,
        icon: '',
        path: '',
        component_key: '',
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
    ALL: '' as const,
}

export const MENU_SWITCH_VALUE = {
    NO: 0,
    YES: 1,
}

export const MENU_CASCADER_PROPS = {
    checkStrictly: true,
    expandTrigger: 'hover',
    label: 'title',
    value: 'id',
    emitPath: false,
    disabled: 'disabled',
}
