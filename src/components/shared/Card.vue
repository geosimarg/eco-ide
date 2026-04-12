<script setup lang="ts">
defineProps<{
  padding?: 'sm' | 'md' | 'lg';
}>();
</script>

<template>
  <div class="card" :class="padding || 'md'">
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.sm { padding: var(--space-sm); }
.md { padding: var(--space-md); }
.lg { padding: var(--space-lg); }
</style>