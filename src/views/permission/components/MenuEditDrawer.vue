<template>
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
            <el-form-item :label="t('permission.menu.parentMenu')" prop="pid">
                <el-cascader
                    v-model="formData.pid"
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
                        <xl-i18n-input
                            v-model="formData.title_i18n"
                            :placeholder="t('permission.menu.titleI18nDialogPreviewPlaceholder')"
                            :item-placeholder="t('permission.menu.routeTitleLocalePlaceholder')"
                            :dialog-title="t('permission.menu.titleI18nDialogTitle')"
                            show-tip
                            maxlength="12"
                            show-word-limit
                        />
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
                    <el-form-item :label="t('permission.menu.routeComponentPath')" prop="component_key" :required="formData.type === MENU_TYPE.MENU && formData.is_external_links !== MENU_SWITCH_VALUE.YES">
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
                        <el-input v-model.trim="formData.component_key" :placeholder="t('permission.menu.componentPathPlaceholder')" />
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
                        <el-input v-model="formData.animate_duration" :placeholder="t('permission.menu.animationDurationPlaceholder')" @input="handleAnimateDurationChange(formData.animate_duration ?? '', 2)"></el-input>
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
</template>

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import xlI18nInput from '@/components/i18nInput/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import { MENU_TYPE, MENU_SWITCH_VALUE, MENU_CASCADER_PROPS } from '@/modules/menu/model'
import { useMenuForm } from '@/modules/menu/useMenuForm'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    getList: () => Promise<void>
}>()

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
    getList: props.getList,
})

defineExpose({
    openEditDrawer,
    handleAddChild,
    handleDelete,
})
</script>
