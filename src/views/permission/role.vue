<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="角色名称" prop="name">
                            <el-input placeholder="请输入角色名称" v-model.trim="queryWhere.name" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div style="display: flex; align-items: center; margin-bottom: 10px">
                <xl-action-button v-permission="'role:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(1)" />
            </div>
            <div>
                <xl-table-list :loading="loading" :data="roleList" :tableTitle="tableTitle" :pagination="pagination" row-key="id">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val }">
                        <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <!-- 操作列 -->
                    <template #operation>
                        <el-table-column width="180" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" :maxVisibleButtons="3" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting" size="40%">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :key="currentIndex ?? 0">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="角色名称" prop="name" :rules="[{ required: true, message: '请输入角色名称', trigger: 'blur' }]">
                            <el-input v-model.trim="formData.name" placeholder="请输入角色名称" :disabled="isSuperAdminEditing"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="标识" prop="code" :rules="[{ required: true, message: '请输入角色标识', trigger: 'blur' }]">
                            <el-input v-model.trim="formData.code" placeholder="请输入角色标识" :disabled="isEditMode || isSuperAdminEditing"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="status" label="状态">
                            <el-select v-model="formData.status" placeholder="请选择状态" clearable :disabled="isSuperAdminEditing">
                                <el-option label="正常" :value="STATUS.ENABLED" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="角色描述" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" placeholder="请输入角色描述" show-word-limit type="textarea" :rows="3" :disabled="isSuperAdminEditing" />
                </el-form-item>
                <el-form-item label="菜单权限" prop="menu_list">
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
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons, { type ActionButtonConfig } from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES } from '@/constants/messages'
import { deleteRole } from '@/api/permission'
import { ROLE_STATUS } from '@/modules/role/model'
import { useRoleList } from '@/modules/role/useRoleList'
import { useRoleForm } from '@/modules/role/useRoleForm'
import type { Role } from '@/types/role'
import type { TableColumn } from '@/types/common'

const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('role:addChild')
const addButtonInfo = getButtonInfoFull('role:add')
const updateButtonInfo = getButtonInfoFull('role:update')
const deleteButtonInfo = getButtonInfoFull('role:delete')

const STATUS = ROLE_STATUS

const { loading, roleList, queryFormRef, queryWhere, pagination, getList, handleSearch } = useRoleList()

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
        ElMessage.warning('超级管理员角色不允许删除')
        return
    }

    try {
        await ElMessageBox.confirm(CONFIRM_MESSAGES.DELETE_ROLE, CONFIRM_DIALOG_TITLE, {
            type: 'warning',
        })
        await deleteRole({ id: row.id })
        ElMessage.success(RESULT_MESSAGES.DELETE_SUCCESS)
        getList()
    } catch {
        // 用户取消或报错
    }
}

onMounted(() => {
    getList()
})

const tableTitle: TableColumn<Role>[] = [
    { prop: 'id', align: 'center', h_label: 'ID', width: 80 },
    { prop: 'name', h_label: '角色名称', width: 200, overflow: true },
    { prop: 'code', h_label: '标识', width: 150 },
    { prop: 'description', h_label: '角色描述', minWidth: 200, overflow: true },
    {
        prop: 'sort',
        h_label: '排序',
        align: 'center',
        width: 100,
    },
    {
        prop: 'status',
        h_label: '状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            [STATUS.ENABLED]: { type: 'success', text: '正常' },
            [STATUS.DISABLED]: { type: 'danger', text: '禁用' },
        },
    },
    { prop: 'created_at', align: 'center', h_label: '创建时间', width: 160 },
    { prop: 'updated_at', align: 'center', h_label: '更新时间', width: 160 },
]
</script>
