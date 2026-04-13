<script setup lang="ts">
    import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
    import { useWorkspaceStore } from '@/stores/workspace';
    import { useGitStore } from '@/stores/git';
    import EditorTab from '@/components/editor/EditorTab.vue';
    import CodeEditor from '@/components/editor/CodeEditor.vue';
    import DiffViewer from '@/components/editor/DiffViewer.vue';
    import WelcomeScreen from '@/components/editor/WelcomeScreen.vue';
    import MarkdownPreview from '@/components/editor/MarkdownPreview.vue';
    import { EditorGroup } from '@/interfaces/editor_group';

    const props = defineProps<{
        group: EditorGroup;
        isPreviewPane?: boolean;
        previewContent?: string;
    }>();

    const emit = defineEmits<{
        split: [payload: { direction: 'left' | 'right', fileId: string, sourceGroupId: string }];
        'toggle-preview': [fileId: string];
        'editor-scroll': [scrollPercent: number];
    }>();

    function handleEditorScroll(percent: number) {
        emit('editor-scroll', percent);
    }

    async function handleDiffAcceptAll() {
        if (!activeFile.value) return;
        const relativePath = activeFile.value.path.replace(workspaceStore.workspacePath + '/', '');
        await gitStore.stageFile(relativePath);
    }

    async function handleDiffRejectAll() {
        if (!activeFile.value) return;
        const relativePath = activeFile.value.path.replace(workspaceStore.workspacePath + '/', '');
        const change = gitStore.changes.find(c => c.path === relativePath);
        if (change?.status === 'untracked') {
            await gitStore.deleteFile(relativePath);
        } else {
            await gitStore.discardChanges(relativePath);
        }
    }

    async function openDiffForChange(changePath: string, diffMode: 'staged' | 'unstaged') {
        const fullPath = `${workspaceStore.workspacePath}/${changePath}`;
        const name = changePath.split('/').pop() || '';
        const changeList = diffMode === 'staged' ? gitStore.stagedChanges : gitStore.changes;
        const change = changeList.find(c => c.path === changePath);

        let originalContent = '';
        let modifiedContent = '';

        if (diffMode === 'staged') {
            originalContent = await gitStore.getHeadContent(changePath);
            modifiedContent = await gitStore.getStagedContent(changePath);
        } else {
            if (change?.status !== 'untracked') {
                originalContent = await gitStore.getHeadContent(changePath);
            }
            const { invoke } = await import('@tauri-apps/api/core');
            modifiedContent = await invoke<string>('read_file', { path: fullPath });
        }

        workspaceStore.openFile({
            name,
            path: fullPath,
            content: modifiedContent,
            isDiff: true,
            originalContent,
            diffLabel: diffMode === 'staged' ? 'Index' : 'HEAD',
            diffMode: diffMode,
        });
    }

    async function handleDiffPrevFile() {
        if (!activeFile.value) return;
        const diffMode = activeFile.value.diffMode || 'unstaged';
        const changesList = diffMode === 'staged' ? gitStore.stagedChanges : gitStore.changes;
        const files = changesList.map(c => c.path);
        const currentPath = activeFile.value?.path;
        if (!currentPath) return;
        const currentIdx = files.indexOf(currentPath.replace(workspaceStore.workspacePath + '/', ''));
        if (currentIdx > 0) {
            await openDiffForChange(files[currentIdx - 1], diffMode as 'staged' | 'unstaged');
        }
    }

    async function handleDiffNextFile() {
        if (!activeFile.value) return;
        const diffMode = activeFile.value.diffMode || 'unstaged';
        const changesList = diffMode === 'staged' ? gitStore.stagedChanges : gitStore.changes;
        const files = changesList.map(c => c.path);
        const currentPath = activeFile.value?.path;
        if (!currentPath) return;
        const currentIdx = files.indexOf(currentPath.replace(workspaceStore.workspacePath + '/', ''));
        if (currentIdx < files.length - 1) {
            await openDiffForChange(files[currentIdx + 1], diffMode as 'staged' | 'unstaged');
        }
    }

    async function handleDiffUnstageFile() {
        if (!activeFile.value) return;
        const relativePath = activeFile.value.path.replace(workspaceStore.workspacePath + '/', '');
        await gitStore.unstageFile(relativePath);
    }


    const workspaceStore = useWorkspaceStore();
    const gitStore = useGitStore();
    const draggedIndex = ref<number | null>(null);
    const dropZone = ref<'left' | 'right' | null>(null);
    const editorGroupRef = ref<HTMLElement | null>(null);
    const tabsWrapperRef = ref<HTMLElement | null>(null);

    const canScrollLeft = ref(false);
    const canScrollRight = ref(false);

    const activeFileId = computed(() => props.group.activeFileId);
    const activeFile = computed(() => {
        return props.group.files.find(f => f.id === activeFileId.value);
    });

    const activeFileExtension = computed(() => {
        if (!activeFile.value) return null;
        const name = activeFile.value.name;
        const dotIndex = name.lastIndexOf('.');
        return dotIndex > 0 ? name.substring(dotIndex).toLowerCase() : null;
    });

    const isMarkdownFile = computed(() => {
        return activeFileExtension.value === '.md' || activeFileExtension.value === '.markdown';
    });

    const isDiffFile = computed(() => {
        return activeFile.value?.isDiff === true;
    });

    const hasContextAction = computed(() => {
        return isMarkdownFile.value;
    });

    function handleContextAction() {
        if (isMarkdownFile.value && activeFile.value) {
            emit('toggle-preview', activeFile.value.id);
        }
    }

    function checkOverflow() {
        if (!tabsWrapperRef.value) return;
        const el = tabsWrapperRef.value;
        canScrollLeft.value = el.scrollLeft > 0;
        canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    }

    function scrollTabs(direction: 'left' | 'right') {
        if (!tabsWrapperRef.value) return;
        const scrollAmount = 150;
        tabsWrapperRef.value.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }

    function goToPreviousTab() {
        const files = props.group.files;
        if (files.length <= 1) return;
        const currentIndex = files.findIndex(f => f.id === activeFileId.value);
        const prevIndex = currentIndex <= 0 ? files.length - 1 : currentIndex - 1;
        workspaceStore.setActiveFile(files[prevIndex].id);
    }

    function goToNextTab() {
        const files = props.group.files;
        if (files.length <= 1) return;
        const currentIndex = files.findIndex(f => f.id === activeFileId.value);
        const nextIndex = currentIndex >= files.length - 1 ? 0 : currentIndex + 1;
        workspaceStore.setActiveFile(files[nextIndex].id);
    }

    watch(() => props.group.files, () => {
        nextTick(checkOverflow);
    }, { deep: true });

    onMounted(() => {
        checkOverflow();
        tabsWrapperRef.value?.addEventListener('scroll', checkOverflow);
        window.addEventListener('resize', checkOverflow);
    });

    onUnmounted(() => {
        tabsWrapperRef.value?.removeEventListener('scroll', checkOverflow);
        window.removeEventListener('resize', checkOverflow);
    });

    function selectTab(id: string) {
        workspaceStore.setActiveFile(id);
    }

    function closeTab(id: string) {
        workspaceStore.closeFile(id);
    }

    function handleDragStart(e: DragEvent, index: number) {
        draggedIndex.value = index;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify({
                fileId: props.group.files[index].id,
                sourceGroupId: props.group.id
            }));
        }
    }

    function handleTabDrop(targetIndex: number) {
        if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
            workspaceStore.reorderFile(props.group.id, draggedIndex.value, targetIndex);
        }
        draggedIndex.value = null;
    }

    function onDragOver(e: DragEvent) {
        e.preventDefault();
        if (!editorGroupRef.value) return;

        const target = e.target as HTMLElement;
        if (target.closest('.tabs-container')) {
            dropZone.value = null;
            return;
        }

        const rect = editorGroupRef.value.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const threshold = width * 0.3;

        if (x < threshold) {
            dropZone.value = 'left';
        } else if (x > width - threshold) {
            dropZone.value = 'right';
        } else {
            dropZone.value = null;
        }
    }

    function onDragLeave(e: DragEvent) {
        if (e.relatedTarget && editorGroupRef.value?.contains(e.relatedTarget as Node)) {
            return;
        }
        dropZone.value = null;
    }

    function onDrop(e: DragEvent) {
        const zone = dropZone.value;
        dropZone.value = null;

        if (!zone) return;

        const target = e.target as HTMLElement;
        if (target.closest('.tab')) {
            return;
        }

        if (e.dataTransfer) {
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data.fileId && data.sourceGroupId) {
                    emit('split', { direction: zone, fileId: data.fileId, sourceGroupId: data.sourceGroupId });
                }
            } catch (err) {
                console.error('Failed to parse drag data', err);
            }
        }
    }
