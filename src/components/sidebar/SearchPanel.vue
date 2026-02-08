<script setup lang="ts">
import { ref } from 'vue';

const searchQuery = ref('');
const searchResults = ref<Array<{ file: string; line: number; content: string }>>([]);
const isSearching = ref(false);

async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  
  try {
    // TODO: Implementar busca via backend Tauri
    // const { invoke } = await import('@tauri-apps/api/core');
    // searchResults.value = await invoke('search_files', { query: searchQuery.value });
    
    // Mock de resultados
    searchResults.value = [
      { file: 'src/main.ts', line: 5, content: 'import { createApp } from \'vue\';' },
      { file: 'src/App.vue', line: 12, content: '  const searchQuery = ref(\'\');' },
    ];
  } catch (error) {
    console.error('Erro na busca:', error);
  } finally {
    isSearching.value = false;
  }
}
</script>

<template>
  <div class="search-panel">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="6" />
        <path d="M21 21L15.5 15.5" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Buscar em arquivos..."
        @keyup.enter="performSearch"
      />
    </div>

    <div v-if="isSearching" class="loading">
      Buscando...
    </div>

    <div v-else-if="searchResults.length > 0" class="results">
      <div
        v-for="(result, index) in searchResults"
        :key="index"
        class="result-item"
      >
        <div class="result-file">{{ result.file }}</div>
        <div class="result-line">
          <span class="line-number">{{ result.line }}</span>
          <span class="line-content">{{ result.content }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery" class="no-results">
      Nenhum resultado encontrado
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
}

.result-item {
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.result-item:hover {
  background: var(--bg-hover);
}

.result-file {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.result-line {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
}

.line-number {
  color: var(--text-muted);
}

.line-content {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
