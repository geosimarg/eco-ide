<script setup lang="ts">
import { ref } from 'vue';

interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  installed: boolean;
  language: 'rust' | 'typescript' | 'python' | 'go';
}

const searchQuery = ref('');
const extensions = ref<Extension[]>([
  {
    id: 'rust-analyzer',
    name: 'Rust Analyzer',
    description: 'Suporte avançado para Rust com análise em tempo real',
    version: '0.1.0',
    installed: true,
    language: 'rust',
  },
  {
    id: 'prettier',
    name: 'Prettier',
    description: 'Formatador de código para JS, TS, CSS, JSON e mais',
    version: '0.1.0',
    installed: true,
    language: 'typescript',
  },
  {
    id: 'python-lsp',
    name: 'Python LSP',
    description: 'Language Server Protocol para Python',
    version: '0.1.0',
    installed: false,
    language: 'python',
  },
]);

const languageIcons: Record<string, string> = {
  rust: '🦀',
  typescript: '🟦',
  python: '🐍',
  go: '🐹',
};

function toggleInstall(ext: Extension) {
  ext.installed = !ext.installed;
}
</script>

<template>
  <div class="extensions-panel">
    <div class="search-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Buscar extensões..."
      />
    </div>

    <div class="section">
      <h3 class="section-title">Instaladas</h3>
      <div class="extension-list">
        <div
          v-for="ext in extensions.filter(e => e.installed)"
          :key="ext.id"
          class="extension-item"
        >
          <div class="ext-icon">{{ languageIcons[ext.language] }}</div>
          <div class="ext-info">
            <div class="ext-name">{{ ext.name }}</div>
            <div class="ext-desc">{{ ext.description }}</div>
            <div class="ext-meta">
              <span class="ext-version">v{{ ext.version }}</span>
              <span class="ext-lang">{{ ext.language }}</span>
            </div>
          </div>
          <button class="uninstall-btn" @click="toggleInstall(ext)">
            Desinstalar
          </button>
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">Disponíveis</h3>
      <div class="extension-list">
        <div
          v-for="ext in extensions.filter(e => !e.installed)"
          :key="ext.id"
          class="extension-item"
        >
          <div class="ext-icon">{{ languageIcons[ext.language] }}</div>
          <div class="ext-info">
            <div class="ext-name">{{ ext.name }}</div>
            <div class="ext-desc">{{ ext.description }}</div>
            <div class="ext-meta">
              <span class="ext-version">v{{ ext.version }}</span>
              <span class="ext-lang">{{ ext.language }}</span>
            </div>
          </div>
          <button class="install-btn" @click="toggleInstall(ext)">
            Instalar
          </button>
        </div>
      </div>
    </div>

    <div class="wasm-info">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>Extensões são executadas em sandbox WebAssembly</span>
    </div>
  </div>
</template>

<style scoped>
.extensions-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-sm);
}

.search-wrapper {
  margin-bottom: var(--space-md);
}

.search-input {
  width: 100%;
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

.section {
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-sm);
}

.extension-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.extension-item {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.ext-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.ext-info {
  flex: 1;
  min-width: 0;
}

.ext-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.ext-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ext-meta {
  display: flex;
  gap: var(--space-sm);
  font-size: 10px;
  color: var(--text-muted);
}

.install-btn,
.uninstall-btn {
  align-self: center;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.install-btn {
  background: var(--accent-primary);
  color: white;
}

.install-btn:hover {
  filter: brightness(1.1);
}

.uninstall-btn {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.uninstall-btn:hover {
  background: var(--error);
  color: white;
}

.wasm-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: auto;
  padding: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}
</style>
