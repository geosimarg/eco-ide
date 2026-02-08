<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useI18nStore } from '@/stores/i18n';

const i18n = useI18nStore();

const props = defineProps<{
    visible: boolean;
    parentPath: string;
}>();

const emit = defineEmits<{
    create: [folderName: string];
    cancel: [];
}>();

const folderName = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.visible, (newValue) => {
    if (newValue) {
        folderName.value = '';
        nextTick(() => {
            inputRef.value?.focus();
        });
    }
});

function handleSave() {
    if (!folderName.value.trim()) return;
    emit('create', folderName.value.trim());
}

function handleCancel() {
    emit('cancel');
}
</script>

<template>
    <Teleport to="body">
        <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ i18n.t('new_folder_modal.title') }}</h3>
                </div>

                <div class="modal-body">
                    <p class="path-info">{{ i18n.t('new_folder_modal.create_in') }}: <span>{{ parentPath }}</span></p>
                    <div class="input-group">
                        <input ref="inputRef" v-model="folderName" type="text"
                            :placeholder="i18n.t('new_folder_modal.placeholder')" @keydown.enter="handleSave"
                            @keydown.esc="handleCancel" />
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn secondary" @click="handleCancel">{{ i18n.t('new_folder_modal.cancel') }}</button>
                    <button class="btn primary" @click="handleSave" :disabled="!folderName.trim()">{{
                        i18n.t('new_folder_modal.create') }}</button>
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
    animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
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
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.path-info {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.path-info span {
    font-family: monospace;
    color: var(--text-secondary);
}

.input-group input {
    width: 100%;
    padding: var(--space-md);
    background: var(--bg-input);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--font-size-md);
    outline: none;
    transition: border-color var(--transition-fast);
}

.input-group input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-focus);
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

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn.primary {
    background: var(--accent-primary);
    color: white;
}

.btn.primary:hover:not(:disabled) {
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
