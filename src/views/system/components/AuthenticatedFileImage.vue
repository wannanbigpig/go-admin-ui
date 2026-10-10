<template>
    <div class="authenticated-file-image">
        <el-image
            :src="imageUrl"
            :fit="fit"
            :lazy="lazy"
            :alt="file.origin_name || ''"
            :preview-src-list="preview && !isPrivate && file.url ? [file.url] : []"
            preview-teleported
            @click="handleClick"
        >
            <template #placeholder>
                <slot name="placeholder"><el-icon><Picture /></el-icon></slot>
            </template>
            <template #error>
                <slot name="error"><el-icon><Picture /></el-icon></slot>
            </template>
        </el-image>
        <teleport to="body">
            <el-image-viewer v-if="viewerUrl" :url-list="[viewerUrl]" @close="closeViewer" />
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElImageViewer } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { fetchSystemFileBlob } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { SystemFile } from '@/types/system'

const props = withDefaults(defineProps<{
    file: SystemFile
    fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    lazy?: boolean
    preview?: boolean
}>(), {
    fit: 'cover',
    lazy: false,
    preview: false,
})

const isPrivate = computed(() => Number(props.file.is_public) !== 1)
const privateThumbnailUrl = ref('')
const viewerUrl = ref('')
let previewController: AbortController | null = null

const closeViewer = () => {
    if (viewerUrl.value) URL.revokeObjectURL(viewerUrl.value)
    viewerUrl.value = ''
}

watch(
    () => [props.file.uuid, props.file.is_public] as const,
    (_, _previous, onCleanup) => {
        previewController?.abort()
        closeViewer()
        privateThumbnailUrl.value = ''
        if (!isPrivate.value || !props.file.uuid) return
        const controller = new AbortController()
        let objectUrl = ''
        onCleanup(() => {
            controller.abort()
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        })
        void fetchSystemFileBlob(props.file.uuid, 'thumb', controller.signal)
            .then((blob) => {
                if (controller.signal.aborted) return
                objectUrl = URL.createObjectURL(blob)
                privateThumbnailUrl.value = objectUrl
            })
            .catch((error) => {
                if (!controller.signal.aborted) Logger.warn('加载私有文件缩略图失败:', error)
            })
    },
    { immediate: true }
)

const imageUrl = computed(() => (isPrivate.value ? privateThumbnailUrl.value : props.file.thumbnail_url || props.file.url || ''))

const handleClick = async (event: MouseEvent) => {
    if (!props.preview) return
    event.stopPropagation()
    if (!isPrivate.value || !props.file.uuid) return
    previewController?.abort()
    const controller = new AbortController()
    previewController = controller
    try {
        const blob = await fetchSystemFileBlob(props.file.uuid, undefined, controller.signal)
        if (controller.signal.aborted) return
        closeViewer()
        viewerUrl.value = URL.createObjectURL(blob)
    } catch (error) {
        if (!controller.signal.aborted) Logger.warn('预览私有文件失败:', error)
    }
}

onBeforeUnmount(() => {
    previewController?.abort()
    closeViewer()
})
</script>

<style scoped>
.authenticated-file-image {
    overflow: hidden;
}

.authenticated-file-image :deep(.el-image) {
    width: 100%;
    height: 100%;
}
</style>
