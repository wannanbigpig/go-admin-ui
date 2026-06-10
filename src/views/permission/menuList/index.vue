<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
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
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :onReset="handleReset" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>
        <div class="xl-container">
            <div class="xl-table-actions">
                <el-button @click="handleToggleExpand">{{ isExpanded ? t('common.actions.collapseAll') : t('common.actions.expandAll') }}</el-button>
                <xl-action-button v-permission="'menu:add'" :show-icon="false" type="primary" code="menu:add" @click="menuDrawerRef?.openEditDrawer(1)" />
            </div>
            <div>
                <xl-table-list ref="tableListRef" :loading="loading" :data="menuList" :tableTitle="tableTitle" row-key="id" :default-expand-all="false">
                    <template #td="{ item, val, row }">
                        <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                        <span v-else-if="item.copy" trigger="click" effect="customized" :content="t('common.actions.copySuccess')" placement="left">
                            <span @click="copyText(String(val))" class="xl-cursor-pointer">
                                {{ val }}
                            </span>
                        </span>
                        <span v-else-if="item.prop == 'title'" class="xl-label-with-icon-right">
                            <el-icon v-if="(row as Menu).icon"> <xl-icon :icon="(row as Menu).icon || ''" /> </el-icon> <span>{{ val }}</span>
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
        <menu-edit-drawer ref="menuDrawerRef" :get-list="getList" />
    </div>
</template>

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import MenuEditDrawer from '../components/MenuEditDrawer.vue'
import { onMounted, ref, reactive, computed, markRaw, nextTick } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useClipboard } from '@/composables/useClipboard'
import { MENU_STATUS, MENU_TYPE } from '@/modules/menu/model'
import { useMenuList } from '@/modules/menu/useMenuList'
import { useMenuTreeExpand } from '@/modules/menu/useMenuTreeExpand'
import type { Menu } from '@/types/menu'
import type { TableColumn } from '@/types/common'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const { copyText } = useClipboard()
const { t } = useI18n()
const addChildButtonInfo = getButtonInfoFull('menu:addChild')
const updateButtonInfo = getButtonInfoFull('menu:update')
const deleteButtonInfo = getButtonInfoFull('menu:delete')

const { loading, menuList, getList } = useMenuList()
loading.value = true
const menuDrawerRef = ref<InstanceType<typeof MenuEditDrawer> | null>(null)

const queryFormRef = ref()
const tableListRef = ref<{
    toggleRowExpansion: (row: Menu, expanded?: boolean) => void
} | null>(null)
const queryWhere = reactive<{
    status: number | ''
}>({
    status: MENU_STATUS.ALL,
})

const { isExpanded, handleToggleExpand, resetExpanded } = useMenuTreeExpand({
    menuList,
    tableListRef,
})

const handleSearch = () => {
    resetExpanded()
    const params: Record<string, unknown> = {}
    if (queryWhere.status !== '') params.status = queryWhere.status
    getList(params)
}

const handleReset = () => {
    resetExpanded()
    if (queryFormRef.value) {
        queryFormRef.value.resetFields()
    }
    queryWhere.status = MENU_STATUS.ALL
    getList()
}

const actionButtons = markRaw([
    {
        permission: 'menu:addChild',
        buttonInfo: addChildButtonInfo || undefined,
        showIcon: false,
        visible: (row: Menu) => Number(row.type) !== MENU_TYPE.BUTTON,
        click: (row: Menu) => menuDrawerRef.value?.handleAddChild(row),
    },
    {
        permission: 'menu:update',
        buttonInfo: updateButtonInfo || undefined,
        showIcon: false,
        click: (row: Menu, index: number) => menuDrawerRef.value?.openEditDrawer(2, row, index),
    },
    {
        permission: 'menu:delete',
        buttonInfo: deleteButtonInfo || undefined,
        showIcon: false,
        click: (row: Menu) => menuDrawerRef.value?.handleDelete(row),
        divided: true,
    },
])

onMounted(async () => {
    loading.value = true
    await nextTick()
    // 等待过渡动画 (300ms) 彻底执行完毕，确保先流畅进入页面并显示骨架屏
    // 避开由于 apiCache 立即同步 resolved 导致的重度 DOM 同步渲染对动画执行帧率的侵占
    await new Promise<void>((resolve) => setTimeout(resolve, 350))
    await getList(queryWhere)
})

const tableTitle = computed(
    () =>
        markRaw([
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
        ]) as TableColumn<Menu>[]
)
</script>

<style scoped lang="scss"></style>
