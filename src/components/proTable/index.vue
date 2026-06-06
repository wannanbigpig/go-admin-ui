<template>
    <div class="xl-pro-table">
        <!-- 内建搜索区（columns/search-schema 驱动）；若未配置则保留 search slot 入口 -->
        <div v-if="hasBuiltinSearch || $slots.search" class="xl-container xl-m-bottom-10">
            <slot v-if="$slots.search" name="search" />
            <el-form v-else ref="searchFormRef" class="xl-search-form" size="default" :model="localModel" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row :gutter="20">
                    <el-col v-for="(field, idx) in searchFields" :key="String(field.prop)" :span="field.span ?? 6" v-show="isFieldVisible(idx)">
                        <el-form-item :label="field.label" :prop="String(field.prop)">
                            <template v-if="field.type === 'select'">
                                <el-select v-model="localModel[field.prop]" :placeholder="field.placeholder" clearable>
                                    <el-option v-for="opt in field.options || []" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
                                </el-select>
                            </template>
                            <template v-else-if="field.type === 'daterange'">
                                <el-date-picker
                                    v-model="localModel[field.prop]"
                                    type="daterange"
                                    range-separator="-"
                                    :start-placeholder="t('common.date.start')"
                                    :end-placeholder="t('common.date.end')"
                                    value-format="YYYY-MM-DD"
                                />
                            </template>
                            <template v-else>
                                <el-input v-model.trim="localModel[field.prop]" :placeholder="field.placeholder" clearable />
                            </template>
                        </el-form-item>
                    </el-col>

                    <div ref="searchBtnRef" class="xl-search-btn xl-pro-table__search-btn">
                        <el-button type="primary" :disabled="loading" @click="handleSearch">{{ searchText }}</el-button>
                        <el-button :disabled="loading" @click="handleReset">{{ resetText }}</el-button>
                        <el-text v-show="canCollapse" class="xl-collapsible xl-cursor-pointer" type="primary" @click="toggleCollapse">
                            {{ isExpanded ? collapseText : expandText }}
                            <el-icon>
                                <i-ep-arrow-down v-show="!isExpanded" />
                                <i-ep-arrow-up v-show="isExpanded" />
                            </el-icon>
                        </el-text>
                    </div>
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div v-if="$slots.actions || $slots.toolbar" class="xl-pro-table__toolbar">
                <div v-if="$slots.actions" class="xl-table-actions xl-pro-table__toolbar-actions">
                    <slot name="actions" />
                </div>
                <div v-if="$slots.toolbar" class="xl-pro-table__toolbar-main">
                    <slot name="toolbar" />
                </div>
            </div>

            <xl-table-list
                :loading="loading"
                :data="data"
                :table-title="resolvedTableTitle"
                :border="border"
                :row-key="rowKey"
                :lazy="lazy"
                :load="load"
                :tree-props="treeProps"
                :selectable="selectable"
                :height="height"
                :pagination="pagination"
                @size-change="(size) => emit('size-change', size)"
                @current-change="(page) => emit('current-change', page)"
                @selection-change="(selection) => emit('selection-change', selection)"
                @sort-change="(payload) => emit('sort-change', payload)"
            >
                <template #td="scope">
                    <!-- 内置渲染：tag / avatar / eye，未匹配则交给 default slot -->
                    <template v-if="getCellType(scope.item) === 'tag' && scope.item.tag">
                        <el-tag :type="resolveTagType(scope.item, scope.row, scope.val)">
                            {{ resolveTagText(scope.item, scope.row, scope.val) }}
                        </el-tag>
                    </template>
                    <template v-else-if="getCellType(scope.item) === 'avatar'">
                        <el-avatar :src="String(scope.val ?? '')" :size="28" :alt="String(scope.val ?? '')" />
                    </template>
                    <template v-else-if="getCellType(scope.item) === 'eye'">
                        <span class="xl-pro-table__eye">
                            <span>{{ revealMap[String(scope.row?.id ?? scope.item.prop)] ? scope.val : '••••••' }}</span>
                            <el-icon
                                class="xl-cursor-pointer xl-m-left-10"
                                role="button"
                                tabindex="0"
                                :aria-label="t('common.actions.toggleVisibility')"
                                @click="toggleReveal(scope.row, scope.item)"
                                @keydown.enter="toggleReveal(scope.row, scope.item)"
                            >
                                <i-ep-view />
                            </el-icon>
                        </span>
                    </template>
                    <slot v-else name="td" v-bind="scope" />
                </template>
                <template #operation>
                    <slot name="operation" />
                </template>
            </xl-table-list>
        </div>
    </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed, ref, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'element-plus'
