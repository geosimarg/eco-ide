<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { diffLines } from 'diff';
  import { useI18nStore } from '@/stores/i18n';
  import { DiffChunk } from '@/interfaces/diff_chunk';

  const props = defineProps<{
    originalContent: string;
    modifiedContent: string;
    originalLabel?: string;
    modifiedLabel?: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:stagedContent', content: string): void;
    (e: 'accept-all'): void;
    (e: 'reject-all'): void;
    (e: 'accept-chunk', chunkId: string): void;
  }>();

  const i18n = useI18nStore();
  const chunks = ref<DiffChunk[]>([]);
  const stagedChunks = ref<Set<string>>(new Set());

  function parseDiff() {
    const diffResult = diffLines(props.originalContent || '', props.modifiedContent || '');
    const result: DiffChunk[] = [];
    let chunkId = 0;
    let originalLine = 1;
    let modifiedLine = 1;

    let currentChunk: DiffChunk | null = null;
    let originalLines: string[] = [];
    let modifiedLines: string[] = [];

    for (const part of diffResult) {
      const lines = part.value.split('\n').filter((l, i, arr) => i < arr.length - 1 || l !== '');

      for (const line of lines) {
        if (part.added) {
          if (!currentChunk || currentChunk.status === 'unchanged') {
            if (currentChunk) result.push(currentChunk);
            currentChunk = {
              id: `chunk-${chunkId++}`,
              originalStart: originalLine,
              modifiedStart: modifiedLine,
              originalLines: [],
              modifiedLines: [],
              status: 'added'
            };
          }
          modifiedLines.push(line);
          modifiedLine++;
        } else if (part.removed) {
          if (!currentChunk || currentChunk.status === 'unchanged') {
            if (currentChunk) result.push(currentChunk);
            currentChunk = {
              id: `chunk-${chunkId++}`,
              originalStart: originalLine,
              modifiedStart: modifiedLine,
              originalLines: [],
              modifiedLines: [],
              status: 'removed'
            };
          }
          originalLines.push(line);
          originalLine++;
        } else {
          if (currentChunk && currentChunk.status !== 'unchanged') {
            currentChunk.originalLines = [...originalLines];
            currentChunk.modifiedLines = [...modifiedLines];
            result.push(currentChunk);
            currentChunk = null;
            originalLines = [];
            modifiedLines = [];
          }
          currentChunk = {
            id: `chunk-${chunkId++}`,
            originalStart: originalLine,
            modifiedStart: modifiedLine,
            originalLines: [line],
            modifiedLines: [line],
            status: 'unchanged'
          };
          result.push(currentChunk);
          currentChunk = null;
          originalLine++;
          modifiedLine++;
        }
      }
    }

    if (currentChunk && currentChunk.status !== 'unchanged') {
      currentChunk.originalLines = [...originalLines];
      currentChunk.modifiedLines = [...modifiedLines];
      result.push(currentChunk);
    }

    chunks.value = result;
  }

  watch([() => props.originalContent, () => props.modifiedContent], parseDiff, { immediate: true });

  function toggleChunk(chunkId: string) {
    if (stagedChunks.value.has(chunkId)) {
      stagedChunks.value.delete(chunkId);
    } else {
      stagedChunks.value.add(chunkId);
      emit('accept-chunk', chunkId);
    }
    stagedChunks.value = new Set(stagedChunks.value);
    updateStagedContent();
  }

  function acceptAll() {
    chunks.value.forEach(c => stagedChunks.value.add(c.id));
    stagedChunks.value = new Set(stagedChunks.value);
    updateStagedContent();
    emit('accept-all');
  }

  function rejectAll() {
    stagedChunks.value.clear();
    stagedChunks.value = new Set(stagedChunks.value);
    updateStagedContent();
    emit('reject-all');
  }

  function updateStagedContent() {
    const lines: string[] = [];

    for (const chunk of chunks.value) {
      if (stagedChunks.value.has(chunk.id)) {
        lines.push(...chunk.modifiedLines);
      } else {
        lines.push(...chunk.originalLines);
      }
    }

    emit('update:stagedContent', lines.join('\n'));
  }

  const stats = computed(() => {
    let additions = 0;
    let deletions = 0;
    let stagedAdditions = 0;
    let stagedDeletions = 0;

    for (const chunk of chunks.value) {
      if (chunk.status === 'added' || chunk.status === 'modified') {
        additions += chunk.modifiedLines.length;
        if (stagedChunks.value.has(chunk.id)) {
          stagedAdditions += chunk.modifiedLines.length;
        }
      }
      if (chunk.status === 'removed' || chunk.status === 'modified') {
        deletions += chunk.originalLines.length;
        if (!stagedChunks.value.has(chunk.id)) {
          stagedDeletions += chunk.originalLines.length;
        }
      }
    }

    return { additions, deletions, stagedAdditions, stagedDeletions };
  });

  function getChunkStatus(chunk: DiffChunk) {
    if (chunk.status === 'unchanged') return 'unchanged';
    if (stagedChunks.value.has(chunk.id)) return 'accepted';
    return 'rejected';
  }
</script>

