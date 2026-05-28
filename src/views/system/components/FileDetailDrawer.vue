<template>
    <el-drawer v-model="visible" :title="t('system.file.detailTitle')" direction="rtl" size="720px" @close="emit('update:modelValue', false)">
        <div v-loading="loading" :element-loading-text="t('system.file.loadingText')" class="detail-container">
            <template v-if="file">
                <!-- 顶部文件概览 -->
                <div class="file-detail-header">
                    <div class="header-icon">
                        <el-image v-if="isImageFile(file) && file.url" :src="file.url" fit="cover" class="detail-thumbnail" :preview-src-list="[file.url]" preview-teleported />
                        <div v-else class="detail-icon-placeholder">
                            <el-icon :size="48" color="var(--el-text-color-placeholder)"><Document /></el-icon>
                            <span class="detail-ext" v-if="file.ext">{{ String(file.ext).toUpperCase() }}</span>
                        </div>
                    </div>
                    <div class="header-info">
                        <h3 class="file-name">{{ file.origin_name || '-' }}</h3>
                        <div class="file-meta-badges">
                            <el-tag size="small" :type="getStorageDriverTagType(file.storage_driver)" effect="plain">{{ getStorageDriverLabel(file.storage_driver) }}</el-tag>
                            <el-tag size="small" :type="getStorageStatusTagType(file.storage_status)" effect="light">{{ getStorageStatusLabel(file.storage_status) }}</el-tag>
                            <el-tag size="small" :type="Number(file.is_public) === 1 ? 'success' : 'info'" effect="plain">
                                {{ Number(file.is_public) === 1 ? t('system.file.publicLabel') : t('system.file.privateLabel') }}
                            </el-tag>
                        </div>
                    </div>
                </div>

                <el-divider />

                <!-- 基础详情 -->
                <div class="detail-section">
                    <div class="section-header">
                        <span class="section-title">
                            <el-icon class="section-icon"><InfoFilled /></el-icon>
                            {{ t('common.labels.basicInfo') || '基础信息' }}
                        </span>
                    </div>
                    <el-descriptions :column="2" border size="small" class="modern-descriptions">
                        <el-descriptions-item :label="t('system.file.url')" :span="2">
                            <el-link v-if="file.url" :href="file.url" target="_blank" type="primary" class="detail-link">{{ file.url }}</el-link>
                            <span v-else>-</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.size')">{{ formatFileSize(file.size) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.mimeType')">{{ file.mime_type || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.logicalPath')">{{ file.logical_path || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.folderId')">{{ file.folder_id ?? '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.storageDriver')">{{ getStorageDriverLabel(file.storage_driver) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.storageStatus')">{{ file.storage_status_name || file.storage_status || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="isLocalStorageFile(file)" :label="t('system.file.actualPath')" :span="2">
                            <code class="detail-code">{{ buildActualLocalPath(file) || '-' }}</code>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.bucket')">{{ file.bucket || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.objectKey')">{{ file.object_key || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.uploadSource')">{{ file.upload_source_name || file.upload_source || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.uploadStatus')">{{ file.upload_status_name || file.upload_status || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.uuid')" :span="2">
                            <code class="detail-code">{{ file.uuid || '-' }}</code>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('system.file.hash')" :span="2">
                            <code class="detail-code">{{ file.hash || '-' }}</code>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('common.labels.createdAt')">{{ file.created_at || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('common.labels.updatedAt')">{{ file.updated_at || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="file.deleted_at" :label="t('system.file.deletedAt')" :span="2">{{ file.deleted_at }}</el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- References -->
                <div class="detail-section">
                    <div class="section-header">
                        <span class="section-title">
                            <el-icon class="section-icon"><Link /></el-icon>
                            {{ t('system.file.references') }}
                        </span>
                        <el-tag size="small" type="primary" effect="dark" round class="count-tag">{{ file.reference_count || 0 }}</el-tag>
                    </div>
                    <el-table :data="references" border size="small" :empty-text="t('common.noData')" class="modern-table">
                        <el-table-column prop="owner_type" :label="t('system.file.referenceOwnerType')" width="110">
                            <template #default="{ row }">
                                {{ row.owner_type || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="source_name" :label="t('system.file.referenceSource')" min-width="140" show-overflow-tooltip />
                        <el-table-column prop="field_name" :label="t('system.file.referenceField')" min-width="150">
                            <template #default="{ row }">
                                <span class="field-label">{{ row.owner_field }}</span>
                                <span v-if="row.field_name" class="field-remark">({{ row.field_name }})</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" :label="t('common.labels.createdAt')" width="160" align="center" />
                    </el-table>
                </div>
            </template>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { Document, InfoFilled, Link } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SystemFile, SystemFileReference } from '@/types/system'

const { t } = useI18n()

interface Props {
    modelValue: boolean
    file: SystemFile | null
    references: SystemFileReference[]
    loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const visible = ref(props.modelValue)
watch(
    () => props.modelValue,
    (val) => {
        visible.value = val
    }
)
watch(visible, (val) => {
    emit('update:modelValue', val)
})

const isImageFile = (file: SystemFile) => {
    return file.file_type === 'image' || String(file.mime_type || '').startsWith('image/')
}

const isLocalStorageFile = (file: SystemFile) => {
    return String(file.storage_driver || 'local') === 'local'
}

const buildActualLocalPath = (file: SystemFile) => {
    return String(file.storage_path || file.path || '').replace(/^\/+/, '')
}

const formatFileSize = (size?: number) => {
    const bytes = Number(size || 0)
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const getStorageDriverLabel = (value?: string) => {
    const options = [
        { label: t('system.file.storageDrivers.local'), value: 'local' },
        { label: t('system.file.storageDrivers.aliyunOss'), value: 'aliyun_oss' },
    ]
    return options.find((item) => item.value === value)?.label || value || '-'
}

const getStorageDriverTagType = (value?: string) => {
    const typeMap: Record<string, string> = {
        local: 'info',
        aliyun_oss: 'success',
    }
    return typeMap[value || ''] || 'info'
}

const getStorageStatusLabel = (value?: string) => {
    const options = [
        { label: t('system.file.storageStatuses.stored'), value: 'stored' },
        { label: t('system.file.storageStatuses.normal'), value: 'normal' },
        { label: t('system.file.storageStatuses.uploading'), value: 'uploading' },
        { label: t('system.file.storageStatuses.deleteFailed'), value: 'delete_failed' },
        { label: t('system.file.storageStatuses.missing'), value: 'missing' },
    ]
    return options.find((item) => item.value === value)?.label || value || '-'
}

const getStorageStatusTagType = (value?: string) => {
    const typeMap: Record<string, string> = {
        stored: 'success',
        normal: 'success',
        uploading: 'warning',
        delete_failed: 'danger',
        missing: 'danger',
    }
    return typeMap[value || ''] || 'info'
}
</script>

<style scoped lang="scss">
.detail-container {
    padding: 0 20px 20px;
}

.file-detail-header {
    display: flex;
    gap: 20px;
    align-items: center;
    margin-bottom: 10px;

    .header-icon {
        width: 100px;
        height: 100px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        overflow: hidden;
        position: relative;
    }

    .detail-thumbnail {
        width: 100%;
        height: 100%;
    }

    .detail-icon-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--xl-space-2);
    }

    .detail-ext {
        font-size: var(--xl-font-sm);
        font-weight: 700;
        color: var(--el-text-color-placeholder);
    }

    .header-info {
        flex: 1;
        min-width: 0;

        .file-name {
            margin: 0 0 var(--xl-space-3);
            font-size: var(--xl-font-xl);
            color: var(--el-text-color-primary);
            word-break: break-all;
        }

        .file-meta-badges {
            display: flex;
            gap: var(--xl-space-2);
            flex-wrap: wrap;
        }
    }
}

.detail-section {
    margin-bottom: 30px;

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--xl-space-4);

        .section-title {
            font-size: var(--xl-font-lg);
            font-weight: 600;
            color: var(--el-text-color-primary);
            display: flex;
            align-items: center;
            gap: var(--xl-space-2);
        }

        .section-icon {
            color: var(--el-color-primary);
        }
    }
}

.modern-descriptions {
    :deep(.el-descriptions__label) {
        width: 120px;
        // !important 用于覆盖 EP el-descriptions 自身高优先级样式
        background-color: var(--el-fill-color-light) !important;
        font-weight: 600;
    }
}

.detail-code {
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: var(--xl-radius-sm);
    font-family: monospace;
    font-size: var(--xl-font-sm);
}

.detail-link {
    font-size: 13px;
    word-break: break-all;
}

.modern-table {
    border-radius: 8px;
    overflow: hidden;
}

.field-label {
    font-family: monospace;
    color: var(--el-color-primary);
}

.field-remark {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
}
</style>