import xlTableList from '@/components/tableList/index.vue'
import type { TableColumn } from '@/types/common'
import type { ProTableColumns, ProTableSearchSchema, ProTableCellType, ProTableColumn } from './types'

interface Props {
    loading?: boolean
    data: T[]
    /** 兼容旧用法：直接传 TableColumn[]；推荐使用 columns */
    tableTitle?: TableColumn<T>[]
    /** 新用法：列定义（含 search 推导与单元格 type） */
    columns?: ProTableColumns<T>
    /** 新用法：显式声明搜索 schema；未提供则从 columns.search 推导 */
    searchSchema?: ProTableSearchSchema
    /** 内建搜索模型；若启用内建搜索必须传入（v-model:search-model） */
    searchModel?: Record<string, unknown>
    /** 默认折叠后保留显示的搜索字段数，超过则出现展开按钮 */
    searchMaxShow?: number
    border?: boolean
    rowKey?: string
    lazy?: boolean
    load?: (row: T, treeNode: unknown, resolve: (data: T[]) => void) => void
    treeProps?: { children?: string; hasChildren?: string }
    selectable?: boolean
    height?: string | number
    pagination?: {
        total: number
        page?: number
        pageSize?: number
        currentPage?: number
        pageSizeChange?: (size: number) => void
        pageChange?: (page: number) => void
    }
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    data: () => [],
    tableTitle: undefined,
    columns: undefined,
    searchSchema: undefined,
    searchModel: undefined,
    searchMaxShow: 3,
    border: false,
    rowKey: 'id',
    lazy: false,
    treeProps: () => ({ children: 'children', hasChildren: 'hasChildren' }),
    selectable: false,
    pagination: () => ({}) as NonNullable<Props['pagination']>,
})

const emit = defineEmits<{
    'size-change': [size: number]
    'current-change': [page: number]
    'selection-change': [selection: T[]]
    'sort-change': [payload: { column: unknown; prop: string; order: 'ascending' | 'descending' | null }]
    search: [model: Record<string, unknown>]
    reset: []
    'update:searchModel': [model: Record<string, unknown>]
}>()

const { t } = useI18n()

// ==================== 列定义解析 ====================
/**
 * 将 ProTableColumn 转换为 TableColumn（沿用 tableList 现有渲染管线）。
 * 仅做字段映射，不破坏 customRow 行为。
 */
const toTableColumn = <R,>(col: ProTableColumn<R>): TableColumn<R> => {
    const cellType = col.type
    const needsCustomTd = cellType === 'tag' || cellType === 'avatar' || cellType === 'eye' || cellType === 'custom'
    return {
        ...col,
        h_label: col.h_label ?? col.label ?? '',
        customRow: col.customRow || needsCustomTd,
    } as TableColumn<R>
}

const resolvedTableTitle = computed<TableColumn<T>[]>(() => {
    if (props.tableTitle && props.tableTitle.length > 0) return props.tableTitle
    if (props.columns && props.columns.length > 0) {
        return props.columns.map((c) => toTableColumn(c))
    }
    return []
})

const getCellType = (item: TableColumn<T> | ProTableColumn<T>): ProTableCellType | undefined => {
    return (item as ProTableColumn<T>).type
}

const resolveTagType = (item: TableColumn<T>, row: T, val: unknown) => {
    if (!item.tag) return 'info'
    const key = item.tagKey ? (row as Record<string, unknown>)[item.tagKey as string] : val
    return item.tag[key as string | number]?.type || 'info'
}

