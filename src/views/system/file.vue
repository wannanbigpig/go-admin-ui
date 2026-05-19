<template>
    <div>
        <div class="file-explorer-container xl-container">
            <!-- Sidebar -->
            <aside class="file-sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-section-title">收藏</div>
                    <ul class="sidebar-nav">
                        <li :class="{ active: selectedCategory === 'all' }" @click="selectCategory('all')">
                            <el-icon><Files /></el-icon>
                            <span>全部文件</span>
                        </li>
                        <li :class="{ active: selectedCategory === 'image' }" @click="selectCategory('image')">
                            <el-icon><Picture /></el-icon>
                            <span>图片</span>
                        </li>
                        <li :class="{ active: selectedCategory === 'video' }" @click="selectCategory('video')">
                            <el-icon><VideoCamera /></el-icon>
                            <span>视频</span>
                        </li>
                        <li :class="{ active: selectedCategory === 'audio' }" @click="selectCategory('audio')">
                            <el-icon><Headset /></el-icon>
                            <span>音频</span>
                        </li>
                        <li :class="{ active: selectedCategory === 'document' }" @click="selectCategory('document')">
                            <el-icon><Document /></el-icon>
                            <span>文档</span>
                        </li>
                        <li :class="{ active: selectedCategory === 'archive' }" @click="selectCategory('archive')">
                            <el-icon><Files /></el-icon>
                            <span>压缩包</span>
                        </li>
                        <li :class="{ active: selectedCategory === 'other' }" @click="selectCategory('other')">
                            <el-icon><More /></el-icon>
                            <span>其他</span>
                        </li>
                    </ul>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-section-title">
                        <span>文件夹</span>
                        <el-button v-permission="'file:create'" type="primary" link @click="openFolderDialog('create')">
                            <el-icon><Plus /></el-icon>
                        </el-button>
                    </div>
                    <el-tree class="folder-tree" :data="folderTree" node-key="id" highlight-current :current-node-key="selectedFolderId" :props="{ label: 'name', children: 'children' }" @node-click="handleFolderSelect">
                        <template #default="{ node, data }">
                            <div class="folder-node-custom">
                                <el-icon><Folder /></el-icon>
                                <span class="folder-name-label">{{ node.label }}</span>
                                <el-dropdown v-if="!data.isRoot" trigger="click" @command="(command: string) => handleFolderCommand(command, data)">
                                    <el-icon class="more-icon" @click.stop><MoreFilled /></el-icon>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="create">新建子目录</el-dropdown-item>
                                            <el-dropdown-item command="rename">重命名</el-dropdown-item>
                                            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </template>
                    </el-tree>
                </div>

                <div class="sidebar-section mt-auto">
                    <ul class="sidebar-nav">
                        <li @click="openTrashDialog">
                            <el-icon><Delete /></el-icon>
                            <span>回收站</span>
                        </li>
                    </ul>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="file-main">
                <!-- Toolbar -->
                <header class="file-header">
                    <div class="header-left">
                        <div class="breadcrumb-nav" v-if="selectedCategory === 'all'">
                            <el-breadcrumb separator="/">
                                <el-breadcrumb-item @click="handleBreadcrumbClick(null)">
                                    <el-icon><HomeFilled /></el-icon>
                                </el-breadcrumb-item>
                                <el-breadcrumb-item v-for="item in folderPath" :key="item.id" @click="handleBreadcrumbClick(item.id)">
                                    {{ item.name }}
                                </el-breadcrumb-item>
                            </el-breadcrumb>
                        </div>
                        <div class="category-title" v-else>
                            <span class="title-text" v-if="selectedCategory === 'image'">图片文件</span>
                            <span class="title-text" v-else-if="selectedCategory === 'video'">视频文件</span>
                            <span class="title-text" v-else-if="selectedCategory === 'audio'">音频文件</span>
                            <span class="title-text" v-else-if="selectedCategory === 'document'">文档文件</span>
                            <span class="title-text" v-else-if="selectedCategory === 'archive'">压缩包文件</span>
                            <span class="title-text" v-else-if="selectedCategory === 'other'">其他文件</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="view-toggle">
                            <el-button-group>
                                <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'">
                                    <el-icon><Menu /></el-icon>
                                </el-button>
                                <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
                                    <el-icon><List /></el-icon>
                                </el-button>
                            </el-button-group>
                        </div>
                        <el-input v-model.trim="queryWhere.origin_name" class="search-input" placeholder="搜索文件..." :prefix-icon="Search" clearable @input="handleSearch" />
                        <xl-action-button v-permission="'file:list'" :text="t('system.file.exportList')" :loading="exporting" @click="handleExportList" />
                        <xl-action-button v-permission="'file:create'" :text="t('system.file.selectUploadFolder')" @click="openUploadDirectoryPicker" />
                        <xl-action-button v-permission="'file:create'" type="primary" :text="t('system.file.selectUploadFiles')" @click="openUploadPicker" />
                        <input ref="uploadInputRef" type="file" multiple class="file-upload-input" @change="handleFileInputChange" />
                        <input ref="uploadDirectoryInputRef" type="file" multiple webkitdirectory directory class="file-upload-input" @change="handleDirectoryInputChange" />
                    </div>
                </header>

                <!-- Content Area -->
                <div
                    class="file-content-wrapper"
                    v-loading="loading"
                    @dragenter.prevent="handleUploadDragEnter"
                    @dragover.prevent="handleUploadDragOver"
                    @dragleave.prevent="handleUploadDragLeave"
                    @drop.prevent="handleUploadDrop"
                >
                    <!-- Drag Overlay -->
                    <div v-if="isDraggingUpload" class="upload-drag-overlay">
                        <div class="drag-message">
                            <el-icon class="drag-icon"><UploadFilled /></el-icon>
                            <span>释放文件以开始上传</span>
                        </div>
                    </div>

                    <!-- Upload Queue (Floating) -->
                    <div v-if="uploadTasks.length && (!uploadFinished || hasErrorTasks)" class="floating-upload-queue">
                        <div class="queue-header">
                            <span>{{ uploading ? '正在上传' : '上传任务' }} ({{ uploadFinishedCount }}/{{ uploadTasks.length }})</span>
                            <div class="queue-actions">
                                <button v-if="uploadTasks.length > 3" type="button" class="queue-toggle" @click="toggleUploadQueueExpanded">
                                    {{ uploadQueueExpanded ? '收起' : '展开' }}
                                </button>
                                <el-icon class="close-icon" @click="clearTasks"><Close /></el-icon>
                            </div>
                        </div>
                        <div class="queue-body">
                            <div v-for="task in visibleUploadTasks" :key="task.id" class="mini-task" :class="{ 'is-error': task.status === 'error' }">
                                <span class="task-name" :title="task.name">{{ task.name }}</span>
                                <div v-if="task.status === 'error'" class="task-error-row">
                                    <span class="task-error-msg" :title="task.error">{{ task.error || '上传失败' }}</span>
                                    <button type="button" class="task-retry" @click="retryUploadTask(task)">重试</button>
                                </div>
                                <el-progress v-else :percentage="task.progress" :stroke-width="4" />
                            </div>
                            <button v-if="!uploadQueueExpanded && uploadTasks.length > 3" type="button" class="queue-more" @click="toggleUploadQueueExpanded">还有 {{ uploadTasks.length - 3 }} 个文件，点击展开</button>
                        </div>
                    </div>
                    <!-- Grid View -->
                    <div v-if="viewMode === 'grid'" class="file-grid-view">
                        <!-- Folders first -->
                        <template v-if="selectedCategory === 'all'">
                            <div v-for="folder in currentLevelFolders" :key="folder.id" class="file-grid-item folder-item" @dblclick="handleFolderSelect(folder)">
                                <div class="item-icon-box">
                                    <div class="mac-folder-icon">
                                        <svg viewBox="0 0 24 24" width="64" height="64">
                                            <path fill="#00a1ff" d="M20 18H4V8h16v10zm-2-12H4v2h14V6z" opacity=".2" />
                                            <path fill="#00a1ff" d="M4 4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2H4z" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="item-name">{{ folder.name }}</div>
                            </div>
                        </template>

                        <!-- Files -->
                        <div v-for="file in fileList" :key="file.id" class="file-grid-item" @click="openDetailDrawer(file)">
                            <div class="item-icon-box">
                                <el-image v-if="isImageFile(file) && file.url" :src="file.url" fit="cover" class="grid-thumbnail" />
                                <div v-else class="grid-placeholder">
                                    <svg viewBox="0 0 24 24" width="48" height="48"><path fill="#909399" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" /></svg>
                                    <span class="grid-ext">{{ file.ext?.toUpperCase() }}</span>
                                </div>
                            </div>
                            <div class="item-name">{{ file.origin_name }}</div>
                            <div class="item-size">{{ formatFileSize(file.size) }}</div>
                        </div>
                    </div>

                    <!-- List View (Existing Table) -->
                    <div v-else class="file-list-view">
                        <div v-if="selectedFiles.length > 0" class="batch-action-bar">
                            <span class="batch-selection-text">{{ t('system.file.batchSelected', { count: selectedFiles.length }) }}</span>
                            <div class="batch-actions">
                                <xl-action-button v-permission="'file:update'" :text="t('system.file.batchMove')" @click="openBatchMoveDialog" />
                                <xl-action-button v-permission="'file:delete'" type="danger" :loading="batchDeleting" :text="t('system.file.batchDelete')" @click="handleBatchDelete" />
                            </div>
                        </div>
                        <xl-table-list :loading="loading" :data="fileList" :tableTitle="tableTitle" :pagination="pagination" selectable @selection-change="handleSelectionChange">
                            <template #td="{ item, val, row }">
                                <div v-if="item.prop === 'origin_name'" class="file-name-cell">
                                    <el-image v-if="isImageFile(row) && row.url" :src="row.url" fit="cover" class="file-thumbnail" :preview-src-list="[row.url]" preview-teleported hide-on-click-modal />
                                    <div v-else class="file-thumbnail-placeholder">
                                        <svg viewBox="0 0 24 24" width="24" height="24">
                                            <path fill="var(--el-text-color-placeholder)" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                                        </svg>
                                        <span class="file-ext" v-if="row.ext">{{ String(row.ext).substring(0, 4).toUpperCase() }}</span>
                                    </div>
                                    <span class="file-name-text">{{ val || '-' }}</span>
                                </div>
                                <el-tag v-else-if="item.prop === 'storage_driver'" :type="getStorageDriverTagType(row.storage_driver)">
                                    {{ getStorageDriverLabel(row.storage_driver) }}
                                </el-tag>
                                <el-tag v-else-if="item.prop === 'storage_status'" :type="getStorageStatusTagType(row.storage_status)">
                                    {{ getStorageStatusLabel(row.storage_status) }}
                                </el-tag>
                                <el-button v-else-if="item.prop === 'reference_count'" type="primary" link :disabled="Number(row.reference_count || 0) <= 0" @click="openReferencesDialog(row)">
                                    {{ row.reference_count || 0 }}
                                </el-button>
                                <el-tag v-else-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                                    {{ item.tag[val as string | number]?.text || val }}
                                </el-tag>
                                <span v-else>{{ val }}</span>
                            </template>
                            <template #operation>
                                <el-table-column width="130" :label="t('common.labels.operation')" align="center" fixed="right">
                                    <template #default="scope">
                                        <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                                    </template>
                                </el-table-column>
                            </template>
                        </xl-table-list>
                    </div>
                </div>
            </main>
        </div>

        <el-dialog v-model="showFolderDialog" :title="folderDialogTitle" width="420px" append-to-body>
            <el-form label-width="90px">
                <el-form-item :label="t('system.file.folderName')">
                    <el-input v-model.trim="folderForm.name" :placeholder="t('system.file.folderNamePlaceholder')" />
                </el-form-item>
                <el-form-item :label="t('system.file.parentFolder')">
                    <el-tree-select v-model="folderForm.parent_id" :data="folderSelectOptions" :props="{ label: 'name', children: 'children', value: 'id' }" check-strictly clearable />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showFolderDialog = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" :loading="folderSubmitting" @click="submitFolderDialog">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="showMoveDialog" :title="moveDialogTitle" width="420px" append-to-body>
            <el-form label-width="90px">
                <el-form-item :label="t('system.file.targetFolder')">
                    <el-tree-select v-model="moveTargetFolderId" :data="folderSelectOptions" :props="{ label: 'name', children: 'children', value: 'id' }" check-strictly clearable />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showMoveDialog = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" :loading="moveSubmitting" @click="submitMoveDialog">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>

        <el-drawer v-model="showDetailDrawer" :title="t('system.file.detailTitle')" direction="rtl" size="720px">
            <div v-loading="detailLoading" :element-loading-text="t('system.file.loadingText')" class="detail-container">
                <template v-if="currentDetail">
                    <!-- 顶部文件概览 -->
                    <div class="file-detail-header">
                        <div class="header-icon">
                            <el-image v-if="isImageFile(currentDetail) && currentDetail.url" :src="currentDetail.url" fit="cover" class="detail-thumbnail" :preview-src-list="[currentDetail.url]" preview-teleported />
                            <div v-else class="detail-icon-placeholder">
                                <svg viewBox="0 0 24 24" width="42" height="42">
                                    <path fill="var(--el-text-color-placeholder)" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                                </svg>
                                <span class="detail-ext" v-if="currentDetail.ext">{{ String(currentDetail.ext).toUpperCase() }}</span>
                            </div>
                        </div>
                        <div class="header-info">
                            <h3 class="file-name">{{ currentDetail.origin_name || '-' }}</h3>
                            <div class="file-meta-badges">
                                <el-tag size="small" :type="getStorageDriverTagType(currentDetail.storage_driver)" effect="plain">{{ getStorageDriverLabel(currentDetail.storage_driver) }}</el-tag>
                                <el-tag size="small" :type="getStorageStatusTagType(currentDetail.storage_status)" effect="light">{{ getStorageStatusLabel(currentDetail.storage_status) }}</el-tag>
                                <el-tag size="small" :type="Number(currentDetail.is_public) === 1 ? 'success' : 'info'" effect="plain">
                                    {{ Number(currentDetail.is_public) === 1 ? t('system.file.publicLabel') : t('system.file.privateLabel') }}
                                </el-tag>
                            </div>
                        </div>
                    </div>

                    <el-divider />

                    <!-- 基础详情 -->
                    <div class="detail-section">
                        <div class="section-header">
                            <span class="section-title">
                                <svg viewBox="0 0 24 24" width="16" height="16" class="section-icon">
                                    <path
                                        fill="currentColor"
                                        d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                                    />
                                </svg>
                                基础信息
                            </span>
                        </div>
                        <el-descriptions :column="2" border size="small" class="modern-descriptions">
                            <el-descriptions-item :label="t('system.file.url')" :span="2">
                                <el-link v-if="currentDetail.url" :href="currentDetail.url" target="_blank" type="primary" class="detail-link">{{ currentDetail.url }}</el-link>
                                <span v-else>-</span>
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.size')">{{ formatFileSize(currentDetail.size) }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.mimeType')">{{ currentDetail.mime_type || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.logicalPath')">{{ currentDetail.logical_path || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.folderId')">{{ currentDetail.folder_id ?? '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.storageDriver')">{{ getStorageDriverLabel(currentDetail.storage_driver) }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.storageStatus')">{{ currentDetail.storage_status_name || currentDetail.storage_status || '-' }}</el-descriptions-item>
                            <el-descriptions-item v-if="isLocalStorageFile(currentDetail)" :label="t('system.file.actualPath')" :span="2">
                                <code class="detail-code">{{ buildActualLocalPath(currentDetail) || '-' }}</code>
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.bucket')">{{ currentDetail.bucket || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.objectKey')">{{ currentDetail.object_key || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.uploadSource')">{{ currentDetail.upload_source_name || currentDetail.upload_source || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.uploadStatus')">{{ currentDetail.upload_status_name || currentDetail.upload_status || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.uuid')" :span="2">
                                <code class="detail-code">{{ currentDetail.uuid || '-' }}</code>
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('system.file.hash')" :span="2">
                                <code class="detail-code">{{ currentDetail.hash || '-' }}</code>
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('common.labels.createdAt')">{{ currentDetail.created_at || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="t('common.labels.updatedAt')">{{ currentDetail.updated_at || '-' }}</el-descriptions-item>
                            <el-descriptions-item v-if="currentDetail.deleted_at" :label="t('system.file.deletedAt')" :span="2">{{ currentDetail.deleted_at }}</el-descriptions-item>
                        </el-descriptions>
                    </div>

                    <!-- 引用来源 -->
                    <div class="detail-section">
                        <div class="section-header">
                            <span class="section-title">
                                <svg viewBox="0 0 24 24" width="16" height="16" class="section-icon">
                                    <path
                                        fill="currentColor"
                                        d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                                    />
                                </svg>
                                {{ t('system.file.references') }}
                            </span>
                            <el-tag size="small" type="primary" effect="dark" round class="count-tag">{{ currentDetail.reference_count || 0 }}</el-tag>
                        </div>
                        <el-table :data="detailReferences" border size="small" empty-text="暂无引用记录" class="modern-table">
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

        <el-dialog v-model="showReferencesDialog" :title="referencesDialogTitle" width="780px" append-to-body>
            <el-table v-loading="referencesLoading" :data="activeReferences" border size="small" empty-text="-" class="reference-dialog-table">
                <el-table-column prop="owner_type" :label="t('system.file.referenceOwnerType')" width="120" show-overflow-tooltip />
                <el-table-column prop="owner_id" :label="t('system.file.referenceOwnerId')" width="90" show-overflow-tooltip />
                <el-table-column prop="source_name" :label="t('system.file.referenceSource')" min-width="130" show-overflow-tooltip>
                    <template #default="{ row }">
                        {{ row.source_name || row.owner_type || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="owner_field" :label="t('system.file.referenceField')" min-width="170" show-overflow-tooltip>
                    <template #default="{ row }">
                        {{ formatReferenceField(row) }}
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>

        <el-dialog v-model="showTrashDialog" :title="t('system.file.trash')" width="86%" append-to-body @open="loadTrashList">
            <xl-table-list :loading="trashLoading" :data="trashList" :tableTitle="trashTableTitle" :pagination="trashPagination">
                <template #td="{ item, val, row }">
                    <div v-if="item.prop === 'origin_name'" class="file-name-cell">
                        <el-image v-if="isImageFile(row) && row.url" :src="row.url" fit="cover" class="file-thumbnail" :preview-src-list="[row.url]" preview-teleported hide-on-click-modal />
                        <div v-else class="file-thumbnail-placeholder">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="var(--el-text-color-placeholder)" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                            </svg>
                            <span class="file-ext" v-if="row.ext">{{ String(row.ext).substring(0, 4).toUpperCase() }}</span>
                        </div>
                        <span class="file-name-text">{{ val || '-' }}</span>
                    </div>
                    <el-tag v-else-if="item.prop === 'storage_status'" :type="getStorageStatusTagType(row.storage_status)">
                        {{ getStorageStatusLabel(row.storage_status) }}
                    </el-tag>
                    <el-tag v-else-if="item.prop === 'storage_driver'" :type="getStorageDriverTagType(row.storage_driver)">
                        {{ getStorageDriverLabel(row.storage_driver) }}
                    </el-tag>
                    <span v-else>{{ val || '-' }}</span>
                </template>
                <template #operation>
                    <el-table-column width="150" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="trashActionButtons" :scope="scope" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Files, Picture, VideoCamera, Headset, Folder, Delete, HomeFilled, Menu, List, Search, MoreFilled, Plus, UploadFilled, Close, Document, More } from '@element-plus/icons-vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { useFileUpload, type UploadTask, type UploadOptions } from '@/composables/useFileUpload'
import { createSystemFileQuery } from '@/modules/system/model'
import { submitSystemFileExportTask } from '@/modules/exportCenter/service'
import { useExportTaskSubmitter } from '@/modules/exportCenter/useExportTaskSubmitter'
import {
    fetchSystemFileList,
    fetchSystemFileDetail,
    removeSystemFile,
    fetchSystemFileTrashList,
    restoreSystemFileFromTrash,
    destroySystemFileFromTrash,
    fetchSystemFileReferences,
    fetchSystemFileFolderTree,
    addSystemFileFolder,
    modifySystemFileFolder,
    removeSystemFileFolder,
    removeSystemFilesBatch,
    moveSystemFileFolder,
    moveSystemFiles,
} from '@/modules/system/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import type { PageData, TableColumn } from '@/types/common'
import type { SystemFile, SystemFileFolder, SystemFileReference, SystemFileExportPayload, SystemFileBatchDeleteResult } from '@/types/system'

const { t } = useI18n()
const { submitExportTask } = useExportTaskSubmitter()

const queryFormRef = ref<FormInstance>()
const queryWhere = reactive(createSystemFileQuery())
const dateRange = ref<[string, string] | []>([])
const ROOT_FOLDER_KEY = '__root__'
type FolderTreeNode = SystemFileFolder & { isRoot?: boolean; children?: FolderTreeNode[] }
const folderTree = ref<SystemFileFolder[]>([])
const selectedFolderId = ref<number | string | null>(null)
const showFolderDialog = ref(false)
const folderSubmitting = ref(false)
const folderDialogMode = ref<'create' | 'rename'>('create')
const activeFolder = ref<SystemFileFolder | null>(null)
const selectedCategory = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

const folderForm = reactive<{ id?: number | string; parent_id?: number | string | null; name: string }>({
    id: undefined,
    parent_id: null,
    name: '',
})
const selectedFiles = ref<SystemFile[]>([])
const batchDeleting = ref(false)
const showMoveDialog = ref(false)
const moveSubmitting = ref(false)
const moveMode = ref<'file' | 'folder'>('file')
const moveTargetFolderId = ref<number | string | null>(null)
const movingFolder = ref<SystemFileFolder | null>(null)
const uploadInputRef = ref<HTMLInputElement>()
const uploadDirectoryInputRef = ref<HTMLInputElement>()
const { uploadTasks, uploading, uploadFinishedCount, uploadFinished, createUploadTask, uploadOneTask, runUploadQueue, clearTasks } = useFileUpload()
const isDraggingUpload = ref(false)
const uploadQueueExpanded = ref(false)
const visibleUploadTasks = computed(() => (uploadQueueExpanded.value ? uploadTasks.value : uploadTasks.value.slice(0, 3)))
const hasErrorTasks = computed(() => uploadTasks.value.some((task) => task.status === 'error'))
let lastUploadOptions: UploadOptions = {}

const toggleUploadQueueExpanded = () => {
    uploadQueueExpanded.value = !uploadQueueExpanded.value
}

const {
    loading,
    items: fileList,
    pagination,
    getList,
    handleSearch,
} = useListPage<SystemFile, typeof queryWhere>({
    query: queryWhere,
    queryFormRef,
    transformParams: (query) => {
        const params = { ...query }
        if (selectedCategory.value === 'all') {
            params.folder_id = selectedFolderId.value
        } else {
            params.folder_id = undefined
        }
        const selectedDateRange = dateRange.value.length === 2 ? dateRange.value : null
        applyDateRangeToQuery(params, selectedDateRange)
        return params
    },
    fetcher: async (params) => {
        try {
            return await fetchSystemFileList(params)
        } catch (error) {
            Logger.error('获取文件资源列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const showDetailDrawer = ref(false)
const detailLoading = ref(false)
const currentDetail = ref<SystemFile | null>(null)
const detailReferences = ref<SystemFileReference[]>([])
const deletingId = ref<number | string | null>(null)
const trashOperatingId = ref<number | string | null>(null)
const showReferencesDialog = ref(false)
const referencesLoading = ref(false)
const activeReferences = ref<SystemFileReference[]>([])
const referencesDialogTitle = ref('')
const showTrashDialog = ref(false)

const folderSelectOptions = computed<FolderTreeNode[]>(() => [
    {
        id: ROOT_FOLDER_KEY,
        parent_id: null,
        name: t('system.file.rootFolder'),
        isRoot: true,
        children: folderTree.value as FolderTreeNode[],
        created_at: '',
        updated_at: '',
    },
])

const folderDialogTitle = computed(() => (folderDialogMode.value === 'create' ? t('system.file.createFolder') : t('system.file.renameFolder')))

const currentLevelFolders = computed(() => {
    if (selectedFolderId.value === null || selectedFolderId.value === ROOT_FOLDER_KEY) {
        return folderTree.value.filter((f) => !f.parent_id)
    }

    const findChildren = (folders: FolderTreeNode[]): FolderTreeNode[] => {
        for (const f of folders) {
            if (f.id === selectedFolderId.value) return f.children || []
            if (f.children) {
                const result = findChildren(f.children)
                if (result.length) return result
            }
        }
        return []
    }
    return findChildren(folderTree.value)
})

const folderPath = computed(() => {
    if (!selectedFolderId.value || selectedFolderId.value === ROOT_FOLDER_KEY) return []

    const path: { id: number | string; name: string }[] = []
    const findPath = (folders: FolderTreeNode[], targetId: number | string): boolean => {
        for (const f of folders) {
            if (f.id === targetId) {
                path.push({ id: f.id, name: f.name })
                return true
            }
            if (f.children && findPath(f.children, targetId)) {
                path.unshift({ id: f.id, name: f.name })
                return true
            }
        }
        return false
    }
    findPath(folderTree.value, selectedFolderId.value)
    return path
})

const CATEGORY_FILE_TYPE_MAP: Record<string, string> = {
    document: 'pdf,word,excel,ppt,text',
    other: 'other',
}

const selectCategory = (category: string) => {
    selectedCategory.value = category
    selectedFolderId.value = null
    selectedFiles.value = []
    queryWhere.file_type = category === 'all' ? null : (CATEGORY_FILE_TYPE_MAP[category] ?? category)
    handleSearch()
}

const handleBreadcrumbClick = (folderId: number | string | null) => {
    selectedFolderId.value = folderId === ROOT_FOLDER_KEY ? null : folderId
    selectedFiles.value = []
    handleSearch()
}

const moveDialogTitle = computed(() => (moveMode.value === 'folder' ? t('system.file.moveFolder') : t('system.file.batchMove')))

const trashList = ref<SystemFile[]>([])
const trashLoading = ref(false)
const trashPagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0,
    pageChange: (page: number) => {
        trashPagination.page = page
        loadTrashList()
    },
    pageSizeChange: (pageSize: number) => {
        trashPagination.page = 1
        trashPagination.pageSize = pageSize
        loadTrashList()
    },
})

const fileTypeOptions = computed(() => [
    { label: t('system.file.fileTypes.image'), value: 'image' },
    { label: t('system.file.fileTypes.pdf'), value: 'pdf' },
    { label: t('system.file.fileTypes.word'), value: 'word' },
    { label: t('system.file.fileTypes.excel'), value: 'excel' },
    { label: t('system.file.fileTypes.ppt'), value: 'ppt' },
    { label: t('system.file.fileTypes.archive'), value: 'archive' },
    { label: t('system.file.fileTypes.text'), value: 'text' },
    { label: t('system.file.fileTypes.audio'), value: 'audio' },
    { label: t('system.file.fileTypes.video'), value: 'video' },
    { label: t('system.file.fileTypes.other'), value: 'other' },
])

const storageDriverOptions = computed(() => [
    { label: t('system.file.storageDrivers.local'), value: 'local' },
    { label: t('system.file.storageDrivers.aliyunOss'), value: 'aliyun_oss' },
    { label: t('system.file.storageDrivers.s3'), value: 's3' },
])

const storageStatusOptions = computed(() => [
    { label: t('system.file.storageStatuses.stored'), value: 'stored' },
    { label: t('system.file.storageStatuses.normal'), value: 'normal' },
    { label: t('system.file.storageStatuses.uploading'), value: 'uploading' },
    { label: t('system.file.storageStatuses.deleteFailed'), value: 'delete_failed' },
    { label: t('system.file.storageStatuses.missing'), value: 'missing' },
])

const formatFileSize = (size?: number) => {
    const bytes = Number(size || 0)
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const getFileTypeLabel = (value?: string) => {
    return fileTypeOptions.value.find((item) => item.value === value)?.label || value || '-'
}

const formatReferenceField = (row: SystemFileReference) => {
    const field = String(row.owner_field || '').trim()
    const name = String(row.field_name || '').trim()
    if (field && name) return `${field}（${name}）`
    return field || name || '-'
}

const openDetailDrawer = async (row: SystemFile) => {
    showDetailDrawer.value = true
    detailLoading.value = true
    detailReferences.value = []
    try {
        const detail = await fetchSystemFileDetail(row.id)
        currentDetail.value = detail
        detailReferences.value = Array.isArray(detail.references) ? detail.references : await fetchSystemFileReferences({ id: row.id })
    } catch (error) {
        Logger.error('获取文件资源详情失败:', error)
    } finally {
        detailLoading.value = false
    }
}

const isImageFile = (row?: SystemFile) => {
    if (!row) return false
    return row.file_type === 'image' || String(row.mime_type || '').startsWith('image/')
}

const isLocalStorageFile = (row?: SystemFile) => {
    return String(row?.storage_driver || 'local') === 'local'
}

const buildActualLocalPath = (row?: SystemFile) => {
    if (!row) return ''
    return String(row.storage_path || row.path || '').replace(/^\/+/, '')
}

const getStorageDriverLabel = (value?: string) => {
    return storageDriverOptions.value.find((item) => item.value === value)?.label || value || '-'
}

const getStorageDriverTagType = (value?: string) => {
    const typeMap: Record<string, string> = {
        local: 'info',
        aliyun_oss: 'success',
        s3: 'warning',
    }
    return typeMap[value || ''] || 'info'
}

const getStorageStatusLabel = (value?: string) => {
    return storageStatusOptions.value.find((item) => item.value === value)?.label || value || '-'
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

const normalizeFolderId = (value?: number | string | null) => (value === ROOT_FOLDER_KEY || value === undefined ? null : value)

const loadFolderTree = async () => {
    try {
        folderTree.value = await fetchSystemFileFolderTree()
    } catch (error) {
        Logger.error('获取文件目录树失败:', error)
        folderTree.value = []
    }
}

const handleFolderSelect = (folder: FolderTreeNode) => {
    selectedFolderId.value = normalizeFolderId(folder.id)
    selectedFiles.value = []
    queryWhere.folder_id = selectedFolderId.value
    pagination.page = 1
    getList()
}

const openFolderDialog = (mode: 'create' | 'rename', folder?: SystemFileFolder) => {
    folderDialogMode.value = mode
    activeFolder.value = folder || null
    folderForm.id = mode === 'rename' ? folder?.id : undefined
    folderForm.parent_id = mode === 'create' ? selectedFolderId.value : (folder?.parent_id ?? null)
    folderForm.name = mode === 'rename' ? folder?.name || '' : ''
    showFolderDialog.value = true
}

const submitFolderDialog = async () => {
    if (!folderForm.name.trim()) {
        ElMessage.warning(t('system.file.folderNameRequired'))
        return
    }
    folderSubmitting.value = true
    try {
        if (folderDialogMode.value === 'rename' && folderForm.id) {
            await modifySystemFileFolder({
                id: folderForm.id,
                name: folderForm.name.trim(),
                parent_id: normalizeFolderId(folderForm.parent_id),
            })
            ElMessage.success(t('common.result.editSuccess'))
        } else {
            await addSystemFileFolder({
                name: folderForm.name.trim(),
                parent_id: normalizeFolderId(folderForm.parent_id),
            })
            ElMessage.success(t('common.result.addSuccess'))
        }
        showFolderDialog.value = false
        await loadFolderTree()
    } catch (error) {
        Logger.error('保存文件目录失败:', error)
    } finally {
        folderSubmitting.value = false
    }
}

const handleFolderCommand = async (command: string, folder: SystemFileFolder) => {
    if (command === 'create') {
        selectedFolderId.value = folder.id
        openFolderDialog('create', folder)
        return
    }
    if (command === 'rename') {
        openFolderDialog('rename', folder)
        return
    }
    if (command === 'move') {
        moveMode.value = 'folder'
        movingFolder.value = folder
        moveTargetFolderId.value = folder.parent_id ?? null
        showMoveDialog.value = true
        return
    }
    if (command === 'delete') {
        try {
            await ElMessageBox.confirm(t('system.file.deleteFolderConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
            await removeSystemFileFolder(folder.id)
            ElMessage.success(t('common.result.deleteSuccess'))
            if (selectedFolderId.value === folder.id) {
                selectedFolderId.value = null
                queryWhere.folder_id = null
            }
            await loadFolderTree()
            await getList()
        } catch (error) {
            Logger.error('删除文件目录失败:', error)
        }
    }
}

const handleSelectionChange = (selection: SystemFile[]) => {
    selectedFiles.value = selection
}

const openBatchMoveDialog = () => {
    if (selectedFiles.value.length === 0) {
        ElMessage.warning(t('system.file.selectFileFirst'))
        return
    }
    moveMode.value = 'file'
    moveTargetFolderId.value = selectedFolderId.value
    showMoveDialog.value = true
}

const submitMoveDialog = async () => {
    moveSubmitting.value = true
    try {
        if (moveMode.value === 'folder') {
            if (!movingFolder.value) return
            await moveSystemFileFolder(movingFolder.value.id, normalizeFolderId(moveTargetFolderId.value))
            ElMessage.success(t('system.file.moveSuccess'))
            showMoveDialog.value = false
            await loadFolderTree()
            return
        }
        const ids = selectedFiles.value.map((item) => item.id)
        if (ids.length === 0) {
            ElMessage.warning(t('system.file.selectFileFirst'))
            return
        }
        await moveSystemFiles({ ids, folder_id: normalizeFolderId(moveTargetFolderId.value) })
        ElMessage.success(t('system.file.moveSuccess'))
        showMoveDialog.value = false
        selectedFiles.value = []
        await getList()
    } catch (error) {
        Logger.error('移动文件资源失败:', error)
    } finally {
        moveSubmitting.value = false
    }
}

const openUploadPicker = () => {
    uploadInputRef.value?.click()
}

const openUploadDirectoryPicker = () => {
    uploadDirectoryInputRef.value?.click()
}

const exporting = ref(false)

const handleExportList = async () => {
    const params = { ...queryWhere } as Record<string, unknown>
    if (selectedCategory.value === 'all') {
        params.folder_id = selectedFolderId.value
    } else {
        params.folder_id = undefined
    }
    const selectedDateRange = dateRange.value.length === 2 ? dateRange.value : null
    applyDateRangeToQuery(params, selectedDateRange)
    const payload = Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page')) as SystemFileExportPayload

    await submitExportTask({
        loading: exporting,
        submitter: () => submitSystemFileExportTask(payload),
        successMessage: t('system.task.exportSubmitSuccess'),
        onError: (error) => {
            Logger.error('提交文件资源导出任务失败:', error)
        },
    })
}

const uploadFilesInQueue = async (files: File[]) => {
    if (files.length === 0) return
    const currentTasks = files.map((file) => createUploadTask(file))
    uploadTasks.value = currentTasks
    uploadQueueExpanded.value = false
    lastUploadOptions = { folderId: selectedFolderId.value }
    await runUploadQueue(currentTasks, lastUploadOptions)
    if (currentTasks.some((task) => task.status === 'success' || task.status === 'reuse')) {
        ElMessage.success(t('common.result.uploadSuccess'))
        await getList()
    }
    if (currentTasks.every((task) => task.status === 'success' || task.status === 'reuse')) {
        window.setTimeout(() => {
            if (uploadTasks.value === currentTasks && !uploading.value) clearTasks()
        }, 1200)
    }
}

const retryUploadTask = async (task: UploadTask) => {
    if (task.status !== 'error') return
    await uploadOneTask(task, lastUploadOptions)
    await getList()
    if (uploadTasks.value.length > 0 && uploadTasks.value.every((item) => item.status === 'success' || item.status === 'reuse')) {
        ElMessage.success(t('common.result.uploadSuccess'))
        const snapshot = uploadTasks.value
        window.setTimeout(() => {
            if (uploadTasks.value === snapshot && !uploading.value) clearTasks()
        }, 1200)
    }
}

const buildFolderIndexKey = (parentId: number | string | null | undefined, name: string) => `${String(parentId ?? ROOT_FOLDER_KEY)}::${name}`

const buildFolderIndex = (folders: FolderTreeNode[]) => {
    const index = new Map<string, FolderTreeNode>()
    const walk = (nodes: FolderTreeNode[]) => {
        for (const node of nodes) {
            index.set(buildFolderIndexKey(node.parent_id ?? null, node.name), node)
            if (Array.isArray(node.children) && node.children.length) {
                walk(node.children as FolderTreeNode[])
            }
        }
    }
    walk(folders)
    return index
}

const extractRelativeFolderPath = (file: File) => {
    const relativePath = typeof (file as File & { webkitRelativePath?: string }).webkitRelativePath === 'string' ? String((file as File & { webkitRelativePath?: string }).webkitRelativePath) : ''
    if (!relativePath.includes('/')) return ''
    return relativePath.split('/').slice(0, -1).join('/')
}

const extractRelativeDisplayName = (file: File) => {
    const relativePath = typeof (file as File & { webkitRelativePath?: string }).webkitRelativePath === 'string' ? String((file as File & { webkitRelativePath?: string }).webkitRelativePath) : ''
    return relativePath || file.name
}

const ensureFolderPathExists = async (relativeFolderPath: string, baseFolderId: number | string | null, folderIndex: Map<string, FolderTreeNode>, createdPathIds: Map<string, number | string | null>) => {
    if (!relativeFolderPath) return baseFolderId
    if (createdPathIds.has(relativeFolderPath)) {
        return createdPathIds.get(relativeFolderPath) ?? baseFolderId
    }

    const segments = relativeFolderPath.split('/').filter(Boolean)
    let currentParentId = baseFolderId
    let currentPath = ''

    for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment
        if (createdPathIds.has(currentPath)) {
            currentParentId = createdPathIds.get(currentPath) ?? currentParentId
            continue
        }

        const folderKey = buildFolderIndexKey(currentParentId, segment)
        let targetFolder = folderIndex.get(folderKey)
        if (!targetFolder) {
            try {
                const createdFolder = (await addSystemFileFolder({
                    name: segment,
                    parent_id: currentParentId,
                })) as FolderTreeNode
                targetFolder = {
                    ...createdFolder,
                    children: Array.isArray(createdFolder.children) ? createdFolder.children : [],
                }
            } catch (error) {
                await loadFolderTree()
                folderIndex.clear()
                for (const [key, value] of buildFolderIndex(folderTree.value as FolderTreeNode[])) {
                    folderIndex.set(key, value)
                }
                targetFolder = folderIndex.get(folderKey)
                if (!targetFolder) {
                    throw error
                }
            }
            folderIndex.set(folderKey, targetFolder)
        }

        currentParentId = targetFolder.id
        createdPathIds.set(currentPath, currentParentId)
    }

    return currentParentId
}

const uploadDirectoryInQueue = async (files: File[]) => {
    if (files.length === 0) return

    const baseFolderId = selectedCategory.value === 'all' ? selectedFolderId.value : null
    await loadFolderTree()
    const folderIndex = buildFolderIndex(folderTree.value as FolderTreeNode[])
    const createdPathIds = new Map<string, number | string | null>([['', baseFolderId]])
    const relativeFolderPaths = Array.from(new Set(files.map(extractRelativeFolderPath).filter(Boolean))).sort((left, right) => left.split('/').length - right.split('/').length)

    for (const relativeFolderPath of relativeFolderPaths) {
        await ensureFolderPathExists(relativeFolderPath, baseFolderId, folderIndex, createdPathIds)
    }

    const currentTasks = [] as ReturnType<typeof createUploadTask>[]
    for (const file of files) {
        const relativeFolderPath = extractRelativeFolderPath(file)
        const targetFolderId = relativeFolderPath ? (createdPathIds.get(relativeFolderPath) ?? baseFolderId) : baseFolderId
        currentTasks.push(
            createUploadTask(file, {
                name: extractRelativeDisplayName(file),
                folderId: targetFolderId,
            })
        )
    }

    uploadTasks.value = currentTasks
    uploadQueueExpanded.value = false
    lastUploadOptions = {}
    await runUploadQueue(currentTasks, lastUploadOptions)
    await loadFolderTree()
    if (currentTasks.some((task) => task.status === 'success' || task.status === 'reuse')) {
        ElMessage.success(t('common.result.uploadSuccess'))
        await getList()
    }
    if (currentTasks.every((task) => task.status === 'success' || task.status === 'reuse')) {
        window.setTimeout(() => {
            if (uploadTasks.value === currentTasks && !uploading.value) clearTasks()
        }, 1200)
    }
}

const handleFileInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''
    await uploadFilesInQueue(files)
}

const handleDirectoryInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''
    await uploadDirectoryInQueue(files)
}

const handleUploadDragEnter = () => {
    isDraggingUpload.value = true
}

const handleUploadDragOver = () => {
    isDraggingUpload.value = true
}

const handleUploadDragLeave = (event: DragEvent) => {
    const current = event.currentTarget as HTMLElement
    const related = event.relatedTarget as Node | null
    if (!related || !current.contains(related)) isDraggingUpload.value = false
}

const handleUploadDrop = async (event: DragEvent) => {
    isDraggingUpload.value = false
    await uploadFilesInQueue(Array.from(event.dataTransfer?.files || []))
}

const findReferencesInError = (value: unknown): SystemFileReference[] => {
    if (!value || typeof value !== 'object') return []
    const record = value as Record<string, unknown>
    if (Array.isArray(record.references)) return record.references as SystemFileReference[]
    if (record.data) return findReferencesInError(record.data)
    if (record.response) return findReferencesInError(record.response)
    return []
}

const getErrorMessage = (error: unknown) => {
    if (!error || typeof error !== 'object') return ''
    const record = error as Record<string, unknown>
    const response = record.response as Record<string, unknown> | undefined
    const data = response?.data as Record<string, unknown> | undefined
    return String(data?.msg || data?.message || record.message || '')
}

const showReferenceBlockInfo = (error: unknown) => {
    const references = findReferencesInError(error)
    if (references.length === 0) return false
    activeReferences.value = references
    referencesDialogTitle.value = getErrorMessage(error) || t('system.file.deleteBlockedTitle')
    showReferencesDialog.value = true
    return true
}

const openReferencesDialog = async (row: SystemFile) => {
    referencesDialogTitle.value = t('system.file.referencesTitle', { name: row.origin_name || row.uuid || row.id })
    activeReferences.value = []
    showReferencesDialog.value = true
    referencesLoading.value = true
    try {
        activeReferences.value = Array.isArray(row.references) ? row.references : await fetchSystemFileReferences({ id: row.id })
    } catch (error) {
        Logger.error('获取文件引用列表失败:', error)
    } finally {
        referencesLoading.value = false
    }
}

const loadTrashList = async () => {
    trashLoading.value = true
    try {
        const result = (await fetchSystemFileTrashList({
            page: trashPagination.page,
            per_page: trashPagination.pageSize,
            is_deleted: 1,
        })) as PageData<SystemFile> & { page?: number; pageSize?: number }
        trashList.value = result.list
        trashPagination.total = result.total
        trashPagination.page = result.page ?? trashPagination.page
        trashPagination.pageSize = result.pageSize ?? trashPagination.pageSize
    } catch (error) {
        Logger.error('获取文件回收站列表失败:', error)
        trashList.value = []
        trashPagination.total = 0
    } finally {
        trashLoading.value = false
    }
}

const openTrashDialog = () => {
    showTrashDialog.value = true
}

const handleRestore = async (row: SystemFile) => {
    try {
        trashOperatingId.value = row.id
        await restoreSystemFileFromTrash(row.id)
        ElMessage.success(t('system.file.restoreSuccess'))
        await loadTrashList()
        await getList()
    } catch (error) {
        Logger.error('恢复文件失败:', error)
    } finally {
        trashOperatingId.value = null
    }
}

const handleDestroy = async (row: SystemFile) => {
    try {
        await ElMessageBox.confirm(t('system.file.destroyConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        trashOperatingId.value = row.id
        await destroySystemFileFromTrash(row.id)
        ElMessage.success(t('common.result.deleteSuccess'))
        await loadTrashList()
    } catch (error) {
        Logger.error('硬删除文件失败:', error)
    } finally {
        trashOperatingId.value = null
    }
}

const handleDelete = async (row: SystemFile) => {
    try {
        await ElMessageBox.confirm(t('system.file.deleteConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        deletingId.value = row.id
        await removeSystemFile(row.id)
        ElMessage.success(t('common.result.deleteSuccess'))
        await getList()
    } catch (error) {
        if (!showReferenceBlockInfo(error)) {
            Logger.error('删除文件资源失败:', error)
        }
    } finally {
        deletingId.value = null
    }
}

const handleBatchDelete = async () => {
    if (selectedFiles.value.length === 0) {
        ElMessage.warning(t('system.file.selectFileFirst'))
        return
    }

    try {
        await ElMessageBox.confirm(t('system.file.batchDeleteConfirm', { count: selectedFiles.value.length }), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        batchDeleting.value = true
        const result = await removeSystemFilesBatch({
            ids: selectedFiles.value.map((item) => item.id),
        })

        const firstFailureWithReferences = (result.failures || []).find((item) => Array.isArray(item.references) && item.references.length > 0)
        if (firstFailureWithReferences) {
            activeReferences.value = firstFailureWithReferences.references || []
            referencesDialogTitle.value = firstFailureWithReferences.message || t('system.file.deleteBlockedTitle')
            showReferencesDialog.value = true
        }

        selectedFiles.value = []
        await getList()
        showBatchDeleteResult(result)
    } catch (error) {
        Logger.error('批量删除文件资源失败:', error)
    } finally {
        batchDeleting.value = false
    }
}

const showBatchDeleteResult = (result: SystemFileBatchDeleteResult) => {
    if (result.deleted > 0 && result.failed === 0) {
        ElMessage.success(t('system.file.batchDeleteSuccess', { count: result.deleted }))
        return
    }
    if (result.deleted > 0) {
        ElMessage.warning(t('system.file.batchDeletePartial', { success: result.deleted, failed: result.failed }))
        return
    }
    ElMessage.error(t('system.file.batchDeleteFailed'))
}

const actionButtons = computed(() => [
    {
        permission: 'file:list',
        text: t('common.actions.detail'),
        showIcon: false,
        click: (row: SystemFile) => openDetailDrawer(row),
    },
    {
        permission: 'file:delete',
        text: t('common.actions.delete'),
        type: 'danger',
        showIcon: false,
        disabled: (row: SystemFile) => deletingId.value === row.id,
        click: (row: SystemFile) => handleDelete(row),
    },
])

const trashActionButtons = computed(() => [
    {
        permission: 'file:delete',
        text: t('system.file.restore'),
        type: 'primary',
        showIcon: false,
        disabled: (row: SystemFile) => trashOperatingId.value === row.id,
        click: (row: SystemFile) => handleRestore(row),
    },
    {
        permission: 'file:delete',
        text: t('system.file.destroy'),
        type: 'danger',
        showIcon: false,
        disabled: (row: SystemFile) => trashOperatingId.value === row.id,
        click: (row: SystemFile) => handleDestroy(row),
    },
])

const tableTitle = computed(
    () =>
        [
            { prop: 'origin_name', h_label: t('system.file.originName'), minWidth: 260, overflow: true, customRow: true },
            { prop: 'file_type', h_label: t('system.file.fileType') || '文件类型', width: 100, align: 'center', formatter: (row) => getFileTypeLabel(row.file_type) },
            { prop: 'size', h_label: t('system.file.size'), width: 100, align: 'right', formatter: (row) => formatFileSize(row.size) },
            { prop: 'mime_type', h_label: t('system.file.mimeType'), minWidth: 140, overflow: true },
            {
                prop: 'is_public',
                h_label: t('system.file.publicStatus'),
                h_tip: t('system.file.publicStatusTip'),
                width: 120,
                align: 'center',
                customRow: true,
                tag: {
                    1: { type: 'success', text: t('common.yes') },
                    0: { type: 'info', text: t('common.no') },
                },
            },
            { prop: 'storage_driver', h_label: t('system.file.storageDriver'), width: 130, align: 'center', customRow: true },
            { prop: 'storage_status', h_label: t('system.file.storageStatus'), width: 130, align: 'center', customRow: true },
            { prop: 'reference_count', h_label: t('system.file.referenceCount'), width: 110, align: 'center', customRow: true },
            { prop: 'uuid', h_label: t('system.file.uuid'), minWidth: 260, overflow: true },
            { prop: 'created_at', h_label: t('common.labels.createdAt'), width: 180, align: 'center' },
        ] as TableColumn<SystemFile>[]
)

const trashTableTitle = computed(
    () =>
        [
            { prop: 'origin_name', h_label: t('system.file.originName'), minWidth: 260, overflow: true, customRow: true },
            { prop: 'file_type', h_label: t('system.file.fileType') || '文件类型', width: 100, align: 'center', formatter: (row) => getFileTypeLabel(row.file_type) },
            { prop: 'storage_driver', h_label: t('system.file.storageDriver'), width: 130, align: 'center', customRow: true },
            { prop: 'storage_status', h_label: t('system.file.storageStatus'), width: 130, align: 'center', customRow: true },
            { prop: 'reference_count', h_label: t('system.file.referenceCount'), width: 110, align: 'center' },
            { prop: 'deleted_at', h_label: t('system.file.deletedAt'), width: 180, align: 'center' },
            { prop: 'deleted_by', h_label: t('system.file.deletedBy'), width: 120, align: 'center' },
            { prop: 'deleted_reason', h_label: t('system.file.deletedReason'), minWidth: 180, overflow: true },
        ] as TableColumn<SystemFile>[]
)

onMounted(() => {
    loadFolderTree()
    getList()
})
</script>

<style scoped lang="scss">
.file-explorer-container {
    display: grid;
    grid-template-columns: 220px 1fr;
    height: calc(100vh - 120px);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin: 10px;
}

/* Sidebar */
.file-sidebar {
    background: rgba(246, 246, 246, 0.8);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(0, 0, 0, 0.05);
    padding: 20px 0;
    display: flex;
    flex-direction: column;
}

.sidebar-section {
    padding: 0 12px;
    margin-bottom: 24px;
}

.sidebar-section-title {
    padding: 0 12px;
    font-size: 11px;
    font-weight: 700;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
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
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        color: #555;
        font-size: 13px;

        &:hover {
            background: rgba(0, 0, 0, 0.03);
        }

        &.active {
            background: rgba(0, 161, 255, 0.1);
            color: #00a1ff;
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
        height: 32px;
        border-radius: 6px;
        margin-bottom: 2px;

        &:hover {
            background: rgba(0, 0, 0, 0.03);
        }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
        background: rgba(0, 161, 255, 0.1);
        color: #00a1ff;
    }
}

.folder-node-custom {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    .el-icon {
        color: #00a1ff;
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
        font-size: 12px;
        transition: opacity 0.2s;
    }

    &:hover .more-icon {
        opacity: 1;
    }
}

/* Main */
.file-main {
    display: flex;
    flex-direction: column;
    background: #fff;
    min-width: 0;
    min-height: 0;
}

.file-header {
    height: 60px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.breadcrumb-nav {
    :deep(.el-breadcrumb__item) {
        cursor: pointer;
        &:hover .el-breadcrumb__inner {
            color: #00a1ff;
        }
    }
}

.category-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.search-input {
    width: 240px;
}

.file-content-wrapper {
    flex: 1;
    overflow: auto;
    padding: 24px;
    position: relative;
    min-width: 0;
    min-height: 0;
}

.file-list-view {
    min-width: max-content;
}

.batch-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px 16px;
    border: 1px solid rgba(64, 158, 255, 0.2);
    border-radius: 10px;
    background: #f8fbff;

    .batch-selection-text {
        font-size: 13px;
        color: var(--el-text-color-primary);
    }

    .batch-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }
}

.upload-drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 161, 255, 0.05);
    border: 2px dashed #00a1ff;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    border-radius: 8px;
    margin: 12px;

    .drag-message {
        background: #fff;
        padding: 20px 40px;
        border-radius: 40px;
        box-shadow: 0 10px 40px rgba(0, 161, 255, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        color: #00a1ff;
        font-weight: 600;

        .drag-icon {
            font-size: 24px;
        }
    }
}

.floating-upload-queue {
    position: absolute;
    bottom: 24px;
    right: 24px;
    width: 280px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    z-index: 200;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);

    .queue-header {
        padding: 12px 16px;
        background: #f9f9f9;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);

        .queue-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .queue-toggle {
            border: 0;
            padding: 0;
            background: transparent;
            color: var(--el-color-primary);
            font-size: 12px;
            cursor: pointer;
        }

        .close-icon {
            cursor: pointer;
            &:hover {
                color: #ff4d4f;
            }
        }
    }

    .queue-body {
        padding: 12px 16px;
    }

    .mini-task {
        margin-bottom: 10px;
        &:last-child {
            margin-bottom: 0;
        }

        .task-name {
            display: block;
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &.is-error .task-name {
            color: #f56c6c;
        }

        .task-error-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
        }

        .task-error-msg {
            flex: 1;
            color: #f56c6c;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .task-retry {
            flex-shrink: 0;
            border: 0;
            padding: 2px 8px;
            background: transparent;
            color: var(--el-color-primary);
            font-size: 12px;
            cursor: pointer;
            &:hover {
                text-decoration: underline;
            }
        }
    }

    .queue-more {
        width: 100%;
        border: 0;
        padding: 0;
        background: transparent;
        font-size: 10px;
        color: #999;
        text-align: center;
        margin-top: 8px;
        cursor: pointer;
    }
}

/* Grid View */
.file-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 24px;
}

.file-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;

    &:hover {
        background: rgba(0, 0, 0, 0.02);
        transform: translateY(-2px);
    }

    &.folder-item {
        .item-icon-box {
            background: transparent;
        }
    }
}

.item-icon-box {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    border-radius: 10px;
    background: #f9f9f9;
    position: relative;
    overflow: hidden;
}

.mac-folder-icon {
    filter: drop-shadow(0 4px 8px rgba(0, 161, 255, 0.3));
}

.grid-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.grid-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.grid-ext {
    font-size: 10px;
    font-weight: 700;
    color: #999;
    background: #eee;
    padding: 1px 4px;
    border-radius: 4px;
}

.item-name {
    font-size: 13px;
    color: #333;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
}

.item-size {
    font-size: 11px;
    color: #999;
}

/* List View Overrides */
.file-upload-input {
    display: none;
}

.file-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.file-name-text {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-name-link {
    max-width: calc(100% - 48px);
    padding: 0;
    justify-content: flex-start;
}

.file-thumbnail {
    width: 36px;
    height: 36px;
    display: block;
    flex: none;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
    vertical-align: middle;
}

.file-thumbnail-placeholder {
    width: 36px;
    height: 36px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    position: relative;
    border: 1px solid var(--el-border-color-lighter);

    .file-ext {
        position: absolute;
        bottom: 2px;
        font-size: 9px;
        font-weight: bold;
        color: var(--el-color-primary);
        background: rgba(255, 255, 255, 0.9);
        padding: 0 2px;
        border-radius: 2px;
        line-height: 1;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

/* 详情抽屉样式 */
.detail-container {
    padding: 0 24px 24px;
}

.file-detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 8px;
}

.detail-thumbnail {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--el-border-color-lighter);
}

.detail-icon-placeholder {
    width: 64px;
    height: 64px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid var(--el-border-color-lighter);

    .detail-ext {
        font-size: 11px;
        font-weight: bold;
        color: var(--el-color-primary);
        margin-top: -2px;
    }
}

.file-name {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    word-break: break-all;
    line-height: 1.4;
}

.file-meta-badges {
    display: flex;
    gap: 8px;
}

.detail-section {
    margin-bottom: 24px;

    &:last-child {
        margin-bottom: 0;
    }
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .section-icon {
        color: var(--el-color-primary);
        opacity: 0.8;
    }
}

.count-tag {
    font-weight: bold;
}

.modern-descriptions {
    :deep(.el-descriptions__label) {
        width: 100px;
        background-color: var(--el-fill-color-lighter);
        font-weight: 500;
    }
}

.detail-link {
    font-size: 12px;
    word-break: break-all;
    line-height: 1.5;
}

.detail-code {
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 12px;
    color: var(--el-color-info-dark-2);
}

.modern-table {
    border-radius: 4px;
    overflow: hidden;

    :deep(.el-table__header) th {
        background-color: var(--el-fill-color-lighter) !important;
        font-weight: 600;
    }
}

.field-label {
    color: var(--el-color-primary);
    font-family: monospace;
    font-weight: 500;
}

.field-remark {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-left: 4px;
}
</style>
