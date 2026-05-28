<template>
    <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        :name="['start_date', 'end_date']"
        :range-separator="t('common.to')"
        :start-placeholder="t('common.date.start')"
        :end-placeholder="t('common.date.end')"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        style="width: 100%"
        clearable
        :disabled-date="disabledDate"
        :shortcuts="showShortcuts ? shortcuts : []"
        @calendar-change="handleCalendarChange"
        @change="handleDateRangeChange"
        @visible-change="handleVisibleChange"
    />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

type DateRangeValue = (string | Date)[] | null

// ==================== Props ====================
interface Props {
    modelValue?: DateRangeValue
    /** 是否显示快速选择选项 */
    showShortcuts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    showShortcuts: true,
})
const { t } = useI18n()

// ==================== Emits ====================
const emit = defineEmits<{
    (e: 'update:modelValue', value: DateRangeValue): void
}>()

// ==================== 响应式数据 ====================
const currentSelectingRange = ref<DateRangeValue>(null) // 当前正在选择的日期范围

// ==================== 计算属性 ====================
const dateRange = computed<DateRangeValue>({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
})

// ==================== 快速选择选项 ====================
/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 */
const formatDateTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const shortcuts = computed(() => [
    {
        text: t('common.date.today'),
        value: () => {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            return [formatDateTime(start), formatDateTime(end)]
        },
    },
    {
        text: t('common.date.yesterday'),
        value: () => {
            const now = new Date()
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0)
            const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
            return [formatDateTime(start), formatDateTime(end)]
        },
    },
    {
        text: t('common.date.last7Days'),
        value: () => {
            const now = new Date()
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            const start = new Date(now)
            start.setDate(start.getDate() - 6)
            start.setHours(0, 0, 0, 0)
            return [formatDateTime(start), formatDateTime(end)]
        },
    },
    {
        text: t('common.date.last30Days'),
        value: () => {
            const now = new Date()
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            const start = new Date(now)
            start.setDate(start.getDate() - 30)
            start.setHours(0, 0, 0, 0)
            return [formatDateTime(start), formatDateTime(end)]
        },
    },
])

// ==================== 方法 ====================
/**
 * 处理日历变化事件，用于获取当前正在选择的日期范围
 */
const handleCalendarChange = (val: DateRangeValue) => {
    currentSelectingRange.value = val
}

/**
 * 处理选择器展开/折叠状态，关闭时清除临时选择状态，避免状态悬挂
 */
const handleVisibleChange = (visible: boolean) => {
    if (!visible) {
        currentSelectingRange.value = null
    }
}

/**
 * 处理日期范围变化，验证范围是否超过1个月
 */
const handleDateRangeChange = (val: DateRangeValue) => {
    if (val && Array.isArray(val) && val.length === 2) {
        const [start, end] = val
        if (start && end) {
            const startDate = new Date(start)
            const endDate = new Date(end)
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
            const diffDays = diffTime / (1000 * 60 * 60 * 24)

            // 如果范围超过1个月（31天），提示用户并清空选择
            // 允许正好31天，因为"近一个月"是30天，加上边界情况可能正好31天
            if (diffDays > 31) {
                ElMessage.warning(t('common.date.rangeLimitOneMonth'))
                dateRange.value = null
                currentSelectingRange.value = null
            }
        }
    }
}

/**
 * 限制日期范围选择（最多1个月，且只能选择最近一年内的时间）
 */
const disabledDate = (time: Date) => {
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(now.getFullYear() - 1)

    // 禁用一年前的日期和未来的日期
    if (time.getTime() < oneYearAgo.getTime() || time.getTime() > now.getTime()) {
        return true
    }

    // 使用当前正在选择的日期范围或已选择的日期范围
    const range = currentSelectingRange.value || dateRange.value

    if (range && Array.isArray(range) && range.length > 0) {
        const start = range[0]
        const end = range[1]

        // 如果已选择开始时间，限制结束时间不能超过开始时间+1个月
        if (start && !end) {
            const startDate = new Date(start)
            const maxDate = new Date(startDate)
            maxDate.setMonth(maxDate.getMonth() + 1)
            // 不能超过开始时间+1个月，也不能超过当前时间
            const limitDate = maxDate.getTime() > now.getTime() ? now : maxDate
            return time.getTime() > limitDate.getTime()
        }

        // 如果已选择结束时间，限制开始时间不能早于结束时间-1个月
        if (!start && end) {
            const endDate = new Date(end)
            const minDate = new Date(endDate)
            minDate.setMonth(minDate.getMonth() - 1)
            // 不能早于结束时间-1个月，也不能早于一年前
            const limitDate = minDate.getTime() < oneYearAgo.getTime() ? oneYearAgo : minDate
            return time.getTime() < limitDate.getTime()
        }

        // 如果已选择完整范围，验证范围是否超过1个月
        if (start && end) {
            const startDate = new Date(start)
            const endDate = new Date(end)
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
            const diffDays = diffTime / (1000 * 60 * 60 * 24)

            // 如果范围已超过1个月，禁用所有日期（需要重新选择）
            if (diffDays > 31) {
                return true
            }
        }
    }

    return false
}
</script>
