<script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue';
  import { useI18nStore } from '@/stores/i18n';
  import { useGitStore } from '@/stores/git';
  import { useWorkspaceStore } from '@/stores/workspace';
  import type { GitChange } from '@/interfaces/git_change';

  const i18n = useI18nStore();
  const gitStore = useGitStore();
  const workspaceStore = useWorkspaceStore();

  const commitMessage = ref('');
  const isCommitting = ref(false);
  const branches = ref<{ name: string; current: boolean }[]>([]);
  const hoveredFile = ref<string | null>(null);
  const expandedSections = ref({ staged: true, changes: true });

  const statusIcons: Record<string, string> = {
    modified: 'M', added: 'A', deleted: 'D',
    untracked: 'U', renamed: 'R', copied: 'C',
  };

  const statusClasses: Record<string, string> = {
    modified: 'st-modified', added: 'st-added', deleted: 'st-deleted',
    untracked: 'st-untracked', renamed: 'st-info', copied: 'st-info',
  };

  const totalChanges = computed(() => gitStore.changes.length + gitStore.stagedChanges.length);

  function getBasename(path: string) { return path.split('/').pop() || path; }
  function getDirname(path: string) {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }

  async function loadBranches() { branches.value = await gitStore.fetchBranches(); }
  async function handleRefresh() { await gitStore.refresh(); await loadBranches(); }

  async function handleViewDiff(change: GitChange, fromStaged = false) {
    if (!workspaceStore.workspacePath) return;
    const fullPath = `${workspaceStore.workspacePath}/${change.path}`;
    const name = getBasename(change.path);

    let originalContent = '';
    let modifiedContent = '';

    if (fromStaged) {
      originalContent = await gitStore.getHeadContent(change.path);
      modifiedContent = await gitStore.getStagedContent(change.path);
    } else {
      if (change.status !== 'untracked') {
        originalContent = await gitStore.getHeadContent(change.path);
      }
      const { invoke } = await import('@tauri-apps/api/core');
      modifiedContent = await invoke<string>('read_file', { path: fullPath });
    }

    workspaceStore.openFile({
      name,
      path: fullPath,
      content: modifiedContent,
      isDiff: true,
      originalContent,
      diffLabel: fromStaged ? 'Index' : 'HEAD',
      diffMode: fromStaged ? 'staged' : 'unstaged',
    });
  }


  async function handleBranchSelect(name: string) { await gitStore.checkoutBranch(name); }

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

  function toggleSection(s: 'staged' | 'changes') {
    expandedSections.value[s] = !expandedSections.value[s];
  }

  onMounted(async () => { await gitStore.refresh(); await loadBranches(); });
  watch(() => workspaceStore.workspacePath, async () => { await gitStore.refresh(); await loadBranches(); });
</script>

