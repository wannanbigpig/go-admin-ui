<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-select v-model="queryWhere.status" clearable :placeholder="t('common.all')">
                                <el-option :label="t('common.all')" :value="MENU_STATUS.ALL" />
                                <el-option :label="t('common.status.enabled')" :value="MENU_STATUS.ENABLED" />
                                <el-option :label="t('common.status.disabled')" :value="MENU_STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>
        <div class="xl-container">
            <div style="display: flex; margin-bottom: 10px">
                <el-button @click="handleToggleExpand">{{ isExpanded ? t('common.actions.collapseAll') : t('common.actions.expandAll') }}</el-button>
                <xl-action-button v-permission="'menu:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(1)" />
            </div>
            <div>
                <xl-table-list ref="tableListRef" :loading="loading" :data="menuList" :tableTitle="tableTitle" row-key="id" :default-expand-all="false">
                    <template #td="{ item, val, row }">
                        <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                        <span v-else-if="item.copy" trigger="click" effect="customized" :content="t('common.actions.copySuccess')" placement="left">
                            <span @click="handleCopyClick(String(val))" class="xl-cursor-pointer">
                                {{ val }}
                            </span>
                        </span>
                        <span v-else-if="item.prop == 'title'" class="xl-label-with-icon-right">
                            <el-icon> <xl-icon :icon="(row as Menu).icon || ''" /> </el-icon> <span>{{ val }}</span>
                        </span>
                        <span v-else>{{ val }}</span>
                    </template>
                    <template #operation>
                        <el-table-column width="200" :label="t('common.labels.operation')" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>
        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="handleSubmit" :isSubmitting="isSubmitting" :withReset="false" size="40%">
            <template #footer v-if="step === 1">
                <el-divider />
                <div style="display: flex; justify-content: flex-end">
                    <el-button @click="handleCancel">{{ t('common.actions.cancel') }}</el-button>
                    <el-button @click="handleStepChange(2)" type="success">{{ t('common.actions.nextStep') }}</el-button>
                </div>
            </template>
            <template #footer v-else-if="step === 2">
                <el-divider />
                <div style="display: flex; justify-content: flex-end">
                    <el-button @click="handleStepChange(1)" type="success">{{ t('common.actions.prevStep') }}</el-button>
                    <el-button @click="handleCancel">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" @click="handleSubmit" :disabled="isSubmitting" :loading="isSubmitting">
                        {{ isSubmitting ? t('common.actions.submitting') : t('common.actions.submit') }}
                    </el-button>
                </div>
            </template>
            <el-steps :active="step" finish-status="success" simple>
                <el-step :title="t('permission.menu.basicInfo')" />
                <el-step :title="t('permission.menu.selectPermission')" />
            </el-steps>
            <el-divider />
            <el-form v-if="step === 1" ref="formDataRef" size="default" :model="formData" label-width="auto" label-position="top" :rules="editFormRules" :key="currentIndex ?? 0">
                <el-form-item :label="t('permission.menu.parentMenu')" prop="parent_id">
                    <el-cascader
                        v-model="formData.parent_id"
                        :options="menuCascaderOptions"
                        :placeholder="t('permission.menu.parentMenu')"
                        :props="MENU_CASCADER_PROPS"
                        filterable
                        :show-all-levels="true"
                        :disabled="isParentFixed"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('permission.menu.routeTitle')" prop="title_i18n">
                            <template v-if="isSingleTitleLocale && singleTitleLocale">
                                <el-input
                                    v-model="formData.title_i18n[singleTitleLocale.value]"
                                    maxlength="12"
                                    show-word-limit
                                    :placeholder="t('permission.menu.routeTitleLocalePlaceholder', { lang: singleTitleLocale.label })"
                                />
                            </template>
                            <template v-else>
                                <el-input readonly :model-value="titleI18nPreviewText" :placeholder="t('permission.menu.titleI18nDialogPreviewPlaceholder')" @click="openTitleI18nDialog">
                                    <template #append>
                                        <el-button @click="openTitleI18nDialog">
                                            {{ t('common.actions.edit') }}
                                        </el-button>
                                    </template>
                                </el-input>
                                <div class="menu-title-i18n-trigger-tip">
                                    {{ t('permission.menu.titleI18nFilledStatus', { filled: titleI18nFilledCount, total: titleLocaleOptions.length }) }}
                                </div>
                            </template>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" v-show="formData.type !== MENU_TYPE.BUTTON">
                        <el-form-item :label="t('permission.menu.routeName')" prop="name" :required="formData.type === MENU_TYPE.MENU">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.routeName') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.routeName')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.name" :placeholder="t('permission.menu.routeNamePlaceholder')"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item prop="icon">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.icon') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.icon')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.icon" :placeholder="t('permission.menu.iconPlaceholder')">
                                <template #suffix>
                                    <el-icon size="20" :color="'var(--el-color-primary)'">
                                        <xl-icon :icon="formData.icon || ''" />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item prop="type">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.menuType') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.type')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-radio-group id="" :aria-label="t('permission.menu.menuType')" size="small" v-model="formData.type" :placeholder="t('permission.menu.menuType')">
                                <el-radio :value="MENU_TYPE.DIRECTORY">{{ t('permission.menu.typeDirectory') }}</el-radio>
                                <el-radio :value="MENU_TYPE.MENU">{{ t('permission.menu.typeMenu') }}</el-radio>
                                <el-radio :value="MENU_TYPE.BUTTON">{{ t('permission.menu.typeButton') }}</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="status" :label="t('common.labels.status')">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('common.labels.status') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.status')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch v-model="formData.status" inline-prompt :active-text="t('common.status.enabled')" :inactive-text="t('common.status.disabled')" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="is_auth" :label="t('permission.menu.auth')">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.auth') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.authSwitch')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch v-model="formData.is_auth" inline-prompt :active-text="t('common.yes')" :inactive-text="t('common.no')" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item prop="is_show" :label="t('permission.menu.show')">
                            <el-switch v-model="formData.is_show" inline-prompt :active-text="t('common.yes')" :inactive-text="t('common.no')" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20" v-show="formData.type !== MENU_TYPE.BUTTON">
                    <el-col :span="10">
                        <el-form-item :label="t('permission.menu.routePath')" prop="path">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.routePath') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.routePath')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.path" :placeholder="t('permission.menu.routePathPlaceholder')" @input="handlePathChange(formData.path ?? '')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="14">
                        <el-form-item :label="t('permission.menu.routeComponentPath')" prop="component" :required="formData.type === MENU_TYPE.MENU && formData.is_external_links !== MENU_SWITCH_VALUE.YES">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.routeComponentPath') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.componentPathHint')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.component" :placeholder="t('permission.menu.componentPathPlaceholder')">
                                <template #prepend>@/views/</template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" v-show="formData.type !== MENU_TYPE.BUTTON">
                    <el-col :span="10">
                        <el-form-item :label="t('permission.menu.redirectRouteName')" prop="redirect">
                            <template #label>
                                <span class="xl-label-with-icon">{{ t('permission.menu.redirectRouteName') }}</span>
                            </template>
                            <el-input v-model.trim="formData.redirect" :placeholder="t('permission.menu.redirectPlaceholder')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="sort">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.weight') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.weight')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input-number v-model.number="formData.sort" :step="10" :placeholder="t('permission.menu.weightPlaceholder')" controls-position="right" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item prop="is_external_links" :label="t('permission.menu.external')">
                            <el-switch
                                v-model="formData.is_external_links"
                                inline-prompt
                                :active-text="t('common.yes')"
                                :inactive-text="t('common.no')"
                                :active-value="1"
                                :inactive-value="0"
                                :disabled="formData.type === MENU_TYPE.BUTTON"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item prop="is_new_window" :label="t('permission.menu.newWindow')" v-show="formData.is_external_links === 1">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.newWindow') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.newWindow')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch v-model="formData.is_new_window" inline-prompt :active-text="t('common.yes')" :inactive-text="t('common.no')" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" justify="space-between">
                    <el-col :span="8" v-show="formData.type === MENU_TYPE.BUTTON">
                        <el-form-item prop="code" :required="formData.type === MENU_TYPE.BUTTON">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.permissionCode') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.permissionCode')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.code"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" v-show="formData.type !== MENU_TYPE.BUTTON">
                    <el-col :span="6">
                        <el-form-item prop="animate_duration">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.animationDuration') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.animationDuration')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input
                                v-model="formData.animate_duration"
                                :placeholder="t('permission.menu.animationDurationPlaceholder')"
                                @input="handleAnimateDurationChange(formData.animate_duration ?? '', 2)"
                            ></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="9">
                        <el-form-item prop="animate_enter">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.animationEnter') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.animationEnter')" raw-content placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.animate_enter" :placeholder="t('permission.menu.animationEnterPlaceholder')"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="9">
                        <el-form-item prop="animate_leave">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.menu.animationLeave') }}
                                    <el-tooltip effect="dark" :content="t('permission.menu.tooltips.animationLeave')" raw-content placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.animate_leave" :placeholder="t('permission.menu.animationLeavePlaceholder')"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('permission.menu.menuDescription')" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" :placeholder="t('permission.menu.descriptionPlaceholder')" show-word-limit type="textarea" />
                </el-form-item>
            </el-form>
            <div v-else-if="step === 2" class="xl-transfer">
                <el-skeleton v-if="permissionListLoading" animated>
                    <template #template>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px; margin-bottom: 8px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
                        </el-form-item>
                    </template>
                </el-skeleton>
                <el-form-item v-else :label="t('permission.menu.menuPermission')" prop="api_list">
                    <el-transfer
                        v-model="formData.api_list"
                        filterable
                        :filter-method="filterPermission"
                        :props="{ key: 'id', label: 'name' }"
                        :data="permissionList || []"
                        :titles="[t('permission.menu.bindableApi'), t('permission.menu.boundApi')]"
                        target-order="push"
                        :filter-placeholder="t('permission.menu.permissionFilterPlaceholder')"
                    />
                </el-form-item>
            </div>
        </xl-drawer>
        <el-dialog v-model="showTitleI18nDialog" :title="t('permission.menu.titleI18nDialogTitle')" width="560px" append-to-body>
            <div class="menu-title-i18n-list">
                <div v-for="locale in titleLocaleOptions" :key="locale.value" class="menu-title-i18n-item">
                    <div class="menu-title-i18n-locale">
                        <el-tag size="small" type="info">{{ locale.label }}</el-tag>
                    </div>
                    <el-input v-model="titleI18nDraft[locale.value]" maxlength="12" show-word-limit :placeholder="t('permission.menu.routeTitleLocalePlaceholder', { lang: locale.label })" />
                </div>
            </div>
            <template #footer>
                <el-button @click="showTitleI18nDialog = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" @click="handleTitleI18nDialogConfirm">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import { nextTick, onMounted, ref, reactive, computed, watch } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { MENU_STATUS, MENU_TYPE, MENU_SWITCH_VALUE, MENU_CASCADER_PROPS } from '@/modules/menu/model'
