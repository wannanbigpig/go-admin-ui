<template>
    <aside class="file-sidebar">
        <div class="sidebar-section">
            <div class="sidebar-section-title">{{ t('system.file.favorites') }}</div>
            <ul class="sidebar-nav">
                <li :class="{ active: selectedCategory === 'all' }" @click="emit('select-category', 'all')">
                    <el-icon><Files /></el-icon>
                    <span>{{ t('system.file.allFiles') }}</span>
                </li>
                <li :class="{ active: selectedCategory === 'image' }" @click="emit('select-category', 'image')">
                    <el-icon><Picture /></el-icon>
                    <span>{{ t('system.file.fileTypes.image') }}</span>
                </li>
                <li :class="{ active: selectedCategory === 'video' }" @click="emit('select-category', 'video')">
                    <el-icon><VideoCamera /></el-icon>
                    <span>{{ t('system.file.fileTypes.video') }}</span>
                </li>
                <li :class="{ active: selectedCategory === 'audio' }" @click="emit('select-category', 'audio')">
                    <el-icon><Headset /></el-icon>
                    <span>{{ t('system.file.fileTypes.audio') }}</span>
                </li>
                <li :class="{ active: selectedCategory === 'document' }" @click="emit('select-category', 'document')">
                    <el-icon><Document /></el-icon>
                    <span>{{ t('system.file.fileTypes.document') }}</span>
                </li>
                <li :class="{ active: selectedCategory === 'archive' }" @click="emit('select-category', 'archive')">
                    <el-icon><Files /></el-icon>
                    <span>{{ t('system.file.fileTypes.archive') }}</span>
                </li>
                <li :class="{ active: selectedCategory === 'other' }" @click="emit('select-category', 'other')">
                    <el-icon><More /></el-icon>
                    <span>{{ t('system.file.fileTypes.other') }}</span>
                </li>
            </ul>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title">
                <span>{{ t('system.file.folders') }}</span>
                <el-button v-permission="'file:create'" type="primary" link @click="emit('open-folder-dialog', 'create')">
                    <el-icon><Plus /></el-icon>
                </el-button>
            </div>
            <el-tree
                class="folder-tree"
                :data="folderTree"
                node-key="id"
                highlight-current
                :current-node-key="selectedFolderId"
                :props="{ label: 'name', children: 'children' }"
                @node-click="(data: FolderTreeNode) => emit('select-folder', data)"
            >
                <template #default="{ node, data }">
                    <div class="folder-node-custom">
                        <el-icon><Folder /></el-icon>
                        <span class="folder-name-label">{{ node.label }}</span>
                        <el-dropdown v-if="!data.isRoot" trigger="click" @command="(command: string) => emit('folder-command', { command, folder: data })">
                            <el-icon class="more-icon" @click.stop><MoreFilled /></el-icon>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="create">{{ t('system.file.createSubFolder') }}</el-dropdown-item>
                                    <el-dropdown-item command="rename">{{ t('system.file.rename') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="hasPermission('file:update')" command="move">{{ t('system.file.moveFolder') }}</el-dropdown-item>
                                    <el-dropdown-item command="delete" divided>{{ t('common.actions.delete') }}</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </template>
            </el-tree>
        </div>

        <div class="sidebar-section mt-auto">
            <ul class="sidebar-nav">
                <li @click="emit('open-trash-dialog')">
                    <el-icon><Delete /></el-icon>
                    <span>{{ t('system.file.trash') }}</span>
                </li>
            </ul>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { Files, Picture, VideoCamera, Headset, Folder, Delete, MoreFilled, Plus, Document, More } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { SystemFileFolder } from '@/types/system'
import { hasPermission } from '@/utils/auth'

const { t } = useI18n()

type FolderTreeNode = SystemFileFolder & { isRoot?: boolean; children?: FolderTreeNode[] }

interface Props {
    folderTree: SystemFileFolder[]
    selectedFolderId: number | string | null
    selectedCategory: string
}

defineProps<Props>()

const emit = defineEmits<{
    (e: 'select-category', category: string): void
    (e: 'select-folder', folder: FolderTreeNode): void
    (e: 'open-folder-dialog', mode: 'create' | 'rename', folder?: SystemFileFolder): void
    (e: 'open-trash-dialog'): void
    (e: 'folder-command', payload: { command: string; folder: SystemFileFolder }): void
}>()
</script>

<style scoped lang="scss">
.file-sidebar {
    background: var(--el-fill-color-light);
    border-right: 1px solid var(--el-border-color-lighter);
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
}

.sidebar-section {
    padding: 0 var(--xl-space-3);
    margin-bottom: var(--xl-space-5);
}

.sidebar-section-title {
    padding: 0 var(--xl-space-3);
    font-size: var(--xl-font-sm);
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--xl-space-2);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sidebar-nav {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: var(--xl-space-2) var(--xl-space-3);
        border-radius: var(--xl-radius-md);
        cursor: pointer;
        transition: all 0.2s;
        color: var(--el-text-color-regular);
        font-size: 14px;

        &:hover {
            background: var(--el-fill-color);
        }

        &.active {
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
            font-weight: 600;
        }

        .el-icon {
            font-size: 16px;
        }
    }
}

.folder-tree {
    background: transparent;

    :deep(.el-tree-node__content) {
        height: 36px;
        border-radius: var(--xl-radius-md);
        margin-bottom: 2px;

        &:hover {
            background: var(--el-fill-color);
        }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
    }
}

.folder-node-custom {
    display: flex;
    align-items: center;
    gap: var(--xl-space-2);
    flex: 1;
    min-width: 0;

    .el-icon {
        color: var(--el-color-primary);
        font-size: 14px;
    }

    .folder-name-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .more-icon {
        opacity: 0;
        font-size: var(--xl-font-sm);
        transition: opacity 0.2s;
        margin-right: var(--xl-space-1);
    }

    &:hover .more-icon {
        opacity: 1;
    }
}

.mt-auto {
    margin-top: auto;
}
</style>