<template>
  <div class="git-panel">
    <!-- No repo -->
    <div v-if="!gitStore.isGitRepo" class="empty-state">
      <div class="empty-circle">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M6 8v1a4 4 0 0 0 4 4h0" />
          <path d="M18 16v-1a4 4 0 0 0-4-4h0" />
        </svg>
      </div>
      <p class="empty-title">{{ i18n.t('gitPanel.notGitRepo') }}</p>
      <p class="empty-desc">{{ i18n.t('gitPanel.notGitRepoDesc') }}</p>
      <button class="primary-btn" @click="gitStore.checkIsRepo">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 4 23 10 17 10" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
        </svg>
        {{ i18n.t('gitPanel.refresh') }}
      </button>
    </div>

    <template v-else>
      <!-- Branch -->
      <div class="branch-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          class="branch-svg">
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
        <select class="branch-sel" :value="gitStore.branch"
          @change="(e) => handleBranchSelect((e.target as HTMLSelectElement).value)">
          <option v-for="b in branches" :key="b.name" :value="b.name">{{ b.name }}</option>
        </select>
        <button class="icon-btn-sm" @click="handleRefresh" :title="i18n.t('gitPanel.refresh')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <!-- STAGED -->
      <div v-if="gitStore.stagedChanges.length > 0" class="section">
        <div class="section-head" @click="toggleSection('staged')">
          <svg class="chev" :class="{ open: expandedSections.staged }" width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span class="section-name">{{ i18n.t('gitPanel.prepared') }}</span>
          <span class="badge">{{ gitStore.stagedChanges.length }}</span>
          <div class="section-btns" @click.stop>
            <button class="sec-btn warn" @click="gitStore.unstageAll()" :title="i18n.t('gitPanel.unstageAll')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <div v-show="expandedSections.staged" class="file-list">
          <div v-for="c in gitStore.stagedChanges" :key="'s-' + c.path" class="file-row"
            @click="handleViewDiff(c, true)" @mouseenter="hoveredFile = 's-' + c.path" @mouseleave="hoveredFile = null">
            <div class="file-meta">
              <span class="fname">{{ getBasename(c.path) }}</span>
              <span v-if="getDirname(c.path)" class="fdir">{{ getDirname(c.path) }}</span>
            </div>
            <div class="file-right">
              <button v-if="hoveredFile === 's-' + c.path" class="row-btn warn"
                @click.stop="gitStore.unstageFile(c.path)" :title="i18n.t('gitPanel.unstageFile')">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span class="status-ch" :class="statusClasses[c.status]">{{ statusIcons[c.status] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CHANGES -->
      <div v-if="gitStore.changes.length > 0" class="section">
        <div class="section-head" @click="toggleSection('changes')">
          <svg class="chev" :class="{ open: expandedSections.changes }" width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span class="section-name">{{ i18n.t('gitPanel.changes') }}</span>
          <span class="badge">{{ gitStore.changes.length }}</span>
          <div class="section-btns" @click.stop>
            <button class="sec-btn danger" @click="gitStore.discardAllChanges()" :title="i18n.t('gitPanel.discardAll')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </button>
            <button class="sec-btn success" @click="gitStore.stageAll()" :title="i18n.t('gitPanel.stageAll')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <div v-show="expandedSections.changes" class="file-list">
          <div v-for="c in gitStore.changes" :key="c.path" class="file-row" @click="handleViewDiff(c)"
            @mouseenter="hoveredFile = c.path" @mouseleave="hoveredFile = null">
            <div class="file-meta">
              <span class="fname">{{ getBasename(c.path) }}</span>
              <span v-if="getDirname(c.path)" class="fdir">{{ getDirname(c.path) }}</span>
            </div>
            <div class="file-right">
              <template v-if="hoveredFile === c.path">
                <button class="row-btn danger"
                  @click.stop="c.status === 'untracked' ? gitStore.deleteFile(c.path) : gitStore.discardChanges(c.path)"
                  :title="i18n.t('gitPanel.discardFile')">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
                <button class="row-btn success" @click.stop="gitStore.stageFile(c.path)"
                  :title="i18n.t('gitPanel.stageFile')">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </template>
              <span class="status-ch" :class="statusClasses[c.status]">{{ statusIcons[c.status] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No changes -->
      <div v-if="totalChanges === 0" class="empty-state compact">
        <div class="empty-circle sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p class="empty-title">{{ i18n.t('gitPanel.noChanges') }}</p>
        <p class="empty-desc">{{ i18n.t('gitPanel.noChangesDesc') }}</p>
      </div>

      <!-- Commit -->
      <div class="commit-box">
        <textarea v-model="commitMessage" class="commit-ta" :placeholder="i18n.t('gitPanel.commitMessage')" rows="2"
          :disabled="isCommitting || gitStore.stagedChanges.length === 0" />
        <button class="commit-btn" @click="handleCommit"
          :disabled="isCommitting || !commitMessage.trim() || gitStore.stagedChanges.length === 0">
          <svg v-if="!isCommitting" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ isCommitting ? '...' : i18n.t('gitPanel.commit') }}
        </button>
      </div>

      <div v-if="gitStore.error" class="error-strip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
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
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 13px;
  }

  /* ===== Empty State ===== */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 6px;
    padding: 28px 20px;
    text-align: center;
  }

  .empty-state.compact {
    padding: 24px 16px;
    flex: 0;
  }

  .empty-circle {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-active) 100%);
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .empty-circle.sm {
    width: 40px;
    height: 40px;
  }

  .empty-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .empty-desc {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.5;
    max-width: 200px;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    background: var(--accent-secondary);
    color: white;
    margin-top: 6px;
    transition: all var(--transition-fast);
  }

  .primary-btn:hover {
    background: var(--accent-secondary-hover);
  }

  /* ===== Branch Bar ===== */
  .branch-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-tertiary);
    min-height: 34px;
  }

  .branch-svg {
    color: var(--accent-secondary);
    flex-shrink: 0;
  }

  .branch-sel {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
  }

  .branch-sel:focus {
    outline: none;
  }

  .branch-sel option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .icon-btn-sm {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .icon-btn-sm:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  /* ===== Sections ===== */
  .section {
    border-bottom: 1px solid var(--border-subtle);
  }

  .section-head {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    cursor: pointer;
    user-select: none;
    transition: background var(--transition-fast);
  }

  .section-head:hover {
    background: var(--bg-hover);
  }

  .chev {
    color: var(--text-muted);
    transition: transform 180ms ease;
    flex-shrink: 0;
  }

  .chev.open {
    transform: rotate(90deg);
  }

  .section-name {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-muted);
  }

  .badge {
    font-size: 10px;
    font-weight: 700;
    padding: 0px 6px;
    border-radius: 10px;
    background: var(--bg-hover);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    line-height: 18px;
  }

  .section-btns {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }

  .sec-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    background: transparent;
  }

  .sec-btn.success {
    color: #4ade80;
  }

  .sec-btn.success:hover {
    background: rgba(34, 197, 94, 0.15);
  }

  .sec-btn.danger {
    color: #f87171;
  }

  .sec-btn.danger:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .sec-btn.warn {
    color: #fbbf24;
  }

  .sec-btn.warn:hover {
    background: rgba(251, 191, 36, 0.15);
  }

  /* ===== File List ===== */
  .file-list {
    display: flex;
    flex-direction: column;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px 3px 26px;
    cursor: pointer;
    transition: background var(--transition-fast);
    min-height: 26px;
  }

  .file-row:hover {
    background: var(--bg-hover);
  }

  .file-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .fname {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fdir {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  }

  .file-right {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }

  .row-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    background: transparent;
  }

  .row-btn.success {
    color: #4ade80;
  }

  .row-btn.success:hover {
    background: rgba(34, 197, 94, 0.2);
  }

  .row-btn.danger {
    color: #f87171;
  }

  .row-btn.danger:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .row-btn.warn {
    color: #fbbf24;
  }

  .row-btn.warn:hover {
    background: rgba(251, 191, 36, 0.2);
  }

  .status-ch {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 800;
    width: 16px;
    text-align: center;
  }

  .st-modified {
    color: #fbbf24;
  }

  .st-added {
    color: #4ade80;
  }

  .st-deleted {
    color: #f87171;
  }

  .st-untracked {
    color: var(--text-muted);
  }

  .st-info {
    color: var(--accent-secondary);
  }

  /* ===== Commit ===== */
  .commit-box {
    margin-top: auto;
    padding: 10px;
    border-top: 1px solid var(--border-default);
    background: var(--bg-tertiary);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .commit-ta {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 12px;
    font-family: var(--font-sans);
    resize: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    line-height: 1.4;
  }

  .commit-ta:focus {
    outline: none;
    border-color: var(--accent-secondary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  .commit-ta::placeholder {
    color: var(--text-muted);
  }

  .commit-ta:disabled {
    opacity: 0.4;
  }

  .commit-btn {
    width: 100%;
    padding: 7px 12px;
    background: var(--accent-primary);
    color: #0B0F14;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all var(--transition-fast);
    box-shadow: 0 1px 6px rgba(34, 197, 94, 0.2);
  }

  .commit-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }

  .commit-btn:not(:disabled):hover {
    background: var(--accent-primary-hover);
    box-shadow: 0 3px 12px rgba(34, 197, 94, 0.3);
  }

  .error-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(239, 68, 68, 0.08);
    border-top: 1px solid rgba(239, 68, 68, 0.15);
    color: #f87171;
    font-size: 11px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  .spin {
    animation: spin 1s linear infinite;
  }
</style>