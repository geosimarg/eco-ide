<script setup lang="ts">
  import { SharedInput } from '@/interfaces/shared_input';

  defineProps<SharedInput>();

  defineEmits<{
    'update:modelValue': [value: string];
  }>();
</script>

<template>
  <div class="input-wrapper">
    <label v-if="label" class="label">{{ label }}</label>
    <input class="input" :type="type || 'text'" :value="modelValue" :placeholder="placeholder" :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
  </div>
</template>

<style scoped>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .input {
    padding: var(--space-sm);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--font-size-md);
    font-family: inherit;
  }

  .input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>