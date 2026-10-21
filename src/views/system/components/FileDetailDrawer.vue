<template>
    <el-drawer v-model="visible" :title="t('system.file.detailTitle')" direction="rtl" size="var(--xl-drawer-md)" @close="emit('update:modelValue', false)">
        <div v-loading="loading" :element-loading-text="t('system.file.loadingText')" class="detail-container">
            <template v-if="file">
                <!-- 顶部文件概览 -->
                <div class="file-detail-header">
                    <div class="header-icon">
                        <AuthenticatedFileImage v-if="isImageFile(file) && file.url" :file="file" class="detail-thumbnail" preview />
                        <div v-else-if="isFolderDetail(file)" class="detail-icon-placeholder">
                            <el-icon :size="48" color="var(--el-color-primary)"><FolderOpened /></el-icon>
                        </div>
                        <div v-else class="detail-icon-placeholder">
                            <el-icon :size="48" color="var(--el-text-color-placeholder)"><Document /></el-icon>
                            <span class="detail-ext" v-if="file.ext">{{ String(file.ext).toUpperCase() }}</span>
                        </div>
                    </div>
                    <div class="header-info">
                        <h3 class="file-name">{{ file.origin_name || '-' }}</h3>
                        <div class="file-meta-badges">
                            <el-tag v-if="isFolderDetail(file)" size="small" type="primary" effect="plain">{{ t('system.file.folders') }}</el-tag>
                            <el-tag v-if="!isFolderDetail(file)" size="small" :type="getStorageDriverTagType(file.storage_driver)" effect="plain">{{ getStorageDriverLabel(file.storage_driver) }}</el-tag>
                            <el-tag v-if="!isFolderDetail(file)" size="small" :type="getStorageStatusTagType(file.storage_status)" effect="light">{{ getStorageStatusLabel(file.storage_status) }}</el-tag>
                            <el-tag v-if="!isFolderDetail(file)" size="small" :type="Number(file.is_public) === 1 ? 'success' : 'info'" effect="plain">
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
                            {{ t('common.labels.basicInfo') }}
                        </span>
                    </div>
                    <DetailGrid>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.url')" :span="2">
                            <el-link
                                v-if="file.url"
                                :href="Number(file.is_public) === 1 && isSafeUrl(file.url) ? file.url : undefined"
                                target="_blank"
                                rel="noopener noreferrer"
                                type="primary"
                                class="detail-link"
                                @click.prevent="handleOpenFileUrl(file.url)"
                                >{{ file.url }}</el-link
                            >
                            <span v-else>-</span>
                        </DetailItem>
                        <DetailItem :label="t('system.file.size')">{{ formatFileSize(file.size) }}</DetailItem>
                        <DetailItem v-if="isFolderDetail(file)" :label="t('system.file.fileType')">{{ t('system.file.folders') }}</DetailItem>
                        <DetailItem v-else :label="t('system.file.mimeType')">{{ file.mime_type || '-' }}</DetailItem>
                        <DetailItem :label="t('system.file.logicalPath')" :span="2">{{ file.logical_path || '-' }}</DetailItem>
                        <DetailItem :label="t('system.file.folderId')">{{ file.folder_id ?? '-' }}</DetailItem>
                        <DetailItem v-if="isFolderDetail(file)" :label="t('system.file.fileCount')">{{ file.file_count || 0 }}</DetailItem>
                        <DetailItem v-if="isFolderDetail(file)" :label="t('system.file.childFolderCount')">{{ file.child_folder_count || 0 }}</DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.storageDriver')">{{ getStorageDriverLabel(file.storage_driver) }}</DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.storageStatus')">{{ file.storage_status_name || file.storage_status || '-' }}</DetailItem>
                        <DetailItem v-if="isLocalStorageFile(file)" :label="t('system.file.actualPath')" :span="2">
                            <span class="detail-text-mono">{{ buildActualLocalPath(file) || '-' }}</span>
                        </DetailItem>
                        <DetailItem v-if="!isLocalStorageFile(file)" :label="t('system.file.bucket')" :span="2">{{ file.bucket || '-' }}</DetailItem>
                        <DetailItem v-if="!isLocalStorageFile(file)" :label="t('system.file.objectKey')" :span="2">
                            <span class="detail-text-mono">{{ file.object_key || '-' }}</span>
                        </DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.uploadSource')">{{ file.upload_source_name || file.upload_source || '-' }}</DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.uploaderName')">{{ file.uploader_name || file.uploader_username || '-' }}</DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.uploadStatus')">{{ file.upload_status_name || file.upload_status || '-' }}</DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.uuid')" :span="2">
                            <span class="detail-text-mono">{{ file.uuid || '-' }}</span>
                        </DetailItem>
                        <DetailItem v-if="!isFolderDetail(file)" :label="t('system.file.hash')" :span="2">
                            <span class="detail-text-mono">{{ file.hash || '-' }}</span>
                        </DetailItem>
                        <DetailItem :label="t('common.labels.createdAt')">{{ file.created_at || '-' }}</DetailItem>
                        <DetailItem :label="t('common.labels.updatedAt')">{{ file.updated_at || '-' }}</DetailItem>
                        <DetailItem v-if="file.deleted_at" :label="t('system.file.deletedAt')" :span="2">{{ file.deleted_at }}</DetailItem>
                    </DetailGrid>
                </div>

                <!-- References -->
                <div v-if="!isFolderDetail(file)" class="detail-section">
                    <div class="section-header">
                        <span class="section-title">
                            <el-icon class="section-icon"><Link /></el-icon>
                            {{ t('system.file.references') }}
                        </span>
                        <el-tag size="small" type="primary" effect="dark" round class="count-tag">{{ file.reference_count || 0 }}</el-tag>
                    </div>
                    <ul v-if="references.length" class="reference-list">
                        <li v-for="reference in references" :key="reference.id">
                            <DetailGrid>
                                <DetailItem :label="t('system.file.referenceOwnerType')">{{ reference.owner_type || '-' }}</DetailItem>
                                <DetailItem :label="t('system.file.referenceSource')">{{ reference.source_name || '-' }}</DetailItem>
                                <DetailItem :label="t('system.file.referenceField')">
                                    <span class="field-label">{{ reference.owner_field }}</span>
                                    <span v-if="reference.field_name" class="field-remark">({{ reference.field_name }})</span>
                                </DetailItem>
                                <DetailItem :label="t('common.labels.createdAt')">{{ reference.created_at || '-' }}</DetailItem>
                            </DetailGrid>
                        </li>
                    </ul>
                    <el-empty v-else :description="t('common.noData')" :image-size="64" />
                </div>
            </template>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import DetailGrid from '@/components/detailGrid/index.vue'
