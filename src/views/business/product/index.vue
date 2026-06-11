<template>
    <div>
        <xl-pro-table :search-model="queryWhere" :columns="columns" :loading="loading" :data="productList" :pagination="pagination" @search="onSearch" @reset="handleReset">
            <template #actions>
                <el-button type="primary" @click="openCreateDrawer">{{ t('product.addTitle') }}</el-button>
            </template>
            <template #operation>
                <el-table-column width="200" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <el-button link type="primary" @click="openEditDrawer(scope.row)">{{ t('common.actions.edit') }}</el-button>
                        <el-button link type="danger" @click="handleDelete(scope.row)">{{ t('common.actions.delete') }}</el-button>
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>

        <!-- 产品表单抽屉 -->
        <el-drawer v-model="showDrawer" :title="isEditMode ? t('product.editTitle') : t('product.addTitle')" size="40%">
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
            <template #footer>
                <el-button @click="showDrawer = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import xlProTable from '@/components/proTable/index.vue'
import DeptTreeSelect from '@/components/DeptTreeSelect.vue'
import { getProductList, createProduct, updateProduct, deleteProduct, type Product } from '@/api/product'
import { useListPage } from '@/composables/useListPage'
import { normalizeListData } from '@/modules/shared/response'
import { Logger } from '@/utils/logger'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

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
    handleReset: resetProductList,
} = useListPage<Product, typeof queryWhere>({
    query: queryWhere,
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
const showDrawer = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
    id: 0,
    name: '',
    description: '',
    price: 0,
    status: 1,
    dept_id: 0,
})

const formRules: FormRules = {
    name: [{ required: true, message: t('product.nameRequired'), trigger: 'blur' }],
}

// 表格列定义
const columns = [
    { prop: 'id', h_label: 'ID', width: 80 },
    { prop: 'name', h_label: t('product.name'), label: t('product.name'), search: { type: 'input' as const, placeholder: t('product.namePlaceholder'), span: 6 } },
    { prop: 'description', h_label: t('common.labels.description'), overflow: true },
    { prop: 'price', h_label: t('product.price'), width: 100 },
    { prop: 'status_name', h_label: t('common.labels.status'), width: 80 },
    { prop: 'dept_name', h_label: t('product.ownerDepartment'), width: 120 },
    { prop: 'created_at', h_label: t('common.labels.createdAt'), width: 180 },
]

// 搜索
const onSearch = async (model: Record<string, unknown>) => {
    Object.assign(queryWhere, model)
    await handleSearch()
}

// 重置
const handleReset = async () => {
    await resetProductList()
}

// 打开新增抽屉
const openCreateDrawer = () => {
    isEditMode.value = false
    resetForm()
    // 设置默认部门为用户的默认部门
    formData.dept_id = authStore.userInfo?.dept_id || 0
    showDrawer.value = true
}

// 打开编辑抽屉
const openEditDrawer = (row: Product) => {
    isEditMode.value = true
    formData.id = row.id
    formData.name = row.name
    formData.description = row.description
    formData.price = row.price
    formData.status = row.status
    formData.dept_id = row.dept_id
    showDrawer.value = true
}

// 重置表单
const resetForm = () => {
    formData.id = 0
    formData.name = ''
    formData.description = ''
    formData.price = 0
    formData.status = 1
    formData.dept_id = 0
    formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
        const data = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            status: formData.status,
            dept_id: formData.dept_id,
        }

        if (isEditMode.value) {
            await updateProduct({ id: formData.id, ...data })
            ElMessage.success(t('product.updateSuccess'))
        } else {
            await createProduct(data)
            ElMessage.success(t('product.createSuccess'))
        }
        showDrawer.value = false
        await getList()
    } catch (error) {
        Logger.error('提交失败:', error)
    } finally {
        submitting.value = false
    }
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
