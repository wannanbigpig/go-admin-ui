import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export function useNotificationCategoryOptions() {
    const { t } = useI18n()
    return computed(() => [
        { value: 'system', label: t('system.notification.categoryOptions.system') },
        { value: 'export', label: t('system.notification.categoryOptions.export') },
        { value: 'todo', label: t('system.notification.categoryOptions.todo') },
    ])
}

export function useManualNotificationCategoryOptions() {
    const options = useNotificationCategoryOptions()
    return computed(() => options.value.filter((item) => item.value === 'system' || item.value === 'export'))
}
