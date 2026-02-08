<script setup lang="ts">
import { type OpenFile, useWorkspaceStore } from '@/stores/workspace';
import { computed } from 'vue';

const props = defineProps<{
  file: OpenFile;
  active: boolean;
}>();

const emit = defineEmits<{
  select: [];
  close: [];
}>();

const workspaceStore = useWorkspaceStore();

const icon = computed(() => {
  const ext = props.file.name.split('.').pop() || '';
  const icons: Record<string, string> = {
    ts: '🟦',
    js: '🟨',
    vue: '💚',
    rs: '🦀',
    py: '🐍',
    json: '📋',
    md: '📝',
    css: '🎨',
    html: '🌐',
  };
  return icons[ext] || '📄';
});

async function handleClose(e: MouseEvent) {
  e.stopPropagation();

  await workspaceStore.closeFileWithConfirmation(props.file.id);
}
</script>

<template>
  <div
    class="tab"
    :class="{ active }"
    @click="emit('select')"
  >
    <span class="tab-icon">{{ icon }}</span>
    <span class="tab-name">{{ file.name }}</span>
    <span v-if="file.modified" class="modified-dot" title="Não salvo"></span>
    <button class="close-btn" @click="handleClose" title="Fechar">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.2" />
        <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.2" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
  height: 100%;
  min-width: 120px;
  max-width: 180px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.tab:hover {
  background: var(--bg-hover);
}

.tab.active {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--accent-primary);
}

.tab-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tab-name {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab.active .tab-name {
  color: var(--text-primary);
}

.modified-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.tab:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}
</style>