import DetailItem from '@/components/detailGrid/DetailItem.vue'
import { Document, FolderOpened, InfoFilled, Link } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { downloadFileBlob, fetchSystemFileBlob } from '@/modules/system/service'
import type { SystemFile, SystemFileReference } from '@/types/system'
import AuthenticatedFileImage from './AuthenticatedFileImage.vue'

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
    if (isFolderDetail(file)) return false
    return file.file_type === 'image' || String(file.mime_type || '').startsWith('image/')
}

const isFolderDetail = (file: SystemFile) => file.item_type === 'folder' || file.file_type === 'folder'

const isLocalStorageFile = (file: SystemFile) => {
    if (isFolderDetail(file)) return false
    return String(file.storage_driver || 'local') === 'local'
}

const buildActualLocalPath = (file: SystemFile) => {
    return String(file.storage_path || file.path || '').replace(/^\/+/, '')
}

const isSafeUrl = (url?: string) => /^https?:\/\//.test(url || '') || /^\/(?!\/)/.test(url || '')

// Blob URLs inherit the application origin; active documents must only be downloaded.
const previewMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/avif', 'application/pdf', 'text/plain'])

const handleOpenFileUrl = async (url?: string) => {
    if (!props.file || !isSafeUrl(url)) {
        ElMessage.error(t('common.result.operationFailed'))
        return
    }
    if (Number(props.file.is_public) === 1) {
        window.open(url, '_blank', 'noopener,noreferrer')
        return
    }
    const tab = window.open('about:blank', '_blank')
    if (!tab) {
        ElMessage.error(t('common.result.operationFailed'))
        return
    }
    tab.opener = null
    const file = props.file
    try {
        const blob = await fetchSystemFileBlob(file.uuid)
        const mimeType = blob.type.split(';')[0]?.trim().toLowerCase() || ''
        if (!previewMimeTypes.has(mimeType)) {
            tab.close()
            downloadFileBlob(blob, file.origin_name || file.uuid)
            return
        }
        const objectUrl = URL.createObjectURL(blob)
        tab.location.replace(objectUrl)
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60_000)
    } catch {
        tab.close()
    }
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
    padding: 0;
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

.detail-code {
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: var(--xl-radius-sm);
    font-family: monospace;
    font-size: var(--xl-font-sm);
}

.detail-text-mono {
    font-family: monospace;
    font-size: var(--xl-font-sm);
}

.detail-link {
    font-size: 13px;
    word-break: break-all;
}

.reference-list {
    display: grid;
    gap: var(--xl-space-3);
    padding: 0;
    margin: 0;
    list-style: none;
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
