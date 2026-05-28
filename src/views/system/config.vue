<template>
    <div>
        <el-tabs v-model="activeTab" class="xl-container xl-tabs xl-m-bottom-10">
            <el-tab-pane :label="t('system.config.tabs.normal')" name="normal" />
            <el-tab-pane :label="t('system.config.tabs.storage')" name="storage" />
            <el-tab-pane :label="t('system.config.tabs.auditMask')" name="audit_mask" />
        </el-tabs>

        <div v-if="activeTab === 'normal'">
            <xl-pro-table :search-model="queryWhere" :columns="columns" :loading="loading" :data="configList" :pagination="pagination" :search-max-show="4" @search="onSearch" @reset="handleReset">
                <template #actions>
                    <xl-action-button v-permission="'sysConfig:add'" code="sysConfig:add" type="primary" :show-icon="false" @click="openCreateDrawer" />
                    <xl-action-button v-permission="'sysConfig:refresh'" code="sysConfig:refresh" type="primary" :show-icon="false" :loading="refreshing" @click="handleRefreshCache" />
                </template>
                <template #operation>
                    <el-table-column width="140" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                        </template>
                    </el-table-column>
                </template>
            </xl-pro-table>

            <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formRef" :onConfirm="submitForm" :isSubmitting="submitting" size="36%">
                <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
                    <el-form-item :label="t('system.config.key')" prop="config_key">
                        <el-input v-model.trim="formData.config_key" :disabled="isEditMode" />
                    </el-form-item>
                    <el-form-item :label="t('system.config.name')" prop="config_name_i18n">
                        <xl-i18n-input v-model="formData.config_name_i18n" show-tip />
                    </el-form-item>
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item :label="t('system.config.valueType')" prop="value_type">
                                <el-select v-model="formData.value_type">
                                    <el-option v-for="item in valueTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="t('system.config.groupCode')" prop="group_code">
                                <el-input v-model.trim="formData.group_code" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item :label="t('system.config.value')" prop="config_value">
                        <el-input v-model="formData.config_value" type="textarea" :rows="4" />
                    </el-form-item>
                    <el-row :gutter="16">
                        <el-col :span="8">
                            <el-form-item :label="t('system.config.sensitive')" prop="is_sensitive">
                                <el-switch v-model="formData.is_sensitive" :active-value="1" :inactive-value="0" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item :label="t('common.labels.status')" prop="status">
                                <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item :label="t('common.labels.sort')" prop="sort">
                                <el-input-number v-model="formData.sort" :min="0" :step="10" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item :label="t('common.labels.description')" prop="remark">
                        <el-input v-model.trim="formData.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
                    </el-form-item>
                </el-form>
            </xl-drawer>
        </div>

        <div v-if="activeTab === 'storage'">
            <system-storage-config-panel />
        </div>

        <div v-if="activeTab === 'audit_mask'">
            <request-log-mask-config-panel />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlI18nInput from '@/components/i18nInput/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import SystemStorageConfigPanel from '@/views/system/components/StorageConfigPanel.vue'
import RequestLogMaskConfigPanel from '@/views/system/components/RequestLogMaskConfigPanel.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { usePermission } from '@/composables/usePermission'
import { useDictOptions } from '@/composables/useDictOptions'
import { validateFormSafely } from '@/modules/shared/form'
import { createLocaleTextMap, createSystemConfigQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, commonStatusFallbackOptions, yesNoFallbackOptions } from '@/modules/system/dictOptions'
import { fetchSystemConfigList, fetchSystemConfigDetail, addSystemConfig, modifySystemConfig, removeSystemConfig, refreshSystemConfig } from '@/modules/system/service'
import { mergeI18nField } from '@/modules/shared/i18n'
import type { SystemConfig, SystemConfigPayload } from '@/types/system'
import type { ProTableColumns } from '@/components/proTable/types'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const { getButtonInfoFull } = usePermission()
const route = useRoute()
const router = useRouter()

