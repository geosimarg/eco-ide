<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useEditorStore } from '@/stores/editor';
import { useConfigStore } from '@/stores/config';
import { useI18nStore } from '@/stores/i18n';
import { open } from '@tauri-apps/plugin-dialog';
import { logger } from '@/utils/logger';
import LanguageSelector from '@/components/editor/LanguageSelector.vue';

const workspaceStore = useWorkspaceStore();
const editorStore = useEditorStore();
const configStore = useConfigStore();
const i18n = useI18nStore();

// Dados reais do arquivo ativo
const activeFile = computed(() => workspaceStore.activeFile);
const language = computed(() => activeFile.value?.language || 'Plain Text');

// Cursor position do store
const cursorLine = computed(() => editorStore.cursorLine);
const cursorColumn = computed(() => editorStore.cursorColumn);
const selectionLength = computed(() => editorStore.selectionLength);

const encoding = 'UTF-8';
const eol = 'LF';
const indentation = computed(() => `${i18n.t('statusbar.spaces')}: 2`);

// Seletor de linguagem
const showLanguageSelector = ref(false);

function openLanguageSelector() {
  if (activeFile.value) {
    showLanguageSelector.value = true;
  }
}

function handleLanguageSelect(newLanguage: string) {
  if (activeFile.value) {
    // Atualizar linguagem no arquivo aberto
    workspaceStore.setFileLanguage(activeFile.value.id, newLanguage);

    // Salvar override na config do workspace se tiver caminho
    if (activeFile.value.path && workspaceStore.workspacePath) {
      configStore.setLanguageOverride(activeFile.value.path, newLanguage);
    }
  }
  showLanguageSelector.value = false;
}

async function handleOpenFolder() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Selecione uma pasta'
    });

    if (selected && typeof selected === 'string') {
      await workspaceStore.openFolder(selected);
      // Carregar config do workspace
      await configStore.loadConfig(selected);
    }
  } catch (error) {
    logger.error('Erro ao abrir pasta:', error);
  }
}
</script>

<template>
  <footer class="statusbar">
    <div class="statusbar-left">
      <button class="status-item" :title="i18n.t('statusbar.open_folder')" @click="handleOpenFolder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" />
        </svg>
        <span>{{ i18n.t('statusbar.open_folder') }}</span>
      </button>
    </div>

    <div class="statusbar-right">
      <button class="status-item" v-if="activeFile"
        :title="`${i18n.t('statusbar.line')} ${cursorLine}, ${i18n.t('statusbar.col')} ${cursorColumn}`">
        {{ i18n.t('statusbar.line') }} {{ cursorLine }}, {{ i18n.t('statusbar.col') }} {{ cursorColumn }}
        <span v-if="selectionLength > 0" class="selection-info">({{ selectionLength }} {{ i18n.t('statusbar.selected')
          }})</span>
      </button>

      <button class="status-item" v-if="activeFile" :title="`${i18n.t('statusbar.indentation')}: ${indentation}`">
        {{ indentation }}
      </button>

      <button class="status-item" :title="`${i18n.t('statusbar.encoding')}: ${encoding}`">
        {{ encoding }}
      </button>

      <button class="status-item" :title="`${i18n.t('statusbar.eol')}: ${eol}`">
        {{ eol }}
      </button>

      <button class="status-item language" :title="`${i18n.t('statusbar.language')}: ${language}`"
        @click="openLanguageSelector">
        {{ language }}
      </button>
    </div>
  </footer>

  <LanguageSelector :visible="showLanguageSelector" :current-language="language" @select="handleLanguageSelect"
    @close="showLanguageSelector = false" />
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--statusbar-height);
  padding: 0 var(--space-sm);
  background: var(--accent-primary);
  color: white;
}

.statusbar-left,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-sm);
  height: var(--statusbar-height);
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.9);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.status-item svg {
  width: 14px;
  height: 14px;
}

.status-item.language {
  background: rgba(0, 0, 0, 0.2);
}

.status-item.language:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>