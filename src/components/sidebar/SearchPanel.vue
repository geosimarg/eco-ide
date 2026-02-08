<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useI18nStore } from '@/stores/i18n';
import { logger } from '@/utils/logger';
import FileIcon from '@/components/common/FileIcon.vue';

const workspaceStore = useWorkspaceStore();
const i18n = useI18nStore();

const searchQuery = ref('');
const searchExclude = ref('');
const searchResults = ref<Array<{ file: string; line: number; content: string }>>([]);
const isSearching = ref(false);

const groupedResults = computed(() => {
  const groups: Record<string, Array<{ line: number; content: string }>> = {};
  searchResults.value.forEach(result => {
    if (!groups[result.file]) {
      groups[result.file] = [];
    }
    groups[result.file].push({
      line: result.line,
      content: result.content
    });
  });
  return groups;
});

const resultCount = computed(() => searchResults.value.length);

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
      query: searchQuery.value,
      exclude: searchExclude.value.trim() || null,
    });
  } catch (error) {
    logger.error('Erro na busca:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

/** Coluna exata da ocorrência do termo de busca na linha (1-based). */
function getMatchColumn(lineContent: string, query: string): number {
  const q = query.trim();
  if (!q) return 1;
  const idx = lineContent.toLowerCase().indexOf(q.toLowerCase());
  return idx >= 0 ? idx + 1 : 1;
}

async function handleResultDblClick(file: string, line: number, lineContent: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const content = await invoke<string>('read_file', { path: file });

    const fileName = file.split(/[/\\]/).pop() || file;
    const column = getMatchColumn(lineContent, searchQuery.value);

    workspaceStore.openFile({
      name: fileName,
      path: file,
      content: content,
      initialLine: line,
      initialColumn: column,
    });
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

function getFileName(path: string) {
  return path.split(/[/\\]/).pop() || path;
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
    <div class="exclude-input-wrapper">
      <input v-model="searchExclude" type="text" class="search-input exclude-input"
        :placeholder="i18n.t('search.exclude_placeholder')" @keyup.enter="performSearch" />
    </div>

    <div v-if="isSearching" class="loading">
      {{ i18n.t('search.loading') }}
    </div>

    <div v-else-if="resultCount > 0" class="results">
      <div class="results-count">
        {{ i18n.t('search.results_found', { count: resultCount }) }}
      </div>

      <div v-for="(matches, file) in groupedResults" :key="file" class="file-group">
        <div class="file-header" :title="String(file)">
          <FileIcon :name="getFileName(String(file))" class="file-icon" />
          <span class="file-name">{{ getFileName(String(file)) }}</span>
          <span class="file-path">{{ getRelativePath(String(file)) }}</span>
          <span class="match-badge">{{ matches.length }}</span>
        </div>

        <div class="file-matches">
          <div v-for="(match, index) in matches" :key="index" class="match-item"
            @dblclick="handleResultDblClick(String(file), match.line, match.content)">
            <div class="match-line">
              <span class="line-number">{{ match.line }}:</span>
              <span class="line-content">{{ match.content }}</span>
            </div>
          </div>
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

.search-input-wrapper,
.exclude-input-wrapper {
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

.exclude-input {
  padding-left: var(--space-sm);
  font-size: var(--font-size-xs);
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
  gap: var(--space-sm);
}

.results-count {
  padding: 0 var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
}

.file-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-primary);
  position: sticky;
  top: 0;
}

.file-name {
  color: var(--text-primary);
}

.file-path {
  color: var(--text-tertiary);
  font-weight: 400;
  font-size: 10px;
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50%;
}

.match-badge {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 0 6px;
  font-size: 10px;
}

.file-matches {
  display: flex;
  flex-direction: column;
}

.match-item {
  padding: 4px var(--space-sm) 4px 28px;
  cursor: pointer;
  transition: background var(--transition-fast);
  border-left: 2px solid transparent;
}

.match-item:hover {
  background: var(--bg-hover);
  border-left-color: var(--accent-primary);
}

.match-line {
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
