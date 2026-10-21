<template>
    <div>
        <xl-pro-table
            :search-model="searchModel"
            :table-title="tableTitle"
            :search-schema="searchSchema"
            :loading="loading"
            :data="logList"
            :pagination="pagination"
            :search-max-show="4"
            @search="onSearch"
            @reset="onReset"
            @sort-change="handleSortChange"
        >
            <template #td="{ item, val }">
                <el-tag v-if="item.tag" :type="item.tag[val as keyof typeof item.tag]?.type || 'info'">
                    {{ item.tag[val as keyof typeof item.tag]?.text || val }}
                </el-tag>
                <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" :content="t('common.actions.copySuccess')" placement="left">
                    <span @click="copyText(String(val))" class="xl-cursor-pointer"> {{ val }}</span>
                </el-tooltip>
                <span v-else>
                    {{ val }}
                </span>
            </template>
            <template #operation>
                <el-table-column width="100" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <xl-action-button v-permission="'adminLoginLog:detail'" :button-info="detailButtonInfo" type="primary" link :show-icon="false" @click="openDetailDrawer(scope.row)" />
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" :title="t('log.login.detailTitle')" direction="rtl" size="var(--xl-drawer-md)">
            <div v-loading="detailLoading" :element-loading-text="t('log.login.loadingText')" class="detail-content">
                <template v-if="currentDetail">
                    <DetailGrid :title="t('common.labels.basicInfo')">
                        <DetailItem :label="t('log.login.username')">{{ currentDetail.username || '-' }}</DetailItem>
                        <DetailItem :label="t('log.login.ipAddress')">{{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}</DetailItem>
                        <DetailItem :label="t('log.login.operationType')">
                            <el-tag :type="currentDetail.type === 1 ? 'primary' : 'info'">
                                {{ currentDetail.type_name || (currentDetail.type === 1 ? t('log.login.loginAction') : currentDetail.type === 2 ? t('log.login.refresh') : '-') }}
                            </el-tag>
                        </DetailItem>
                        <DetailItem :label="t('log.login.loginStatus')">
                            <el-tag :type="currentDetail.login_status === 1 ? 'success' : 'danger'">
                                {{ currentDetail.login_status_name || (currentDetail.login_status === 1 ? t('common.status.success') : t('common.status.failed')) }}
                            </el-tag>
                        </DetailItem>
                        <DetailItem :label="t('log.login.durationMs')">{{ currentDetail.execution_time || '-' }}</DetailItem>
                        <DetailItem v-if="currentDetail.os" :label="t('log.login.os')">{{ currentDetail.os || '-' }}</DetailItem>
                        <DetailItem v-if="currentDetail.browser" :label="t('log.login.browser')">{{ currentDetail.browser || '-' }}</DetailItem>
                        <DetailItem :label="t('log.login.loginTime')">{{ currentDetail.created_at || '-' }}</DetailItem>
                        <DetailItem v-if="currentDetail.login_status === 0 && currentDetail.login_fail_reason" :label="t('log.login.failReason')" :span="2">
                            {{ currentDetail.login_fail_reason || '-' }}
                        </DetailItem>
                        <DetailItem v-if="currentDetail.is_revoked === 1" :label="t('log.login.revoked')">
                            <el-tag type="danger">{{ t('common.yes') }}</el-tag>
                        </DetailItem>
                        <DetailItem v-if="currentDetail.is_revoked === 1 && currentDetail.revoked_reason" :label="t('log.login.revokedReason')" :span="2">
                            {{ currentDetail.revoked_reason || '-' }}
                        </DetailItem>
                    </DetailGrid>

                    <template v-if="currentDetail.token_hash || currentDetail.refresh_token_hash">
                        <DetailGrid :title="t('log.login.sessionInfo')" :columns="1" class="session-info">
                            <DetailItem v-if="currentDetail.token_hash" :label="t('log.login.accessToken')">
                                <code class="hash-content">{{ currentDetail.token_hash }}</code>
                            </DetailItem>
                            <DetailItem v-if="currentDetail.refresh_token_hash" :label="t('log.login.refreshToken')">
                                <code class="hash-content">{{ currentDetail.refresh_token_hash }}</code>
                            </DetailItem>
                        </DetailGrid>
                    </template>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import DetailGrid from '@/components/detailGrid/index.vue'
import DetailItem from '@/components/detailGrid/DetailItem.vue'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { computed, onMounted, reactive } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useClipboard } from '@/composables/useClipboard'
import { useAdminLoginLogPage } from '@/modules/log/useAdminLoginLogPage'
import type { ProTableSearchSchema } from '@/components/proTable/types'
import type { TableColumn } from '@/types/common'
import type { LoginLog } from '@/types/log'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const { copyText } = useClipboard()
const detailButtonInfo = getButtonInfoFull('adminLoginLog:detail')
const { t } = useI18n()

