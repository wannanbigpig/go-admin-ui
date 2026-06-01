import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export function useNotificationCategoryOptions() {
    const { t } = useI18n()
    return computed(() => [
        { value: 'system', label: t('system.notification.categoryOptions.system') },
        { value: 'export', label: t('system.notification.categoryOptions.export') },
    ])
}
