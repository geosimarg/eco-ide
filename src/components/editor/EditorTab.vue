<script setup lang="ts">
import { ref, computed } from 'vue';
import { type OpenFile, useWorkspaceStore } from '@/stores/workspace';
import { useI18nStore } from '@/stores/i18n';
import FileIcon from '@/components/common/FileIcon.vue';
import ContextMenu, { type ContextMenuItem } from '@/components/common/ContextMenu.vue';

const props = defineProps<{
  file: OpenFile;
  active: boolean;
}>();

const emit = defineEmits<{
  select: [];
  close: [];
  dragStart: [e: DragEvent];
  drop: [e: DragEvent];
}>();

const workspaceStore = useWorkspaceStore();
const i18n = useI18nStore();
const isDragOver = ref(false);
const contextMenu = ref({ visible: false, x: 0, y: 0 });

const isFileModified = computed(() => props.file.modified);

const hasMultipleTabs = computed(() => workspaceStore.openFiles.length > 1);

const tabContextMenuItems = computed<ContextMenuItem[]>(() => [
  { id: 'save', label: i18n.t('context.save'), shortcut: 'Ctrl+S', disabled: !isFileModified.value },
  { id: 'divider1', label: '', divider: true },
  { id: 'close', label: i18n.t('context.close'), shortcut: 'Ctrl+W' },
  { id: 'close_others', label: i18n.t('context.close_others'), disabled: !hasMultipleTabs.value },
  { id: 'close_saved', label: i18n.t('context.close_saved'), disabled: !hasMultipleTabs.value },
  { id: 'divider2', label: '', divider: true },
  { id: 'pin', label: i18n.t('context.pin') },
  { id: 'copy_path', label: i18n.t('context.copy_path') },
  { id: 'divider3', label: '', divider: true },
  { id: 'split_right', label: i18n.t('context.split_right') },
  { id: 'split_down', label: i18n.t('context.split_down') },
]);

async function handleClose(e: MouseEvent) {
  e.stopPropagation();
  await workspaceStore.closeFileWithConfirmation(props.file.id);
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY
  };
}

async function handleContextMenuSelect(id: string) {
  try {
    switch (id) {
      case 'save':
        if (props.file.path) {
          await workspaceStore.saveFile(props.file.id, props.file.path);
        }
        break;
      case 'close':
        await workspaceStore.closeFileWithConfirmation(props.file.id);
        break;
      case 'close_others':
        workspaceStore.closeOtherFiles(props.file.id);
        break;
      case 'close_saved':
        workspaceStore.closeSavedFiles();
        break;
      case 'pin':
        workspaceStore.toggleFilePinned(props.file.id);
        break;
      case 'copy_path':
        await navigator.clipboard.writeText(props.file.path);
        break;
      case 'split_right':
        workspaceStore.splitEditor('vertical');
        break;
      case 'split_down':
        workspaceStore.splitEditor('horizontal');
        break;
    }
  } catch (e) {
    console.error('[ContextMenu] Error:', e);
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  emit('drop', e);
}
</script>

<template>
  <div class="tab" :class="{ active, 'drag-over': isDragOver, pinned: file.pinned }" draggable="true" @click="emit('select')"
    @dragstart="emit('dragStart', $event)" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
    @contextmenu="handleContextMenu">
    <FileIcon :name="props.file.name" class="tab-icon" />
    <span class="tab-name no-select">{{ file.name }}</span>
    <span v-if="file.modified" class="modified-dot" title="Não salvo"></span>
    <button class="close-btn" @click="handleClose" title="Fechar">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.2" />
        <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.2" />
      </svg>
    </button>
  </div>
  <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="tabContextMenuItems"
    @select="handleContextMenuSelect" @close="contextMenu.visible = false" />
</template>

<style scoped>
.tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 5px var(--space-md);
  height: 100%;
  min-width: 80px;
  max-width: 180px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: none;
}

.tab:hover {
  background: var(--bg-hover);
}

.tab.active {
  background: var(--editor-bg);
  border-top: 1px solid var(--accent-primary);
}

.tab.drag-over {
  background: var(--bg-hover);
  border-bottom: 2px solid var(--accent-primary);
  opacity: 0.8;
}

.tab-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  flex-shrink: 0;
  pointer-events: none;
}

.tab-name {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}

.tab.active .tab-name {
  color: var(--text-primary);
}

.modified-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.tab:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.tab.pinned {
  background: var(--bg-tertiary);
}

.tab.pinned .tab-name {
  font-style: italic;
  color: var(--text-muted);
}
</style>
