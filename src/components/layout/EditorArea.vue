<script setup lang="ts">
import { ref, computed } from 'vue';
import EditorTab from '@/components/editor/EditorTab.vue';
import CodeEditor from '@/components/editor/CodeEditor.vue';
import WelcomeScreen from '@/components/editor/WelcomeScreen.vue';
import { useWorkspaceStore } from '@/stores/workspace';

const workspaceStore = useWorkspaceStore();

const openTabs = computed(() => workspaceStore.openFiles);
const activeTabId = computed(() => workspaceStore.activeFileId);

function selectTab(id: string) {
  workspaceStore.setActiveFile(id);
}

function closeTab(id: string) {
  workspaceStore.closeFile(id);
}
</script>

<template>
  <div class="editor-area">
    <!-- Tabs -->
    <div class="tabs-container" v-if="openTabs.length > 0">
      <EditorTab
        v-for="tab in openTabs"
        :key="tab.id"
        :file="tab"
        :active="tab.id === activeTabId"
        @select="selectTab(tab.id)"
        @close="closeTab(tab.id)"
      />
    </div>

    <!-- Editor Content -->
    <div class="editor-content">
      <WelcomeScreen v-if="openTabs.length === 0" />
      <CodeEditor
        v-else
        :file="workspaceStore.activeFile!"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: var(--bg-primary);
  overflow: hidden;
}

.tabs-container {
  display: flex;
  align-items: center;
  height: var(--tab-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.tabs-container::-webkit-scrollbar {
  height: 3px;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}
</style>
