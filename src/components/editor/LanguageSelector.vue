<script setup lang="ts">
import { ref, computed } from 'vue';
import { SUPPORTED_LANGUAGES } from '@/stores/config';

const props = defineProps<{
  currentLanguage: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  select: [language: string];
  close: [];
}>();

const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

const filteredLanguages = computed(() => {
  if (!searchQuery.value) return SUPPORTED_LANGUAGES;
  const query = searchQuery.value.toLowerCase();
  return SUPPORTED_LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(query) ||
    lang.id.toLowerCase().includes(query)
  );
});

function selectLanguage(langId: string) {
  const lang = SUPPORTED_LANGUAGES.find(l => l.id === langId);
  if (lang) {
    emit('select', lang.name);
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

// Focar no input quando abrir
import { watch, nextTick } from 'vue';
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick();
    searchInput.value?.focus();
  } else {
    searchQuery.value = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="language-selector-overlay" @click="emit('close')">
      <div class="language-selector" @click.stop @keydown="handleKeydown">
        <div class="selector-header">
          <input 
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Selecionar modo de linguagem..."
            class="search-input"
            @keydown.escape="emit('close')"
          />
        </div>
        <div class="language-list">
          <button 
            v-for="lang in filteredLanguages" 
            :key="lang.id"
            class="language-item"
            :class="{ active: lang.name === currentLanguage }"
            @click="selectLanguage(lang.id)"
          >
            <span class="lang-name">{{ lang.name }}</span>
            <span v-if="lang.name === currentLanguage" class="current-indicator">✓</span>
          </button>
          <div v-if="filteredLanguages.length === 0" class="no-results">
            Nenhuma linguagem encontrada
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.language-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 1000;
}

.language-selector {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  width: 400px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.selector-header {
  padding: var(--space-sm);
  border-bottom: 1px solid var(--border-subtle);
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  outline: none;
}

.search-input:focus {
  border-color: var(--accent-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.language-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xs);
}

.language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
}

.language-item:hover {
  background: var(--bg-hover);
}

.language-item.active {
  background: var(--bg-active);
  color: var(--accent-primary);
}

.current-indicator {
  color: var(--accent-primary);
  font-weight: bold;
}

.no-results {
  padding: var(--space-lg);
  text-align: center;
  color: var(--text-muted);
}
</style>
