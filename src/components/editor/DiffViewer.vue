<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';
  import { diffLines } from 'diff';
  import { useI18nStore } from '@/stores/i18n';
  import { useGitStore } from '@/stores/git';
  import { useWorkspaceStore } from '@/stores/workspace';

  interface DiffLine {
    type: 'context' | 'added' | 'removed';
    content: string;
    oldNum: number | null;
    newNum: number | null;
  }

  interface DiffChunk {
    id: number;
    removedLines: DiffLine[];
    addedLines: DiffLine[];
    contextBefore: DiffLine[];
    contextAfter: DiffLine[];
    oldStart: number;
    oldCount: number;
    newStart: number;
    newCount: number;
  }

  const props = defineProps<{
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    originalLabel?: string;
    modifiedLabel?: string;
    changeIndex?: number;
    totalChanges?: number;
    diffMode?: 'staged' | 'unstaged';
  }>();

  const emit = defineEmits<{
    (e: 'accept-file'): void;
    (e: 'discard-file'): void;
    (e: 'unstage-file'): void;
    (e: 'previous-file'): void;
    (e: 'next-file'): void;
  }>();

  const i18n = useI18nStore();
  const gitStore = useGitStore();
  const workspaceStore = useWorkspaceStore();

  const chunks = ref<DiffChunk[]>([]);
  const activeChunkIndex = ref(0);
  const containerRef = ref<HTMLElement | null>(null);

  // Internal content state — updated by props initially, then self-managed after hunk ops
  const localOriginal = ref(props.originalContent);
  const localModified = ref(props.modifiedContent);

  const CONTEXT_LINES = 3;

  const additionsCount = computed(() =>
    chunks.value.reduce((acc, c) => acc + c.addedLines.length, 0)
  );
  const deletionsCount = computed(() =>
    chunks.value.reduce((acc, c) => acc + c.removedLines.length, 0)
  );

  const fileName = computed(() => props.filePath.split('/').pop() || '');
  const relativePath = computed(() => {
    if (!workspaceStore.workspacePath) return props.filePath;
    return props.filePath.replace(workspaceStore.workspacePath + '/', '');
  });

  const canGoPrevFile = computed(() => (props.changeIndex ?? 0) > 0);
  const canGoNextFile = computed(() => (props.changeIndex ?? 0) < (props.totalChanges ?? 0) - 1);

  function parseDiff() {
    const diffResult = diffLines(localOriginal.value || '', localModified.value || '');
    const allLines: DiffLine[] = [];
    let oldLine = 1;
    let newLine = 1;

    for (const part of diffResult) {
      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();

      for (const line of lines) {
        if (part.added) {
          allLines.push({ type: 'added', content: line, oldNum: null, newNum: newLine++ });
        } else if (part.removed) {
          allLines.push({ type: 'removed', content: line, oldNum: oldLine++, newNum: null });
        } else {
          allLines.push({ type: 'context', content: line, oldNum: oldLine++, newNum: newLine++ });
        }
      }
    }

    const changeRanges: { start: number; end: number }[] = [];
    let inChange = false;
    let start = 0;

    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i].type !== 'context') {
        if (!inChange) { start = i; inChange = true; }
      } else {
        if (inChange) { changeRanges.push({ start, end: i - 1 }); inChange = false; }
      }
    }
    if (inChange) changeRanges.push({ start, end: allLines.length - 1 });

    const result: DiffChunk[] = [];

    for (let idx = 0; idx < changeRanges.length; idx++) {
      const range = changeRanges[idx];
      const ctxBeforeStart = Math.max(0, range.start - CONTEXT_LINES);
      const ctxAfterEnd = Math.min(allLines.length - 1, range.end + CONTEXT_LINES);
      const contextBefore = allLines.slice(ctxBeforeStart, range.start);
      const contextAfter = allLines.slice(range.end + 1, ctxAfterEnd + 1);
      const changeLines = allLines.slice(range.start, range.end + 1);
      const removedLines = changeLines.filter(l => l.type === 'removed');
      const addedLines = changeLines.filter(l => l.type === 'added');
      const firstOld = removedLines[0]?.oldNum ?? contextBefore[contextBefore.length - 1]?.oldNum ?? 1;
      const firstNew = addedLines[0]?.newNum ?? contextBefore[contextBefore.length - 1]?.newNum ?? 1;

      result.push({
        id: idx,
        removedLines,
        addedLines,
        contextBefore,
        contextAfter,
        oldStart: firstOld,
        oldCount: removedLines.length + contextBefore.length + contextAfter.length,
        newStart: firstNew,
        newCount: addedLines.length + contextBefore.length + contextAfter.length,
      });
    }

    chunks.value = result;
    activeChunkIndex.value = 0;
    nextTick(() => { if (result.length > 0) scrollToChunk(0); });
  }

  // "original" becomes what's currently in the git index (git show :path),
  // "modified" becomes what's on disk — so only UNSTAGED hunks remain visible.
  // In 'staged' mode, it compares HEAD vs INDEX.
  async function reloadContent() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const rel = relativePath.value;

      if (props.diffMode === 'staged') {
        localOriginal.value = await gitStore.getHeadContent(rel);
        try {
          localModified.value = await gitStore.getStagedContent(rel);
        } catch {
          localModified.value = '';
        }
      } else {
        // Index content: what's already staged (may differ from HEAD after partial staging)
        try {
          localOriginal.value = await gitStore.getStagedContent(rel);
        } catch {
          localOriginal.value = await gitStore.getHeadContent(rel);
        }

        // Working tree content
        localModified.value = await invoke<string>('read_file', { path: props.filePath });
      }

      parseDiff();
    } catch (e) {
      // Silently fall back if reload fails
    }
  }

  function scrollToChunk(index: number) {
    const els = containerRef.value?.querySelectorAll('.change-block');
    if (els && els[index]) {
      els[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      activeChunkIndex.value = index;
    }
  }

  function goToPreviousChange() {
    if (activeChunkIndex.value > 0) scrollToChunk(activeChunkIndex.value - 1);
  }

  function goToNextChange() {
    if (activeChunkIndex.value < chunks.value.length - 1) scrollToChunk(activeChunkIndex.value + 1);
  }

  function generateHunkPatch(chunk: DiffChunk): string {
    const rel = relativePath.value;
    let patch = `--- a/${rel}\n+++ b/${rel}\n`;
    patch += `@@ -${chunk.oldStart},${chunk.removedLines.length} +${chunk.newStart},${chunk.addedLines.length} @@\n`;
    for (const line of chunk.removedLines) patch += `-${line.content}\n`;
    for (const line of chunk.addedLines) patch += `+${line.content}\n`;
    return patch;
  }

  async function handleAcceptChunk(chunk: DiffChunk) {
    const patch = generateHunkPatch(chunk);
    await gitStore.stageHunk(relativePath.value, patch);
    await reloadContent();
  }

  async function handleRejectChunk(chunk: DiffChunk) {
    const patch = generateHunkPatch(chunk);
    await gitStore.discardHunk(relativePath.value, patch);
    await reloadContent();
  }

  async function handleUnstageChunk(chunk: DiffChunk) {
    const patch = generateHunkPatch(chunk);
    await gitStore.unstageHunk(relativePath.value, patch);
    await reloadContent();
  }

  async function handleAcceptFile() {
    await gitStore.stageFile(relativePath.value);
    emit('accept-file');
  }

  async function handleDiscardFile() {
    const change = gitStore.changes.find(c => c.path === relativePath.value);
    if (change?.status === 'untracked') {
      await gitStore.deleteFile(relativePath.value);
    } else {
      await gitStore.discardChanges(relativePath.value);
    }
    emit('discard-file');
  }

  async function handleUnstageFile() {
    await gitStore.unstageFile(relativePath.value);
    emit('unstage-file');
  }

  // Sync internal state when props change (e.g. navigating to a different file)
  watch([() => props.filePath, () => props.originalContent, () => props.modifiedContent], () => {
    localOriginal.value = props.originalContent;
    localModified.value = props.modifiedContent;
    parseDiff();
  }, { immediate: true });
</script>

<template>
  <div class="diff-viewer">
    <!-- Header -->
    <div class="diff-header">
      <div class="header-left">
        <svg class="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <div class="header-file-info">
          <span class="header-filename">{{ fileName }}</span>
          <span class="header-path">{{ relativePath }}</span>
        </div>
      </div>
      <div class="header-stats">
        <span class="stat-pill add">+{{ additionsCount }}</span>
        <span class="stat-pill del">−{{ deletionsCount }}</span>
      </div>
    </div>

    <!-- Diff Content -->
    <div class="diff-body" ref="containerRef">
      <div v-if="chunks.length === 0" class="empty-diff">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
          opacity="0.4">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ i18n.t('diff.noChanges') }}</span>
      </div>

      <div v-for="(chunk, idx) in chunks" :key="chunk.id" class="change-block"
        :class="{ active: idx === activeChunkIndex }">
        <!-- Context before -->
        <div v-if="chunk.contextBefore.length > 0" class="context-lines">
          <div v-for="(line, li) in chunk.contextBefore" :key="'cb-' + li" class="diff-line context">
            <span class="ln old">{{ line.oldNum }}</span>
            <span class="ln new">{{ line.newNum }}</span>
            <span class="prefix"> </span>
            <span class="code">{{ line.content }}</span>
          </div>
        </div>

        <!-- Removed block (red) -->
        <div v-if="chunk.removedLines.length > 0" class="removed-block">
          <div v-for="(line, li) in chunk.removedLines" :key="'rm-' + li" class="diff-line removed">
            <span class="ln old">{{ line.oldNum }}</span>
            <span class="ln new"></span>
            <span class="prefix">−</span>
            <span class="code">{{ line.content }}</span>
          </div>
        </div>

        <!-- Added block (green) -->
        <div v-if="chunk.addedLines.length > 0" class="added-block">
          <div v-for="(line, li) in chunk.addedLines" :key="'ad-' + li" class="diff-line added">
            <span class="ln old"></span>
            <span class="ln new">{{ line.newNum }}</span>
            <span class="prefix">+</span>
            <span class="code">{{ line.content }}</span>
          </div>
        </div>

        <!-- Per-chunk actions -->
        <div class="chunk-actions">
          <template v-if="props.diffMode !== 'staged'">
            <button class="chunk-btn accept" @click="handleAcceptChunk(chunk)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ i18n.t('gitPanel.accept') }}
            </button>
            <button class="chunk-btn reject" @click="handleRejectChunk(chunk)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {{ i18n.t('gitPanel.reject') }}
            </button>
          </template>
          <template v-else>
            <button class="chunk-btn reject" @click="handleUnstageChunk(chunk)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {{ i18n.t('gitPanel.unstageFile') || 'Remover do Stage' }}
            </button>
          </template>
        </div>

        <!-- Context after -->
        <div v-if="chunk.contextAfter.length > 0" class="context-lines">
          <div v-for="(line, li) in chunk.contextAfter" :key="'ca-' + li" class="diff-line context">
            <span class="ln old">{{ line.oldNum }}</span>
            <span class="ln new">{{ line.newNum }}</span>
            <span class="prefix"> </span>
            <span class="code">{{ line.content }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="diff-toolbar">
      <button class="tool-btn" :disabled="!canGoPrevFile" @click="emit('previous-file')"
        :title="i18n.t('gitPanel.previousFile')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span class="tool-label">{{ i18n.t('gitPanel.previousFile') }}</span>
      </button>

      <div class="tool-sep"></div>

      <template v-if="props.diffMode !== 'staged'">
        <button class="tool-btn accept-file" @click="handleAcceptFile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span class="tool-label">{{ i18n.t('gitPanel.acceptFile') }}</span>
        </button>

        <button class="tool-btn discard-file" @click="handleDiscardFile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span class="tool-label">{{ i18n.t('gitPanel.discardFileChanges') }}</span>
        </button>
      </template>
      <template v-else>
        <button class="tool-btn discard-file" @click="handleUnstageFile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span class="tool-label">{{ i18n.t('gitPanel.unstageFile') || 'Tirar do Stage' }}</span>
        </button>
      </template>

      <div class="tool-sep"></div>

      <button class="tool-btn" @click="goToPreviousChange" :disabled="activeChunkIndex <= 0"
        :title="i18n.t('gitPanel.previousChange')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <span class="tool-counter">{{ chunks.length > 0 ? `${activeChunkIndex + 1}/${chunks.length}` : '0/0' }}</span>

      <button class="tool-btn" @click="goToNextChange" :disabled="activeChunkIndex >= chunks.length - 1"
        :title="i18n.t('gitPanel.nextChange')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div class="tool-sep"></div>

      <button class="tool-btn" :disabled="!canGoNextFile" @click="emit('next-file')"
        :title="i18n.t('gitPanel.nextFile')">
        <span class="tool-label">{{ i18n.t('gitPanel.nextFile') }}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .diff-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
    overflow: hidden;
  }

  /* ===== Header ===== */
  .diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-default);
    min-height: 44px;
    gap: 16px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .file-icon {
    color: var(--accent-secondary);
    flex-shrink: 0;
  }

  .header-file-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .header-filename {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    font-family: var(--font-sans);
  }

  .header-path {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-stats {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .stat-pill {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 12px;
  }

  .stat-pill.add {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
  }

  .stat-pill.del {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
  }

  /* ===== Diff Body ===== */
  .diff-body {
    flex: 1;
    overflow: auto;
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .empty-diff {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 14px;
  }

  /* ===== Change Block ===== */
  .change-block {
    position: relative;
    margin: 0;
    border-left: 3px solid transparent;
    transition: border-color var(--transition-normal);
  }

  .change-block.active {
    border-left-color: var(--accent-secondary);
  }

  /* Context lines */
  .context-lines {
    background: var(--bg-primary);
  }

  /* Removed block */
  .removed-block {
    background: rgba(239, 68, 68, 0.08);
    border-top: 1px solid rgba(239, 68, 68, 0.15);
    border-bottom: 1px solid rgba(239, 68, 68, 0.08);
  }

  /* Added block */
  .added-block {
    background: rgba(34, 197, 94, 0.08);
    border-top: 1px solid rgba(34, 197, 94, 0.08);
    border-bottom: 1px solid rgba(34, 197, 94, 0.15);
  }

  /* Single diff line */
  .diff-line {
    display: flex;
    align-items: stretch;
    min-height: 22px;
    line-height: 22px;
    white-space: pre;
  }

  .diff-line.context {
    background: var(--bg-primary);
  }

  .diff-line.removed {
    background: rgba(239, 68, 68, 0.1);
  }

  .diff-line.added {
    background: rgba(34, 197, 94, 0.1);
  }

  /* Line numbers */
  .ln {
    display: inline-block;
    width: 50px;
    padding: 0 8px;
    text-align: right;
    font-size: 11px;
    user-select: none;
    flex-shrink: 0;
    color: var(--text-muted);
    opacity: 0.5;
  }

  .ln.old {
    border-right: 1px solid var(--border-subtle);
  }

  .ln.new {
    border-right: 1px solid var(--border-subtle);
  }

  .diff-line.removed .ln {
    color: #f87171;
    opacity: 0.6;
  }

  .diff-line.added .ln {
    color: #4ade80;
    opacity: 0.6;
  }

  /* Prefix (+, -, space) */
  .prefix {
    width: 22px;
    text-align: center;
    flex-shrink: 0;
    user-select: none;
    font-weight: 700;
    font-size: 13px;
  }

  .diff-line.context .prefix {
    color: transparent;
  }

  .diff-line.removed .prefix {
    color: #f87171;
  }

  .diff-line.added .prefix {
    color: #4ade80;
  }

  /* Code content */
  .code {
    flex: 1;
    padding-right: 16px;
    color: var(--text-primary);
  }

  .diff-line.removed .code {
    color: var(--text-secondary);
  }

  /* ===== Per-chunk Actions ===== */
  .chunk-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 6px 16px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-default);
  }

  .chunk-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 14px;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .chunk-btn.accept {
    background: #16a34a;
    color: #fff;
  }

  .chunk-btn.accept:hover {
    background: #15803d;
    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
  }

  .chunk-btn.reject {
    background: #dc2626;
    color: #fff;
  }

  .chunk-btn.reject:hover {
    background: #b91c1c;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }

  /* ===== Toolbar ===== */
  .diff-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-default);
    min-height: 40px;
  }

  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-sans);
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  .tool-btn:hover:not(:disabled) {
    background: var(--bg-active);
    color: var(--text-primary);
  }

  .tool-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .tool-btn.accept-file {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
  }

  .tool-btn.accept-file:hover {
    background: rgba(34, 197, 94, 0.22);
  }

  .tool-btn.discard-file {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
  }

  .tool-btn.discard-file:hover {
    background: rgba(239, 68, 68, 0.22);
  }

  .tool-label {
    white-space: nowrap;
  }

  .tool-sep {
    width: 1px;
    height: 22px;
    background: var(--border-default);
    flex-shrink: 0;
  }

  .tool-counter {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    font-family: var(--font-mono);
    min-width: 36px;
    text-align: center;
    padding: 0 4px;
  }
</style>