<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useI18nStore } from '@/stores/i18n';
import { useGlobalConfigStore } from '@/stores/globalConfig';
import { useConfigStore } from '@/stores/config';
import { useUIStore } from '@/stores/ui';
import ActivityBar from '@/components/layout/ActivityBar.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import EditorArea from '@/components/layout/EditorArea.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import TitleBar from '@/components/layout/TitleBar.vue';

const UnsavedChangesModal = defineAsyncComponent(() => 
  import('@/components/modals/UnsavedChangesModal.vue'));
const SettingsModal = defineAsyncComponent(() => 
  import('@/components/modals/SettingsModal.vue'));
const DiffViewer = defineAsyncComponent(() => 
  import('@/components/editor/DiffViewer.vue'));
const CommandPalette = defineAsyncComponent(() => 
  import('@/components/modals/CommandPalette.vue'));

const workspaceStore = useWorkspaceStore();
const i18nStore = useI18nStore();
const globalConfigStore = useGlobalConfigStore();
const configStore = useConfigStore();
const uiStore = useUIStore();

const sidebarVisible = ref(true);
const activeView = ref<'files' | 'search' | 'extensions' | 'git' | 'http'>('files');
const commandPaletteVisible = ref(false);

function setActiveView(view: typeof activeView.value) {
  if (activeView.value === view) {
    sidebarVisible.value = !sidebarVisible.value;
  } else {
    activeView.value = view;
    sidebarVisible.value = true;
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    commandPaletteVisible.value = true;
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

onMounted(async () => {
  await i18nStore.initLocale();
  await globalConfigStore.loadConfig();

  if (globalConfigStore.config.shouldRestoreSession && globalConfigStore.config.lastWorkspacePath) {
    await workspaceStore.openFolder(globalConfigStore.config.lastWorkspacePath);
    await configStore.loadConfig(globalConfigStore.config.lastWorkspacePath);
    await workspaceStore.restoreSession();
  }

  window.addEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div class="app-container">
    <!-- Title Bar (arrastável no Tauri) -->
    <TitleBar />

    <div class="main-content">
      <!-- Activity Bar (barra lateral com ícones) -->
      <ActivityBar :active-view="activeView" @select="setActiveView" />

      <!-- Sidebar (explorador de arquivos, busca, etc) -->
      <Sidebar v-if="sidebarVisible" :active-view="activeView" />

      <!-- Área do Editor (abas + editor de código) -->
      <EditorArea class="flex-1" />
    </div>

    <UnsavedChangesModal :visible="workspaceStore.showUnsavedChangesModal" :files="workspaceStore.unsavedFilesForModal"
      @save="workspaceStore.handleModalChoice('save')" @discard="workspaceStore.handleModalChoice('discard')"
      @cancel="workspaceStore.handleModalChoice('cancel')" />

    <!-- Settings Modal -->
    <SettingsModal :visible="uiStore.showSettingsModal" @close="uiStore.closeSettings()" />

    <!-- Diff Viewer Modal -->
    <div v-if="uiStore.showDiffViewer" class="modal-overlay" @click.self="uiStore.closeDiffViewer()">
      <div class="diff-modal">
        <div class="diff-header-bar">
          <span>{{ i18nStore.t('diff.title') }}</span>
          <button class="close-btn" @click="uiStore.closeDiffViewer()">×</button>
        </div>
        <DiffViewer 
          :original-content="uiStore.diffOriginalContent"
          :modified-content="uiStore.diffModifiedContent"
          :original-label="uiStore.diffOriginalLabel"
          :modified-label="uiStore.diffModifiedLabel"
        />
      </div>
    </div>

    <!-- Status Bar (rodapé) -->
    <StatusBar />
  </div>

  <!-- Command Palette -->
  <CommandPalette :visible="commandPaletteVisible" @close="commandPaletteVisible = false" />
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.diff-modal {
  width: 90%;
  height: 80%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.diff-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--title-bar-bg);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
}

.close-btn:hover {
  color: var(--text-primary);
}
</style>
