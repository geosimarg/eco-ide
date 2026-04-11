<script setup lang="ts">
import FileExplorer from '@/components/sidebar/FileExplorer.vue';
import SearchPanel from '@/components/sidebar/SearchPanel.vue';
import ExtensionsPanel from '@/components/sidebar/ExtensionsPanel.vue';
import GitPanel from '@/components/sidebar/GitPanel.vue';
import HttpClientPanel from '@/components/sidebar/HttpClientPanel.vue';

import { useI18nStore } from '@/stores/i18n';

defineProps<{
  activeView: 'files' | 'search' | 'extensions' | 'git' | 'http';
}>();

const i18n = useI18nStore();
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">{{ i18n.t(`activity.${activeView}`).toUpperCase() }}</span>
    </div>

    <div class="sidebar-content">
      <FileExplorer v-if="activeView === 'files'" />
      <SearchPanel v-else-if="activeView === 'search'" />
      <HttpClientPanel v-else-if="activeView === 'http'" />
      <ExtensionsPanel v-else-if="activeView === 'extensions'" />
      <GitPanel v-else-if="activeView === 'git'" />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--panel-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  height: var(--tab-height);
}

.sidebar-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}
</style>
