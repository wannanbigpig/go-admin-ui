<template>
    <span class="xl-action-button-wrapper">
        <el-tooltip v-if="tooltipContent" :content="tooltipContent" placement="top">
            <span class="xl-action-button-tooltip-trigger" :class="{ 'is-disabled': isDisabled }">
                <el-button v-bind="buttonAttrs" @click="handleClick">
                    <el-icon v-if="shouldShowIcon">
                        <xl-icon :icon="resolvedButtonInfo?.icon || ''" />
                    </el-icon>
                    <span v-if="shouldShowText">{{ resolvedButtonInfo?.title || text }}</span>
                </el-button>
            </span>
        </el-tooltip>
        <el-button v-else v-bind="buttonAttrs" @click="handleClick">
            <el-icon v-if="shouldShowIcon">
                <xl-icon :icon="resolvedButtonInfo?.icon || ''" />
            </el-icon>
            <span v-if="shouldShowText">{{ resolvedButtonInfo?.title || text }}</span>
        </el-button>
    </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Icon as XlIcon } from '@iconify/vue'
import { usePermission } from '@/composables/usePermission'

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
    /**
     * 权限按钮 code，传入后内部自动解析为 buttonInfo。
     * 优先级高于 buttonInfo。
     */
    code?: string
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
    code: '',
    text: '',
    showText: true,
    showTooltip: false,
    showIcon: true,
})

const { getButtonInfoFull } = usePermission()

const resolvedButtonInfo = computed<ButtonInfo | null>(() => {
    if (props.code) {
        return getButtonInfoFull(props.code) as ButtonInfo | null
    }
    return props.buttonInfo
})

const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
}>()
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
    const icon = resolvedButtonInfo.value?.icon
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
    return shouldShowTooltip.value ? resolvedButtonInfo.value?.title || props.text : ''
})

const handleClick = (event: MouseEvent) => {
    emit('click', event)
}

const isDisabled = computed(() => {
    return attrs.disabled === true || attrs.disabled === ''
})
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

    &.is-disabled {
        cursor: not-allowed;
    }
}
</style>
