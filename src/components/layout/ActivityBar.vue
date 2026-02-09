<script setup lang="ts">
import { useUIStore } from '@/stores/ui';
import { useI18nStore } from '@/stores/i18n';

defineProps<{
  activeView: 'files' | 'search' | 'extensions' | 'git';
}>();

const emit = defineEmits<{
  select: [view: 'files' | 'search' | 'extensions' | 'git'];
}>();

const uiStore = useUIStore();
const i18n = useI18nStore();

const views = [
  { id: 'files' as const, icon: 'files', title: 'Explorador' },
  { id: 'search' as const, icon: 'search', title: 'Buscar' },
  { id: 'git' as const, icon: 'git', title: 'Controle de Código' },
  { id: 'extensions' as const, icon: 'extensions', title: 'Extensões' },
];
</script>

<template>
  <div class="activity-bar">
    <div class="top-icons">
      <button v-for="view in views" :key="view.id" class="activity-btn" :class="{ active: activeView === view.id }"
        :title="view.title" @click="emit('select', view.id)">
        <!-- Files Icon -->
        <svg v-if="view.icon === 'files'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.5">
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" />
        </svg>

        <!-- Search Icon -->
        <svg v-else-if="view.icon === 'search'" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="6" />
          <path d="M21 21L15.5 15.5" />
        </svg>

        <!-- Git Icon -->
        <svg v-else-if="view.icon === 'git'" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M12 8V16" />
          <path d="M12 8C12 10 14 12 16 12" />
        </svg>

        <!-- Extensions Icon -->
        <svg v-else-if="view.icon === 'extensions'" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      </button>
    </div>

    <div class="bottom-icons">
      <button class="activity-btn" :title="i18n.t('settings.title')" @click="uiStore.openSettings()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.activity-bar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
}

.top-icons,
.bottom-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xs) 0;
}

.activity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sidebar-width);
  height: var(--sidebar-width);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: color var(--transition-fast);
}

.activity-btn:hover {
  color: var(--text-primary);
}

.activity-btn.active {
  color: var(--text-primary);
}

.activity-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 24px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}
</style>
