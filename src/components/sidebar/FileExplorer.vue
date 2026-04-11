<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useWorkspaceStore, type FileEntry } from '@/stores/workspace';
import { useConfigStore } from '@/stores/config';
import { useI18nStore } from '@/stores/i18n';
import { useUIStore } from '@/stores/ui';
import { logger } from '@/utils/logger';
import NewFileModal from '@/components/modals/NewFileModal.vue';
import NewFolderModal from '@/components/modals/NewFolderModal.vue';
import FileIcon from '@/components/common/FileIcon.vue';
import ContextMenu, { type ContextMenuItem } from '@/components/common/ContextMenu.vue';

const workspaceStore = useWorkspaceStore();
const configStore = useConfigStore();
const i18n = useI18nStore();
const uiStore = useUIStore();

const files = computed(() => {
  return filterEntries(workspaceStore.files);
});

function filterEntries(entries: FileEntry[]): FileEntry[] {
  return entries.filter(entry => {
    if (entry.isDirectory) {
      return !configStore.shouldHideFolder(entry.name);
    } else {
      return !configStore.shouldHideFile(entry.name);
    }
  }).map(entry => {
    if (entry.isDirectory && entry.children) {
      return {
        ...entry,
        children: filterEntries(entry.children)
      };
    }
    return entry;
  });
}

const workspaceName = computed(() => workspaceStore.workspaceName);

const showNewFileModal = ref(false);
const newFileParentPath = ref('');
const showNewFolderModal = ref(false);
const newFolderParentPath = ref('');

const contextMenu = ref({ visible: false, x: 0, y: 0 });
const contextMenuEntry = ref<FileEntry | null>(null);

const clipboard = ref<{ entry: FileEntry; action: 'copy' | 'cut' } | null>(null);

const renamingEntry = ref<FileEntry | null>(null);
const renameInputValue = ref('');

const newFileParentPathRelative = computed(() => {
  if (!workspaceStore.workspacePath || !newFileParentPath.value) return '';
  if (newFileParentPath.value === workspaceStore.workspacePath) return './';
  if (newFileParentPath.value.startsWith(workspaceStore.workspacePath)) {
    let rel = newFileParentPath.value.slice(workspaceStore.workspacePath.length);
    rel = rel.replace(/^[/\\]+/, '');
    return rel || './';
  }
  return newFileParentPath.value;
});

const newFolderParentPathRelative = computed(() => {
  if (!workspaceStore.workspacePath || !newFolderParentPath.value) return '';
  if (newFolderParentPath.value === workspaceStore.workspacePath) return './';
  if (newFolderParentPath.value.startsWith(workspaceStore.workspacePath)) {
    let rel = newFolderParentPath.value.slice(workspaceStore.workspacePath.length);
    rel = rel.replace(/^[/\\]+/, '');
    return rel || './';
  }
  return newFolderParentPath.value;
});

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const entry = contextMenuEntry.value;
  const items: ContextMenuItem[] = [];

  // Build menu based on whether there's a selected entry
  if (!entry) {
    // Background menu (no selection)
    items.push({ id: 'new_file_bg', label: i18n.t('context.new_file'), shortcut: 'Ctrl+N' });
    items.push({ id: 'new_folder_bg', label: i18n.t('context.new_folder'), shortcut: 'Ctrl+Shift+N' });
    return items;
  }

  // Group: Arquivo (New submenu for directories)
  if (entry.isDirectory) {
    items.push({
      id: 'novo',
      label: i18n.t('context.novo'),
      children: [
        { id: 'new_file', label: i18n.t('context.new_file'), shortcut: 'Ctrl+N' },
        { id: 'new_folder', label: i18n.t('context.new_folder'), shortcut: 'Ctrl+Shift+N' }
      ]
    });
  } else {
    items.push({ id: 'new_file', label: i18n.t('context.new_file'), shortcut: 'Ctrl+N' });
    items.push({ id: 'new_folder', label: i18n.t('context.new_folder'), shortcut: 'Ctrl+Shift+N' });
  }

  // Divider
  items.push({ id: 'divider1', label: '', divider: true });

  // Group: Editar
  items.push({
    id: 'editar',
    label: i18n.t('context.editar'),
    children: [
      { id: 'copy', label: i18n.t('context.copy'), shortcut: 'Ctrl+C' },
      { id: 'cut', label: i18n.t('context.cut'), shortcut: 'Ctrl+X' }
    ]
  });

  if (clipboard.value) {
    items.push({ id: 'paste', label: i18n.t('context.paste'), shortcut: 'Ctrl+V' });
  }

  // Divider
  items.push({ id: 'divider2', label: '', divider: true });

  // Group: Ações
  items.push({
    id: 'acoes',
    label: i18n.t('context.acoes'),
    children: [
      { id: 'rename', label: i18n.t('context.rename'), shortcut: 'F2' },
      { id: 'compare', label: i18n.t('diff.compare_with_active'), shortcut: 'Ctrl+Shift+D' },
      { id: 'divider_diff', label: '', divider: true },
      { id: 'delete', label: i18n.t('context.delete'), shortcut: 'Del' }
    ]
  });

  return items;
});

