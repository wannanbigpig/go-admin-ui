<template>
    <div>
        <el-tabs v-model="activeTab" class="xl-container xl-tabs xl-m-bottom-10">
            <el-tab-pane :label="t('system.dict.typeTab')" name="type" />
            <el-tab-pane :label="t('system.dict.itemTab')" name="item" />
        </el-tabs>

        <div v-if="activeTab === 'type'" class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="typeQueryFormRef" :model="typeQuery" @submit.prevent="handleTypeSearch" @keydown.enter.prevent="handleTypeSearch">
                <el-row id="typeSearchForm" :gutter="20">
                    <el-col :span="5">
                        <el-form-item :label="t('system.dict.typeCode')" prop="type_code">
                            <el-input v-model.trim="typeQuery.type_code" :placeholder="t('system.dict.typeCodePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item :label="t('system.dict.typeName')" prop="type_name">
                            <el-input v-model.trim="typeQuery.type_name" :placeholder="t('system.dict.typeNamePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-select v-model="typeQuery.status" clearable :placeholder="t('common.placeholders.selectStatus')">
                                <el-option v-for="item in commonStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="typeLoading" :maxShow="3" :onSearch="handleTypeSearch" :modelRef="typeQueryFormRef" nodeName="#typeSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div v-else class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="itemQueryFormRef" :model="itemQuery" @submit.prevent="handleItemSearch" @keydown.enter.prevent="handleItemSearch">
                <el-row id="itemSearchForm" :gutter="20">
                    <el-col :span="6">
                        <el-form-item :label="t('system.dict.typeCode')" prop="type_code">
                            <el-select v-model="selectedTypeCode" filterable clearable :placeholder="t('system.dict.typeCodePlaceholder')">
                                <el-option v-for="type in typeOptions" :key="type.type_code" :label="`${type.type_name} (${type.type_code})`" :value="type.type_code" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item :label="t('system.dict.itemLabel')" prop="label">
                            <el-input v-model.trim="itemQuery.label" :placeholder="t('system.dict.itemLabelPlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item :label="t('system.dict.itemValue')" prop="value">
                            <el-input v-model.trim="itemQuery.value" :placeholder="t('system.dict.itemValuePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-select v-model="itemQuery.status" clearable :placeholder="t('common.placeholders.selectStatus')">
                                <el-option v-for="item in commonStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="itemLoading" :maxShow="4" :onSearch="handleItemSearch" :modelRef="itemQueryFormRef" nodeName="#itemSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div class="xl-table-actions">
                <xl-action-button v-permission="'sysDict:add'" :button-info="addButtonInfo" type="primary" :show-icon="false" @click="openCreateDrawer" />
            </div>

            <xl-table-list v-if="activeTab === 'type'" :loading="typeLoading" :data="typeList" :tableTitle="typeTableTitle" :pagination="typePagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
                <template #operation>
                    <el-table-column width="150" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="typeActionButtons" :scope="scope" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>

            <xl-table-list v-else :loading="itemLoading" :data="itemList" :tableTitle="itemTableTitle" :pagination="itemPagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
                <template #operation>
                    <el-table-column width="150" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="itemActionButtons" :scope="scope" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <xl-drawer v-model="showTypeDrawer" :title="typeFormTitle" :formRef="typeFormRef" :onConfirm="submitTypeForm" :isSubmitting="typeSubmitting" size="36%">
            <el-form ref="typeFormRef" :model="typeFormData" :rules="typeFormRules" label-width="auto">
                <el-form-item :label="t('system.dict.typeCode')" prop="type_code">
                    <el-input v-model.trim="typeFormData.type_code" :disabled="typeEditMode" />
                </el-form-item>
                <el-form-item :label="t('system.dict.typeName')" prop="type_name_i18n">
                    <xl-i18n-input v-model="typeFormData.type_name_i18n" show-tip />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-switch v-model="typeFormData.status" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.sort')" prop="sort">
                            <el-input-number v-model="typeFormData.sort" :min="0" :step="10" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('common.labels.description')" prop="remark">
                    <el-input v-model.trim="typeFormData.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
                </el-form-item>
            </el-form>
        </xl-drawer>

        <xl-drawer v-model="showItemDrawer" :title="itemFormTitle" :formRef="itemFormRef" :onConfirm="submitItemForm" :isSubmitting="itemSubmitting" size="38%">
            <el-form ref="itemFormRef" :model="itemFormData" :rules="itemFormRules" label-width="auto">
                <el-form-item :label="t('system.dict.typeCode')" prop="type_code">
                    <el-select v-model="itemFormData.type_code" filterable>
                        <el-option v-for="type in typeOptions" :key="type.type_code" :label="`${type.type_name} (${type.type_code})`" :value="type.type_code" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('system.dict.itemLabel')" prop="label_i18n">
                    <xl-i18n-input v-model="itemFormData.label_i18n" show-tip />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.dict.itemValue')" prop="value">
                            <el-input v-model.trim="itemFormData.value" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.dict.tagType')" prop="tag_type">
                            <el-input v-model.trim="itemFormData.tag_type" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.dict.color')" prop="color">
                            <el-input v-model.trim="itemFormData.color" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.dict.default')" prop="is_default">
                            <el-switch v-model="itemFormData.is_default" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-switch v-model="itemFormData.status" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.sort')" prop="sort">
                            <el-input-number v-model="itemFormData.sort" :min="0" :step="10" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('common.labels.description')" prop="remark">
                    <el-input v-model.trim="itemFormData.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlI18nInput from '@/components/i18nInput/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { usePermission } from '@/composables/usePermission'
