<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="角色名称" prop="name">
                            <el-input placeholder="请输入角色名称" v-model.trim="queryWhere.name" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryWhere.status" clearable placeholder="请选择状态">
                                <el-option label="正常" :value="STATUS.NORMAL" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div style="display: flex; align-items: center; margin-bottom: 10px">
                <xl-action-button v-permission="'role:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(EDIT_TYPE.ADD)" />
            </div>
            <div v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
                <xl-table-list ref="tableListRef" :data="roleList" :tableTitle="tableTitle" :pagination="pagination" :lazy="true" :load="loadChildren" :tree-props="treeProps" row-key="id">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val }">
                        <el-tag v-if="item.tag" :type="item.tag[val]?.type || item.tag['other']?.type">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <!-- 操作列 -->
                    <template #operation>
                        <el-table-column width="180" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons(scope)" :scope="scope" :maxVisibleButtons="3" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <!-- 骨架屏 -->
            <el-skeleton v-if="menuTreeLoading" animated>
                <template #template>
                    <el-form size="default" label-width="auto">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 80px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 80px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 60px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 60px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 76px" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 200px" />
                        </el-form-item>
                    </el-form>
                </template>
            </el-skeleton>
            <!-- 表单内容 -->
            <el-form v-else ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules()" :key="currentIndex">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="角色名称" prop="name">
                            <el-input v-model.trim="formData.name" placeholder="请输入角色名称" :disabled="isSuperAdminEditing"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="上级角色" prop="pid">
                            <el-select v-model="formData.pid" placeholder="请选择上级角色" clearable :disabled="isSuperAdminEditing" @change="handleParentRoleChange">
                                <el-option label="顶级角色" :value="0" />
                                <el-option v-for="role in filteredRoleOptions" :key="role.id" :label="role.label || role.name" :value="role.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="排序" prop="sort">
                            <el-input-number v-model.number="formData.sort" :min="0" :step="10" placeholder="请输入排序值" controls-position="right" style="width: 100%" :disabled="isSuperAdminEditing" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="status" label="状态">
                            <el-select v-model="formData.status" placeholder="请选择状态" clearable :disabled="isSuperAdminEditing">
                                <el-option label="正常" :value="STATUS.NORMAL" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="角色描述" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" placeholder="请输入角色描述" show-word-limit type="textarea" :rows="3" :disabled="isSuperAdminEditing" />
                </el-form-item>
                <el-form-item label="菜单权限" prop="menu_list">
                    <el-tree
                        ref="menuTreeRef"
                        :data="menuTreeData"
                        :props="{ label: 'title', children: 'children', disabled: 'disabled' }"
                        show-checkbox
                        node-key="id"
                        :default-checked-keys="formData.menu_list"
                        @check="handleMenuCheck"
                        class="menu-permission-tree"
                    >
                        <template #default="{ node, data }">
                            <span class="tree-node-label">
                                <span>{{ node.label }}</span>
                                <span v-if="data.disabled" class="disabled-tag">（已拥有）</span>
                            </span>
                        </template>
                    </el-tree>
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<style lang="scss" scoped>
.menu-permission-tree {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;

    .tree-node-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .disabled-tag {
        color: #f56c6c;
        font-size: 12px;
        font-weight: normal;
    }
}
</style>

<script setup>
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { deleteRoleItem } from '@/modules/permission/service'
import { isSuperAdminRole, ROLE_EDIT_TYPE, ROLE_STATUS, ROLE_TREE_PROPS } from '@/modules/role/model'
import { useRoleList } from '@/modules/role/useRoleList'
import { useRoleForm } from '@/modules/role/useRoleForm'
const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('role:addChild')
const addButtonInfo = getButtonInfoFull('role:add')
const updateButtonInfo = getButtonInfoFull('role:update')
const deleteButtonInfo = getButtonInfoFull('role:delete')

// ==================== 常量定义 ====================
const tableListRef = ref(null)
const STATUS = ROLE_STATUS
const EDIT_TYPE = ROLE_EDIT_TYPE
const treeProps = ROLE_TREE_PROPS

const { loading, roleList, queryFormRef, queryWhere, pagination, getList, handleSearch, loadChildren, refreshParentNodeChildren } = useRoleList(tableListRef)
const {
    showDrawer,
    formDataRef,
    formTitle,
    currentIndex,
    isSubmitting,
    menuTreeRef,
    formData,
    isSuperAdminEditing,
    getDynamicRules,
    filteredRoleOptions,
    menuTreeData,
    menuTreeLoading,
    handleMenuCheck,
    handleParentRoleChange,
    openEditDrawer,
    handleAddChild,
    editConfirmSubmit,
} = useRoleForm({
    roleList,
    refreshParentNodeChildren,
})

// ==================== 操作处理 ====================
/**
 * 添加子级角色
 */
const actionButtons = (scope) => {
    const buttons = []
    const row = scope.row || scope

    // 只有顶级角色（pid === 0）才显示"新增子角色"按钮
    if (row.pid === 0 || row.pid === null) {
        buttons.push({
            permission: 'role:addChild',
            buttonInfo: addChildButtonInfo,
            showIcon: false,
            click: (row) => handleAddChild(row),
            disabled: isSuperAdminRole(row),
        })
    }

    buttons.push(
        {
            permission: 'role:update',
            buttonInfo: updateButtonInfo,
            showIcon: false,
            click: (row, index) => openEditDrawer(EDIT_TYPE.EDIT, row, index),
            disabled: isSuperAdminRole(row),
        },
        {
            permission: 'role:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: false,
            click: (row) => handleDelete(row),
            divided: true,
            disabled: isSuperAdminRole(row),
            tooltip: isSuperAdminRole(row) ? '该系统保留对象不允许删除' : '',
        }
    )

    return buttons
}

/**
 * 删除角色
 */
const handleDelete = async (row) => {
    if (isSuperAdminRole(row)) {
        ElMessage.warning('超级管理员角色不允许删除')
        return
    }

    try {
        await ElMessageBox.confirm('确认删除该角色吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        const parentId = row.pid || 0
                        await deleteRoleItem(row.id)
                        ElMessage.success('删除成功')

                        // 刷新父节点的子节点数据
                        await refreshParentNodeChildren(parentId)
                        // 如果删除的是顶级节点，也需要刷新列表
                        if (parentId === 0) {
                            getList()
                        }

                        done()
                    } catch (error) {
                        console.error('删除失败:', error)
                        instance.confirmButtonLoading = false
                        instance.confirmButtonText = '确认'
                    }
                } else {
                    done()
                }
            },
        })
    } catch {
        // 用户取消删除时不处理
    }
}

onMounted(() => {
    getList()
})

const tableTitle = [
    {
        prop: 'name',
        h_label: '角色名称',
        width: 200,
        overflow: true,
    },
    {
        prop: 'description',
        h_label: '角色描述',
        minWidth: 200,
        overflow: true,
    },
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
            [STATUS.NORMAL]: { type: 'success', text: '正常' },
            [STATUS.DISABLED]: { type: 'danger', text: '禁用' },
        },
    },
    {
        prop: 'created_at',
        align: 'center',
        h_label: '创建时间',
        width: 160,
    },
    {
        prop: 'updated_at',
        align: 'center',
        h_label: '更新时间',
        width: 160,
    },
]
</script>