import { useMenuList } from '@/modules/menu/useMenuList'
import { useMenuForm } from '@/modules/menu/useMenuForm'
import type { Menu } from '@/types/menu'
import type { TableColumn } from '@/types/common'
import { Logger } from '@/utils/logger'
import { LOCALE_OPTIONS } from '@/locales'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const { t } = useI18n()
const addChildButtonInfo = getButtonInfoFull('menu:addChild')
const addButtonInfo = getButtonInfoFull('menu:add')
const updateButtonInfo = getButtonInfoFull('menu:update')
const deleteButtonInfo = getButtonInfoFull('menu:delete')

const { loading, menuList, getList } = useMenuList()
const {
    showDrawer,
    formTitle,
    formDataRef,
    currentIndex,
    isSubmitting,
    formData,
    step,
    editFormRules,
    isParentFixed,
    menuCascaderOptions,
    permissionListLoading,
    permissionList,
    openEditDrawer,
    handleAddChild,
    handleSubmit,
    handleDelete,
    handleCancel,
    handleStepChange,
    handlePathChange,
    handleAnimateDurationChange,
    filterPermission,
} = useMenuForm({
    getList,
})

const queryFormRef = ref()
const tableListRef = ref<{
    toggleRowExpansion: (row: Menu, expanded?: boolean) => void
} | null>(null)
const queryWhere = reactive({
    status: MENU_STATUS.ALL,
})

