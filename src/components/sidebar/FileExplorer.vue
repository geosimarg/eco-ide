<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore, type FileEntry } from '@/stores/workspace';
import { useConfigStore } from '@/stores/config';
import { useI18nStore } from '@/stores/i18n';
import { logger } from '@/utils/logger';
import NewFileModal from '@/components/modals/NewFileModal.vue';

const workspaceStore = useWorkspaceStore();
const configStore = useConfigStore();
const i18n = useI18nStore();

const files = computed(() => workspaceStore.files);
const workspaceName = computed(() => workspaceStore.workspaceName);

// Estado do modal de novo arquivo
const showNewFileModal = ref(false);
const newFileParentPath = ref('');

const newFileParentPathRelative = computed(() => {
  if (!workspaceStore.workspacePath || !newFileParentPath.value) return '';
  if (newFileParentPath.value === workspaceStore.workspacePath) return './';
  if (newFileParentPath.value.startsWith(workspaceStore.workspacePath)) {
    let rel = newFileParentPath.value.slice(workspaceStore.workspacePath.length);
    // Remove barras iniciais
    rel = rel.replace(/^[/\\]+/, '');
    return rel || './';
  }
  return newFileParentPath.value;
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

async function loadFiles(path: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const entries = await invoke<FileEntry[]>('list_directory', { path });
    workspaceStore.setFiles(entries);
  } catch (error) {
    logger.error('Erro ao listar diretório:', error);
  }
}

async function handleFileClick(entry: FileEntry) {
  if (entry.isDirectory) {
    workspaceStore.toggleDirectory(entry.path);
    // TODO: carregar filhos se necessário
  } else {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const content = await invoke<string>('read_file', { path: entry.path });
      workspaceStore.openFile({
        name: entry.name,
        path: entry.path,
        content,
      });
    } catch (error) {
      logger.error('Erro ao abrir arquivo:', error);
    }
  }
}

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) {
    return entry.expanded ? '📂' : '📁';
  }
  const ext = entry.name.split('.').pop() || '';
  const icons: Record<string, string> = {
    ts: '🟦',
    js: '🟨',
    vue: '💚',
    rs: '🦀',
    py: '🐍',
    json: '📋',
    md: '📝',
    css: '🎨',
    html: '🌐',
    toml: '⚙️',
  };
  return icons[ext] || '📄';
}

function handleCreateFile(parentPath: string) {
  newFileParentPath.value = parentPath;
  showNewFileModal.value = true;
}

async function handleModalCreate(fileName: string) {
  showNewFileModal.value = false;
  const parentPath = newFileParentPath.value;

  const separator = navigator.userAgent.includes('Windows') ? '\\' : '/';
  const fullPath = parentPath.endsWith(separator)
    ? `${parentPath}${fileName}`
    : `${parentPath}${separator}${fileName}`;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('create_file', { path: fullPath });

    const newEntry: FileEntry = {
      name: fileName,
      path: fullPath,
      isDirectory: false,
      children: undefined,
      expanded: undefined
    };

    if (parentPath === workspaceStore.workspacePath) {
      workspaceStore.files.push(newEntry);
      sortFiles(workspaceStore.files);
    } else {
      const parent = findEntry(workspaceStore.files, parentPath);
      if (parent && parent.children) {
        parent.children.push(newEntry);
        sortFiles(parent.children);
        parent.expanded = true;
      }
    }

    workspaceStore.openFile({
      name: fileName,
      path: fullPath,
      content: ''
    });

  } catch (e) {
    logger.error('Erro ao criar arquivo:', e);
    alert('Erro ao criar arquivo: ' + e);
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
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });
}
</script>

<template>
  <div class="file-explorer">
    <!-- Estado vazio -->
    <div v-if="!workspaceStore.workspacePath" class="empty-state">
      <p>{{ i18n.t('workspace.no_folder') }}</p>
      <button class="open-btn" @click="openFolder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" />
        </svg>
        <span>{{ i18n.t('explorer.open_folder') }}</span>
      </button>
    </div>

    <!-- Árvore de arquivos -->
    <div v-else class="file-tree">
      <div class="tree-header" id="tree-header">
        <span class="tree-title">{{ workspaceName }}</span>
        <button class="icon-btn" @click="handleCreateFile(workspaceStore.workspacePath!)"
          :title="i18n.t('explorer.new_file')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </button>
      </div>

      <div class="tree-content">
        <template v-for="entry in files" :key="entry.path">
          <div class="tree-item" :class="{ directory: entry.isDirectory }" @click="handleFileClick(entry)">
            <span class="item-icon">{{ getFileIcon(entry) }}</span>
            <span class="item-name">{{ entry.name }}</span>

            <button v-if="entry.isDirectory" class="item-action-btn" @click.stop="handleCreateFile(entry.path)"
              :title="i18n.t('explorer.new_file')">
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
              :class="{ directory: child.isDirectory }" @click="handleFileClick(child)">
              <span class="item-icon">{{ getFileIcon(child) }}</span>
              <span class="item-name">{{ child.name }}</span>

              <button v-if="child.isDirectory" class="item-action-btn" @click.stop="handleCreateFile(child.path)"
                :title="i18n.t('explorer.new_file')">
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

    <NewFileModal :visible="showNewFileModal" :parent-path="newFileParentPathRelative" @create="handleModalCreate"
      @cancel="showNewFileModal = false" />
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
</style>