</script>

<template>
    <div class="editor-group"
        :class="{ 'active-group': workspaceStore.activeGroupId === group.id, 'preview-pane': isPreviewPane }"
        @click="workspaceStore.activeGroupId = group.id" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
        ref="editorGroupRef">
        <div class="drop-indicator left" v-if="dropZone === 'left'"></div>
        <div class="drop-indicator right" v-if="dropZone === 'right'"></div>

        <div class="tabs-container" v-if="group.files.length > 0 && !isPreviewPane">
            <div class="tabs-wrapper" ref="tabsWrapperRef">
                <EditorTab v-for="(tab, index) in group.files" :key="tab.id" :file="tab"
                    :active="tab.id === activeFileId" @select="selectTab(tab.id)" @close="closeTab(tab.id)"
                    @dragStart="handleDragStart($event, index)" @drop="handleTabDrop(index)" />
            </div>

            <div class="tabs-actions">
                <button v-if="hasContextAction" class="tab-action-btn context-action" @click="handleContextAction"
                    :title="isMarkdownFile ? 'Preview Markdown' : ''">
                    <svg v-if="isMarkdownFile" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <div v-if="hasContextAction" class="tabs-actions-separator"></div>
                <button class="tab-action-btn" @click="scrollTabs('left')" :disabled="!canScrollLeft"
                    title="Scroll para esquerda">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="tab-action-btn" @click="scrollTabs('right')" :disabled="!canScrollRight"
                    title="Scroll para direita">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div class="tabs-actions-separator"></div>
                <button class="tab-action-btn" @click="goToPreviousTab" :disabled="group.files.length <= 1"
                    title="Aba anterior">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="11 17 6 12 11 7"></polyline>
                        <line x1="6" y1="12" x2="18" y2="12"></line>
                    </svg>
                </button>
                <button class="tab-action-btn" @click="goToNextTab" :disabled="group.files.length <= 1"
                    title="Próxima aba">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <line x1="6" y1="12" x2="18" y2="12"></line>
                    </svg>
                </button>
            </div>
        </div>

        <div class="editor-content">
            <MarkdownPreview v-if="isPreviewPane && previewContent" :content="previewContent" />
            <div v-else-if="group.files.length === 0" class="empty-group">
                <span v-if="workspaceStore.groups.length > 1">Grupo Vazio</span>
                <WelcomeScreen v-else />
            </div>
            <DiffViewer v-else-if="isDiffFile && activeFile" :filePath="activeFile.path"
                :originalContent="activeFile.originalContent || ''" :modifiedContent="activeFile.content || ''"
                :originalLabel="activeFile.diffLabel || 'Original'" :modifiedLabel="'Trabalho Atual'"
                :changeIndex="(activeFile.diffMode === 'staged' ? gitStore.stagedChanges : gitStore.changes).findIndex(c => activeFile?.path?.includes(c.path) ?? -1)"
                :totalChanges="(activeFile.diffMode === 'staged' ? gitStore.stagedChanges : gitStore.changes).length"
                :diffMode="activeFile.diffMode"
                @accept-file="handleDiffAcceptAll"
                @discard-file="handleDiffRejectAll"
                @unstage-file="handleDiffUnstageFile"
                @previous-file="handleDiffPrevFile"
                @next-file="handleDiffNextFile" />
            <CodeEditor v-else-if="activeFile" :file="activeFile" @scroll="handleEditorScroll" />
        </div>
    </div>