const isExpanded = ref(false)
const titleLocaleOptions = computed(() => LOCALE_OPTIONS)
const isSingleTitleLocale = computed(() => titleLocaleOptions.value.length <= 1)
const singleTitleLocale = computed(() => titleLocaleOptions.value[0] ?? null)
const showTitleI18nDialog = ref(false)
const titleI18nDraft = ref<Record<string, string>>({})

const createLocaleTitleMap = (source: Record<string, string> = {}) => {
    return titleLocaleOptions.value.reduce<Record<string, string>>((result, locale) => {
        result[locale.value] = source[locale.value] ?? ''
        return result
    }, {})
}

const titleI18nFilledCount = computed(() => {
    return titleLocaleOptions.value.filter((locale) => (formData.title_i18n?.[locale.value] ?? '').trim().length > 0).length
})

const titleI18nPreviewText = computed(() => {
    return titleLocaleOptions.value
        .map((locale) => {
            const title = (formData.title_i18n?.[locale.value] ?? '').trim()
            return title ? `${locale.label}: ${title}` : ''
        })
        .filter(Boolean)
        .join(' | ')
})

const openTitleI18nDialog = () => {
    titleI18nDraft.value = createLocaleTitleMap(formData.title_i18n)
    showTitleI18nDialog.value = true
}

const handleTitleI18nDialogConfirm = async () => {
    formData.title_i18n = createLocaleTitleMap(titleI18nDraft.value)
    showTitleI18nDialog.value = false
    await formDataRef.value?.validateField('title_i18n').catch(() => undefined)
}

const toggleMenuRowsExpansion = (rows: Menu[], expanded: boolean) => {
    rows.forEach((row) => {
        if (!Array.isArray(row.children) || row.children.length === 0) {
            return
        }

        tableListRef.value?.toggleRowExpansion(row, expanded)
        toggleMenuRowsExpansion(row.children, expanded)
    })
}

