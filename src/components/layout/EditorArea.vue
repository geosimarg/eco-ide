<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import EditorGroup from '@/components/layout/EditorGroup.vue';
import MarkdownPreview from '@/components/editor/MarkdownPreview.vue';

const workspaceStore = useWorkspaceStore();
const groups = computed(() => workspaceStore.groups);

const previewFileId = ref<string | null>(null);
const previewScrollPercent = ref(0);

const previewContent = computed(() => {
  if (!previewFileId.value) return '';
  for (const group of groups.value) {
    const file = group.files.find(f => f.id === previewFileId.value);
    if (file) return file.content;
  }
  return '';
});

watch(() => {
  if (!previewFileId.value) return true;
  for (const group of groups.value) {
    if (group.files.find(f => f.id === previewFileId.value)) return true;
  }
  return false;
}, (exists) => {
  if (!exists) previewFileId.value = null;
});

function handleSplit(index: number, payload: { direction: 'left' | 'right', fileId: string, sourceGroupId: string }) {
  const { direction, fileId } = payload;
  let insertIndex = index;
  if (direction === 'right') {
    insertIndex = index + 1;
  }
  const newGroupId = workspaceStore.createGroup(undefined, insertIndex);
  workspaceStore.moveFileToGroup(fileId, newGroupId);
}

function handleTogglePreview(fileId: string) {
  if (previewFileId.value === fileId) {
    previewFileId.value = null;
  } else {
    previewFileId.value = fileId;
    previewScrollPercent.value = 0;
  }
}

function handleEditorScroll(percent: number) {
  if (previewFileId.value) {
    previewScrollPercent.value = percent;
  }
}
</script>

<template>
  <div class="editor-area">
    <div class="groups-container">
      <EditorGroup v-for="(group, index) in groups" :key="group.id" :group="group" @split="handleSplit(index, $event)"
        @toggle-preview="handleTogglePreview" @editor-scroll="handleEditorScroll" />

      <div v-if="previewFileId" class="preview-pane">
        <div class="preview-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>Preview</span>
          <button class="preview-close-btn" @click="previewFileId = null" title="Fechar preview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <MarkdownPreview :content="previewContent" :scroll-percent="previewScrollPercent" />
      </div>
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

.groups-container {
  display: flex;
  flex: 1;
  flex-direction: row;
  overflow: hidden;
}

.preview-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-primary);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  height: var(--tab-height);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.preview-header span {
  flex: 1;
}

.preview-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preview-close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
