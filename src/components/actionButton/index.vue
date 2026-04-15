<!--
  操作按钮组件 - 统一的按钮组件，支持图标、文本、tooltip 等功能
  
  ==================== 功能特性 ====================
  1. 支持图标和文本的灵活显示控制
  2. 支持 tooltip 提示（当只显示图标时）
  3. 支持所有 el-button 的属性（type、link、size 等）
  4. 支持权限控制（通过 v-permission 指令）
  5. 自动处理按钮间距
  
  ==================== Props 说明 ====================
  buttonInfo: Object | null
    - 按钮信息对象，包含 icon 和 title
    - icon: String - 图标名称（Iconify 图标）
    - title: String - 按钮标题文本
    - 示例: { icon: 'mdi:plus', title: '新增' }
  
  text: String
    - 按钮文本（当 buttonInfo 不存在时使用）
    - 默认: ''
  
  showText: Boolean
    - 是否显示文本
    - 默认: true
    - 如果为 false，则优先显示 icon，没有 icon 才显示文本
  
  showTooltip: Boolean
    - 是否显示 tooltip
    - 默认: false
    - 当 showText 为 false 且只显示图标时，如果为 true 则显示 tooltip
  
  showIcon: Boolean
    - 是否显示图标
    - 默认: true
    - 如果为 false，即使有图标也不显示
  
  type: String
    - 按钮类型（primary、success、warning、danger、info、text）
    - 默认: undefined（使用 el-button 的默认值）
  
  link: Boolean
    - 是否为链接样式
    - 默认: undefined（使用 el-button 的默认值）
  
  size: String
    - 按钮尺寸（large、default、small）
    - 默认: undefined（使用 el-button 的默认值）
  
  ==================== 事件 ====================
  @click: (event: Event) => void
    - 按钮点击事件
  
  ==================== 使用示例 ====================
  
  【示例 1】基础使用（显示图标和文本）
  <xl-action-button
    :button-info="{ icon: 'mdi:plus', title: '新增' }"
    type="primary"
    @click="handleAdd"
  />
  
  【示例 2】只显示图标（带 tooltip）
  <xl-action-button
    :button-info="{ icon: 'mdi:edit', title: '编辑' }"
    :show-text="false"
    :show-tooltip="true"
    type="primary"
    link
    @click="handleEdit"
  />
  
  【示例 3】只显示文本（无图标）
  <xl-action-button
    text="删除"
    :show-icon="false"
    type="danger"
    @click="handleDelete"
  />
  
  【示例 4】使用自定义文本（不使用 buttonInfo）
  <xl-action-button
    text="保存"
    type="success"
    size="large"
    @click="handleSave"
  />
  
  【示例 5】带权限控制
  <xl-action-button
    v-permission="'user:add'"
    :button-info="{ icon: 'mdi:plus', title: '新增用户' }"
    type="primary"
    @click="handleAddUser"
  />
  
  【示例 6】传递所有 el-button 支持的属性
  <xl-action-button
    :button-info="{ icon: 'mdi:download', title: '导出' }"
    type="primary"
    :loading="isExporting"
    :disabled="!canExport"
    @click="handleExport"
  />
  
  ==================== 注意事项 ====================
  1. buttonInfo 和 text 可以同时存在，但 buttonInfo.title 的优先级高于 text
  2. 如果 showText 为 false 且没有图标，会自动显示文本（避免按钮为空）
  3. tooltip 只在 showText 为 false 且只显示图标时才会显示
  4. 所有 el-button 支持的属性都可以通过 props 或 HTML 属性传递
  5. 组件会自动处理按钮间距，无需手动设置 margin
  6. 权限控制使用 v-permission 指令，会自动应用到根元素
-->
<template>
    <span class="xl-action-button-wrapper" :title="tooltipContent || undefined">
        <el-tooltip v-if="tooltipContent" :content="tooltipContent" placement="top">
            <span class="xl-action-button-tooltip-trigger">
                <el-button v-bind="buttonAttrs" @click="handleClick">
                    <el-icon v-if="shouldShowIcon">
                        <xl-icon :icon="buttonInfo?.icon" />
                    </el-icon>
                    <span v-if="shouldShowText">{{ buttonInfo?.title || text }}</span>
                </el-button>
            </span>
        </el-tooltip>
        <el-button v-else v-bind="buttonAttrs" @click="handleClick">
            <el-icon v-if="shouldShowIcon">
                <xl-icon :icon="buttonInfo?.icon" />
            </el-icon>
            <span v-if="shouldShowText">{{ buttonInfo?.title || text }}</span>
        </el-button>
    </span>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { Icon as XlIcon } from '@iconify/vue'

// ==================== 组件选项 ====================
defineOptions({
    inheritAttrs: false,
})

