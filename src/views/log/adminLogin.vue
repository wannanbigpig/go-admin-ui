<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('log.login.username')" prop="username">
                            <el-input :placeholder="t('log.login.inputUsername')" v-model.trim="queryWhere.username" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.login.ipAddress')" prop="ip">
                            <el-input :placeholder="t('log.login.inputIp')" v-model.trim="queryWhere.ip" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.login.loginStatus')" prop="login_status">
                            <el-select v-model="queryWhere.login_status" clearable :placeholder="t('log.login.selectStatus')">
                                <el-option :label="t('common.status.success')" :value="1" />
                                <el-option :label="t('common.status.failed')" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item :label="t('log.login.loginTime')" prop="dateRange">
                            <xl-date-range-picker v-model="dateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="4" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="loading" :data="logList" :tableTitle="tableTitle" :pagination="pagination">
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
            </xl-table-list>
        </div>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" :title="t('log.login.detailTitle')" direction="rtl" size="50%">
            <div v-loading="detailLoading" :element-loading-text="t('log.login.loadingText')" class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item :label="t('log.login.username')" :span="2">{{ currentDetail.username || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.ipAddress')" :span="2">{{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.operationType')">
                            <el-tag :type="currentDetail.type === 1 ? 'primary' : 'info'">
                                {{ currentDetail.type_name || (currentDetail.type === 1 ? t('log.login.loginAction') : currentDetail.type === 2 ? t('log.login.refresh') : '-') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.loginStatus')">
                            <el-tag :type="currentDetail.login_status === 1 ? 'success' : 'danger'">
                                {{ currentDetail.login_status_name || (currentDetail.login_status === 1 ? t('common.status.success') : t('common.status.failed')) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.durationMs')">{{ currentDetail.execution_time || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.os" :label="t('log.login.os')">{{ currentDetail.os || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.browser" :label="t('log.login.browser')">{{ currentDetail.browser || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.loginTime')" :span="2">{{ currentDetail.created_at || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.login_status === 0 && currentDetail.login_fail_reason" :label="t('log.login.failReason')" :span="2">
                            {{ currentDetail.login_fail_reason || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1" :label="t('log.login.revoked')">
                            <el-tag type="danger">{{ t('common.yes') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1 && currentDetail.revoked_reason" :label="t('log.login.revokedReason')" :span="2">
                            {{ currentDetail.revoked_reason || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <template v-if="currentDetail.access_token || currentDetail.refresh_token">
                        <el-divider />

                        <el-collapse v-model="activeCollapse">
                            <el-collapse-item v-if="currentDetail.access_token" name="accessToken">
                                <template #title>
                                    <span>{{ t('log.login.accessToken') }}</span>
                                    <el-button link type="primary" size="small" class="format-btn" @click.stop="toggleTokenFormat('accessToken')">
                                        {{ accessTokenFormatted ? t('log.login.restore') : t('log.login.format') }}
                                    </el-button>
                                </template>
                                <pre class="json-content">{{ accessTokenFormatted ? formatJwtToken(currentDetail.access_token) : currentDetail.access_token }}</pre>
                            </el-collapse-item>
                            <el-collapse-item v-if="currentDetail.refresh_token" name="refreshToken">
                                <template #title>
                                    <span>{{ t('log.login.refreshToken') }}</span>
                                    <el-button link type="primary" size="small" class="format-btn" @click.stop="toggleTokenFormat('refreshToken')">
                                        {{ refreshTokenFormatted ? t('log.login.restore') : t('log.login.format') }}
                                    </el-button>
                                </template>
                                <pre class="json-content">{{ refreshTokenFormatted ? formatJwtToken(currentDetail.refresh_token) : currentDetail.refresh_token }}</pre>
                            </el-collapse-item>
                        </el-collapse>
                    </template>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { computed, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useClipboard } from '@/composables/useClipboard'
import { useAdminLoginLogPage } from '@/modules/log/useAdminLoginLogPage'
import type { TableColumn } from '@/types/common'
import type { LoginLog } from '@/types/log'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const { copyText } = useClipboard()
const detailButtonInfo = getButtonInfoFull('adminLoginLog:detail')
const { t } = useI18n()

const {
    loading,
    logList,
    pagination,
    queryFormRef,
    queryWhere,
    dateRange,
    showDetailDrawer,
    currentDetail,
    detailLoading,
    activeCollapse,
    accessTokenFormatted,
    refreshTokenFormatted,
    formatIpAddress,
    toggleTokenFormat,
    formatJwtToken,
    handleSearch,
    getList,
    openDetailDrawer,
} = useAdminLoginLogPage()

onMounted(() => {
    getList()
})

const tableTitle = computed(
    () =>
        [
            { prop: 'id', align: 'center', h_label: t('common.labels.id'), width: 80 },
            { prop: 'username', h_label: t('log.login.username'), minWidth: 120, overflow: true },
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
            { prop: 'execution_time', h_label: t('log.login.durationMs'), align: 'center', width: 100 },
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
            { prop: 'created_at', h_label: t('log.login.time'), align: 'center', width: 160 },
        ] as TableColumn<LoginLog>[]
)
</script>

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}
.detail-content {
    padding: 20px;
    .json-content {
        background-color: var(--el-fill-color-light);
        padding: 15px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
    }
    .format-btn {
        margin-left: 10px;
    }
}
</style>