const handleToggleExpand = async () => {
    const nextExpandedState = !isExpanded.value
    await nextTick()
    toggleMenuRowsExpansion(menuList.value, nextExpandedState)
    isExpanded.value = nextExpandedState
}

const handleCopyClick = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        Logger.error('复制失败:', error)
    }
}

const handleSearch = () => {
    isExpanded.value = false
    getList()
}

const actionButtons = computed(() => {
    return [
        {
            permission: 'menu:addChild',
            buttonInfo: addChildButtonInfo || undefined,
            showIcon: false,
            click: (row: Menu) => handleAddChild(row),
        },
        {
            permission: 'menu:update',
            buttonInfo: updateButtonInfo || undefined,
            showIcon: false,
            click: (row: Menu, index: number) => openEditDrawer(2, row, index),
        },
        {
            permission: 'menu:delete',
            buttonInfo: deleteButtonInfo || undefined,
            showIcon: false,
            click: (row: Menu) => handleDelete(row),
            divided: true,
        },
    ]
})

onMounted(() => {
    getList()
})

watch(
    () => showDrawer.value,
    (visible) => {
        if (!visible) {
            showTitleI18nDialog.value = false
        }
    }
)

const tableTitle = computed(
    () =>
        [
            {
                prop: 'title',
                h_label: t('permission.menu.name'),
                minWidth: 200,
                customRow: true,
            },
            {
                prop: 'full_path',
                h_label: t('permission.menu.routeOrPermission'),
                minWidth: 200,
                hidden: true,
                customRow: true,
                overflow: true,
                copy: true,
                h_tip: t('permission.menu.tooltips.routeOrPermission'),
                formatter: (row: Menu) => {
                    return row.type === 3 ? row.code || '-' : row.full_path || '-'
                },
            },
            {
                prop: 'type',
                h_label: t('permission.menu.type'),
                align: 'center',
                h_tip: t('permission.menu.tooltips.type'),
                width: 120,
                customRow: true,
                tag: {
                    1: { type: 'primary', text: t('permission.menu.typeDirectory') },
                    2: { type: 'success', text: t('permission.menu.typeMenu') },
                    3: { type: 'danger', text: t('permission.menu.typeButton') },
                },
            },
            {
                prop: 'status',
                h_label: t('common.labels.status'),
                align: 'center',
                width: 120,
                customRow: true,
                tag: {
                    0: { type: 'danger', text: t('common.status.disabled') },
                    1: { type: 'success', text: t('common.status.enabled') },
                },
            },
            {
                prop: 'is_show',
                h_label: t('permission.menu.show'),
                align: 'center',
                width: 120,
                customRow: true,
                tag: {
                    1: { type: 'success', text: t('common.yes') },
                    0: { type: 'danger', text: t('common.no') },
                },
                h_tip: t('permission.menu.tooltips.show'),
            },
            {
                prop: 'is_auth',
                h_label: t('permission.menu.auth'),
                align: 'center',
                width: 130,
                customRow: true,
                tag: {
                    1: { type: 'success', text: t('common.yes') },
                    0: { type: 'danger', text: t('common.no') },
                },
                h_tip: t('permission.menu.tooltips.auth'),
            },
            {
                prop: 'is_external_links',
                h_label: t('permission.menu.external'),
                align: 'center',
                width: 130,
                customRow: true,
                tag: {
                    1: { type: 'success', text: t('common.yes') },
                    0: { type: 'danger', text: t('common.no') },
                },
            },
            {
                prop: 'is_new_window',
                h_label: t('permission.menu.newWindow'),
                align: 'center',
                width: 150,
                customRow: true,
                tag: {
                    1: { type: 'success', text: t('common.yes') },
                    0: { type: 'danger', text: t('common.no') },
                },
            },
            {
                prop: 'sort',
                h_label: t('permission.menu.weight'),
                align: 'center',
                width: 100,
                h_tip: t('permission.menu.tooltips.weight'),
            },
            { prop: 'created_at', width: 160, align: 'center', h_label: t('common.labels.createdAt') },
            {
                prop: 'updated_at',
                h_label: t('common.labels.updatedAt'),
                align: 'center',
                width: 160,
                h_tip: t('permission.menu.tooltips.updatedAt'),
            },
        ] as TableColumn<Menu>[]
)
</script>

<style scoped lang="scss">
.menu-title-i18n-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.menu-title-i18n-trigger-tip {
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.menu-title-i18n-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.menu-title-i18n-locale {
    width: 88px;
    flex: 0 0 88px;
    display: flex;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .menu-title-i18n-item {
        flex-direction: column;
        align-items: stretch;
        gap: 6px;
    }

    .menu-title-i18n-locale {
        width: auto;
        flex: none;
        justify-content: flex-start;
    }
}
</style>