</template>

<style scoped>
    .editor-group {
        display: flex;
        flex-direction: column;
        flex: 1;
        background: var(--bg-primary);
        overflow: hidden;
        border-right: 1px solid var(--border-subtle);
        min-width: 0;
        /* Important for flex children */
    }

    .editor-group:last-child {
        border-right: none;
    }

    .editor-group.active-group .tabs-container {
        background: var(--bg-secondary);
    }

    .tabs-container {
        display: flex;
        align-items: center;
        height: fit-content;
        background: var(--bg-tertiary);
        border-bottom: thin solid var(--editor-bg);
    }

    .tabs-wrapper {
        display: flex;
        align-items: center;
        flex: 1;
        overflow-x: auto;
        min-width: 0;
    }

    .tabs-wrapper::-webkit-scrollbar {
        height: 3px;
    }

    .tabs-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 0 var(--space-xs);
        border-left: 1px solid var(--border-subtle);
        height: 100%;
        flex-shrink: 0;
    }

    .tabs-actions-separator {
        width: 1px;
        height: 16px;
        background: var(--border-subtle);
        margin: 0 4px;
    }

    .tab-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .tab-action-btn:hover:not(:disabled) {
        background: var(--bg-hover);
        color: var(--text-primary);
    }

    .tab-action-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .tab-action-btn.context-action {
        color: var(--accent-primary);
    }

    .tab-action-btn.context-action:hover {
        background: var(--success-muted);
        color: var(--accent-primary);
    }

    .editor-content {
        flex: 1;
        overflow: hidden;
        position: relative;
    }

    .empty-group {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted);
    }

    .editor-group {
        position: relative;
    }

    .drop-indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 50%;
        pointer-events: none;
        background: rgba(34, 197, 94, 0.1);
        z-index: 10;
    }

    .drop-indicator.left {
        left: 0;
        border-right: 2px solid var(--accent-primary);
    }

    .drop-indicator.right {
        right: 0;
        border-left: 2px solid var(--accent-primary);
    }
</style>
