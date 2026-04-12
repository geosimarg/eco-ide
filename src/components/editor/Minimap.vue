<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  content: string;
  scrollPercent: number;
}>();

const emit = defineEmits<{
  scrollChange: [percent: number];
}>();

const minimapContainer = ref<HTMLElement | null>(null);

interface LineData {
  lineNumber: number;
  y: number;
  height: number;
}

const lineHeight = 2;
const viewportRatio = 0.05;

const lines = computed(() => {
  const content = props.content;
  const lineCount = content.split('\n').length;
  const result: LineData[] = [];
  
  for (let i = 1; i <= lineCount; i++) {
    result.push({
      lineNumber: i,
      y: (i - 1) * lineHeight,
      height: lineHeight
    });
  }
  
  return result;
});

const totalHeight = computed(() => lines.value.length * lineHeight);

const viewportStyle = computed(() => {
  const percent = props.scrollPercent;
  const top = percent * (totalHeight.value - (totalHeight.value * viewportRatio));
  return {
    top: `${Math.max(0, top)}px`,
    height: `${totalHeight.value * viewportRatio}px`
  };
});

function handleMinimapClick(event: MouseEvent) {
  if (!minimapContainer.value) return;
  
  const rect = minimapContainer.value.getBoundingClientRect();
  const clickY = event.clientY - rect.top;
  const percent = clickY / minimapContainer.value.clientHeight;
  
  emit('scrollChange', Math.max(0, Math.min(1, percent)));
}

function handleMinimapDrag(event: MouseEvent) {
  if (event.buttons !== 1) return;
  handleMinimapClick(event);
}
</script>

<template>
  <div 
    ref="minimapContainer"
    class="minimap"
    @click="handleMinimapClick"
    @mousedown="handleMinimapDrag"
  >
    <div class="minimap-content" :style="{ height: `${totalHeight}%` }">
      <div 
        v-for="line in lines" 
        :key="line.lineNumber"
        class="minimap-line"
        :style="{ 
          top: `${line.y}%`,
          height: `${line.height}%`
        }"
      />
    </div>
    
    <div 
      class="minimap-viewport"
      :style="viewportStyle"
    />
  </div>
</template>

<style scoped>
.minimap {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: var(--editor-gutter-bg, #1e1e1e);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
}

.minimap-content {
  position: relative;
  width: 100%;
}

.minimap-line {
  position: absolute;
  left: 4px;
  right: 4px;
  background: var(--editor-minimap-line, #4a4a4a);
  border-radius: 1px;
  opacity: 0.6;
}

.minimap-viewport {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--editor-minimap-viewport-bg, rgba(100, 100, 255, 0.2));
  border: 1px solid var(--editor-minimap-viewport-border, rgba(100, 100, 255, 0.4));
  border-radius: 2px;
  pointer-events: none;
  transition: top 0.05s ease-out;
}
</style>