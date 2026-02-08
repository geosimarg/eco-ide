<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore, type FileEntry } from '@/stores/workspace';
import { useConfigStore } from '@/stores/config';
import { logger } from '@/utils/logger';

const workspaceStore = useWorkspaceStore();
const configStore = useConfigStore();

const files = computed(() => workspaceStore.files);
const workspaceName = computed(() => workspaceStore.workspaceName);

async function openFolder() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Selecionar pasta do projeto',
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
</script>

<template>
  <div class="file-explorer">
    <!-- Estado vazio -->
    <div v-if="!workspaceStore.workspacePath" class="empty-state">
      <p>Nenhuma pasta aberta</p>
      <button class="open-btn" @click="openFolder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" />
        </svg>
        <span>Abrir Pasta</span>
      </button>
    </div>

    <!-- Árvore de arquivos -->
    <div v-else class="file-tree">
      <div class="tree-header">
        <span class="tree-title">{{ workspaceName }}</span>
        <button class="icon-btn" @click="openFolder" title="Abrir outra pasta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div class="tree-content">
        <template v-for="entry in files" :key="entry.path">
          <div
            class="tree-item"
            :class="{ directory: entry.isDirectory }"
            @click="handleFileClick(entry)"
          >
            <span class="item-icon">{{ getFileIcon(entry) }}</span>
            <span class="item-name">{{ entry.name }}</span>
          </div>
          
          <!-- Filhos expandidos -->
          <template v-if="entry.isDirectory && entry.expanded && entry.children">
            <div
              v-for="child in entry.children"
              :key="child.path"
              class="tree-item nested"
              :class="{ directory: child.isDirectory }"
              @click="handleFileClick(child)"
            >
              <span class="item-icon">{{ getFileIcon(child) }}</span>
              <span class="item-name">{{ child.name }}</span>
            </div>
          </template>
        </template>
      </div>
    </div>
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
</style>