import { invalidateDictOptionsCache, useDictOptions } from '@/composables/useDictOptions'
import { validateFormSafely } from '@/modules/shared/form'
import { createLocaleTextMap, createDictTypeQuery, createDictItemQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, commonStatusFallbackOptions, yesNoFallbackOptions } from '@/modules/system/dictOptions'
import { fetchDictTypeList, fetchDictTypeDetail, addDictType, modifyDictType, removeDictType, fetchDictItemList, addDictItem, modifyDictItem, removeDictItem } from '@/modules/system/service'
import type { DictType, DictItem } from '@/types/system'
import type { TableColumn } from '@/types/common'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'

const { t } = useI18n()
const { getButtonInfoFull } = usePermission()

const addButtonInfo = getButtonInfoFull('sysDict:add')
const updateButtonInfo = getButtonInfoFull('sysDict:update')
const deleteButtonInfo = getButtonInfoFull('sysDict:delete')
const { options: commonStatusOptions, tagMap: commonStatusTagMap, load: loadCommonStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.commonStatus, commonStatusFallbackOptions)
const { tagMap: yesNoTagMap, load: loadYesNoOptions } = useDictOptions(SYSTEM_DICT_TYPES.yesNo, yesNoFallbackOptions)

const activeTab = ref<'type' | 'item'>('type')
const selectedTypeCode = ref('')

const typeQueryFormRef = ref<FormInstance>()
const itemQueryFormRef = ref<FormInstance>()
const typeQuery = reactive(createDictTypeQuery())
const itemQuery = reactive(createDictItemQuery(''))