async function openFolder() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: i18n.t('explorer.open_folder'),
    });
    if (selected && typeof selected === 'string') {
      await workspaceStore.openFolder(selected);
      await configStore.loadConfig(selected);
    }
  } catch (error) {
    logger.error('Erro ao abrir pasta:', error);
  }
}

async function handleFileClick(entry: FileEntry) {
  if (renamingEntry.value) return;

  if (entry.isDirectory) {
    workspaceStore.toggleDirectory(entry.path);
  } else {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const content = await invoke<string>('read_file', { path: entry.path });
      workspaceStore.openFile({ name: entry.name, path: entry.path, content });
    } catch (error) {
      logger.error('Erro ao abrir arquivo:', error);
    }
  }
}

async function handleContextMenu(e: MouseEvent, entry: FileEntry) {
  e.preventDefault();
  e.stopPropagation();
  logger.info('Opening context menu for:', entry.path);

  if (contextMenu.value.visible) {
    contextMenu.value.visible = false;
    await nextTick();
  }

  contextMenuEntry.value = entry;
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY };
}

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuEntry.value = null;
}

async function handleContextAction(actionId: string) {
  const entry = contextMenuEntry.value;
  if (!entry) return;

  switch (actionId) {
    case 'new_file':
      handleCreateFile(entry.path);
      break;
    case 'new_folder':
      handleCreateFolder(entry.path);
      break;
    case 'copy':
      clipboard.value = { entry, action: 'copy' };
      break;
    case 'cut':
      clipboard.value = { entry, action: 'cut' };
      break;
    case 'paste':
      await handlePaste(entry.path);
      break;
    case 'rename':
      startRename(entry);
      break;
    case 'delete':
      await handleDelete(entry);
      break;
    case 'compare':
      await handleCompareWithActiveFile(entry);
      break;
  }
}

async function handleCompareWithActiveFile(entry: FileEntry) {
  const activeFile = workspaceStore.activeFile;
  if (!activeFile) {
    alert(i18n.t('diff.no_active_file'));
    return;
  }
  
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const originalContent = await invoke<string>('read_file', { path: entry.path });
    
    uiStore.openDiffViewer(
      activeFile.content,
      originalContent,
      activeFile.name,
      entry.name
    );
  } catch (e) {
    logger.error('Erro ao comparar arquivos:', e);
    alert('Erro ao comparar arquivos: ' + e);
  }
}

function startRename(entry: FileEntry) {
  renamingEntry.value = entry;
  renameInputValue.value = entry.name;
}

async function finishRename() {
  if (!renamingEntry.value || !renameInputValue.value.trim()) {
    renamingEntry.value = null;
    return;
  }

  const oldPath = renamingEntry.value.path;
  const separator = navigator.userAgent.includes('Windows') ? '\\' : '/';
  const parentPath = oldPath.substring(0, oldPath.lastIndexOf(separator));
  const newPath = `${parentPath}${separator}${renameInputValue.value.trim()}`;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('rename_path', { oldPath, newPath });

    renamingEntry.value.name = renameInputValue.value.trim();
    renamingEntry.value.path = newPath;

    workspaceStore.updateFilePath(oldPath, newPath, renameInputValue.value.trim());
  } catch (e) {
    logger.error('Erro ao renomear:', e);
    alert('Erro ao renomear: ' + e);
  }

  renamingEntry.value = null;
}

