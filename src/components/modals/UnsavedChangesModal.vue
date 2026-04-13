<script setup lang="ts">
  import { computed } from 'vue';
  import FileIcon from '@/components/common/FileIcon.vue';
  import type { OpenFile } from '@/interfaces/open_file';

  const props = defineProps<{
    files: OpenFile[];
    visible: boolean;
  }>();

  const emit = defineEmits<{
    save: [];
    discard: [];
    cancel: [];
  }>();

  const title = computed(() => {
    if (props.files.length === 1) {
      return 'Deseja salvar as alterações em "' + props.files[0].name + '"?';
    }
    return `Deseja salvar as alterações em ${props.files.length} arquivos?`;
  });

  const message = computed(() => {
    if (props.files.length === 1) {
      return 'Se você não salvar, as alterações serão perdidas.';
    }
    return 'Se você não salvar, as alterações nos arquivos selecionados serão perdidas.';
  });
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ title }}</h3>
        </div>

        <div class="modal-body">
          <p>{{ message }}</p>
          <ul v-if="files.length > 1" class="file-list">
            <li v-for="file in files" :key="file.id">
              <FileIcon :name="file.name" class="file-icon" />
              {{ file.name }}
            </li>
          </ul>
        </div>

        <div class="modal-footer">
          <button class="btn secondary" @click="emit('discard')">Não Salvar</button>
          <button class="btn secondary" @click="emit('cancel')">Cancelar</button>
          <button class="btn primary" @click="emit('save')">Salvar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 500px;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: modal-appear 0.2s ease-out;
  }

  @keyframes modal-appear {
    from {
      opacity: 0;
      transform: scale(0.95);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
  }

  .modal-header h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .modal-body {
    padding: var(--space-lg);
    color: var(--text-secondary);
  }

  .file-list {
    margin-top: var(--space-md);
    list-style: none;
    max-height: 150px;
    overflow-y: auto;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }

  .file-list li {
    padding: var(--space-xs) var(--space-sm);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-sm);
  }

  .file-list .file-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .file-list li:nth-child(even) {
    background: var(--bg-secondary);
  }

  .modal-footer {
    padding: var(--space-md) var(--space-lg);
    background: var(--bg-secondary);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
    border-top: 1px solid var(--border-subtle);
  }

  .btn {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
  }

  .btn.primary {
    background: var(--accent-primary);
    color: white;
  }

  .btn.primary:hover {
    background: var(--accent-secondary);
  }

  .btn.secondary {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .btn.secondary:hover {
    background: var(--bg-hover);
  }
</style>
