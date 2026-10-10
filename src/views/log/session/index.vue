<template>
    <div>
        <xl-pro-table
            :search-model="searchModel"
            :table-title="tableTitle"
            :search-schema="searchSchema"
            :loading="loading"
            :data="sessionList"
            :pagination="pagination"
            :search-max-show="4"
            @search="onSearch"
            @reset="onReset"
            @sort-change="handleSortChange"
        >
            <template #td="{ item, val }">
                <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                    {{ item.tag[val as string | number]?.text || val }}
                </el-tag>
                <span v-else>{{ val }}</span>
            </template>
            <template #operation>
                <el-table-column width="110" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <xl-action-button
                            v-permission="'session:revoke'"
                            type="danger"
                            link
                            :show-icon="false"
                            :text="t('log.session.revoke')"
                            :disabled="Number(scope.row.is_revoked) === 1 || revokingId === scope.row.id"
                            @click="handleRevoke(scope.row)"
                        />
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { createOnlineSessionQuery } from '@/modules/log/model'
import { fetchOnlineSessionList, revokeOnlineSessionById } from '@/modules/log/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import type { ProTableSearchSchema } from '@/components/proTable/types'
import type { TableColumn } from '@/types/common'
import type { OnlineSession } from '@/types/log'

const { t } = useI18n()

const queryWhere = reactive(createOnlineSessionQuery())
const dateRange = ref<[string, string] | []>([])

const {
    loading,
    items: sessionList,
    pagination,
    getList,
    handleSearch,
    handleSortChange,
    handleReset: rawHandleReset,
} = useListPage<OnlineSession, typeof queryWhere>({
    query: queryWhere,
    sortFields: ['uid', 'token_expires', 'created_at'],
    transformParams: (query) => {
        const params = { ...query }
        const selectedDateRange = dateRange.value.length === 2 ? dateRange.value : null
        applyDateRangeToQuery(params, selectedDateRange)
        return params
    },
    fetcher: async (params) => {
        try {
            return await fetchOnlineSessionList(params)
        } catch (error) {
            Logger.error('获取在线会话列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const searchModel = reactive({
    uid: '',
    username: '',
    ip: '',
    is_revoked: '',
    dateRange: [] as string[],
})

const onSearch = (model: Record<string, unknown>) => {
    queryWhere.uid = (model.uid as string) || null
    queryWhere.username = (model.username as string) || null
    queryWhere.ip = (model.ip as string) || null
    queryWhere.is_revoked = model.is_revoked !== undefined && model.is_revoked !== '' ? (model.is_revoked as number) : null
    if (Array.isArray(model.dateRange) && model.dateRange.length === 2) {
        dateRange.value = model.dateRange as [string, string]
    } else {
        dateRange.value = []
    }
    handleSearch()
}

const onReset = async () => {
    dateRange.value = []
    await rawHandleReset()
}

const revokingId = ref<number | string | null>(null)

const handleRevoke = async (row: OnlineSession) => {
    try {
        const { value } = await ElMessageBox.prompt(t('log.session.revokeConfirm'), t(CONFIRM_DIALOG_TITLE), {
            type: 'warning',
            inputPlaceholder: t('log.session.revokeReasonPlaceholder'),
        })
        revokingId.value = row.id
        await revokeOnlineSessionById(row.id, value || '')
        ElMessage.success(t('common.result.operationSuccess'))
        await getList()
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        Logger.error('撤销会话失败:', error)
    } finally {
        revokingId.value = null
    }
}

const searchSchema = computed<ProTableSearchSchema>(() => [
    {
        prop: 'uid',
        label: t('log.session.uid'),
        type: 'input',
        placeholder: t('log.session.uidPlaceholder'),
        span: 4,
    },
    {
        prop: 'username',
        label: t('log.session.username'),
        type: 'input',
        placeholder: t('log.session.usernamePlaceholder'),
        span: 4,
    },
    {
        prop: 'ip',
        label: t('log.session.ip'),
        type: 'input',
        placeholder: t('log.session.ipPlaceholder'),
        span: 4,
    },
    {
        prop: 'is_revoked',
        label: t('log.session.revoked'),
        type: 'select',
        options: [
            { label: t('common.yes'), value: 1 },
            { label: t('common.no'), value: 0 },
        ],
        span: 4,
    },
    {
        prop: 'dateRange',
        label: t('log.session.loginTime'),
        type: 'daterange',
        span: 8,
    },
])

const tableTitle = computed<TableColumn<OnlineSession>[]>(
    () =>
        [
            { prop: 'username', h_label: t('log.session.username'), minWidth: 120, overflow: true },
            { prop: 'uid', sortable: 'custom', h_label: t('log.session.uid'), width: 90, align: 'center' },
            { prop: 'ip', h_label: t('log.session.ip'), minWidth: 130, overflow: true },
            { prop: 'os', h_label: t('log.session.os'), width: 120, overflow: true },
            { prop: 'browser', h_label: t('log.session.browser'), width: 120, overflow: true },
            {
                prop: 'is_revoked',
                h_label: t('log.session.revoked'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: {
                    0: { type: 'success', text: t('common.no') },
                    1: { type: 'danger', text: t('common.yes') },
                },
            },
            { prop: 'token_expires', sortable: 'custom', h_label: t('log.session.tokenExpires'), width: 160, align: 'center' },
            { prop: 'created_at', sortable: 'custom', h_label: t('log.session.loginTime'), width: 160, align: 'center' },
        ]
)

onMounted(() => {
    getList()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}
</style>
