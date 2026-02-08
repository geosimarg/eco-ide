<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useWorkspaceStore } from '@/stores/workspace';
import ActivityBar from '@/components/layout/ActivityBar.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import EditorArea from '@/components/layout/EditorArea.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import TitleBar from '@/components/layout/TitleBar.vue';
import UnsavedChangesModal from '@/components/modals/UnsavedChangesModal.vue';

const workspaceStore = useWorkspaceStore();

// Estado dos painéis
const sidebarVisible = ref(true);
const activeView = ref<'files' | 'search' | 'extensions' | 'git'>('files');

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value;
}

function setActiveView(view: typeof activeView.value) {
  if (activeView.value === view) {
    sidebarVisible.value = !sidebarVisible.value;
  } else {
    activeView.value = view;
    sidebarVisible.value = true;
  }
}

onMounted(async () => {
  const appWindow = getCurrentWindow();
  await appWindow.onCloseRequested(async (event) => {
    if (!workspaceStore.hasUnsavedChanges) {
      return;
    }

    event.preventDefault();
    const shouldClose = await workspaceStore.closeWindowWithConfirmation();
    
    if (shouldClose) {
      appWindow.destroy();
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
      <ActivityBar
        :active-view="activeView"
        @select="setActiveView"
      />

      <!-- Sidebar (explorador de arquivos, busca, etc) -->
      <Sidebar
        v-if="sidebarVisible"
        :active-view="activeView"
      />

      <!-- Área do Editor (abas + editor de código) -->
      <EditorArea class="flex-1" />
    </div>

    <UnsavedChangesModal 
      :visible="workspaceStore.showUnsavedChangesModal"
      :files="workspaceStore.unsavedFilesForModal"
      @save="workspaceStore.handleModalChoice('save')"
      @discard="workspaceStore.handleModalChoice('discard')"
      @cancel="workspaceStore.handleModalChoice('cancel')"
    />

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
