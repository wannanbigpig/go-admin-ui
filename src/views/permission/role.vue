<template>
    <div>
        <xl-pro-table :search-model="queryWhere" :columns="columns" :loading="loading" :data="roleList" :pagination="pagination" row-key="id" @search="onSearch" @reset="handleReset">
            <template #actions>
                <xl-action-button v-permission="'role:add'" code="role:add" :show-icon="false" type="primary" @click="openEditDrawer(1)" />
            </template>
            <template #operation>
                <el-table-column width="180" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <xl-action-buttons :buttons="actionButtons" :scope="scope" :maxVisibleButtons="3" />
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting" size="40%">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :key="currentIndex ?? 0">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('permission.role.name')" prop="name" :rules="[{ required: true, message: t('validation.role.nameInputRequired'), trigger: 'blur' }]">
                            <el-input v-model.trim="formData.name" :placeholder="t('permission.role.namePlaceholder')" :disabled="isSuperAdminEditing"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('permission.role.code')" prop="code" :rules="[{ required: true, message: t('validation.role.codeInputRequired'), trigger: 'blur' }]">
                            <el-input v-model.trim="formData.code" :placeholder="t('permission.role.codePlaceholder')" :disabled="isEditMode || isSuperAdminEditing"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="status" :label="t('common.labels.status')">
                            <el-select v-model="formData.status" :placeholder="t('permission.role.statusPlaceholder')" clearable :disabled="isSuperAdminEditing">
                                <el-option :label="t('common.status.enabled')" :value="STATUS.ENABLED" />
                                <el-option :label="t('common.status.disabled')" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('permission.role.description')" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" :placeholder="t('permission.role.descriptionPlaceholder')" show-word-limit type="textarea" :rows="3" :disabled="isSuperAdminEditing" />
                </el-form-item>
                <el-form-item :label="t('permission.role.menuPermission')" prop="menu_list">
                    <div style="width: 100%; border: 1px solid var(--el-border-color); border-radius: 4px; padding: 10px">
                        <el-skeleton v-if="menuTreeLoading" animated />
                        <el-tree
                            v-else
                            ref="menuTreeRef"
                            :data="menuTreeData"
                            :props="{ label: 'title', children: 'children', disabled: 'disabled' }"
                            show-checkbox
                            node-key="id"
                            :default-checked-keys="formData.menu_list"
                            @check="handleMenuCheck"
                        />
                    </div>
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<script setup lang="ts">
import xlProTable from '@/components/proTable/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons, { type ActionButtonConfig } from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES } from '@/constants/messages'
import { deleteRole } from '@/api/permission'
import { ROLE_STATUS } from '@/modules/role/model'
import { useRoleList } from '@/modules/role/useRoleList'
import { useRoleForm } from '@/modules/role/useRoleForm'
import type { Role } from '@/types/role'
import type { ProTableColumns } from '@/components/proTable/types'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('role:addChild')
const updateButtonInfo = getButtonInfoFull('role:update')
const deleteButtonInfo = getButtonInfoFull('role:delete')
const { t } = useI18n()

const STATUS = ROLE_STATUS

const onSearch = (model: Record<string, unknown>) => {
    Object.assign(queryWhere, model)
    handleSearch()
}

/* eslint-disable prefer-const */
let { loading, roleList, queryWhere, pagination, getList, handleSearch, handleReset } = useRoleList()

/* eslint-enable prefer-const */

const refreshParentNodeChildren = async (_parentId: number) => {
    await getList()
}

const {
    showDrawer,
    formDataRef,
    formTitle,
    currentIndex,
    isSubmitting,
    menuTreeRef,
    formData,
    isEditMode,
    isSuperAdminEditing,
    menuTreeData,
    menuTreeLoading,
    handleMenuCheck,
    openEditDrawer,
    handleAddChild,
    editConfirmSubmit,
} = useRoleForm({
    roleList,
    refreshParentNodeChildren,
})

type RoleActionScope = { row?: Role } | Role

const actionButtons = (scope: RoleActionScope): ActionButtonConfig<Role>[] => {
    const buttons: ActionButtonConfig<Role>[] = []
    const row: Role = (typeof scope === 'object' && scope !== null && 'row' in scope ? scope.row : scope) as Role

    // 只有顶级角色（pid === 0 或 null）才显示"新增子角色"按钮
    if (!row || row.pid === 0 || row.pid === null) {
        buttons.push({
            permission: 'role:addChild',
            buttonInfo: addChildButtonInfo || undefined,
            showIcon: false,
            click: (row: Role) => handleAddChild(row),
        })
    }

    buttons.push(
        {
            permission: 'role:update',
            buttonInfo: updateButtonInfo || undefined,
            showIcon: false,
            click: (row: Role, index: number) => openEditDrawer(2, row, index),
            disabled: (row: Role) => row.code === 'super_admin',
        },
        {
            permission: 'role:delete',
            buttonInfo: deleteButtonInfo || undefined,
            showIcon: false,
            click: (row: Role) => handleDelete(row),
            disabled: (row: Role) => row.code === 'super_admin',
            divided: true,
        }
    )
    return buttons
}

const handleDelete = async (row: Role) => {
    if (row.code === 'super_admin') {
        ElMessage.warning(t('permission.role.superAdminDeleteForbidden'))
        return
    }

    try {
        await ElMessageBox.confirm(t(CONFIRM_MESSAGES.DELETE_ROLE), t(CONFIRM_DIALOG_TITLE), {
            type: 'warning',
        })
        await deleteRole({ id: row.id })
        ElMessage.success(t(RESULT_MESSAGES.DELETE_SUCCESS))
        getList()
    } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
            ElMessage.error(t(RESULT_MESSAGES.DELETE_FAILED))
        }
    }
}

onMounted(() => {
    getList()
})

const columns = computed<ProTableColumns<Role>>(() => [
    { prop: 'id', align: 'center', h_label: t('common.labels.id'), width: 80 },
    {
        prop: 'name',
        h_label: t('permission.role.name'),
        label: t('permission.role.name'),
        width: 200,
        overflow: true,
        search: { type: 'input', placeholder: t('permission.role.namePlaceholder'), span: 4 },
    },
    { prop: 'code', h_label: t('permission.role.code'), width: 150 },
    { prop: 'description', h_label: t('permission.role.description'), minWidth: 200, overflow: true },
    {
        prop: 'sort',
        h_label: t('common.labels.sort'),
        align: 'center',
        width: 100,
    },
    {
        prop: 'status',
        h_label: t('common.labels.status'),
        align: 'center',
        width: 120,
        type: 'tag',
        tag: {
            [STATUS.ENABLED]: { type: 'success', text: t('common.status.enabled') },
            [STATUS.DISABLED]: { type: 'danger', text: t('common.status.disabled') },
        },
    },
    { prop: 'created_at', align: 'center', h_label: t('common.labels.createdAt'), width: 160 },
    { prop: 'updated_at', align: 'center', h_label: t('common.labels.updatedAt'), width: 160 },
])
</script>
