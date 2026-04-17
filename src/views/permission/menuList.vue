<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryWhere.status" clearable placeholder="全部">
                                <el-option label="全部" :value="-1" />
                                <el-option label="正常" :value="1" />
                                <el-option label="禁用" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>
        <div class="xl-container">
            <div style="display: flex; margin-bottom: 10px">
                <xl-action-button v-permission="'menu:add'" :show-icon="false" type="primary" :button-info="addButtonInfo || {}" @click="openEditDrawer(1)" />
            </div>
            <div>
                <xl-table-list :loading="loading" :data="menuList" :tableTitle="tableTitle" row-key="id" :default-expand-all="false">
                    <template #td="{ item, val, row }">
                        <el-tag v-if="item.tag" :type="item.tag[val]?.type || 'info'">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <span v-else-if="item.prop == 'title'" class="xl-label-with-icon-right">
                            <el-icon> <xl-icon :icon="row['icon']" /> </el-icon> <span>{{ val }}</span>
                        </span>
                        <span v-else>{{ val }}</span>
                    </template>
                    <template #operation>
                        <el-table-column width="200" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>

        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" label-position="top" :key="currentIndex ?? 0">
                <el-form-item label="上级菜单" prop="parent_id">
                    <el-input v-model="formData.parent_id" placeholder="上级ID"></el-input>
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="路由标题" prop="title">
                            <el-input v-model.trim="formData.title" placeholder="请输入路由标题"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="标识" prop="code">
                            <el-input v-model.trim="formData.code" placeholder="请输入标识"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="类型" prop="type">
                            <el-select v-model="formData.type">
                                <el-option label="目录" :value="1" />
                                <el-option label="菜单" :value="2" />
                                <el-option label="按钮" :value="3" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="是否显示" prop="is_show">
                            <el-switch v-model="formData.is_show" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </xl-drawer>
    </div>
</template>

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import { onMounted, ref, computed, reactive } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useMenuList } from '@/modules/menu/useMenuList'
import { useMenuForm } from '@/modules/menu/useMenuForm'
import type { Menu } from '@/types/menu'

const { getButtonInfoFull } = usePermission()
const addButtonInfo = getButtonInfoFull('menu:add')
const updateButtonInfo = getButtonInfoFull('menu:update')
const deleteButtonInfo = getButtonInfoFull('menu:delete')

const { loading, menuList, getList } = useMenuList()
const { showDrawer, formTitle, formDataRef, currentIndex, isSubmitting, formData, openEditDrawer, editConfirmSubmit, handleDelete } = useMenuForm({
    getList,
})

const queryFormRef = ref()
const queryWhere = reactive({
    status: -1,
})

const handleSearch = () => {
    getList()
}

const actionButtons = computed(() => {
    return [
        {
            permission: 'menu:update',
            buttonInfo: updateButtonInfo,
            showIcon: false,
            click: (row: Menu, index: number) => openEditDrawer(2, row, index),
        },
        {
            permission: 'menu:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: false,
            click: (row: Menu) => handleDelete(row),
        },
    ]
})

onMounted(() => {
    getList()
})

const tableTitle: any[] = [
    { prop: 'title', h_label: '名称', minWidth: 200, customRow: true },
    { prop: 'code', h_label: '标识', width: 150 },
    {
        prop: 'type',
        h_label: '类型',
        align: 'center',
        width: 100,
        tag: {
            1: { type: 'primary', text: '目录' },
            2: { type: 'success', text: '菜单' },
            3: { type: 'danger', text: '按钮' },
        },
    },
    { prop: 'created_at', width: 160, align: 'center', h_label: '创建时间' },
]
</script>
