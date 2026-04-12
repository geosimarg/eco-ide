<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const searchQuery = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const workspaceStore = useWorkspaceStore();

const allCommands = computed((): Command[] => [
  {
    id: 'file.new',
    label: 'New File',
    category: 'File',
    action: () => workspaceStore.createNewFile(),
  },
  {
    id: 'file.openFolder',
    label: 'Open Folder',
    category: 'File',
    action: () => {}, // Opens folder dialog
  },
  {
    id: 'file.save',
    label: 'Save',
    category: 'File',
    shortcut: 'Ctrl+S',
    action: () => {}, // Handled by editor
  },
  {
    id: 'file.saveAs',
    label: 'Save As',
    category: 'File',
    shortcut: 'Ctrl+Shift+S',
    action: () => {},
  },
  {
    id: 'edit.undo',
    label: 'Undo',
    category: 'Edit',
    shortcut: 'Ctrl+Z',
    action: () => {},
  },
  {
    id: 'edit.redo',
    label: 'Redo',
    category: 'Edit',
    shortcut: 'Ctrl+Shift+Z',
    action: () => {},
  },
  {
    id: 'edit.find',
    label: 'Find',
    category: 'Edit',
    shortcut: 'Ctrl+F',
    action: () => {},
  },
  {
    id: 'edit.replace',
    label: 'Find and Replace',
    category: 'Edit',
    shortcut: 'Ctrl+H',
    action: () => {},
  },
  {
    id: 'view.toggleSidebar',
    label: 'Toggle Sidebar',
    category: 'View',
    action: () => {},
  },
  {
    id: 'view.toggleMinimap',
    label: 'Toggle Minimap',
    category: 'View',
    action: () => {},
  },
  {
    id: 'settings.open',
    label: 'Open Settings',
    category: 'Preferences',
    action: () => {}, // Opens settings modal
  },
]);

const filteredCommands = computed(() => {
  if (!searchQuery.value) return allCommands.value;
  
  const query = searchQuery.value.toLowerCase();
  return allCommands.value.filter(cmd => 
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );
});

watch(() => props.visible, (visible) => {
  if (visible) {
    searchQuery.value = '';
    selectedIndex.value = 0;
    setTimeout(() => inputRef.value?.focus(), 50);
  }
});

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;
    case 'Enter':
      e.preventDefault();
      executeCommand(filteredCommands.value[selectedIndex.value]);
      break;
    case 'Escape':
      e.preventDefault();
      emit('close');
      break;
  }
}

function executeCommand(cmd: Command) {
  cmd.action();
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="command-palette-overlay" @click.self="emit('close')">
      <div class="command-palette" @keydown="handleKeydown">
        <div class="search-container">
          <span class="search-icon">⌘</span>
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Type a command..."
            class="search-input"
          />
        </div>
        
        <div class="commands-list">
          <div
            v-for="(cmd, index) in filteredCommands"
            :key="cmd.id"
            class="command-item"
            :class="{ selected: index === selectedIndex }"
            @click="executeCommand(cmd)"
            @mouseenter="selectedIndex = index"
          >
            <span class="command-category">{{ cmd.category }}</span>
            <span class="command-label">{{ cmd.label }}</span>
            <span v-if="cmd.shortcut" class="command-shortcut">{{ cmd.shortcut }}</span>
          </div>
          
          <div v-if="filteredCommands.length === 0" class="no-results">
            No commands found
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  padding-top: 80px;
  z-index: 2000;
}

.command-palette {
  width: 500px;
  max-height: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.search-container {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  color: var(--text-secondary);
  margin-right: var(--space-sm);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--font-size-md);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.commands-list {
  max-height: 340px;
  overflow-y: auto;
  padding: var(--space-xs) 0;
}

.command-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.command-item:hover,
.command-item.selected {
  background: var(--bg-hover);
}

.command-category {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  width: 80px;
}

.command-label {
  flex: 1;
  color: var(--text-primary);
}

.command-shortcut {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.no-results {
  padding: var(--space-md);
  text-align: center;
  color: var(--text-secondary);
}
</style>