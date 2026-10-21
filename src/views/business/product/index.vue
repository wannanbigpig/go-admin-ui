<template>
    <div>
        <PageHeading :title="t('product.title')" :description="t('product.pageDescription')" />
        <xl-pro-table :search-model="queryWhere" :columns="columns" :loading="loading" :data="productList" :pagination="pagination" @search="onSearch" @reset="handleReset" @sort-change="handleSortChange">
            <template #actions>
                <xl-action-button v-permission="'product:create'" code="product:create" type="primary" :show-icon="false" @click="openCreateDrawer" />
            </template>
            <template #operation>
                <el-table-column width="200" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>

        <!-- 产品表单抽屉 -->
        <xl-drawer
            v-model="showDrawer"
            :title="isEditMode ? t('product.editTitle') : t('product.addTitle')"
            :formRef="formRef"
            :onConfirm="handleSubmit"
            :isSubmitting="submitting"
            :withReset="false"
            size="md"
        >
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
                <el-form-item :label="t('product.name')" prop="name">
                    <el-input v-model.trim="formData.name" :placeholder="t('product.namePlaceholder')" />
                </el-form-item>
                <el-form-item :label="t('product.description')" prop="description">
                    <el-input v-model.trim="formData.description" :placeholder="t('product.descriptionPlaceholder')" type="textarea" />
                </el-form-item>
                <el-form-item :label="t('product.price')" prop="price">
                    <el-input-number v-model="formData.price" :min="0" :placeholder="t('product.pricePlaceholder')" />
                </el-form-item>
                <el-form-item :label="t('common.labels.status')" prop="status">
                    <el-select v-model="formData.status" :placeholder="t('common.placeholders.selectStatus')">
                        <el-option :label="t('common.status.enabled')" :value="1" />
                        <el-option :label="t('common.status.disabled')" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('product.ownerDepartment')" prop="dept_id">
                    <DeptTreeSelect v-model="formData.dept_id" :multiple="false" :placeholder="t('product.ownerDepartmentPlaceholder')" />
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<script setup lang="ts">
import PageHeading from '@/components/pageHeading/index.vue'
import { computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlActionButtons, { type ActionButtonConfig } from '@/components/actionButtons/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import DeptTreeSelect from '@/components/DeptTreeSelect.vue'
import { getProductList, deleteProduct, type Product } from '@/api/product'
import { useListPage } from '@/composables/useListPage'
import { normalizeListData } from '@/modules/shared/response'
import { useProductForm } from '@/modules/product/useProductForm'
import { Logger } from '@/utils/logger'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import type { ProTableColumns } from '@/components/proTable/types'

const authStore = useAuthStore()
const { t } = useI18n()

// 列表相关
const queryWhere = reactive({
    name: '',
    status: undefined as number | undefined,
    page: 1,
    per_page: 15,
})

const {
    loading,
    items: productList,
    pagination,
    getList,
    handleSearch,
    handleSortChange,
    handleReset: resetProductList,
} = useListPage<Product, typeof queryWhere>({
    query: queryWhere,
    sortFields: ['id', 'name', 'price', 'created_at'],
    transformParams: (query) => ({
        ...query,
        name: query.name.trim() || '',
    }),
    fetcher: async (params) => {
        const response = await getProductList(params)
        return normalizeListData<Product>(response)
    },
})

// 表单相关
const { showDrawer, isEditMode, isSubmitting: submitting, formDataRef: formRef, formData, openCreateDrawer, openEditDrawer, handleSubmit } = useProductForm({
    getDefaultDepartmentId: () => authStore.userInfo?.dept_id || 0,
    refreshList: getList,
})

const formRules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('product.nameRequired'), trigger: 'blur' }],
}))

// 表格列定义
const columns = computed<ProTableColumns<Product>>(() => [
    { prop: 'id', sortable: 'custom', h_label: 'ID', width: 80 },
    { prop: 'name', sortable: 'custom', h_label: t('product.name'), label: t('product.name'), search: { type: 'input' as const, placeholder: t('product.namePlaceholder'), span: 6 } },
    { prop: 'description', h_label: t('common.labels.description'), overflow: true },
    { prop: 'price', sortable: 'custom', h_label: t('product.price'), width: 100 },
    { prop: 'status_name', h_label: t('common.labels.status'), width: 80 },
    { prop: 'dept_name', h_label: t('product.ownerDepartment'), width: 120 },
    { prop: 'created_at', sortable: 'custom', h_label: t('common.labels.createdAt'), width: 180 },
])

const actionButtons = computed<ActionButtonConfig<Product>[]>(() => [
    {
        permission: 'product:update',
        text: t('common.actions.edit'),
        showIcon: false,
        click: (row) => openEditDrawer(row),
    },
    {
        permission: 'product:delete',
        text: t('common.actions.delete'),
        showIcon: false,
        type: 'danger',
        click: (row) => handleDelete(row),
    },
])

// 搜索
const onSearch = async (model: Record<string, unknown>) => {
    Object.assign(queryWhere, model)
    await handleSearch()
}

// 重置
const handleReset = async () => {
    await resetProductList()
}

// 删除
const handleDelete = async (row: Product) => {
    try {
        await ElMessageBox.confirm(t('product.deleteConfirm', { name: row.name }), t('common.confirm.title'), {
            type: 'warning',
        })
        await deleteProduct(row.id)
        ElMessage.success(t('product.deleteSuccess'))
        await getList()
    } catch (error) {
        if (error !== 'cancel') {
            Logger.error('删除失败:', error)
        }
    }
}

onMounted(() => {
    getList()
})
</script>
