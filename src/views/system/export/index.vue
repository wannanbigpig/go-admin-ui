<template>
    <div>
        <PageHeading :title="t('system.task.myExportsTitle')" :description="t('system.task.exportPageDescription')" />
        <ExportRecordsPanel :active="true" />
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageHeading from '@/components/pageHeading/index.vue'
import ExportRecordsPanel from '../components/ExportRecordsPanel.vue'

const { t } = useI18n()
</script>
