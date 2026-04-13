<script setup lang="ts">
  import type { SharedButton } from '@/interfaces/shared_button';

  defineProps<SharedButton>();

  defineEmits<{
    click: [event: MouseEvent];
  }>();
</script>

<template>
  <button class="btn" :class="[variant || 'primary', size || 'md']" :disabled="disabled"
    @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<style scoped>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    border: none;
    border-radius: var(--radius-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sm {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
  }

  .md {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-md);
  }

  .lg {
    padding: var(--space-md) var(--space-lg);
    font-size: var(--font-size-lg);
  }

  .primary {
    background: var(--accent-primary);
    color: white;
  }

  .primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .secondary {
    background: var(--bg-hover);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .secondary:hover:not(:disabled) {
    background: var(--border-color);
  }

  .ghost {
    background: transparent;
    color: var(--text-secondary);
  }

  .ghost:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
</style>