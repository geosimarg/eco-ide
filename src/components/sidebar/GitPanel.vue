<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useGitStore, type GitChange } from '@/stores/git';
import { useWorkspaceStore } from '@/stores/workspace';

const gitStore = useGitStore();
const workspaceStore = useWorkspaceStore();

const commitMessage = ref('');
const isCommitting = ref(false);
const branches = ref<{ name: string; current: boolean }[]>([]);

const statusIcons: Record<string, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  untracked: 'U',
  renamed: 'R',
  copied: 'C',
};

const statusColors: Record<string, string> = {
  modified: 'var(--warning)',
  added: 'var(--success)',
  deleted: 'var(--error)',
  untracked: 'var(--text-muted)',
  renamed: 'var(--info)',
  copied: 'var(--info)',
};

const totalChanges = computed(() => 
  gitStore.changes.length + gitStore.stagedChanges.length
);

async function loadBranches() {
  branches.value = await gitStore.fetchBranches();
}

async function handleRefresh() {
  await gitStore.refresh();
}

async function handleStage(change: GitChange) {
  if (!change.staged) {
    await gitStore.stageFile(change.path);
  }
}

async function handleUnstage(change: GitChange) {
  if (change.staged) {
    await gitStore.unstageFile(change.path);
  }
}

async function handleStageAll() {
  await gitStore.stageAll();
}

async function handleCommit() {
  if (!commitMessage.value.trim()) return;
  
  isCommitting.value = true;
  try {
    await gitStore.commit(commitMessage.value);
    commitMessage.value = '';
  } finally {
    isCommitting.value = false;
  }
}

async function handleBranchSelect(branchName: string) {
  await gitStore.checkoutBranch(branchName);
}

onMounted(async () => {
  await gitStore.refresh();
  await loadBranches();
});

watch(() => workspaceStore.workspacePath, async () => {
  await gitStore.refresh();
  await loadBranches();
});
</script>

<template>
  <div class="git-panel">
    <div v-if="!gitStore.isGitRepo" class="no-repo">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="4" />
        <line x1="1.05" y1="12" x2="7" y2="12" />
        <line x1="17.01" y1="12" x2="22.96" y2="12" />
      </svg>
      <p>Não é um repositório Git</p>
      <button class="init-btn" @click="gitStore.checkIsRepo">
        Atualizar
      </button>
    </div>

    <template v-else>
      <div class="branch-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M12 8V16" />
          <path d="M12 8C12 10 14 12 16 12" />
        </svg>
        <select class="branch-select" :value="gitStore.branch" @change="(e) => handleBranchSelect((e.target as HTMLSelectElement).value)">
          <option v-for="b in branches" :key="b.name" :value="b.name">{{ b.name }}</option>
        </select>
        <button class="refresh-btn" @click="handleRefresh" title="Atualizar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <div v-if="gitStore.stagedChanges.length > 0" class="section">
        <h3 class="section-title">
          Preparadas
          <span class="count">{{ gitStore.stagedChanges.length }}</span>
        </h3>
        <div class="changes-list">
          <div
            v-for="change in gitStore.stagedChanges"
            :key="'staged-' + change.path"
            class="change-item"
            @click="handleUnstage(change)"
            :title="change.path"
          >
            <span class="staged-icon" title="Clique para desmarcar">✓</span>
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

      <div v-if="gitStore.changes.length > 0" class="section">
        <h3 class="section-title">
          Alterações
          <span class="count">{{ gitStore.changes.length }}</span>
          <button class="stage-all-btn" @click="handleStageAll" title="Preparar todas">
            +
          </button>
        </h3>
        <div class="changes-list">
          <div
            v-for="change in gitStore.changes"
            :key="change.path"
            class="change-item"
            @click="handleStage(change)"
            :title="change.path"
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

      <div v-if="totalChanges === 0" class="empty-state">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p>Sem alterações</p>
      </div>

      <div class="actions">
        <textarea
          v-model="commitMessage"
          class="commit-input"
          placeholder="Mensagem do commit..."
          rows="2"
          :disabled="isCommitting || gitStore.stagedChanges.length === 0"
        />
        <button
          class="commit-btn"
          @click="handleCommit"
          :disabled="isCommitting || !commitMessage.trim() || gitStore.stagedChanges.length === 0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ isCommitting ? 'Enviando...' : 'Commit' }}
        </button>
      </div>

      <div v-if="gitStore.error" class="error-message">
        {{ gitStore.error }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.git-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-sm);
}

.no-repo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
  gap: var(--space-sm);
}

.no-repo p {
  font-size: var(--font-size-sm);
}

.init-btn {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
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
  flex: 1;
}

.refresh-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
}

.refresh-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-md);
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
  margin-bottom: var(--space-xs);
}

.count {
  padding: 1px 6px;
  font-size: 10px;
  background: var(--accent-primary);
  color: white;
  border-radius: 10px;
}

.stage-all-btn {
  margin-left: auto;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: var(--bg-hover);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
}

.stage-all-btn:hover {
  background: var(--accent-primary);
  color: white;
}

.changes-list {
  flex: 1;
  overflow-y: auto;
}

.change-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.change-item:hover {
  background: var(--bg-hover);
}

.staged-icon {
  width: 14px;
  font-size: 10px;
  color: var(--success);
  text-align: center;
}

.status-badge {
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.file-path {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  color: var(--text-muted);
  gap: var(--space-xs);
}

.empty-state p {
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: auto;
}

.commit-input {
  width: 100%;
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  resize: none;
  font-family: inherit;
}

.commit-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.commit-input::placeholder {
  color: var(--text-muted);
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

.commit-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

.commit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--error);
  background: rgba(255, 0, 0, 0.1);
  border-radius: var(--radius-sm);
}
</style>