const resolveTagText = (item: TableColumn<T>, row: T, val: unknown) => {
    if (!item.tag) return val
    const key = item.tagKey ? (row as Record<string, unknown>)[item.tagKey as string] : val
    return item.tag[key as string | number]?.text ?? val
}

// ==================== eye 切换 ====================
const revealMap = reactive<Record<string, boolean>>({})
const toggleReveal = (row: T, item: TableColumn<T>) => {
    const key = String((row as Record<string, unknown>)?.id ?? item.prop)
    revealMap[key] = !revealMap[key]
}

// ==================== 内建搜索 ====================
const searchFields = computed<ProTableSearchSchema>(() => {
    if (props.searchSchema && props.searchSchema.length > 0) return props.searchSchema
    if (!props.columns) return []
    return props.columns
        .filter((c) => !!c.search)
        .map((c) => ({
            prop: String(c.prop),
            label: c.search?.label ?? c.label ?? c.h_label ?? '',
            type: c.search?.type,
            placeholder: c.search?.placeholder,
            options: c.search?.options,
            span: c.search?.span,
        }))
})

const hasBuiltinSearch = computed(() => searchFields.value.length > 0)

const localModel = reactive<Record<string, unknown>>({})

// 监听 props.searchModel 的改变（仅浅层监听对象引用的替换，如重置操作）
watch(
    () => props.searchModel,
    (newVal) => {
        if (newVal) {
            // 移除 localModel 中 newVal 不存在的 key
            Object.keys(localModel).forEach((key) => {
                if (!(key in newVal)) {
                    delete localModel[key]
                }
            })
            // 同步最新的值
            Object.assign(localModel, newVal)
        }
    },
    { immediate: true }
)

// 浅层监听 localModel 属性的改变（第一层结构改变），再同步 emit 给外层
watch(
    () => ({ ...localModel }),
    (newVal) => {
        if (props.searchModel) {
            let hasDiff = false
            const keys = Object.keys({ ...newVal, ...props.searchModel })
            for (const key of keys) {
                if (newVal[key] !== props.searchModel[key]) {
                    hasDiff = true
                    break
                }
            }
            if (hasDiff) {
                emit('update:searchModel', { ...newVal })
            }
        }
    }
)

const isExpanded = ref(false)
const searchFormRef = ref<FormInstance | null>(null)
const searchBtnRef = ref<HTMLDivElement | null>(null)

const canCollapse = computed(() => props.searchMaxShow > 0 && searchFields.value.length > props.searchMaxShow)
const isFieldVisible = (idx: number) => {
    if (!canCollapse.value) return true
    return isExpanded.value || idx < props.searchMaxShow
}
const toggleCollapse = () => {
    isExpanded.value = !isExpanded.value
}

const searchText = computed(() => t('common.actions.search'))
const resetText = computed(() => t('common.actions.reset'))
const expandText = computed(() => t('common.actions.expand'))
const collapseText = computed(() => t('common.actions.collapse'))

const handleSearch = () => {
    emit('search', { ...localModel })
}

const handleReset = () => {
    searchFormRef.value?.resetFields()
    emit('reset')
}

// 当 searchSchema 变化时，确保 localModel 含有所有字段（初始化默认 ''）
watch(
    () => searchFields.value,
    (fields) => {
        fields.forEach((f) => {
            if (!(f.prop in localModel)) {
                localModel[f.prop] = f.type === 'daterange' ? [] : ''
            }
        })
    },
    { immediate: true }
)

defineExpose({
    searchFormRef,
    searchBtnRef,
})
</script>

<style scoped lang="scss">
.xl-pro-table__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
}

.xl-pro-table__toolbar-actions {
    flex: 1;
    min-width: 0;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
    border-bottom: none !important;
}

.xl-pro-table__toolbar-main {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
}

.xl-pro-table__search-btn {
    display: flex;
    align-items: center;
    margin-left: auto;
    margin-bottom: 18px;
    padding-right: 12px;
}

.xl-pro-table__eye {
    display: inline-flex;
    align-items: center;
}

.xl-collapsible {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 12px;
    line-height: 32px;
}

@media (max-width: 960px) {
    .xl-pro-table__toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .xl-pro-table__toolbar-actions {
        width: 100%;
    }
}
</style>