async function handlePaste(targetPath: string) {
  if (!clipboard.value) return;

  const { entry, action } = clipboard.value;
  const separator = navigator.userAgent.includes('Windows') ? '\\' : '/';
  const destPath = `${targetPath}${separator}${entry.name}`;

  try {
    const { invoke } = await import('@tauri-apps/api/core');

    if (action === 'copy') {
      await invoke('copy_path', { source: entry.path, destination: destPath });
    } else {
      await invoke('rename_path', { oldPath: entry.path, newPath: destPath });
      removeEntryFromTree(entry.path);
      clipboard.value = null;
    }

    const newEntry: FileEntry = {
      ...entry,
      path: destPath,
    };

    addEntryToTree(targetPath, newEntry);

  } catch (e) {
    logger.error('Erro ao colar:', e);
    alert('Erro ao colar: ' + e);
  }
}

async function handleDelete(entry: FileEntry) {
  const confirmMsg = i18n.t('context.confirm_delete').replace('{name}', entry.name);
  if (!confirm(confirmMsg)) return;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_path', { path: entry.path });
    removeEntryFromTree(entry.path);

    if (!entry.isDirectory) {
      workspaceStore.closeFileByPath(entry.path);
    }
  } catch (e) {
    logger.error('Erro ao excluir:', e);
    alert('Erro ao excluir: ' + e);
  }
}

function removeEntryFromTree(path: string) {
  function remove(entries: FileEntry[]): boolean {
    const idx = entries.findIndex(e => e.path === path);
    if (idx >= 0) {
      entries.splice(idx, 1);
      return true;
    }
    for (const e of entries) {
      if (e.children && remove(e.children)) return true;
    }
    return false;
  }
  remove(workspaceStore.files);
}

function addEntryToTree(parentPath: string, entry: FileEntry) {
  if (parentPath === workspaceStore.workspacePath) {
    workspaceStore.files.push(entry);
    sortFiles(workspaceStore.files);
  } else {
    const parent = findEntry(workspaceStore.files, parentPath);
    if (parent?.children) {
      parent.children.push(entry);
      sortFiles(parent.children);
      parent.expanded = true;
    }
  }
}

function handleCreateFolder(parentPath: string) {
  newFolderParentPath.value = parentPath;
  showNewFolderModal.value = true;
}

function handleCreateFile(parentPath: string) {
  newFileParentPath.value = parentPath;
  showNewFileModal.value = true;
}

async function handleModalCreate(fileName: string) {
  showNewFileModal.value = false;
  const parentPath = newFileParentPath.value;
  const separator = navigator.userAgent.includes('Windows') ? '\\' : '/';
  const fullPath = parentPath.endsWith(separator) ? `${parentPath}${fileName}` : `${parentPath}${separator}${fileName}`;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('create_file', { path: fullPath });

    const newEntry: FileEntry = { name: fileName, path: fullPath, isDirectory: false, children: undefined, expanded: undefined };
    addEntryToTree(parentPath, newEntry);
    workspaceStore.openFile({ name: fileName, path: fullPath, content: '' });
  } catch (e) {
    logger.error('Erro ao criar arquivo:', e);
    alert('Erro ao criar arquivo: ' + e);
  }
}

async function handleModalCreateFolder(folderName: string) {
  showNewFolderModal.value = false;
  const parentPath = newFolderParentPath.value;
  const separator = navigator.userAgent.includes('Windows') ? '\\' : '/';
  const fullPath = parentPath.endsWith(separator) ? `${parentPath}${folderName}` : `${parentPath}${separator}${folderName}`;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('create_directory', { path: fullPath });

    const newEntry: FileEntry = { name: folderName, path: fullPath, isDirectory: true, children: [], expanded: false };
    addEntryToTree(parentPath, newEntry);
  } catch (e) {
    logger.error('Erro ao criar pasta:', e);
    alert('Erro ao criar pasta: ' + e);
  }
}

function findEntry(entries: FileEntry[], path: string): FileEntry | null {
  for (const entry of entries) {
    if (entry.path === path) return entry;
    if (entry.children) {
      const found = findEntry(entry.children, path);
      if (found) return found;
    }
  }
  return null;
}

function sortFiles(entries: FileEntry[]) {
  entries.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
    return a.isDirectory ? -1 : 1;
  });
}
</script>

