<script setup lang="ts">
import { ref } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useI18nStore } from '@/stores/i18n';
import { logger } from '@/utils/logger';

const workspaceStore = useWorkspaceStore();
const i18n = useI18nStore();

const searchQuery = ref('');
const searchResults = ref<Array<{ file: string; line: number; content: string }>>([]);
const isSearching = ref(false);

async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  if (!workspaceStore.workspacePath) {
    return;
  }

  isSearching.value = true;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    searchResults.value = await invoke('search_files', {
      directory: workspaceStore.workspacePath,
      query: searchQuery.value
    });
  } catch (error) {
    logger.error('Erro na busca:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

async function handleResultClick(result: { file: string; line: number; content: string }) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const content = await invoke<string>('read_file', { path: result.file });

    const fileName = result.file.split(/[/\\]/).pop() || result.file;

    workspaceStore.openFile({
      name: fileName,
      path: result.file,
      content: content
    });

    // TODO: Implementar rolagem para a linha específica quando o editor suportar
    logger.log(`Abrindo arquivo em ${result.file}:${result.line}`);

  } catch (e) {
    logger.error('Erro ao abrir arquivo do resultado:', e);
  }
}

function getRelativePath(fullPath: string) {
  if (!workspaceStore.workspacePath) return fullPath;
  if (fullPath.startsWith(workspaceStore.workspacePath)) {
    let rel = fullPath.slice(workspaceStore.workspacePath.length);
    rel = rel.replace(/^[/\\]+/, '');
    return rel;
  }
  return fullPath;
}
</script>

<template>
  <div class="search-panel">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.5">
        <circle cx="11" cy="11" r="6" />
        <path d="M21 21L15.5 15.5" />
      </svg>
      <input v-model="searchQuery" type="text" class="search-input" :placeholder="i18n.t('search.placeholder')"
        @keyup.enter="performSearch" />
    </div>

    <div v-if="isSearching" class="loading">
      {{ i18n.t('search.loading') }}
    </div>

    <div v-else-if="searchResults.length > 0" class="results">
      <div class="results-count">
        {{ i18n.t('search.results_found', { count: searchResults.length }) }}
      </div>
      <div v-for="(result, index) in searchResults" :key="index" class="result-item" @click="handleResultClick(result)">
        <div class="result-file" :title="result.file">{{ getRelativePath(result.file) }}</div>
        <div class="result-line">
          <span class="line-number">{{ result.line }}:</span>
          <span class="line-content">{{ result.content }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery" class="no-results">
      {{ i18n.t('search.no_results') }}
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-sm);
}

.search-input-wrapper {
  position: relative;
  margin-bottom: var(--space-sm);
}

.search-icon {
  position: absolute;
  left: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-sm) var(--space-sm) 32px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.loading,
.no-results {
  padding: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  text-align: center;
}

.results {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.results-count {
  padding: 0 var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
}

.result-item {
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-subtle);
}

.result-file {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--accent-primary);
  margin-bottom: 2px;
  word-break: break-all;
}

.result-line {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.line-number {
  color: var(--text-muted);
  min-width: 24px;
  text-align: right;
}

.line-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
</style>
