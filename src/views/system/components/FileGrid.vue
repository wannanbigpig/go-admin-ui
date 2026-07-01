<template>
    <div
        class="file-grid-view"
        :class="{
            'is-empty': !files.length && (!folders.length || selectedCategory !== 'all'),
            'has-selection': selectedFiles.length > 0,
        }"
    >
        <!-- Folders first -->
        <template v-if="selectedCategory === 'all'">
            <div
                v-for="folder in folders"
                :key="folder.id"
                class="file-grid-item folder-item"
                :class="{ 'is-selected': isFolderSelected(folder) }"
                role="button"
                tabindex="0"
                @click="handleFolderClick(folder)"
                @dblclick="emit('folder-click', folder)"
                @keydown.enter="emit('folder-click', folder)"
                @keydown.space.prevent="toggleFolderSelection(folder)"
                @contextmenu.prevent="openContextMenu($event, 'folder', folder)"
            >
                <div class="item-checkbox" @click.stop>
                    <el-checkbox :model-value="isFolderSelected(folder)" @change="toggleFolderSelection(folder)" />
                </div>
                <div class="item-icon-box">
                    <div class="folder-icon">
                        <el-icon :size="48"><FolderOpened /></el-icon>
                    </div>
                </div>
                <div class="item-name" :title="folder.name">{{ folder.name }}</div>

                <!-- Hover actions (Dropdown) -->
                <div class="item-actions" @click.stop>
                    <el-dropdown trigger="click" @command="(cmd: string) => handleFolderCommand(cmd, folder)">
                        <div class="action-btn">
                            <el-icon><MoreFilled /></el-icon>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="rename">
                                    <el-icon><Edit /></el-icon>{{ t('common.actions.rename') }}
                                </el-dropdown-item>
                                <el-dropdown-item command="move">
                                    <el-icon><Rank /></el-icon>{{ t('system.file.moveFolder') }}
                                </el-dropdown-item>
                                <el-dropdown-item command="delete" divided class="text-danger">
                                    <el-icon><Delete /></el-icon>{{ t('common.actions.delete') }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </div>
        </template>

        <!-- Files -->
        <div
            v-for="file in files"
            :key="file.id"
            class="file-grid-item file-item"
            :class="{ 'is-selected': isFileSelected(file) }"
            role="button"
            tabindex="0"
            @click="handleFileClick($event, file)"
            @keydown.enter="handleFileClick($event, file)"
            @keydown.space.prevent="toggleFileSelection(file)"
            @contextmenu.prevent="openContextMenu($event, 'file', file)"
        >
            <!-- Checkbox -->
            <div class="item-checkbox" @click.stop>
                <el-checkbox :model-value="isFileSelected(file)" @change="toggleFileSelection(file)" />
            </div>

            <div class="item-icon-box">
                <el-image v-if="isImageFile(file) && getFileThumbnailUrl(file)" :src="getFileThumbnailUrl(file)" fit="cover" class="grid-thumbnail" lazy :alt="file.origin_name || ''">
                    <template #placeholder>
                        <div class="image-slot">
                            <el-icon><Picture /></el-icon>
                        </div>
                    </template>
                </el-image>
                <div v-else class="grid-placeholder">
                    <el-icon :size="40" color="var(--el-text-color-placeholder)"><Document /></el-icon>
                    <span class="grid-ext">{{ file.ext?.toUpperCase() }}</span>
                </div>
            </div>
            <div class="item-name" :title="file.origin_name">{{ file.origin_name }}</div>
            <div class="item-size">{{ formatFileSize(file.size) }}</div>

            <!-- Hover actions (Dropdown) -->
            <div class="item-actions" @click.stop>
                <el-dropdown trigger="click" @command="(cmd: string) => handleFileCommand(cmd, file)">
                    <div class="action-btn">
                        <el-icon><MoreFilled /></el-icon>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="detail">
                                <el-icon><InfoFilled /></el-icon>{{ t('common.actions.detail') }}
                            </el-dropdown-item>
                            <el-dropdown-item command="rename">
                                <el-icon><Edit /></el-icon>{{ t('common.actions.rename') }}
                            </el-dropdown-item>
                            <el-dropdown-item command="move">
                                <el-icon><Rank /></el-icon>{{ t('system.file.batchMove') }}
                            </el-dropdown-item>
                            <el-dropdown-item command="delete" divided class="text-danger">
                                <el-icon><Delete /></el-icon>{{ t('common.actions.delete') }}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>

        <el-empty v-if="!files.length && (!folders.length || selectedCategory !== 'all')" :description="t('common.noData')" class="empty-state" />

        <!-- Custom Context Menu -->
        <teleport to="body">
            <div v-if="contextMenu.show" class="context-menu-popover" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
                <div v-if="contextMenu.type === 'folder'" class="context-menu-group">
                    <div class="context-menu-item" @click="handleFolderCommand('rename', contextMenu.item)">
                        <el-icon><Edit /></el-icon>
                        <span>{{ t('common.actions.rename') }}</span>
                    </div>
                    <div class="context-menu-item" @click="handleFolderCommand('move', contextMenu.item)">
                        <el-icon><Rank /></el-icon>
                        <span>{{ t('system.file.moveFolder') }}</span>
                    </div>
                    <div class="context-menu-item danger" @click="handleFolderCommand('delete', contextMenu.item)">
                        <el-icon><Delete /></el-icon>
                        <span>{{ t('common.actions.delete') }}</span>
                    </div>
                </div>
                <div v-else class="context-menu-group">
                    <div class="context-menu-item" @click="handleFileCommand('detail', contextMenu.item)">
                        <el-icon><InfoFilled /></el-icon>
                        <span>{{ t('common.actions.detail') }}</span>
                    </div>
                    <div class="context-menu-item" @click="handleFileCommand('rename', contextMenu.item)">
                        <el-icon><Edit /></el-icon>
                        <span>{{ t('common.actions.rename') }}</span>
                    </div>
                    <div class="context-menu-item" @click="handleFileCommand('move', contextMenu.item)">
                        <el-icon><Rank /></el-icon>
                        <span>{{ t('system.file.batchMove') }}</span>
                    </div>
                    <div class="context-menu-item danger" @click="handleFileCommand('delete', contextMenu.item)">
                        <el-icon><Delete /></el-icon>
                        <span>{{ t('common.actions.delete') }}</span>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import { FolderOpened, Document, Picture, MoreFilled, Edit, Rank, Delete, InfoFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { formatFileSize } from '@/utils/helper'
import type { SystemFile, SystemFileFolder } from '@/types/system'
import type { FileOperationItem } from '../composables/useFileOperations'

const { t } = useI18n()

interface Props {
    files: SystemFile[]
    folders: SystemFileFolder[]
    selectedCategory: string
    selectedFiles?: FileOperationItem[]
}

const props = withDefaults(defineProps<Props>(), {
    selectedFiles: () => [],
})

const emit = defineEmits<{
    (e: 'folder-click', folder: SystemFileFolder): void
    (e: 'file-click', file: SystemFile): void
    (e: 'selection-change', selection: FileOperationItem[]): void
    (e: 'folder-command', payload: { command: string; folder: SystemFileFolder }): void
    (e: 'rename-file', file: SystemFile): void
    (e: 'delete-file', file: SystemFile): void
    (e: 'move-file', file: SystemFile): void
}>()

const isImageFile = (file: SystemFile) => {
    return file.file_type === 'image' || String(file.mime_type || '').startsWith('image/')
}

const getFileThumbnailUrl = (file: SystemFile) => file.thumbnail_url || file.url || ''

const getItemType = (item: FileOperationItem) => (item.item_type === 'folder' ? 'folder' : 'file')

const isSameItem = (left: FileOperationItem, right: FileOperationItem) => {
    return getItemType(left) === getItemType(right) && String(left.id) === String(right.id)
}

const toFolderSelectionItem = (folder: SystemFileFolder): FileOperationItem => ({
    ...folder,
    item_type: 'folder',
    origin_name: folder.name,
})

const isItemSelected = (item: FileOperationItem) => {
    return props.selectedFiles.some((selected) => isSameItem(selected, item))
}

// 多选判断
const isFileSelected = (file: SystemFile) => {
    return isItemSelected(file)
}

const isFolderSelected = (folder: SystemFileFolder) => {
    return isItemSelected(toFolderSelectionItem(folder))
}

// 切换选择
const toggleItemSelection = (item: FileOperationItem) => {
    const index = props.selectedFiles.findIndex((selected) => isSameItem(selected, item))
    const newSelection = [...props.selectedFiles]
    if (index > -1) {
        newSelection.splice(index, 1)
    } else {
        newSelection.push(item)
    }
    emit('selection-change', newSelection)
}

const toggleFileSelection = (file: SystemFile) => {
    toggleItemSelection(file)
}

const toggleFolderSelection = (folder: SystemFileFolder) => {
    toggleItemSelection(toFolderSelectionItem(folder))
}

// 点击卡片
const handleFileClick = (event: MouseEvent | KeyboardEvent, file: SystemFile) => {
    if (props.selectedFiles.length > 0) {
        toggleFileSelection(file)
    } else {
        emit('file-click', file)
    }
}

const handleFolderClick = (folder: SystemFileFolder) => {
    if (props.selectedFiles.length > 0) {
        toggleFolderSelection(folder)
    }
}

// 下拉菜单操作
const handleFolderCommand = (command: string, folder: SystemFile | SystemFileFolder | null) => {
    if (folder) {
        emit('folder-command', { command, folder: folder as SystemFileFolder })
    }
}

const handleFileCommand = (command: string, file: SystemFile | SystemFileFolder | null) => {
    if (file) {
        const targetFile = file as SystemFile
        if (command === 'detail') {
            emit('file-click', targetFile)
        } else if (command === 'rename') {
            emit('rename-file', targetFile)
        } else if (command === 'delete') {
            emit('delete-file', targetFile)
        } else if (command === 'move') {
            emit('move-file', targetFile)
        }
    }
}

// 右键菜单管理
const contextMenu = reactive({
    show: false,
    x: 0,
    y: 0,
    type: 'file' as 'file' | 'folder',
    item: null as SystemFile | SystemFileFolder | null,
})

const openContextMenu = (e: MouseEvent | KeyboardEvent, type: 'file' | 'folder', item: SystemFile | SystemFileFolder) => {
    contextMenu.show = true
    contextMenu.type = type
    contextMenu.item = item
    if ('clientX' in e && (e.clientX || e.clientY)) {
        contextMenu.x = e.clientX
        contextMenu.y = e.clientY
    } else {
        const target = e.target as HTMLElement
        if (target) {
            const rect = target.getBoundingClientRect()
            contextMenu.x = rect.left + rect.width / 2
            contextMenu.y = rect.top + rect.height / 2
        } else {
            contextMenu.x = 100
            contextMenu.y = 100
        }
    }
}

const closeContextMenu = () => {
    contextMenu.show = false
}

onMounted(() => {
    window.addEventListener('click', closeContextMenu)
    window.addEventListener('contextmenu', closeContextMenu) // 另外右键其他区域也应关闭
})

onBeforeUnmount(() => {
    window.removeEventListener('click', closeContextMenu)
    window.removeEventListener('contextmenu', closeContextMenu)
})
</script>

<style scoped lang="scss">
.file-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px;
    padding: 10px;
    position: relative;

    &.is-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        height: 100%;
        box-sizing: border-box;
    }
}

