<template>
    <div ref="btnRef" class="xl-search-btn">
        <el-button type="primary" native-type="button" @click="handleSearch" :disabled="loading">{{ t('common.actions.search') }}</el-button>
        <el-button v-if="withReset" native-type="button" @click="handleReset" :disabled="loading">{{ t('common.actions.reset') }}</el-button>
        <el-text v-show="showCollapsible" class="xl-collapsible xl-cursor-pointer" type="primary" @click="toggleCollapse">
            {{ isFolded ? t('common.actions.collapse') : t('common.actions.expand') }}
            <el-icon>
                <i-ep-arrow-down v-show="!isFolded" />
                <i-ep-arrow-up v-show="isFolded" />
            </el-icon>
        </el-text>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, inject, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { formContextKey, type FormInstance } from 'element-plus'
import { Logger } from '@/utils/logger'

const formContext = inject(formContextKey, undefined)

// ==================== Props 定义 ====================
interface Props {
    /** 最大显示的表单项数量，超过此数量将显示折叠/展开按钮 */
    maxShow?: number
    /** 加载状态，控制按钮是否禁用 */
    loading?: boolean
    /** 表单项选择器，用于查找需要控制的表单项 */
    nodeName?: string
    /** 表单引用对象，用于获取表单元素或调用 resetFields 方法 */
    modelRef?: FormInstance | Record<string, unknown> | HTMLElement | null
    /** 是否显示重置按钮 */
    withReset?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    maxShow: 3,
    loading: false,
    nodeName: '#searchForm > .el-col',
    modelRef: null,
    withReset: true,
})

const emit = defineEmits<{
    search: []
    reset: []
}>()

const { t } = useI18n()
const instance = getCurrentInstance()

// ==================== 响应式数据 ====================
const isFolded = ref(false)
const visibleItems = ref<HTMLElement[]>([])
const btnRef = ref<HTMLDivElement | null>(null)

// ==================== 计算属性 ====================
const showCollapsible = computed(() => props.maxShow > 0 && visibleItems.value.length > props.maxShow)

const hasResetListener = computed(() => {
    const vnodeProps = instance?.vnode.props
    return !!(vnodeProps && (vnodeProps.onReset || vnodeProps['onReset']))
})

// ==================== 方法 ====================
/**
 * 处理查询按钮点击
 */
const handleSearch = () => {
    emit('search')
}

/**
 * 切换折叠/展开状态
 */
const toggleCollapse = () => {
    isFolded.value = !isFolded.value
}

/**
 * 重置表单
 * 优先通知父级处理，未监听 reset 时使用 modelRef 的 resetFields 方法
 */
const handleReset = () => {
    emit('reset')
    if (hasResetListener.value) {
        return
    }
    if (props.modelRef && 'resetFields' in props.modelRef && typeof props.modelRef.resetFields === 'function') {
        props.modelRef.resetFields()
    } else {
        Logger.warn('collapsibleSearchBtn: reset 未监听且 modelRef 无 resetFields 方法')
    }
}

/**
 * 获取表单项元素并初始化可见性
 */
const getFormItems = async () => {
    await nextTick()

    let container: HTMLElement | Document | null = null
    if (props.modelRef) {
        // 如果 modelRef 提供了，使用 modelRef 的 $el 作为容器（如果是 Vue 组件实例则访问 $el，否则直接使用）
        const anyRef = props.modelRef as Record<string, unknown>
        container = (anyRef.$el as HTMLElement) || (props.modelRef as HTMLElement)
    } else if (formContext && (formContext as unknown as Record<string, unknown>).$el) {
        container = (formContext as unknown as Record<string, unknown>).$el as HTMLElement
    } else if (btnRef.value) {
        // 否则限制在当前组件附近的表单或父级容器内，防止全局 querySelectorAll 污染其他区域 of 表单
        container = btnRef.value.closest('form') || btnRef.value.parentElement
    }

    if (!container) return

    const formItems = container.querySelectorAll(props.nodeName)
    formItems.forEach((item) => {
        const htmlItem = item as HTMLElement
        visibleItems.value.push(htmlItem)
        // 如果超过最大显示数量，默认隐藏
        if (props.maxShow > 0 && visibleItems.value.length > props.maxShow) {
            htmlItem.classList.add('xl-display-none')
        }
    })
}

/**
 * 根据折叠状态和最大显示数量更新表单项的可见性
 */
const updateVisibility = () => {
    visibleItems.value.forEach((item, index) => {
        const shouldShow = isFolded.value || index < props.maxShow
        if (shouldShow) {
            item.classList.remove('xl-display-none')
        } else {
            item.classList.add('xl-display-none')
        }
    })
}

// ==================== 生命周期 ====================
onMounted(() => {
    getFormItems()
})

watch([() => props.maxShow, isFolded], () => {
    updateVisibility()
})
</script>

<style lang="scss" scoped>
.xl-search-btn {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    flex: 1;
    padding-right: 12px;
    min-width: 200px;
    margin-bottom: 18px; /* Match el-form-item margin-bottom */
}

.xl-collapsible {
    margin-left: 12px;
    line-height: 32px; /* Match standard button/input height */
}
</style>
