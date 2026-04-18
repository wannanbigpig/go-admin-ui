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
                :text="button.text || String(button.buttonInfo?.title || button.permission || '')"
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
                :text="button.text || String(button.buttonInfo?.title || button.permission || '')"
                @click="handleClick(button, scope)"
            />
            <el-dropdown v-if="hasMoreButtons" trigger="click" size="small" teleported persistent>
                <el-button type="primary" link>
                    更多
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                            v-for="(button, index) in moreButtons"
                            :key="index"
                            :divided="button.divided"
                            :disabled="normalizeDisabled(button)"
                            :title="normalizeTooltip(button) || undefined"
                            @click="handleClick(button, scope)"
                        >
                            <el-icon v-if="button.buttonInfo?.icon && button.showIcon !== false" class="el-icon--left">
                                <xl-icon :icon="String(button.buttonInfo.icon)" />
                            </el-icon>
                            {{ String(button.buttonInfo?.title || button.text || '操作') }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </template>
    </div>
</template>

<script lang="ts">
export interface TableScope<U> {
    row: U
    $index: number
}

export interface ActionButtonConfig<U> {
    permission: string
    buttonInfo?: Record<string, unknown>
    text?: string
    showIcon?: boolean
    showText?: boolean
    type?: string
    link?: boolean
    disabled?: boolean | ((row: U, index: number) => boolean)
    visible?: (row: U, index: number) => boolean
    tooltip?: string | ((row: U, index: number) => string)
    divided?: boolean
    click?: (row: U, index: number) => void
    onClick?: (row: U, index: number) => void
}
</script>

<script setup lang="ts" generic="T extends object">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { Icon as XlIcon } from '@iconify/vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { usePermission } from '@/composables/usePermission'

const { checkPermission } = usePermission()

interface Props<U> {
    buttons: ActionButtonConfig<U>[] | ((scope: TableScope<U> | U) => ActionButtonConfig<U>[])
    scope: TableScope<U> | U
    maxVisibleButtons?: number
}

const props = withDefaults(defineProps<Props<T>>(), {
    maxVisibleButtons: 2,
})

// 支持 buttons 为函数或数组
const buttonsArray = computed(() => {
    if (typeof props.buttons === 'function') {
        return props.buttons(props.scope)
    }
    return props.buttons
})

const getRowData = (s: TableScope<T> | T): T => {
    if (s && typeof s === 'object' && 'row' in s) {
        return (s as TableScope<T>).row
    }
    return s as T
}

const getIndex = (s: TableScope<T> | T): number => {
    if (s && typeof s === 'object' && '$index' in s) {
        return (s as TableScope<T>).$index
    }
    return 0
}

const visibleButtons = computed(() => {
    return buttonsArray.value.filter((btn) => {
        const row = getRowData(props.scope)
        const index = getIndex(props.scope)
        if (typeof btn.visible === 'function' && !btn.visible(row, index)) {
            return false
        }
        const hasPermission = btn.buttonInfo?.is_show === false ? false : checkPermission(btn.permission)
        return hasPermission
    })
})

const normalizeDisabled = (button: ActionButtonConfig<T>) => {
    if (typeof button.disabled === 'function') {
        const row = getRowData(props.scope)
        const index = getIndex(props.scope)
        return button.disabled(row, index)
    }
    return !!button.disabled
}

const normalizeTooltip = (button: ActionButtonConfig<T>) => {
    if (typeof button.tooltip === 'function') {
        const row = getRowData(props.scope)
        const index = getIndex(props.scope)
        return button.tooltip(row, index) || ''
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

const handleClick = (button: ActionButtonConfig<T>, scope: TableScope<T> | T) => {
    if (normalizeDisabled(button)) return
    const row = getRowData(scope)
    const index = getIndex(scope)
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