.file-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--xl-space-4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s var(--xl-ease-standard);
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    position: relative;

    &:hover {
        background: var(--el-fill-color-light);
        border-color: var(--el-color-primary-light-7);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

        .item-actions {
            opacity: 1;
        }
    }

    &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 2px;
        background: var(--el-fill-color-light);
    }

    &.is-selected {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
    }

    .item-checkbox {
        position: absolute;
        top: var(--xl-space-2);
        left: var(--xl-space-2);
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s;

        .file-grid-view.has-selection & {
            opacity: 0.5;
        }
    }

    // !important 用于覆盖 .has-selection 提升后的特定性（0,3,0 > 当前 0,2,1）
    &:hover .item-checkbox,
    &.is-selected .item-checkbox {
        opacity: 1 !important;
    }

    .item-icon-box {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--xl-space-3);
        position: relative;
    }

    .item-name {
        width: 100%;
        text-align: center;
        font-size: var(--xl-font-md);
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: var(--xl-space-1);
        font-weight: 500;
    }

    .item-size {
        font-size: var(--xl-font-xs);
        color: var(--el-text-color-placeholder);
    }

    /* 右上角操作下拉按钮 */
    .item-actions {
        position: absolute;
        top: var(--xl-space-2);
        right: var(--xl-space-2);
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 9;

        .action-btn {
            width: 24px;
            height: 24px;
            border-radius: var(--xl-radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-regular);
            background: rgba(0, 0, 0, 0.04);
            transition: all 0.2s;

            &:hover {
                background: var(--el-color-primary);
                color: #fff;
            }
        }
    }
}