const activeTab = ref<'normal' | 'storage' | 'audit_mask'>('normal')
const updateButtonInfo = getButtonInfoFull('sysConfig:update')
const deleteButtonInfo = getButtonInfoFull('sysConfig:delete')
const { options: commonStatusOptions, tagMap: commonStatusTagMap, load: loadCommonStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.commonStatus, commonStatusFallbackOptions)
const { tagMap: yesNoTagMap, load: loadYesNoOptions } = useDictOptions(SYSTEM_DICT_TYPES.yesNo, yesNoFallbackOptions)

const valueTypeOptions = [
    { label: 'string', value: 'string' },
    { label: 'number', value: 'number' },
    { label: 'bool', value: 'bool' },
    { label: 'json', value: 'json' },
]

/* eslint-disable prefer-const */
let queryWhere = reactive(createSystemConfigQuery())
/* eslint-enable prefer-const */

const {
    handleReset,
    loading,
    items: configList,
    pagination,
    getList,
    handleSearch,
} = useListPage<SystemConfig, typeof queryWhere>({
    query: queryWhere,
    fetcher: (params) => fetchSystemConfigList(params),
})

const showDrawer = ref(false)
const submitting = ref(false)
const refreshing = ref(false)
const formRef = ref<FormInstance>()
const currentId = ref<number | string | null>(null)

const onSearch = (model: Record<string, unknown>) => {
    Object.assign(queryWhere, model)
    handleSearch()
}
const formData = reactive({
    config_key: '',
    config_name_i18n: createLocaleTextMap(),
    config_value: '',
    value_type: 'string',
    group_code: '',
    is_sensitive: 0,
    is_visible: 1,
    manage_tab: '',
    status: 1,
    sort: 0,
    remark: '',
})

const isEditMode = computed(() => currentId.value !== null)
const formTitle = computed(() => (isEditMode.value ? t('system.config.editTitle') : t('system.config.addTitle')))

const formRules = computed(() => ({
    config_key: [{ required: true, message: t('system.config.form.keyRequired'), trigger: 'blur' }],
    value_type: [{ required: true, message: t('system.config.form.valueTypeRequired'), trigger: 'change' }],
    config_name_i18n: [
        {
            validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
                const hasName = Object.values(formData.config_name_i18n).some((value) => String(value || '').trim() !== '')
                if (!hasName) {
                    callback(new Error(t('system.config.form.nameRequired')))
                    return
                }
                callback()
            },
            trigger: 'blur',
        },
    ],
}))

const buildConfigPayload = (): SystemConfigPayload => ({
    config_key: formData.config_key,
    config_name_i18n: formData.config_name_i18n,
    config_value: formData.config_value,
    value_type: formData.value_type,
    group_code: formData.group_code,
    is_sensitive: formData.is_sensitive,
    is_visible: formData.is_visible,
    manage_tab: formData.manage_tab,
    status: formData.status,
    sort: formData.sort,
    remark: formData.remark,
})

const resetForm = () => {
    currentId.value = null
    Object.assign(formData, {
        config_key: '',
        config_name_i18n: createLocaleTextMap(),
        config_value: '',
        value_type: 'string',
        group_code: '',
        is_sensitive: 0,
        is_visible: 1,
        manage_tab: '',
        status: 1,
        sort: 0,
        remark: '',
    })
    nextTick(() => {
        formRef.value?.clearValidate()
    })
}

const openCreateDrawer = () => {
    resetForm()
    showDrawer.value = true
}

const openEditDrawer = async (row: SystemConfig) => {
    resetForm()
    currentId.value = row.id
    try {
        const detail = await fetchSystemConfigDetail(row.id)
        Object.assign(formData, {
            config_key: detail.config_key || '',
            config_name_i18n: mergeI18nField(detail as unknown as Record<string, unknown>, 'config_name_i18n'),
            config_value: detail.config_value || '',
            value_type: detail.value_type || 'string',
            group_code: detail.group_code || '',
            is_sensitive: Number(detail.is_sensitive || 0),
            is_visible: Number(detail.is_visible ?? 1),
            manage_tab: detail.manage_tab || '',
            status: Number(detail.status ?? 1),
            sort: Number(detail.sort ?? 0),
            remark: detail.remark || '',
        })
        showDrawer.value = true
    } catch (error) {
        Logger.error('获取系统参数详情失败:', error)
        ElMessage.error(t('common.result.operationFailed'))
    }
}