// ==================== Props 定义 ====================
const props = defineProps({
    /** 按钮信息对象，包含 icon 和 title */
    buttonInfo: {
        type: Object,
        default: null,
    },
    /** 按钮文本（当 buttonInfo 不存在时使用） */
    text: {
        type: String,
        default: '',
    },
    /** 是否显示文本，默认为 true。如果为 false，则优先显示 icon，没有 icon 才显示文本 */
    showText: {
        type: Boolean,
        default: true,
    },
    /** 是否显示 tooltip，默认为 true。当 showText 为 false 且只显示图标时，如果为 true 则显示 tooltip */
    showTooltip: {
        type: Boolean,
        default: false,
    },
    /** 是否显示图标，默认为 true。如果为 false，即使有图标也不显示 */
    showIcon: {
        type: Boolean,
        default: true,
    },
    /** 按钮类型（type、link、size 等 el-button 支持的属性） */
    type: {
        type: String,
        default: undefined,
    },
    /** 是否为链接样式 */
    link: {
        type: Boolean,
        default: undefined,
    },
    /** 按钮尺寸 */
    size: {
        type: String,
        default: undefined,
    },
    tooltipContent: {
        type: String,
        default: '',
    },
})

// ==================== Emits 定义 ====================
const emit = defineEmits(['click'])

// ==================== 属性处理 ====================
const attrs = useAttrs()

/**
 * 按钮属性，合并 props 和 attrs，确保所有属性都能正确传递
 * 指令（如 v-permission）会自动应用到根元素，不需要手动传递
 */
const buttonAttrs = computed(() => {
    // 创建一个新对象，合并 props 中明确定义的属性和 attrs 中的其他属性
    // props 中的属性优先级更高（如果同时存在）
    const result = { ...attrs }

    // 如果 props 中明确定义了这些属性，使用 props 的值（优先级更高）
    if (props.type !== undefined) {
        result.type = props.type
    }
    if (props.link !== undefined) {
        result.link = props.link
    }
    if (props.size !== undefined) {
        result.size = props.size
    }
    if (props.tooltipContent) {
        result.title = props.tooltipContent
    }

    // 排除 class 和 style（这些不应该传递给按钮，应该应用到根元素）
    delete result.class
    delete result.style

    return result
})

// ==================== 计算属性 ====================
/**
 * 获取有效的图标值
 */
const hasIcon = computed(() => {
    const icon = props.buttonInfo?.icon
    return icon && icon.trim() !== ''
})

/**
 * 是否显示图标
 * 需要同时满足：1. props.showIcon 为 true（允许显示图标）
 *             2. hasIcon.value 为 true（有有效的图标）
 */
const shouldShowIcon = computed(() => {
    return props.showIcon && hasIcon.value
})

/**
 * 是否显示文本
 * 如果 showText 为 true，或者 showText 为 false 但没有可显示的 icon，则显示文本
 */
const shouldShowText = computed(() => {
    if (props.showText) {
        return true
    }
    // showText 为 false 时，如果没有可显示的 icon（没有图标或 showIcon 为 false），则显示文本
    return !shouldShowIcon.value
})

/**
 * 是否显示 tooltip
 * 当 showText 为 false 且只显示图标时，如果 showTooltip 为 true，则显示 tooltip 提示文本
 */
const shouldShowTooltip = computed(() => {
    return props.showTooltip && !props.showText && shouldShowIcon.value && !shouldShowText.value
})

const tooltipContent = computed(() => {
    if (props.tooltipContent) return props.tooltipContent
    return shouldShowTooltip.value ? props.buttonInfo?.title || props.text : ''
})

// ==================== 方法 ====================
/**
 * 处理按钮点击事件
 */
const handleClick = (event) => {
    emit('click', event)
}
</script>

<style lang="scss" scoped>
.xl-action-button-wrapper {
    display: inline-flex;
    vertical-align: middle;
    align-items: center;
}

.xl-action-button-tooltip-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    cursor: not-allowed;
}
</style>

<style lang="scss">
// 全局样式：确保 xl-action-button 组件后面的按钮有正确的左边距
// Element Plus 按钮默认使用 .el-button + .el-button { margin-left: 10px; } 来设置间距
// 我们需要确保 xl-action-button-wrapper 后面的按钮也有相同的间距
.xl-action-button-wrapper + .el-button {
    margin-left: 12px;
}

.el-button + .xl-action-button-wrapper {
    margin-left: 12px;
}

// 确保 xl-action-button-wrapper 内部的按钮不会有多余的 margin
.xl-action-button-wrapper .el-button {
    margin-left: 0;
    margin-right: 0;
}

.xl-action-button-tooltip-trigger .el-button.is-disabled {
    pointer-events: none;
}

.xl-action-button-tooltip-trigger .el-button.is-disabled > * {
    pointer-events: none;
}
</style>
