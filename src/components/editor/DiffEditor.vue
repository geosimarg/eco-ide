<script setup lang="ts">
import { ref, computed } from 'vue';
import { diffLines } from 'diff';
import { useI18nStore } from '@/stores/i18n';

const props = defineProps<{
  content: string;
  originalContent: string;
  diffLabel?: string;
}>();

const i18n = useI18nStore();

const diffResult = computed(() => {
  return diffLines(props.originalContent || '', props.content || '');
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

const leftLines = computed(() => {
  const lines: { text: string; type: 'removed' | 'unchanged' | 'empty' }[] = [];
  
  for (const part of diffResult.value) {
    if (part.removed) {
      for (const line of part.value.split('\n')) {
        if (line || part.value.split('\n').length > 1) {
          lines.push({ text: line, type: 'removed' });
        }
      }
    } else if (!part.added) {
      for (const line of part.value.split('\n')) {
        if (line || part.value.split('\n').length > 1) {
          lines.push({ text: line, type: 'unchanged' });
        }
      }
    }
  }
  
  return lines;
});

const rightLines = computed(() => {
  const lines: { text: string; type: 'added' | 'unchanged' | 'empty' }[] = [];
  
  for (const part of diffResult.value) {
    if (part.added) {
      for (const line of part.value.split('\n')) {
        if (line || part.value.split('\n').length > 1) {
          lines.push({ text: line, type: 'added' });
        }
      }
    } else if (!part.removed) {
      for (const line of part.value.split('\n')) {
        if (line || part.value.split('\n').length > 1) {
          lines.push({ text: line, type: 'unchanged' });
        }
      }
    }
  }
  
  return lines;
});

const leftColumn = ref<HTMLElement | null>(null);
const rightColumn = ref<HTMLElement | null>(null);
let isScrolling = false;

function handleLeftScroll() {
  if (isScrolling || !leftColumn.value || !rightColumn.value) return;
  isScrolling = true;
  rightColumn.value.scrollTop = leftColumn.value.scrollTop;
  rightColumn.value.scrollLeft = leftColumn.value.scrollLeft;
  setTimeout(() => { isScrolling = false; }, 10);
}

function handleRightScroll() {
  if (isScrolling || !leftColumn.value || !rightColumn.value) return;
  isScrolling = true;
  leftColumn.value.scrollTop = rightColumn.value.scrollTop;
  leftColumn.value.scrollLeft = rightColumn.value.scrollLeft;
  setTimeout(() => { isScrolling = false; }, 10);
}

function getLeftLineClass(type: string): string {
  if (type === 'removed') return 'diff-removed';
  if (type === 'empty') return 'diff-empty';
  return 'diff-unchanged';
}

function getRightLineClass(type: string): string {
  if (type === 'added') return 'diff-added';
  if (type === 'empty') return 'diff-empty';
  return 'diff-unchanged';
}
</script>

<template>
  <div class="diff-editor">
    <div class="diff-header">
      <div class="diff-label">
        <span class="label original">{{ props.diffLabel || 'Original (HEAD)' }}</span>
        <span class="label modified">{{ i18n.t('diff.modified') }}</span>
      </div>
      <div class="diff-stats">
        <span class="stat additions">+{{ stats.additions }}</span>
        <span class="stat deletions">-{{ stats.deletions }}</span>
      </div>
    </div>
    
    <div class="diff-content">
      <div 
        ref="leftColumn" 
        class="diff-column" 
        @scroll="handleLeftScroll"
      >
        <div 
          v-for="(line, index) in leftLines" 
          :key="'left-' + index"
          :class="['diff-line', getLeftLineClass(line.type)]"
        >
          <span class="line-number">{{ index + 1 }}</span>
          <span class="line-prefix">{{ line.type === 'removed' ? '-' : ' ' }}</span>
          <span class="line-content">{{ line.text }}</span>
        </div>
      </div>
      
      <div 
        ref="rightColumn" 
        class="diff-column" 
        @scroll="handleRightScroll"
      >
        <div 
          v-for="(line, index) in rightLines" 
          :key="'right-' + index"
          :class="['diff-line', getRightLineClass(line.type)]"
        >
          <span class="line-number">{{ index + 1 }}</span>
          <span class="line-prefix">{{ line.type === 'added' ? '+' : ' ' }}</span>
          <span class="line-content">{{ line.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--title-bar-bg);
  border-bottom: 1px solid var(--border-color);
}

.diff-label {
  display: flex;
  gap: 24px;
}

.label {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.label.original {
  color: var(--error);
}

.label.modified {
  color: var(--success);
}

.diff-stats {
  display: flex;
  gap: 12px;
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
}

.stat.additions {
  color: var(--success);
}

.stat.deletions {
  color: var(--error);
}

.diff-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.diff-column {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.diff-line {
  display: flex;
  white-space: pre;
}

.diff-line.diff-removed {
  background: rgba(239, 68, 68, 0.15);
}

.diff-line.diff-added {
  background: rgba(34, 197, 94, 0.15);
}

.diff-line.diff-empty {
  background: var(--bg-tertiary);
  opacity: 0.3;
}

.diff-line.diff-unchanged {
  background: transparent;
}

.line-number {
  width: 40px;
  text-align: right;
  padding-right: 8px;
  color: var(--text-muted);
  flex-shrink: 0;
  user-select: none;
}

.line-prefix {
  width: 16px;
  text-align: center;
  color: var(--text-muted);
  flex-shrink: 0;
  user-select: none;
}

.diff-removed .line-prefix {
  color: var(--error);
}

.diff-added .line-prefix {
  color: var(--success);
}

.line-content {
  flex: 1;
  padding-right: 16px;
}
</style>
