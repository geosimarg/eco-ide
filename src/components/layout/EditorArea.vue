<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import EditorGroup from '@/components/layout/EditorGroup.vue';

const workspaceStore = useWorkspaceStore();
const groups = computed(() => workspaceStore.groups);

function handleSplit(index: number, payload: { direction: 'left' | 'right', fileId: string, sourceGroupId: string }) {
  const { direction, fileId } = payload;

  // Determine insertion index
  let insertIndex = index;
  if (direction === 'right') {
    insertIndex = index + 1;
  }

  // Create new group at index
  const newGroupId = workspaceStore.createGroup(undefined, insertIndex);

  // Move file to new group
  workspaceStore.moveFileToGroup(fileId, newGroupId);
}
</script>

<template>
  <div class="editor-area">
    <div class="groups-container">
      <EditorGroup v-for="(group, index) in groups" :key="group.id" :group="group"
        @split="handleSplit(index, $event)" />
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
  /* Default split direction */
  overflow: hidden;
}
</style>
