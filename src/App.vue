<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useWorkspaceStore } from '@/stores/workspace';
import { useI18nStore } from '@/stores/i18n';
import { useGlobalConfigStore } from '@/stores/globalConfig';
import { useConfigStore } from '@/stores/config';
import { useUIStore } from '@/stores/ui'; // Importando uiStore
import ActivityBar from '@/components/layout/ActivityBar.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import EditorArea from '@/components/layout/EditorArea.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import TitleBar from '@/components/layout/TitleBar.vue';
import UnsavedChangesModal from '@/components/modals/UnsavedChangesModal.vue';
import SettingsModal from '@/components/modals/SettingsModal.vue'; // Importando modal

const workspaceStore = useWorkspaceStore();
const i18nStore = useI18nStore();
const globalConfigStore = useGlobalConfigStore();
const configStore = useConfigStore();
const uiStore = useUIStore(); // Inicializando store

const sidebarVisible = ref(true);
const activeView = ref<'files' | 'search' | 'extensions' | 'git'>('files');

function setActiveView(view: typeof activeView.value) {
  if (activeView.value === view) {
    sidebarVisible.value = !sidebarVisible.value;
  } else {
    activeView.value = view;
    sidebarVisible.value = true;
  }
}

onMounted(async () => {
  await i18nStore.initLocale();
  await globalConfigStore.loadConfig();

  if (globalConfigStore.config.shouldRestoreSession && globalConfigStore.config.lastWorkspacePath) {
    await workspaceStore.openFolder(globalConfigStore.config.lastWorkspacePath);
    await configStore.loadConfig(globalConfigStore.config.lastWorkspacePath);
    await workspaceStore.restoreSession();
  }

  const appWindow = getCurrentWindow();
  await appWindow.onCloseRequested(async (event) => {
    // Se houver alterações não salvas, interceptar fechamento
    if (workspaceStore.hasUnsavedChanges) {
      // Prevenir fechamento imediato para mostrar modal
      event.preventDefault();

      const confirmed = await workspaceStore.closeWindowWithConfirmation();
      if (!confirmed) {
        // Usuário cancelou
        return;
      }

      // Se confirmou (Salvou ou Descartou), prosseguir com fechamento manual
      // Salvar sessão antes de sair
      if (workspaceStore.workspacePath) {
        globalConfigStore.setLastWorkspace(workspaceStore.workspacePath);
        await workspaceStore.saveSession();
      }

      // Forçar destruição da janela pois o evento original foi prevenido
      appWindow.destroy();
    } else {
      // Se não há alterações não salvas, apenas salvar sessão e permitir fechamento
      if (workspaceStore.workspacePath) {
        globalConfigStore.setLastWorkspace(workspaceStore.workspacePath);
        await workspaceStore.saveSession();
      }
      // Não precisa chamar destroy ou preventDefault, fecha normalmente
    }
  });
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

    <!-- Status Bar (rodapé) -->
    <StatusBar />
  </div>
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
</style>
