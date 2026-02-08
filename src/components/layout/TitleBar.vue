<script setup lang="ts">
import { ref, computed } from 'vue';
import MenuBar from './MenuBar.vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useI18nStore } from '@/stores/i18n';

const workspaceStore = useWorkspaceStore();
const i18n = useI18nStore();
const isMaximized = ref(false);

const workspaceName = computed(() => workspaceStore.workspaceName || i18n.t('workspace.no_folder'));

async function handleMinimize() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().minimize();
}

async function handleMaximize() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const win = getCurrentWindow();
  const maximized = await win.isMaximized();
  if (maximized) {
    await win.unmaximize();
    isMaximized.value = false;
  } else {
    await win.maximize();
    isMaximized.value = true;
  }
}

async function handleClose() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().close();
}
</script>

<template>
  <div class="titlebar" data-tauri-drag-region>
    <div class="titlebar-left" data-tauri-drag-region>
      <img src="/favicon.svg" alt="Eco IDE" class="logo" />
      <span class="title">Eco IDE</span>
      <div class="menubar-container">
        <MenuBar />
      </div>
    </div>

    <!-- Center e Right mantidos -->
    <div class="titlebar-center" data-tauri-drag-region>
      <span class="workspace-name">{{ workspaceName }}</span>
    </div>

    <div class="titlebar-right">
      <button class="window-btn" @click="handleMinimize" title="Minimizar">
        <svg width="10" height="1" viewBox="0 0 10 1">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button class="window-btn" @click="handleMaximize" :title="isMaximized ? 'Restaurar' : 'Maximizar'">
        <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10">
          <rect x="0" y="0" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1" />
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10">
          <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1" />
          <rect x="0" y="2" width="8" height="8" fill="var(--bg-secondary)" stroke="currentColor" stroke-width="1" />
        </svg>
      </button>
      <button class="window-btn close" @click="handleClose" title="Fechar">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2" />
          <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-sm);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.menubar-container {
  height: 100%;
  margin-left: var(--space-sm);
}

/* Resto dos estilos mantidos */
.logo {
  width: 16px;
  height: 16px;
}

.title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.titlebar-center {
  flex: 1;
  text-align: center;
}

.workspace-name {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.window-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.window-btn.close:hover {
  background: var(--error);
  color: white;
}
</style>
