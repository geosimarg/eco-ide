<script setup lang="ts">
import { computed } from 'vue';
import { diffLines, type Change } from 'diff';
import { useI18nStore } from '@/stores/i18n';

const props = defineProps<{
  originalContent: string;
  modifiedContent: string;
  originalLabel?: string;
  modifiedLabel?: string;
}>();

const i18n = useI18nStore();

const diffResult = computed(() => {
  return diffLines(props.originalContent || '', props.modifiedContent || '');
});

const stats = computed(() => {
  let additions = 0;
  let deletions = 0;
  
  for (const part of diffResult.value) {
    if (part.added) {
      additions += part.count || 0;
    } else if (part.removed) {
      deletions += part.count || 0;
    }
  }
  
  return { additions, deletions };
});

function getLineClass(part: Change): string {
  if (part.added) return 'diff-added';
  if (part.removed) return 'diff-removed';
  return '';
}

function getLinePrefix(part: Change): string {
  if (part.added) return '+';
  if (part.removed) return '-';
  return ' ';
}
</script>

<template>
  <div class="diff-viewer">
    <div class="diff-header">
      <div class="diff-labels">
        <span class="label original">{{ originalLabel || i18n.t('diff.original') }}</span>
        <span class="label modified">{{ modifiedLabel || i18n.t('diff.modified') }}</span>
      </div>
      <div class="diff-stats">
        <span class="stat additions">+{{ stats.additions }}</span>
        <span class="stat deletions">-{{ stats.deletions }}</span>
      </div>
    </div>
    
    <div class="diff-content">
      <div v-for="(part, index) in diffResult" :key="index" 
           class="diff-line"
           :class="getLineClass(part)">
        <span class="line-number">{{ part.added || part.removed ? (part.count || 0) : '' }}</span>
        <span class="line-prefix">{{ getLinePrefix(part) }}</span>
        <span class="line-content">{{ part.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--editor-bg);
  font-family: var(--font-mono);
  font-size: 13px;
  overflow: hidden;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--title-bar-bg);
  border-bottom: 1px solid var(--border-color);
}

.diff-labels {
  display: flex;
  gap: 16px;
}

.label {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.label.original {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6b6b;
}

.label.modified {
  background: rgba(100, 255, 100, 0.2);
  color: #69db7c;
}

.diff-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.stat.additions {
  color: #69db7c;
}

.stat.deletions {
  color: #ff6b6b;
}

.diff-content {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.diff-line {
  display: flex;
  padding: 2px 16px;
  white-space: pre;
}

.diff-line.diff-added {
  background: rgba(100, 255, 100, 0.1);
}

.diff-line.diff-removed {
  background: rgba(255, 100, 100, 0.1);
}

.line-number {
  width: 40px;
  color: var(--text-muted);
  text-align: right;
  padding-right: 8px;
  user-select: none;
}

.line-prefix {
  width: 16px;
  color: var(--text-muted);
  user-select: none;
}

.diff-added .line-prefix {
  color: #69db7c;
}

.diff-removed .line-prefix {
  color: #ff6b6b;
}

.line-content {
  flex: 1;
  color: var(--text-primary);
}
</style>