.folder-icon {
    color: var(--el-color-warning);
}

.grid-thumbnail {
    width: 100%;
    height: 100%;
    border-radius: var(--xl-radius-sm);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.grid-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-lighter);
    border-radius: var(--xl-radius-sm);

    .grid-ext {
        position: absolute;
        bottom: var(--xl-space-3);
        font-size: 9px;
        font-weight: 700;
        color: #fff;
        background: var(--el-text-color-placeholder);
        padding: 1px var(--xl-space-1);
        border-radius: 2px;
        text-transform: uppercase;
    }
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-placeholder);
}

// !important 用于覆盖 EP el-dropdown-item 自带文字色
.text-danger {
    color: var(--el-color-danger) !important;
}
</style>

<style lang="scss">
/* 绝对定位的右键菜单浮层，使用 Teleport 渲染到 body */
.context-menu-popover {
    position: fixed;
    z-index: 99999;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 6px;
    min-width: 130px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    animation: menu-show 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: auto;

    .dark & {
        background: rgba(25, 25, 30, 0.85);
        border-color: rgba(255, 255, 255, 0.06);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
}

@keyframes menu-show {
    from {
        opacity: 0;
        transform: scale(0.92) translateY(-4px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.context-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: var(--xl-space-2) 14px;
    font-size: var(--xl-font-md);
    color: var(--el-text-color-regular);
    cursor: pointer;
    border-radius: var(--xl-radius-md);
    transition: all 0.15s ease;

    &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);

        .dark & {
            background: rgba(var(--el-color-primary-rgb), 0.15);
        }
    }

    &.danger {
        color: var(--el-color-danger);
        &:hover {
            background: var(--el-color-danger-light-9);
            color: var(--el-color-danger);

            .dark & {
                background: rgba(var(--el-color-danger-rgb), 0.15);
            }
        }
    }

    .el-icon {
        font-size: var(--xl-font-lg);
    }
}
</style>