<template>
  <div class="diff-staging">
    <div class="diff-header">
      <div class="diff-labels">
        <span class="label original">{{ originalLabel || 'Original (HEAD)' }}</span>
        <span class="arrow">→</span>
        <span class="label modified">{{ modifiedLabel || 'Modificado' }}</span>
      </div>

      <div class="diff-actions">
        <button class="action-btn accept" @click="acceptAll">
          ✓ {{ i18n.t('diff.acceptAll') }}
        </button>
        <button class="action-btn reject" @click="rejectAll">
          ✗ {{ i18n.t('diff.rejectAll') }}
        </button>
      </div>

      <div class="diff-stats">
        <span class="stat add">+{{ stats.additions }}</span>
        <span class="stat del">-{{ stats.deletions }}</span>
        <span class="divider">|</span>
        <span class="stat staged">Aceitos: +{{ stats.stagedAdditions }} / -{{ stats.stagedDeletions }}</span>
      </div>
    </div>

    <div class="diff-content">
      <div v-for="chunk in chunks" :key="chunk.id" class="diff-chunk" :class="getChunkStatus(chunk)">
        <div v-if="chunk.status === 'unchanged'" class="unchanged-block">
          <div class="chunk-lines">
            <div v-for="(line, idx) in chunk.originalLines" :key="idx" class="line">
              <span class="line-num">{{ chunk.originalStart + idx }}</span>
              <span class="line-content">{{ line }}</span>
            </div>
          </div>
        </div>

        <div v-else class="changed-block">
          <div class="original-side">
            <div class="side-header">
              <span class="side-label">{{ originalLabel || 'Original' }}</span>
            </div>
            <div class="chunk-lines original">
              <div v-for="(line, idx) in chunk.originalLines" :key="idx" class="line removed">
                <span class="line-num">{{ chunk.originalStart + idx }}</span>
                <span class="line-prefix">-</span>
                <span class="line-content">{{ line }}</span>
              </div>
              <div v-if="chunk.originalLines.length === 0" class="empty-side">
                (vazio)
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-accept" :class="{ active: stagedChunks.has(chunk.id) }" @click="toggleChunk(chunk.id)"
              :title="stagedChunks.has(chunk.id) ? 'Rejeitar esta alteração' : 'Aceitar esta alteração'">
              <span v-if="stagedChunks.has(chunk.id)">✓</span>
              <span v-else>→</span>
            </button>
          </div>

          <div class="modified-side">
            <div class="side-header">
              <span class="side-label">{{ modifiedLabel || 'Modificado' }}</span>
            </div>
            <div class="chunk-lines modified">
              <div v-for="(line, idx) in chunk.modifiedLines" :key="idx" class="line added">
                <span class="line-num">{{ chunk.modifiedStart + idx }}</span>
                <span class="line-prefix">+</span>
                <span class="line-content">{{ line }}</span>
              </div>
              <div v-if="chunk.modifiedLines.length === 0" class="empty-side">
                (vazio)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="chunks.length === 0" class="no-changes">
        {{ i18n.t('diff.noChanges') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
  .diff-staging {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
    font-family: var(--font-mono);
    font-size: 13px;
    overflow: hidden;
  }

  .diff-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 16px;
    background: var(--title-bar-bg);
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
  }

  .diff-labels {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-sans);
  }

  .label.original {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .label.modified {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .arrow {
    color: var(--text-muted);
    font-size: 16px;
  }

  .diff-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 14px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-btn.accept {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .action-btn.accept:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  .action-btn.reject {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .action-btn.reject:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .diff-stats {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-family: var(--font-sans);
    margin-left: auto;
  }

  .stat.add {
    color: #22c55e;
  }

  .stat.del {
    color: #ef4444;
  }

  .divider {
    color: var(--text-muted);
  }

  .stat.staged {
    color: var(--text-secondary);
  }

  .diff-content {
    flex: 1;
    overflow: auto;
    padding: 8px 0;
  }

  .diff-chunk {
    margin: 4px 16px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .diff-chunk.accepted {
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
  }

  .diff-chunk.rejected {
    border-color: rgba(239, 68, 68, 0.3);
    opacity: 0.7;
  }

  .unchanged-block {
    background: var(--bg-primary);
  }

  .unchanged-block .chunk-lines {
    padding: 0;
  }

  .changed-block {
    display: flex;
    background: var(--bg-secondary);
  }

  .original-side,
  .modified-side {
    flex: 1;
    min-width: 0;
  }

  .side-header {
    padding: 4px 12px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
  }

  .side-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
    font-family: var(--font-sans);
  }

  .original-side .side-label {
    color: #ef4444;
  }

  .modified-side .side-label {
    color: #22c55e;
  }

  .chunk-lines {
    padding: 4px 0;
  }

  .line {
    display: flex;
    padding: 1px 12px;
    white-space: pre;
  }

  .line-num {
    width: 36px;
    text-align: right;
    padding-right: 8px;
    color: var(--text-muted);
    font-size: 11px;
    flex-shrink: 0;
    user-select: none;
  }

  .line-prefix {
    width: 14px;
    text-align: center;
    flex-shrink: 0;
    user-select: none;
  }

  .line-content {
    flex: 1;
    color: var(--text-primary);
  }

  .line.added {
    background: rgba(34, 197, 94, 0.1);
  }

  .line.added .line-prefix {
    color: #22c55e;
  }

  .line.removed {
    background: rgba(239, 68, 68, 0.1);
  }

  .line.removed .line-prefix {
    color: #ef4444;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    background: var(--bg-tertiary);
  }

  .btn-accept {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-accept:hover {
    border-color: #22c55e;
    color: #22c55e;
  }

  .btn-accept.active {
    background: #22c55e;
    border-color: #22c55e;
    color: white;
  }

  .empty-side {
    padding: 20px;
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    font-size: 12px;
    font-family: var(--font-sans);
  }

  .no-changes {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-muted);
    font-size: 14px;
    font-family: var(--font-sans);
  }
</style>