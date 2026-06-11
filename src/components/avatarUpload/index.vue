<template>
    <el-upload class="avatar-uploader" action="" :show-file-list="false" :http-request="handleUpload" accept="image/jpeg,image/png,image/webp" :before-upload="beforeUpload">
        <el-image v-if="modelValue" :src="getImageUrl(String(modelValue))" class="avatar" fit="cover" :alt="alt" />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
    </el-upload>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions, type UploadRawFile } from 'element-plus'
import { uploadAvatar } from '@/api/auth'
import { getImageUrl } from '@/utils/helper'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
    defineProps<{
        modelValue?: string | null
        maxSize?: number // 最大体积（字节）
        alt?: string
    }>(),
    {
        modelValue: '',
        maxSize: 2 * 1024 * 1024,
        alt: '',
    }
)

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void
    (event: 'change', value: string): void
}>()

const { t } = useI18n()
const loading = ref(false)
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const formatSizeMB = (size: number) => Number((size / 1024 / 1024).toFixed(2))

const beforeUpload = (file: UploadRawFile) => {
    if (!allowedMimeTypes.has(file.type)) {
        ElMessage.error(t('common.messages.invalidImageType'))
        return false
    }
    const maxSize = props.maxSize
    if (file.size > maxSize) {
        ElMessage.error(t('common.messages.imageTooLarge', { size: formatSizeMB(maxSize) }))
        return false
    }
    return true
}

const handleUpload = async (options: UploadRequestOptions) => {
    try {
        loading.value = true
        const formData = new FormData()
        formData.append('file', options.file)
        const res = await uploadAvatar(formData)
        emit('update:modelValue', res.url)
        emit('change', res.url)
        options.onSuccess?.(res)
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options.onError?.(error as any)
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.avatar-uploader .avatar {
    width: 98px;
    height: 98px;
    display: block;
}
.avatar-uploader :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: var(--xl-radius-md);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    &:hover {
        border-color: var(--el-color-primary);
    }
}
.avatar-uploader-icon {
    font-size: 28px;
    color: var(--el-text-color-secondary);
    width: 98px;
    height: 98px;
    text-align: center;
    line-height: 98px;
}
</style>
