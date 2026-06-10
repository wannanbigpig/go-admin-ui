<template>
    <div>
        <xl-pro-table :search-model="queryWhere" :columns="columns" :loading="loading" :data="productList" :pagination="pagination" @search="onSearch" @reset="handleReset">
            <template #actions>
                <el-button type="primary" @click="openCreateDrawer">新增产品</el-button>
            </template>
            <template #operation>
                <el-table-column width="200" label="操作" align="center" fixed="right">
                    <template #default="scope">
                        <el-button link type="primary" @click="openEditDrawer(scope.row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>

        <!-- 产品表单抽屉 -->
        <el-drawer v-model="showDrawer" :title="isEditMode ? '编辑产品' : '新增产品'" size="40%">
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
                <el-form-item label="产品名称" prop="name">
                    <el-input v-model.trim="formData.name" placeholder="请输入产品名称" />
                </el-form-item>
                <el-form-item label="产品描述" prop="description">
                    <el-input v-model.trim="formData.description" placeholder="请输入产品描述" type="textarea" />
                </el-form-item>
                <el-form-item label="价格(分)" prop="price">
                    <el-input-number v-model="formData.price" :min="0" placeholder="请输入价格" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="formData.status" placeholder="请选择状态">
                        <el-option label="启用" :value="1" />
                        <el-option label="禁用" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item label="归属部门" prop="dept_id">
                    <DeptTreeSelect v-model="formData.dept_id" :multiple="false" placeholder="请选择部门（不选则使用默认部门）" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showDrawer = false">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
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

const authStore = useAuthStore()

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
    name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
}

// 表格列定义
const columns = [
    { prop: 'id', h_label: 'ID', width: 80 },
    { prop: 'name', h_label: '产品名称', label: '产品名称', search: { type: 'input' as const, placeholder: '请输入产品名称', span: 6 } },
    { prop: 'description', h_label: '描述', overflow: true },
    { prop: 'price', h_label: '价格(分)', width: 100 },
    { prop: 'status_name', h_label: '状态', width: 80 },
    { prop: 'dept_id', h_label: '部门ID', width: 100 },
    { prop: 'created_at', h_label: '创建时间', width: 180 },
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
            ElMessage.success('更新成功')
        } else {
            await createProduct(data)
            ElMessage.success('创建成功')
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
        await ElMessageBox.confirm(`确定要删除产品"${row.name}"吗？`, '提示', {
            type: 'warning',
        })
        await deleteProduct(row.id)
        ElMessage.success('删除成功')
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
