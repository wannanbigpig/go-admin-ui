import type { SystemConfigQuery, DictTypeQuery, DictItemQuery, TaskQuery, TaskRunQuery, CronTaskStateQuery, LocaleTextMap } from '@/types/system'

export function createLocaleTextMap(): LocaleTextMap {
    return {
        'zh-CN': '',
        'en-US': '',
    }
}

export function createSystemConfigQuery(): SystemConfigQuery {
    return {
        page: 1,
        per_page: 10,
        config_key: null,
        config_name: null,
        group_code: null,
        value_type: null,
        status: null,
    }
}

export function createDictTypeQuery(): DictTypeQuery {
    return {
        page: 1,
        per_page: 10,
        type_code: null,
        type_name: null,
        status: null,
    }
}

export function createDictItemQuery(typeCode = ''): DictItemQuery {
    return {
        page: 1,
        per_page: 10,
        type_code: typeCode,
        label: null,
        value: null,
        status: null,
    }
}

export function createTaskQuery(): TaskQuery {
    return {
        page: 1,
        per_page: 10,
        code: null,
        name: null,
        kind: null,
        status: null,
        allow_manual: null,
        allow_retry: null,
        is_high_risk: null,
    }
}

export function createTaskRunQuery(): TaskRunQuery {
    return {
        page: 1,
        per_page: 10,
        task_code: null,
        kind: null,
        source: null,
        source_id: null,
        status: null,
        start_time: null,
        end_time: null,
    }
}

export function createCronTaskStateQuery(): CronTaskStateQuery {
    return {
        page: 1,
        per_page: 10,
        task_code: null,
        last_status: null,
    }
}
