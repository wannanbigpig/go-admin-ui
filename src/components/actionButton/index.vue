<template>
    <span class="xl-action-button-wrapper" :title="tooltipContent || undefined">
        <el-tooltip v-if="tooltipContent" :content="tooltipContent" placement="top">
            <span class="xl-action-button-tooltip-trigger">
                <el-button v-bind="buttonAttrs" @click="handleClick">
                    <el-icon v-if="shouldShowIcon">
                        <xl-icon :icon="buttonInfo?.icon || ''" />
                    </el-icon>
                    <span v-if="shouldShowText">{{ buttonInfo?.title || text }}</span>
                </el-button>
            </span>
        </el-tooltip>
        <el-button v-else v-bind="buttonAttrs" @click="handleClick">
            <el-icon v-if="shouldShowIcon">
                <xl-icon :icon="buttonInfo?.icon || ''" />
            </el-icon>
            <span v-if="shouldShowText">{{ buttonInfo?.title || text }}</span>
        </el-button>
    </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Icon as XlIcon } from '@iconify/vue'

defineOptions({
    inheritAttrs: false,
})

interface ButtonInfo {
    icon?: string
    title?: string
    is_show?: boolean
    [key: string]: unknown
}

interface Props {
    buttonInfo?: ButtonInfo | null
    text?: string
    showText?: boolean
    showTooltip?: boolean
    showIcon?: boolean
    type?: string
    link?: boolean
    size?: string
    tooltipContent?: string
}

const props = withDefaults(defineProps<Props>(), {
    buttonInfo: null,
    text: '',
    showText: true,
    showTooltip: false,
    showIcon: true,
})

const emit = defineEmits(['click'])
const attrs = useAttrs()

const buttonAttrs = computed(() => {
    const result: Record<string, unknown> = { ...attrs }
    if (props.type !== undefined) result.type = props.type
    if (props.link !== undefined) result.link = props.link
    if (props.size !== undefined) result.size = props.size

    delete result.class
    delete result.style
    return result
})

const hasIcon = computed(() => {
    const icon = props.buttonInfo?.icon
    return !!(icon && icon.trim() !== '')
})

const shouldShowIcon = computed(() => {
    return props.showIcon && hasIcon.value
})

const shouldShowText = computed(() => {
    if (props.showText) return true
    return !shouldShowIcon.value
})

const shouldShowTooltip = computed(() => {
    return props.showTooltip && !props.showText && shouldShowIcon.value && !shouldShowText.value
})

const tooltipContent = computed(() => {
    if (props.tooltipContent) return props.tooltipContent
    return shouldShowTooltip.value ? props.buttonInfo?.title || props.text : ''
})

const handleClick = (event: MouseEvent) => {
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
.xl-action-button-wrapper + .el-button,
.el-button + .xl-action-button-wrapper {
    margin-left: 12px;
}
.xl-action-button-wrapper .el-button {
    margin-left: 0;
    margin-right: 0;
}
.xl-action-button-tooltip-trigger .el-button.is-disabled {
    pointer-events: none;
    & > * {
        pointer-events: none;
    }
}
</style>