<template>
  <div class="file-explorer">
    <!-- Estado vazio -->
    <div v-if="!workspaceStore.workspacePath" class="empty-state">
      <p class="no-select">{{ i18n.t('workspace.no_folder') }}</p>
      <button class="open-btn" @click="openFolder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" />
        </svg>
        <span class="no-select">{{ i18n.t('explorer.open_folder') }}</span>
      </button>
    </div>

    <!-- Árvore de arquivos -->
    <div v-else class="file-tree">
      <div class="tree-header" id="tree-header">
        <span class="tree-title no-select">{{ workspaceName }}</span>
        <div class="tree-header-actions">
          <button class="icon-btn" @click="handleCreateFolder(workspaceStore.workspacePath!)"
            :title="i18n.t('explorer.new_folder')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </button>
          <button class="icon-btn no-select" @click="handleCreateFile(workspaceStore.workspacePath!)"
            :title="i18n.t('explorer.new_file')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      <div class="tree-content">
        <template v-for="entry in files" :key="entry.path">
          <div class="tree-item" :class="{ directory: entry.isDirectory, renaming: renamingEntry?.path === entry.path }"
            @click="handleFileClick(entry)" @contextmenu="handleContextMenu($event, entry)">
            <FileIcon :name="entry.name" :is-directory="entry.isDirectory" :expanded="entry.expanded"
              class="item-icon" />
            <input v-if="renamingEntry?.path === entry.path" v-model="renameInputValue" class="rename-input"
              @blur="finishRename" @keyup.enter="finishRename" @keyup.escape="renamingEntry = null" @click.stop
              autofocus />
            <span v-else class="item-name no-select">{{ entry.name }}</span>
            <button v-if="entry.isDirectory && !renamingEntry" class="item-action-btn no-select"
              @click.stop="handleCreateFile(entry.path)" :title="i18n.t('explorer.new_file')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </button>
          </div>

          <!-- Filhos expandidos -->
          <template v-if="entry.isDirectory && entry.expanded && entry.children">
            <div v-for="child in entry.children" :key="child.path" class="tree-item nested"
              :class="{ directory: child.isDirectory, renaming: renamingEntry?.path === child.path }"
              @click="handleFileClick(child)" @contextmenu="handleContextMenu($event, child)">
              <FileIcon :name="child.name" :is-directory="child.isDirectory" :expanded="child.expanded"
                class="item-icon" />
              <input v-if="renamingEntry?.path === child.path" v-model="renameInputValue" class="rename-input"
                @blur="finishRename" @keyup.enter="finishRename" @keyup.escape="renamingEntry = null" @click.stop
                autofocus />
              <span v-else class="item-name no-select">{{ child.name }}</span>
              <button v-if="child.isDirectory && !renamingEntry" class="item-action-btn no-select"
                @click.stop="handleCreateFile(child.path)" :title="i18n.t('explorer.new_file')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>

    <NewFolderModal :visible="showNewFolderModal" :parent-path="newFolderParentPathRelative"
      @create="handleModalCreateFolder" @cancel="showNewFolderModal = false" />
    <NewFileModal :visible="showNewFileModal" :parent-path="newFileParentPathRelative" @create="handleModalCreate"
      @cancel="showNewFileModal = false" />

    <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems"
      @select="handleContextAction" @close="closeContextMenu" />
  </div>
</template>

<style scoped>
.file-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  color: var(--text-secondary);
  text-align: center;
}

.empty-state p {
  font-size: var(--font-size-sm);
}

.open-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-hover);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.open-btn:hover {
  background: var(--bg-active);
  border-color: var(--accent-primary);
}

.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}

.tree-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tree-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xs) 0;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.tree-item:hover {
  background: var(--bg-hover);
}

.tree-item.nested {
  padding-left: calc(var(--space-md) + 16px);
}

.item-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.item-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.directory .item-name {
  font-weight: 500;
}

.item-action-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0 4px;
  margin-left: auto;
}

.tree-item:hover .item-action-btn {
  display: flex;
  align-items: center;
}

.item-action-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.rename-input {
  flex: 1;
  background: var(--bg-elevated);
  border: 1px solid var(--accent-primary);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  padding: 2px 4px;
  outline: none;
}

.tree-item.renaming {
  background: var(--bg-hover);
}
</style>
