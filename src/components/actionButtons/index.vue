<!--
  操作按钮组件 - 自动将多个按钮分组显示
  当按钮数量 <= maxVisibleButtons 时，直接显示所有按钮
  当按钮数量 > maxVisibleButtons 时，前 (maxVisibleButtons - 1) 个按钮直接显示，其余按钮自动放入"更多"下拉菜单
  注意：maxVisibleButtons 包含"更多"按钮，例如 maxVisibleButtons=2 时，显示 1个按钮 + "更多"按钮
  
  使用示例：
  <xl-action-buttons :buttons="actionButtons" :scope="scope" />
  <xl-action-buttons :buttons="actionButtons" :scope="scope" :max-visible-buttons="3" />
  
  按钮配置格式：
  const actionButtons = computed(() => [
    {
      permission: 'role:addChild',        // 权限码（必填）
      buttonInfo: addChildButtonInfo,     // 按钮信息对象（包含 icon、title 等）
      showIcon: false,                    // 是否显示图标（可选，默认 true）
      showText: true,                     // 是否显示文本（可选，默认 true）
      type: 'primary',                    // 按钮类型（可选，默认 'primary'）
      link: true,                         // 是否为链接样式（可选，默认 true）
      click: (row, index) => {            // 点击事件处理函数（必填）
        handleAddChild(row)
      },
    },
    {
      permission: 'role:edit',
      buttonInfo: editButtonInfo,
      click: (row, index) => openEditDrawer(EDIT_TYPE.EDIT, row, index),
    },
    {
      permission: 'role:delete',
      buttonInfo: deleteButtonInfo,
      click: (row) => handleDelete(row),
      divided: true,                      // 是否显示分隔线（可选）
    },
  ])
-->
<template>
    <div class="xl-action-buttons">
        <!-- 按钮数量 <= 2 时，直接显示所有按钮 -->
        <template v-if="shouldShowAllButtons">
            <xl-action-button
                v-for="(button, index) in visibleButtons"
                :key="index"
                :show-icon="button.showIcon"
                :show-text="button.showText"
                :type="button.type || 'primary'"
                :link="button.link !== false"
                :button-info="button.buttonInfo"
                :text="button.text || button.buttonInfo?.title || button.permission"
                @click="handleClick(button, scope)"
            />
        </template>
        <!-- 按钮数量 > maxVisibleButtons 时，前 (maxVisibleButtons - 1) 个按钮直接显示，其余放入"更多"菜单 -->
        <template v-else>
            <!-- 前 (maxVisibleButtons - 1) 个按钮直接显示（因为"更多"按钮也占一个位置） -->
            <xl-action-button
                v-for="(button, index) in visibleButtons.slice(0, maxVisibleButtons - 1)"
                :key="index"
                :show-icon="button.showIcon"
                :show-text="button.showText"
                :type="button.type || 'primary'"
                :link="button.link !== false"
                :button-info="button.buttonInfo"
                :text="button.text || button.buttonInfo?.title || button.permission"
                @click="handleClick(button, scope)"
            />

            <!-- 更多按钮下拉菜单 -->
            <el-dropdown v-if="hasMoreButtons" trigger="click">
                <el-button type="primary" link>
                    更多
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item v-for="(button, index) in moreButtons" :key="index" :divided="button.divided" @click="handleClick(button, scope)">
                            <el-icon v-if="button.buttonInfo?.icon && button.showIcon !== false" class="el-icon--left">
                                <xl-icon :icon="button.buttonInfo.icon" />
                            </el-icon>
                            {{ button.buttonInfo?.title || button.text || '操作' }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { Icon as XlIcon } from '@iconify/vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { usePermission } from '@/composables/usePermission'

const { checkPermission } = usePermission()

// ==================== Props 定义 ====================
const props = defineProps({
    /** 按钮配置数组 */
    buttons: {
        type: Array,
        required: true,
        default: () => [],
        validator: (value) => {
            return (
                Array.isArray(value) &&
                value.every((btn) => {
                    return btn && typeof btn === 'object' && btn.permission
                })
            )
        },
    },
    /** 当前行的数据，会传递给按钮的点击事件 */
    scope: {
        type: Object,
        default: () => ({}),
    },
    /** 最大可见按钮数量，超过此数量的按钮将放入"更多"菜单，默认值为 2 */
    maxVisibleButtons: {
        type: Number,
        default: 2,
    },
})

// ==================== 计算属性 ====================
/**
 * 获取所有有权限的按钮
 */
const visibleButtons = computed(() => {
    return props.buttons.filter((btn) => {
        // 检查权限：如果有 buttonInfo 且 is_show 为 false，则不显示；否则检查权限
        const hasPermission = btn.buttonInfo?.is_show === false ? false : checkPermission(btn.permission)
        return hasPermission
    })
})

/**
 * 是否应该显示所有按钮（按钮数量 <= maxVisibleButtons）
 */
const shouldShowAllButtons = computed(() => {
    return visibleButtons.value.length <= props.maxVisibleButtons
})

/**
 * 更多按钮（放入下拉菜单，仅在按钮数量 > maxVisibleButtons 时使用）
 */
const moreButtons = computed(() => {
    if (visibleButtons.value.length <= props.maxVisibleButtons) return []
    // 从第 (maxVisibleButtons - 1) 个按钮开始（因为"更多"按钮也占一个位置）
    return visibleButtons.value.slice(props.maxVisibleButtons - 1)
})

/**
 * 是否有更多按钮需要显示
 */
const hasMoreButtons = computed(() => {
    return moreButtons.value.length > 0
})

// ==================== 方法 ====================
/**
 * 处理按钮点击事件
 */
const handleClick = (button, scope) => {
    if (button.click && typeof button.click === 'function') {
        // 如果 click 是函数，直接调用
        // scope 可能是 { row, $index } 或者直接是 row 对象
        const row = scope?.row || scope
        const index = scope?.$index
        button.click(row, index)
    } else if (button.onClick && typeof button.onClick === 'function') {
        // 兼容 onClick 属性名
        const row = scope?.row || scope
        const index = scope?.$index
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

// 确保第一个按钮和"更多"按钮之间有间距
.xl-action-buttons :deep(.xl-action-button-wrapper) + .el-button {
    margin-left: 12px;
}
</style>