const { loading, logList, pagination, queryWhere, dateRange, showDetailDrawer, currentDetail, detailLoading, formatIpAddress, handleSearch, handleSortChange, handleReset, getList, openDetailDrawer } =
    useAdminLoginLogPage()

const searchModel = reactive({
    username: '',
    ip: '',
    login_status: '',
    dateRange: [] as string[],
})

const onSearch = (model: Record<string, unknown>) => {
    queryWhere.username = (model.username as string) || null
    queryWhere.ip = (model.ip as string) || null
    queryWhere.login_status = model.login_status !== undefined && model.login_status !== '' ? (model.login_status as number) : null
    if (Array.isArray(model.dateRange) && model.dateRange.length === 2) {
        dateRange.value = model.dateRange as [string, string]
    } else {
        dateRange.value = []
    }
    handleSearch()
}

const onReset = () => {
    dateRange.value = []
    handleReset()
}

onMounted(() => {
    getList()
})

const searchSchema = computed<ProTableSearchSchema>(() => [
    {
        prop: 'username',
        label: t('log.login.username'),
        type: 'input',
        placeholder: t('log.login.inputUsername'),
        span: 4,
    },
    {
        prop: 'ip',
        label: t('log.login.ipAddress'),
        type: 'input',
        placeholder: t('log.login.inputIp'),
        span: 4,
    },
    {
        prop: 'login_status',
        label: t('log.login.loginStatus'),
        type: 'select',
        placeholder: t('log.login.selectStatus'),
        options: [
            { label: t('common.status.success'), value: 1 },
            { label: t('common.status.failed'), value: 0 },
        ],
        span: 4,
    },
    {
        prop: 'dateRange',
        label: t('log.login.loginTime'),
        type: 'daterange',
        span: 8,
    },
])

const tableTitle = computed(
    () =>
        [
            { prop: 'id', sortable: 'custom', align: 'center', h_label: t('common.labels.id'), width: 80 },
            { prop: 'username', sortable: 'custom', h_label: t('log.login.username'), minWidth: 120, overflow: true },
            {
                prop: 'type',
                h_label: t('log.login.type'),
                align: 'center',
                width: 100,
                customRow: true,
                tag: {
                    1: { type: 'primary', text: t('log.login.login') },
                    2: { type: 'info', text: t('log.login.refresh') },
                },
            },
            {
                prop: 'login_status',
                h_label: t('common.labels.status'),
                align: 'center',
                width: 100,
                customRow: true,
                tag: {
                    1: { type: 'success', text: t('common.status.success') },
                    0: { type: 'danger', text: t('common.status.failed') },
                },
            },
            { prop: 'ip', h_label: t('log.login.ipAddress'), minWidth: 130, customRow: true, copy: true },
            { prop: 'os', h_label: t('log.login.os'), width: 120, overflow: true },
            { prop: 'browser', h_label: t('log.login.browser'), width: 120, overflow: true },
            { prop: 'execution_time', sortable: 'custom', h_label: t('log.login.durationMs'), align: 'center', width: 100 },
            {
                prop: 'is_revoked',
                h_label: t('log.login.revoked'),
                align: 'center',
                width: 80,
                customRow: true,
                tag: {
                    0: { type: 'success', text: t('common.no') },
                    1: { type: 'danger', text: t('common.yes') },
                },
            },
            { prop: 'created_at', sortable: 'custom', h_label: t('log.login.time'), align: 'center', width: 160 },
        ] as TableColumn<LoginLog>[]
)
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
    width: 100%;
}
.detail-content {
    min-width: 0;
    .hash-content {
        font-family: monospace;
        font-size: var(--xl-font-sm);
        word-break: break-all;
    }
}
.session-info {
    margin-top: var(--xl-space-6);
}
</style>