const submitForm = async () => {
    if (submitting.value) return

    const valid = await validateFormSafely(formRef.value, 'system-config-form')
    if (!valid) return

    const payload = buildConfigPayload()

    submitting.value = true
    try {
        if (isEditMode.value && currentId.value !== null) {
            await modifySystemConfig({ id: currentId.value, ...payload })
            ElMessage.success(t('common.result.editSuccess'))
        } else {
            await addSystemConfig(payload)
            ElMessage.success(t('common.result.addSuccess'))
        }
        showDrawer.value = false
        await getList()
    } catch (error) {
        Logger.error('提交系统参数失败:', error)
    } finally {
        submitting.value = false
    }
}

const handleDelete = async (row: SystemConfig) => {
    try {
        await ElMessageBox.confirm(t('system.config.deleteConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        await removeSystemConfig(row.id)
        ElMessage.success(t('common.result.deleteSuccess'))
        await getList()
    } catch {
        // noop
    }
}

const handleRefreshCache = async () => {
    if (refreshing.value) return
    refreshing.value = true
    try {
        await refreshSystemConfig()
        ElMessage.success(t('common.result.refreshSuccess'))
        await getList()
    } catch (error) {
        Logger.error('刷新系统参数缓存失败:', error)
    } finally {
        refreshing.value = false
    }
}

const actionButtons = computed(() => [
    {
        permission: 'sysConfig:update',
        buttonInfo: updateButtonInfo || undefined,
        showIcon: false,
        click: (row: SystemConfig) => openEditDrawer(row),
    },
    {
        permission: 'sysConfig:delete',
        buttonInfo: deleteButtonInfo || undefined,
        showIcon: false,
        click: (row: SystemConfig) => handleDelete(row),
    },
])

const columns = computed<ProTableColumns<SystemConfig>>(() => [
    { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
    {
        prop: 'config_key',
        h_label: t('system.config.key'),
        label: t('system.config.key'),
        minWidth: 180,
        overflow: true,
        search: { type: 'input', placeholder: t('system.config.keyPlaceholder'), span: 5 },
    },
    {
        prop: 'config_name',
        h_label: t('system.config.name'),
        label: t('system.config.name'),
        minWidth: 140,
        overflow: true,
        search: { type: 'input', placeholder: t('system.config.namePlaceholder'), span: 5 },
    },
    { prop: 'config_value', h_label: t('system.config.value'), minWidth: 220, overflow: true },
    { prop: 'value_type', h_label: t('system.config.valueType'), width: 100, align: 'center' },
    {
        prop: 'group_code',
        h_label: t('system.config.groupCode'),
        label: t('system.config.groupCode'),
        minWidth: 120,
        overflow: true,
        search: { type: 'input', placeholder: t('system.config.groupCodePlaceholder'), span: 5 },
    },
    {
        prop: 'is_sensitive',
        h_label: t('system.config.sensitive'),
        width: 100,
        align: 'center',
        type: 'tag',
        tag: yesNoTagMap.value,
    },
    {
        prop: 'status',
        h_label: t('common.labels.status'),
        label: t('common.labels.status'),
        width: 100,
        align: 'center',
        type: 'tag',
        tag: commonStatusTagMap.value,
        search: {
            type: 'select',
            placeholder: t('common.placeholders.selectStatus'),
            options: commonStatusOptions.value,
            span: 5,
        },
    },
    { prop: 'sort', h_label: t('common.labels.sort'), width: 80, align: 'center' },
    { prop: 'updated_at', h_label: t('common.labels.updatedAt'), width: 160, align: 'center' },
])

onMounted(async () => {
    const queryTab = String(route.query.tab || '')
    if (queryTab === 'storage' || queryTab === 'audit_mask' || queryTab === 'normal') {
        activeTab.value = queryTab
    }
    await Promise.all([loadCommonStatusOptions(), loadYesNoOptions(), getList()])
})

watch(activeTab, (tab) => {
    const nextQuery = { ...route.query }
    if (tab === 'normal') {
        delete nextQuery.tab
    } else {
        nextQuery.tab = tab
    }
    if (String(route.query.tab || '') !== String(nextQuery.tab || '')) {
        router.replace({ path: route.path, query: nextQuery })
    }
})
</script>
