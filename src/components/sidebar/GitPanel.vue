<script setup lang="ts">
import { ref } from 'vue';

interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

const branch = ref('main');
const changes = ref<GitChange[]>([
  { path: 'src/App.vue', status: 'modified' },
  { path: 'src/main.ts', status: 'modified' },
  { path: 'src/components/new.vue', status: 'added' },
]);

const statusIcons: Record<string, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  untracked: 'U',
};

const statusColors: Record<string, string> = {
  modified: 'var(--warning)',
  added: 'var(--success)',
  deleted: 'var(--error)',
  untracked: 'var(--text-muted)',
};
</script>

<template>
  <div class="git-panel">
    <div class="branch-info">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <circle cx="18" cy="12" r="2" />
        <path d="M12 8V16" />
        <path d="M12 8C12 10 14 12 16 12" />
      </svg>
      <span class="branch-name">{{ branch }}</span>
    </div>

    <div class="section">
      <h3 class="section-title">
        Alterações
        <span class="count">{{ changes.length }}</span>
      </h3>

      <div class="changes-list">
        <div
          v-for="change in changes"
          :key="change.path"
          class="change-item"
        >
          <span
            class="status-badge"
            :style="{ color: statusColors[change.status] }"
          >
            {{ statusIcons[change.status] }}
          </span>
          <span class="file-path">{{ change.path }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <input
        type="text"
        class="commit-input"
        placeholder="Mensagem do commit..."
      />
      <button class="commit-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Commit
      </button>
    </div>
  </div>
</template>

<style scoped>
.git-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-sm);
}

.branch-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.branch-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-sm);
}

.count {
  padding: 1px 6px;
  font-size: 10px;
  background: var(--accent-primary);
  color: white;
  border-radius: 10px;
}

.changes-list {
  flex: 1;
  overflow-y: auto;
}

.change-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.change-item:hover {
  background: var(--bg-hover);
}

.status-badge {
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  font-weight: 700;
  width: 14px;
  text-align: center;
}

.file-path {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.commit-input {
  width: 100%;
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

.commit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: white;
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.commit-btn:hover {
  filter: brightness(1.1);
}
</style>
