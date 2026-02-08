<script setup lang="ts">
import { ref } from 'vue';
import ActivityBar from '@/components/layout/ActivityBar.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import EditorArea from '@/components/layout/EditorArea.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import TitleBar from '@/components/layout/TitleBar.vue';

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
