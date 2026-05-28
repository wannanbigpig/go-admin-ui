<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form ref="queryFormRef" class="xl-search-form" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="sessionSearchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('log.session.uid')" prop="uid">
                            <el-input v-model.trim="queryWhere.uid" :placeholder="t('log.session.uidPlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.session.username')" prop="username">
                            <el-input v-model.trim="queryWhere.username" :placeholder="t('log.session.usernamePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.session.ip')" prop="ip">
                            <el-input v-model.trim="queryWhere.ip" :placeholder="t('log.session.ipPlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.session.revoked')" prop="is_revoked">
                            <el-select v-model="queryWhere.is_revoked" clearable>
                                <el-option :label="t('common.yes')" :value="1" />
                                <el-option :label="t('common.no')" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item :label="t('log.session.loginTime')" prop="dateRange">
                            <xl-date-range-picker v-model="dateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="5" :onSearch="handleSearch" :onReset="handleReset" :modelRef="queryFormRef" nodeName="#sessionSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="loading" :data="sessionList" :tableTitle="tableTitle" :pagination="pagination">
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
            </xl-table-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { createOnlineSessionQuery } from '@/modules/log/model'
import { fetchOnlineSessionList, revokeOnlineSessionById } from '@/modules/log/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import type { TableColumn } from '@/types/common'
import type { OnlineSession } from '@/types/log'

const { t } = useI18n()

const queryFormRef = ref<FormInstance>()
const queryWhere = reactive(createOnlineSessionQuery())
const dateRange = ref<[string, string] | []>([])

const {
    loading,
    items: sessionList,
    pagination,
    getList,
    handleSearch,
    handleReset: rawHandleReset,
} = useListPage<OnlineSession, typeof queryWhere>({
    query: queryWhere,
    queryFormRef,
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

const handleReset = async () => {
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
    } catch {
        // noop
    } finally {
        revokingId.value = null
    }
}

const tableTitle = computed(
    () =>
        [
            { prop: 'username', h_label: t('log.session.username'), minWidth: 120, overflow: true },
            { prop: 'uid', h_label: t('log.session.uid'), width: 90, align: 'center' },
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
            { prop: 'token_expires', h_label: t('log.session.tokenExpires'), width: 160, align: 'center' },
            { prop: 'created_at', h_label: t('log.session.loginTime'), width: 160, align: 'center' },
        ] as TableColumn<OnlineSession>[]
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
