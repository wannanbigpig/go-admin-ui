import type {
    SystemConfigQuery,
    DictTypeQuery,
    DictItemQuery,
    TaskQuery,
    TaskRunQuery,
    TaskRunStatsQuery,
    TaskRecordPolicyPayload,
    TaskOperationConfigPayload,
    TaskDefinition,
    CronTaskStateQuery,
    SystemFileQuery,
    LocaleTextMap,
} from '@/types/system'

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
        is_visible: 1,
        include_hidden: null,
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
        detail_record_mode: null,
        start_time: null,
        end_time: null,
    }
}

export function createTaskRunStatsQuery(): TaskRunStatsQuery {
    return {
        task_code: null,
        kind: null,
        source: null,
        start_time: null,
        end_time: null,
    }
}

export function createTaskRecordPolicyPayload(row?: Partial<TaskDefinition>): TaskRecordPolicyPayload {
    return {
        task_code: row?.code || '',
        record_success_mode: row?.record_success_mode || 'all',
        record_success_rate: Number(row?.record_success_rate ?? 100),
        record_success_interval_seconds: Number(row?.record_success_interval_seconds ?? 0),
        record_detail_on_manual: Number(row?.record_detail_on_manual ?? 1),
        record_detail_on_failure: Number(row?.record_detail_on_failure ?? 1),
    }
}

export function createTaskOperationConfigPayload(row?: Partial<TaskDefinition>): TaskOperationConfigPayload {
    return {
        task_code: row?.code || '',
        status: Number(row?.status ?? 1),
        allow_manual: Number(row?.allow_manual ?? 0),
        allow_retry: Number(row?.allow_retry ?? 1),
        cron_spec: row?.cron_spec || '',
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

export function createSystemFileQuery(): SystemFileQuery {
    return {
        page: 1,
        per_page: 10,
        origin_name: null,
        uuid: null,
        mime_type: null,
        file_type: null,
        is_public: null,
        storage_driver: null,
        storage_status: null,
        is_referenced: null,
        is_deleted: null,
        uid: null,
        folder_id: null,
        include_subfolder: 0,
        start_time: null,
        end_time: null,
    }
}