const {
    loading: typeLoading,
    items: typeList,
    pagination: typePagination,
    getList: getTypeList,
    handleSearch: handleTypeSearch,
} = useListPage<DictType, typeof typeQuery>({
    query: typeQuery,
    queryFormRef: typeQueryFormRef,
    fetcher: async (params) => {
        try {
            return await fetchDictTypeList(params)
        } catch (error) {
            Logger.error('获取字典类型列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const {
    loading: itemLoading,
    items: itemList,
    pagination: itemPagination,
    handleSearch: handleItemSearch,
} = useListPage<DictItem, typeof itemQuery>({
    query: itemQuery,
    queryFormRef: itemQueryFormRef,
    transformParams: (query) => ({
        ...query,
        type_code: selectedTypeCode.value || query.type_code,
    }),
    fetcher: async (params) => {
        if (!params.type_code) {
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
        try {
            return await fetchDictItemList(params)
        } catch (error) {
            Logger.error('获取字典项列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const typeOptions = computed(() => typeList.value)

watch(
    () => typeList.value,
    (list) => {
        if (!selectedTypeCode.value && list.length > 0) {
            selectedTypeCode.value = list[0].type_code
            itemQuery.type_code = list[0].type_code
        }
    },
    { immediate: true }
)

watch(selectedTypeCode, async (value) => {
    itemQuery.type_code = value || ''
    if (activeTab.value === 'item') {
        await handleItemSearch()
    }
})

watch(activeTab, async (tab) => {
    if (tab === 'item') {
        await getTypeList()
        await handleItemSearch()
    }
})

const showTypeDrawer = ref(false)
const typeSubmitting = ref(false)
const typeFormRef = ref<FormInstance>()
const currentTypeId = ref<number | string | null>(null)
const typeFormData = reactive({
    type_code: '',
    type_name_i18n: createLocaleTextMap(),
    status: 1,
    sort: 0,
    remark: '',
})

const typeEditMode = computed(() => currentTypeId.value !== null)
const typeFormTitle = computed(() => (typeEditMode.value ? t('system.dict.editTypeTitle') : t('system.dict.addTypeTitle')))
const typeFormRules = computed(() => ({
    type_code: [{ required: true, message: t('system.dict.form.typeCodeRequired'), trigger: 'blur' }],
    type_name_i18n: [
        {
            validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
                const hasName = Object.values(typeFormData.type_name_i18n).some((value) => String(value || '').trim() !== '')
                if (!hasName) {
                    callback(new Error(t('system.dict.form.typeNameRequired')))
                    return
                }
                callback()
            },
            trigger: 'blur',
        },
    ],
}))

const showItemDrawer = ref(false)
const itemSubmitting = ref(false)
const itemFormRef = ref<FormInstance>()
const currentItemId = ref<number | string | null>(null)
const itemFormData = reactive({
    type_code: '',
    label_i18n: createLocaleTextMap(),
    value: '',
    color: '',
    tag_type: '',
    is_default: 0,
    status: 1,
    sort: 0,
    remark: '',
})

const itemEditMode = computed(() => currentItemId.value !== null)
const itemFormTitle = computed(() => (itemEditMode.value ? t('system.dict.editItemTitle') : t('system.dict.addItemTitle')))
const itemFormRules = computed(() => ({
    type_code: [{ required: true, message: t('system.dict.form.typeCodeRequired'), trigger: 'change' }],
    value: [{ required: true, message: t('system.dict.form.itemValueRequired'), trigger: 'blur' }],
    label_i18n: [
        {
            validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
                const hasName = Object.values(itemFormData.label_i18n).some((value) => String(value || '').trim() !== '')
                if (!hasName) {
                    callback(new Error(t('system.dict.form.itemLabelRequired')))
                    return
                }
                callback()
            },
            trigger: 'blur',
        },
    ],
}))

const resetTypeForm = () => {
    currentTypeId.value = null
    Object.assign(typeFormData, {
        type_code: '',
        type_name_i18n: createLocaleTextMap(),
        status: 1,
        sort: 0,
        remark: '',
    })
    setTimeout(() => {
        typeFormRef.value?.clearValidate()
    }, 50)
}

const resetItemForm = () => {
    currentItemId.value = null
    Object.assign(itemFormData, {
        type_code: selectedTypeCode.value || '',
        label_i18n: createLocaleTextMap(),
        value: '',
        color: '',
        tag_type: '',
        is_default: 0,
        status: 1,
        sort: 0,
        remark: '',
    })
    setTimeout(() => {
        itemFormRef.value?.clearValidate()
    }, 50)
}

const openCreateDrawer = () => {
    if (activeTab.value === 'type') {
        resetTypeForm()
        showTypeDrawer.value = true
        return
    }
    resetItemForm()
    showItemDrawer.value = true
}

const openEditTypeDrawer = async (row: DictType) => {
    resetTypeForm()
    currentTypeId.value = row.id
    try {
        const detail = await fetchDictTypeDetail(row.id)
        Object.assign(typeFormData, {
            type_code: detail.type_code || '',
            type_name_i18n: {
                ...createLocaleTextMap(),
                ...(detail.type_name_i18n || {}),
                ...(detail.type_name && !detail.type_name_i18n?.['zh-CN'] ? { 'zh-CN': detail.type_name } : {}),
            },
            status: Number(detail.status ?? 1),
            sort: Number(detail.sort ?? 0),
            remark: detail.remark || '',
        })
        showTypeDrawer.value = true
    } catch (error) {
        Logger.error('获取字典类型详情失败:', error)
    }
}

const openEditItemDrawer = (row: DictItem) => {
    resetItemForm()
    currentItemId.value = row.id
    Object.assign(itemFormData, {
        type_code: row.type_code,
        label_i18n: {
            ...createLocaleTextMap(),
            'zh-CN': row.label || '',
        },
        value: row.value || '',
        color: row.color || '',
        tag_type: row.tag_type || '',
        is_default: Number(row.is_default || 0),
        status: Number(row.status ?? 1),
        sort: Number(row.sort ?? 0),
        remark: row.remark || '',
    })
    showItemDrawer.value = true
}

const submitTypeForm = async () => {
    if (typeSubmitting.value) return
    const valid = await validateFormSafely(typeFormRef.value, 'dict-type-form')
    if (!valid) return

    const payload = {
        type_code: typeFormData.type_code,
        type_name_i18n: typeFormData.type_name_i18n,
        status: typeFormData.status,
        sort: typeFormData.sort,
        remark: typeFormData.remark,
    }

    typeSubmitting.value = true
    try {
        if (typeEditMode.value && currentTypeId.value !== null) {
            await modifyDictType({ id: currentTypeId.value, ...payload })
            ElMessage.success(t('common.result.editSuccess'))
        } else {
            await addDictType(payload)
            ElMessage.success(t('common.result.addSuccess'))
        }
        invalidateDictOptionsCache()
        showTypeDrawer.value = false
        await getTypeList()
    } catch (error) {
        Logger.error('提交字典类型失败:', error)
    } finally {
        typeSubmitting.value = false
    }
}

const submitItemForm = async () => {
    if (itemSubmitting.value) return
    const valid = await validateFormSafely(itemFormRef.value, 'dict-item-form')
    if (!valid) return

    const payload = {
        type_code: itemFormData.type_code,
        label_i18n: itemFormData.label_i18n,
        value: itemFormData.value,
        color: itemFormData.color,
        tag_type: itemFormData.tag_type,
        is_default: itemFormData.is_default,
        status: itemFormData.status,
        sort: itemFormData.sort,
        remark: itemFormData.remark,
    }

    itemSubmitting.value = true
    try {
        if (itemEditMode.value && currentItemId.value !== null) {
            await modifyDictItem({ id: currentItemId.value, ...payload })
            ElMessage.success(t('common.result.editSuccess'))
        } else {
            await addDictItem(payload)
            ElMessage.success(t('common.result.addSuccess'))
        }
        invalidateDictOptionsCache()
        showItemDrawer.value = false
        await handleItemSearch()
    } catch (error) {
        Logger.error('提交字典项失败:', error)
    } finally {
        itemSubmitting.value = false
    }
}

const handleDeleteType = async (row: DictType) => {
    try {
        await ElMessageBox.confirm(t('system.dict.deleteTypeConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        await removeDictType(row.id)
        invalidateDictOptionsCache()
        ElMessage.success(t('common.result.deleteSuccess'))
        await getTypeList()
        await handleItemSearch()
    } catch {
        // noop
    }
}

const handleDeleteItem = async (row: DictItem) => {
    try {
        await ElMessageBox.confirm(t('system.dict.deleteItemConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        await removeDictItem(row.id)
        invalidateDictOptionsCache(row.type_code)
        ElMessage.success(t('common.result.deleteSuccess'))
        await handleItemSearch()
    } catch {
        // noop
    }
}

const typeActionButtons = computed(() => [
    {
        permission: 'sysDict:update',
        buttonInfo: updateButtonInfo || undefined,
        showIcon: false,
        click: (row: DictType) => openEditTypeDrawer(row),
    },
    {
        permission: 'sysDict:delete',
        buttonInfo: deleteButtonInfo || undefined,
        showIcon: false,
        click: (row: DictType) => handleDeleteType(row),
    },
])

const itemActionButtons = computed(() => [
    {
        permission: 'sysDict:update',
        buttonInfo: updateButtonInfo || undefined,
        showIcon: false,
        click: (row: DictItem) => openEditItemDrawer(row),
    },
    {
        permission: 'sysDict:delete',
        buttonInfo: deleteButtonInfo || undefined,
        showIcon: false,
        click: (row: DictItem) => handleDeleteItem(row),
    },
])

const typeTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'type_code', h_label: t('system.dict.typeCode'), minWidth: 160, overflow: true },
            { prop: 'type_name', h_label: t('system.dict.typeName'), minWidth: 160, overflow: true },
            {
                prop: 'status',
                h_label: t('common.labels.status'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: commonStatusTagMap.value,
            },
            { prop: 'sort', h_label: t('common.labels.sort'), width: 80, align: 'center' },
            { prop: 'updated_at', h_label: t('common.labels.updatedAt'), width: 160, align: 'center' },
        ] as TableColumn<DictType>[]
)

const itemTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'label', h_label: t('system.dict.itemLabel'), minWidth: 160, overflow: true },
            { prop: 'value', h_label: t('system.dict.itemValue'), minWidth: 120, overflow: true },
            { prop: 'color', h_label: t('system.dict.color'), width: 120 },
            { prop: 'tag_type', h_label: t('system.dict.tagType'), width: 120 },
            {
                prop: 'is_default',
                h_label: t('system.dict.default'),
                width: 90,
                align: 'center',
                customRow: true,
                tag: yesNoTagMap.value,
            },
            {
                prop: 'status',
                h_label: t('common.labels.status'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: commonStatusTagMap.value,
            },
            { prop: 'sort', h_label: t('common.labels.sort'), width: 80, align: 'center' },
            { prop: 'updated_at', h_label: t('common.labels.updatedAt'), width: 160, align: 'center' },
        ] as TableColumn<DictItem>[]
)

onMounted(async () => {
    await Promise.all([loadCommonStatusOptions(), loadYesNoOptions(), getTypeList()])
    if (selectedTypeCode.value) {
        await handleItemSearch()
    }
})
</script>

<style scoped lang="scss">
.el-form-item {
    width: 100% !important;
}
</style>
