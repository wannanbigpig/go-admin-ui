<template>
    <el-tree-select
        v-model="selectedIds"
        :data="deptTreeData"
        :props="treeProps"
        :placeholder="placeholder"
        :multiple="multiple"
        collapse-tags
        collapse-tags-tooltip
        :loading="loading"
        check-strictly
        :show-checkbox="multiple"
        node-key="id"
        :render-after-expand="false"
        style="width: 100%"
    />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchDepartmentList } from '@/modules/department/service'
import { Logger } from '@/utils/logger'
import type { Department } from '@/types/department'

interface Props {
    modelValue?: number | number[]
    placeholder?: string
    multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    placeholder: '请选择部门',
    multiple: true,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[]): void
}>()

const deptTreeData = ref<Department[]>([])
const loading = ref(false)

const treeProps = {
    label: 'name',
    children: 'children',
}

const selectedIds = computed({
    get: () => props.modelValue as number | number[],
    set: (val) => emit('update:modelValue', val),
})

const fetchDeptTree = async () => {
    loading.value = true
    try {
        const data = await fetchDepartmentList()
        deptTreeData.value = data || []
    } catch (error) {
        Logger.error('获取部门树数据失败:', error)
        deptTreeData.value = []
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchDeptTree()
})
</script>
