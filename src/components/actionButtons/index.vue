<template>
    <div class="xl-action-buttons">
        <template v-if="shouldShowAllButtons">
            <xl-action-button
                v-for="(button, index) in visibleButtons"
                :key="index"
                :show-icon="button.showIcon"
                :show-text="button.showText"
                :type="button.type || 'primary'"
                :link="button.link !== false"
                :disabled="normalizeDisabled(button)"
                :tooltip-content="normalizeTooltip(button)"
                :button-info="button.buttonInfo"
                :text="button.text || button.buttonInfo?.title || button.permission"
                @click="handleClick(button, scope)"
            />
        </template>
        <template v-else>
            <xl-action-button
                v-for="(button, index) in visibleButtons.slice(0, maxVisibleButtons - 1)"
                :key="index"
                :show-icon="button.showIcon"
                :show-text="button.showText"
                :type="button.type || 'primary'"
                :link="button.link !== false"
                :disabled="normalizeDisabled(button)"
                :tooltip-content="normalizeTooltip(button)"
                :button-info="button.buttonInfo"
                :text="button.text || button.buttonInfo?.title || button.permission"
                @click="handleClick(button, scope)"
            />
            <el-dropdown v-if="hasMoreButtons" trigger="hover" size="small">
                <el-button type="primary" link>
                    更多
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-tooltip v-for="(button, index) in moreButtons" :key="index" :content="normalizeTooltip(button)" placement="top" :disabled="!normalizeTooltip(button)">
                            <el-dropdown-item :divided="button.divided" :disabled="normalizeDisabled(button)" :title="normalizeTooltip(button) || undefined" @click="handleClick(button, scope)">
                                <el-icon v-if="button.buttonInfo?.icon && button.showIcon !== false" class="el-icon--left">
                                    <xl-icon :icon="button.buttonInfo.icon" />
                                </el-icon>
                                {{ button.buttonInfo?.title || button.text || '操作' }}
                            </el-dropdown-item>
                        </el-tooltip>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { Icon as XlIcon } from '@iconify/vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { usePermission } from '@/composables/usePermission'

const { checkPermission } = usePermission()

interface ActionButtonConfig {
    permission: string
    buttonInfo?: any
    text?: string
    showIcon?: boolean
    showText?: boolean
    type?: string
    link?: boolean
    disabled?: boolean | ((row: any, index?: number) => boolean)
    visible?: (row: any, index?: number) => boolean
    tooltip?: string | ((row: any, index?: number) => string)
    divided?: boolean
    click?: (row: any, index: any) => void
    onClick?: (row: any, index: any) => void
}

interface Props {
    buttons: ActionButtonConfig[]
    scope?: any
    maxVisibleButtons?: number
}

const props = withDefaults(defineProps<Props>(), {
    scope: () => ({}),
    maxVisibleButtons: 2,
})

const visibleButtons = computed(() => {
    return props.buttons.filter((btn) => {
        const row = props.scope?.row || props.scope
        const index = props.scope?.$index
        if (typeof btn.visible === 'function' && !btn.visible(row, index)) {
            return false
        }
        const hasPermission = btn.buttonInfo?.is_show === false ? false : checkPermission(btn.permission)
        return hasPermission
    })
})

const normalizeDisabled = (button: ActionButtonConfig) => {
    if (typeof button.disabled === 'function') {
        const row = props.scope?.row || props.scope
        return button.disabled(row, props.scope?.$index)
    }
    return !!button.disabled
}

const normalizeTooltip = (button: ActionButtonConfig) => {
    if (typeof button.tooltip === 'function') {
        const row = props.scope?.row || props.scope
        return button.tooltip(row, props.scope?.$index) || ''
    }
    return button.tooltip || ''
}

const shouldShowAllButtons = computed(() => {
    return visibleButtons.value.length <= props.maxVisibleButtons
})

const moreButtons = computed(() => {
    if (visibleButtons.value.length <= props.maxVisibleButtons) return []
    return visibleButtons.value.slice(props.maxVisibleButtons - 1)
})

const hasMoreButtons = computed(() => {
    return moreButtons.value.length > 0
})

const handleClick = (button: ActionButtonConfig, scope: any) => {
    if (normalizeDisabled(button)) return
    const row = scope?.row || scope
    const index = scope?.$index
    if (button.click) {
        button.click(row, index)
    } else if (button.onClick) {
        button.onClick(row, index)
    }
}
</script>

<style lang="scss" scoped>
.xl-action-buttons {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    width: 100%;
}
.xl-action-buttons :deep(.xl-action-button-wrapper) + .el-button {
    margin-left: 12px;
}
</style>
