<template>
    <div class="xl-i18n-input-container">
        <template v-if="isSingleLocale && singleLocale">
            <el-input v-model="internalValue[singleLocale.value]" :placeholder="placeholder || t('common.placeholders.input')" v-bind="$attrs" />
        </template>
        <template v-else>
            <el-input readonly :model-value="previewText" :placeholder="placeholder || t('common.placeholders.input')" @click="openDialog" v-bind="$attrs">
                <template #append>
                    <el-button @click="openDialog">
                        {{ t('common.actions.edit') }}
                    </el-button>
                </template>
            </el-input>
            <div v-if="showTip" class="xl-i18n-input-tip">
                {{ t('common.i18n.filledStatus', { filled: filledCount, total: localeOptions.length }) }}
            </div>
        </template>

        <el-dialog v-model="showDialog" :title="dialogTitle || t('common.i18n.dialogTitle')" width="560px" append-to-body>
            <div class="xl-i18n-input-list">
                <div v-for="locale in localeOptions" :key="locale.value" class="xl-i18n-input-item">
                    <div class="xl-i18n-input-locale">
                        <el-tag size="small" type="info">{{ locale.label }}</el-tag>
                    </div>
                    <el-input
                        v-model="draftValue[locale.value]"
                        :placeholder="itemPlaceholder ? itemPlaceholder.replace('{lang}', locale.label) : t('common.i18n.localePlaceholder', { lang: locale.label })"
                        maxlength="60"
                        show-word-limit
                        clearable
                    />
                </div>
            </div>
            <template #footer>
                <el-button @click="showDialog = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" @click="handleConfirm">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALE_OPTIONS, ENABLE_I18N, DEFAULT_LOCALE } from '@/locales'

defineOptions({
    inheritAttrs: false,
})

const props = defineProps<{
    modelValue: Record<string, string>
    placeholder?: string
    itemPlaceholder?: string
    dialogTitle?: string
    showTip?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()

const localeOptions = computed(() => {
    if (!ENABLE_I18N) {
        return LOCALE_OPTIONS.filter((option) => option.value === DEFAULT_LOCALE)
    }
    return LOCALE_OPTIONS
})
const isSingleLocale = computed(() => localeOptions.value.length <= 1)
const singleLocale = computed(() => localeOptions.value[0] ?? null)

const showDialog = ref(false)
const draftValue = ref<Record<string, string>>({})

const internalValue = computed({
    get: () => props.modelValue || {},
    set: (val) => emit('update:modelValue', val),
})

const filledCount = computed(() => {
    return localeOptions.value.filter((locale) => (internalValue.value[locale.value] ?? '').trim().length > 0).length
})

const previewText = computed(() => {
    return localeOptions.value
        .map((locale) => {
            const val = (internalValue.value[locale.value] ?? '').trim()
            return val ? `${locale.label}: ${val}` : ''
        })
        .filter(Boolean)
        .join(' | ')
})

const openDialog = () => {
    draftValue.value = localeOptions.value.reduce<Record<string, string>>((acc, locale) => {
        acc[locale.value] = internalValue.value[locale.value] ?? ''
        return acc
    }, {})
    showDialog.value = true
}

const handleConfirm = () => {
    const newValue = { ...draftValue.value }
    emit('update:modelValue', newValue)
    emit('change', newValue)
    showDialog.value = false
}
</script>

<style lang="scss" scoped>
.xl-i18n-input-container {
    width: 100%;
}

.xl-i18n-input-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
    line-height: 1;
}

.xl-i18n-input-list {
    .xl-i18n-input-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }

        .xl-i18n-input-locale {
            width: 100px;
            flex-shrink: 0;
        }
    }
}
</style>
