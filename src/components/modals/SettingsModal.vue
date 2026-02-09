<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useConfigStore } from '@/stores/config';
import { useGlobalConfigStore } from '@/stores/globalConfig';
import { useI18nStore } from '@/stores/i18n';
import { logger } from '@/utils/logger';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const configStore = useConfigStore();
const globalConfigStore = useGlobalConfigStore();
const i18n = useI18nStore();

const activeTab = ref<'user' | 'workspace'>('user');
const subTab = ref<'general' | 'files' | 'session' | 'json'>('general'); // Sub-abas para organização

// Estado do formulário
const userForm = ref<{
    locale: string;
    hidden_files: string[];
    hidden_folders: string[];
}>({ locale: 'en-US', hidden_files: [], hidden_folders: [] });

const workspaceForm = ref<{
    hidden_files: string[];
    hidden_folders: string[];
}>({ hidden_files: [], hidden_folders: [] });

// Json Fallback
const jsonContent = ref('');
const jsonError = ref<string | null>(null);

// Carregar dados
watch(
    [() => props.visible, activeTab],
    ([isVisible, tab]) => {
        if (isVisible) {
            loadData(tab);
        }
    },
    { immediate: true }
);

function loadData(tab: 'user' | 'workspace') {
    if (tab === 'user') {
        const cfg = globalConfigStore.config;
        userForm.value = {
            locale: cfg.locale || 'en-US',
            hidden_files: [...(cfg.hidden_files || [])],
            hidden_folders: [...(cfg.hidden_folders || [])]
        };
        jsonContent.value = JSON.stringify(cfg, null, 2);
    } else {
        const cfg = configStore.config; // Local config
        workspaceForm.value = {
            hidden_files: [...(cfg.hidden_files || [])],
            hidden_folders: [...(cfg.hidden_folders || [])]
        };
        jsonContent.value = JSON.stringify(cfg, null, 2);
    }
    jsonError.value = null;

    // Reset subtab se necessário
    if (subTab.value === 'json') return;
    subTab.value = tab === 'user' ? 'general' : 'files';
}

// Helpers para listas
const newHiddenFile = ref('');
const newHiddenFolder = ref('');

function addHiddenFile(target: 'user' | 'workspace') {
    const val = newHiddenFile.value.trim();
    if (!val) return;
    const list = target === 'user' ? userForm.value.hidden_files : workspaceForm.value.hidden_files;
    if (!list.includes(val)) {
        list.push(val);
    }
    newHiddenFile.value = '';
}

function removeHiddenFile(target: 'user' | 'workspace', index: number) {
    const list = target === 'user' ? userForm.value.hidden_files : workspaceForm.value.hidden_files;
    list.splice(index, 1);
}

function addHiddenFolder(target: 'user' | 'workspace') {
    const val = newHiddenFolder.value.trim();
    if (!val) return;
    const list = target === 'user' ? userForm.value.hidden_folders : workspaceForm.value.hidden_folders;
    if (!list.includes(val)) {
        list.push(val);
    }
    newHiddenFolder.value = '';
}

function removeHiddenFolder(target: 'user' | 'workspace', index: number) {
    const list = target === 'user' ? userForm.value.hidden_folders : workspaceForm.value.hidden_folders;
    list.splice(index, 1);
}

// Persistência
async function handleSave() {
    try {
        if (activeTab.value === 'user') {
            if (subTab.value === 'json') {
                globalConfigStore.config = JSON.parse(jsonContent.value);
            } else {
                // Merge form into config
                globalConfigStore.config = {
                    ...globalConfigStore.config,
                    locale: userForm.value.locale,
                    hidden_files: userForm.value.hidden_files,
                    hidden_folders: userForm.value.hidden_folders
                };
            }
            await globalConfigStore.saveConfig();

            // Aplicar locale imediatamente
            if (globalConfigStore.config.locale) {
                await i18n.loadLocale(globalConfigStore.config.locale, true);
            }

        } else {
            if (subTab.value === 'json') {
                configStore.config = JSON.parse(jsonContent.value);
            } else {
                configStore.config = {
                    ...configStore.config,
                    hidden_files: workspaceForm.value.hidden_files,
                    hidden_folders: workspaceForm.value.hidden_folders
                };
            }
            await configStore.saveConfig();
        }

        emit('close');
    } catch (e: any) {
        logger.error('Erro ao salvar settings:', e);
        jsonError.value = 'Erro ao salvar: ' + e.message;
    }
}

// Session View
const sessionFiles = computed(() => {
    return configStore.config.session?.groups.flatMap(g => g.files) || [];
});

</script>

<template>
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content">
            <div class="modal-header">
                <h3>{{ i18n.t('settings.title') || 'Settings' }}</h3>
                <div class="tabs">
                    <button :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">
                        User
                    </button>
                    <button :class="{ active: activeTab === 'workspace' }" @click="activeTab = 'workspace'"
                        :disabled="!configStore.workspacePath">
                        Workspace
                    </button>
                </div>
            </div>

            <div class="modal-body-wrapper">
                <!-- Sidebar/Subtabs -->
                <div class="settings-sidebar">
                    <template v-if="activeTab === 'user'">
                        <button :class="{ active: subTab === 'general' }" @click="subTab = 'general'">Geral</button>
                        <button :class="{ active: subTab === 'files' }" @click="subTab = 'files'">Arquivos</button>
                    </template>
                    <template v-else>
                        <button :class="{ active: subTab === 'files' }" @click="subTab = 'files'">Arquivos</button>
                        <button :class="{ active: subTab === 'session' }" @click="subTab = 'session'">Sessão</button>
                    </template>
                    <div class="spacer"></div>
                    <button :class="{ active: subTab === 'json' }" @click="subTab = 'json'" class="json-tab">JSON
                        (Avançado)</button>
                </div>

                <!-- Content Area -->
                <div class="settings-content">

                    <!-- USER: Geral -->
                    <div v-if="activeTab === 'user' && subTab === 'general'" class="form-section">
                        <div class="form-group">
                            <label>Idioma (Language)</label>
                            <select v-model="userForm.locale" class="form-select">
                                <option value="pt-BR">Português (Brasil)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es">Español</option>
                            </select>
                            <p class="help-text">Reinicie a aplicação para garantir que todas as alterações tenham
                                efeito.</p>
                        </div>
                    </div>

                    <!-- USER/WORKSPACE: Arquivos -->
                    <div v-if="subTab === 'files'" class="form-section">
                        <h4>Arquivos Ocultos (Hidden Files)</h4>
                        <p class="help-text">Padrões glob de arquivos para ocultar (ex: *.log)</p>
                        <div class="list-editor">
                            <div class="input-row">
                                <input v-model="newHiddenFile" placeholder="Ex: *.tmp"
                                    @keyup.enter="addHiddenFile(activeTab)" />
                                <button @click="addHiddenFile(activeTab)" class="btn-add">+</button>
                            </div>
                            <ul class="item-list">
                                <li v-for="(item, idx) in (activeTab === 'user' ? userForm.hidden_files : workspaceForm.hidden_files)"
                                    :key="idx">
                                    <span>{{ item }}</span>
                                    <button @click="removeHiddenFile(activeTab, idx)"
                                        class="btn-remove">&times;</button>
                                </li>
                                <li v-if="(activeTab === 'user' ? userForm.hidden_files : workspaceForm.hidden_files).length === 0"
                                    class="empty-list">
                                    Nenhum padrão definido
                                </li>
                            </ul>
                        </div>

                        <h4 class="mt-md">Pastas Ocultas (Hidden Folders)</h4>
                        <p class="help-text">Nomes de pastas para ocultar (ex: node_modules)</p>
                        <div class="list-editor">
                            <div class="input-row">
                                <input v-model="newHiddenFolder" placeholder="Ex: .git"
                                    @keyup.enter="addHiddenFolder(activeTab)" />
                                <button @click="addHiddenFolder(activeTab)" class="btn-add">+</button>
                            </div>
                            <ul class="item-list">
                                <li v-for="(item, idx) in (activeTab === 'user' ? userForm.hidden_folders : workspaceForm.hidden_folders)"
                                    :key="idx">
                                    <span>{{ item }}</span>
                                    <button @click="removeHiddenFolder(activeTab, idx)"
                                        class="btn-remove">&times;</button>
                                </li>
                                <li v-if="(activeTab === 'user' ? userForm.hidden_folders : workspaceForm.hidden_folders).length === 0"
                                    class="empty-list">
                                    Nenhum padrão definido
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- WORKSPACE: Sessão -->
                    <div v-if="activeTab === 'workspace' && subTab === 'session'" class="form-section">
                        <h4>Arquivos na Sessão</h4>
                        <p class="help-text">Arquivos que serão reabertos ao iniciar.</p>
                        <ul class="readonly-list">
                            <li v-for="f in sessionFiles" :key="f.path" class="readonly-item">
                                <span class="path">{{ f.path }}</span>
                                <span class="lang-tag">{{ f.language }}</span>
                            </li>
                            <li v-if="sessionFiles.length === 0" class="empty-list">Nenhum arquivo na sessão salva.</li>
                        </ul>
                    </div>

                    <!-- JSON Editor -->
                    <div v-if="subTab === 'json'" class="json-container">
                        <textarea v-model="jsonContent" class="json-editor" spellcheck="false"></textarea>
                        <div v-if="jsonError" class="error-msg">{{ jsonError }}</div>
                    </div>

                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-cancel" @click="emit('close')">{{ i18n.t('modal.cancel') || 'Cancel' }}</button>
                <button class="btn-primary" @click="handleSave">{{ i18n.t('modal.save') || 'Save' }}</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Base Modal Styles */
.modal-overlay {
    position: fixed;
    top: 30px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    z-index: 100;
}

.modal-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    width: 100%;
    height: 100%;
}

.modal-header {
    padding: var(--space-md) var(--space-xl);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
    flex-shrink: 0;
}

.modal-header h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 500;
    color: var(--text-primary);
}

/* Tabs Header */
.tabs {
    display: flex;
    gap: var(--space-lg);
}

.tabs button {
    background: none;
    border: none;
    padding: var(--space-sm) 0;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-size: var(--font-size-md);
    transition: all var(--transition-fast);
}

.tabs button.active {
    color: var(--accent-primary);
    border-bottom-color: var(--accent-primary);
    font-weight: 500;
}

.tabs button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Layout Split */
.modal-body-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.settings-sidebar {
    width: 200px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-subtle);
    padding: var(--space-md) 0;
    display: flex;
    flex-direction: column;
}

.settings-sidebar button {
    text-align: left;
    background: none;
    border: none;
    padding: var(--space-sm) var(--space-lg);
    color: var(--text-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    border-left: 2px solid transparent;
}

.settings-sidebar button:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
}

.settings-sidebar button.active {
    color: var(--text-primary);
    background: var(--bg-hover);
    border-left-color: var(--accent-primary);
    font-weight: 500;
}

.settings-sidebar .spacer {
    flex: 1;
}

.settings-sidebar .json-tab {
    margin-top: auto;
    border-top: 1px solid var(--border-subtle);
    padding-top: var(--space-md);
    color: var(--text-muted);
}

.settings-content {
    flex: 1;
    padding: var(--space-xl);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* Form Styles */
.form-section {
    max-width: 600px;
}

.form-group {
    margin-bottom: var(--space-lg);
}

.form-group label {
    display: block;
    margin-bottom: var(--space-xs);
    font-weight: 500;
    color: var(--text-primary);
}

.form-select {
    width: 100%;
    padding: var(--space-sm);
    background: var(--bg-input);
    border: 1px solid var(--border-input);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
}

.help-text {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-top: var(--space-xs);
}

h4 {
    margin: 0 0 var(--space-sm) 0;
    color: var(--text-primary);
    font-weight: 500;
}

.mt-md {
    margin-top: var(--space-lg);
}

/* List Editor */
.list-editor {
    border: 1px solid var(--border-input);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    overflow: hidden;
}

.input-row {
    display: flex;
    border-bottom: 1px solid var(--border-subtle);
}

.input-row input {
    flex: 1;
    padding: var(--space-sm);
    background: transparent;
    border: none;
    color: var(--text-primary);
    outline: none;
}

.btn-add {
    background: var(--bg-secondary);
    border: none;
    border-left: 1px solid var(--border-subtle);
    color: var(--text-primary);
    width: 40px;
    cursor: pointer;
    font-size: 18px;
}

.btn-add:hover {
    background: var(--bg-hover);
    color: var(--accent-primary);
}

.item-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
}

.item-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) var(--space-sm);
    border-bottom: 1px solid var(--border-subtle);
}

.item-list li:last-child {
    border-bottom: none;
}

.btn-remove {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 16px;
}

.btn-remove:hover {
    color: var(--error-fg);
}

.empty-list {
    padding: var(--space-md);
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
}

/* Readonly List */
.readonly-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
}

.readonly-item {
    padding: var(--space-sm);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
}

.path {
    font-family: monospace;
    font-size: 0.9em;
}

.lang-tag {
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8em;
}

/* JSON Editor */
.json-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.json-editor {
    flex: 1;
    background: var(--bg-input);
    color: var(--text-primary);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    outline: none;
}

.json-editor:focus {
    border-color: var(--accent-primary);
}

.error-msg {
    color: var(--error-fg);
    margin-top: var(--space-sm);
}

/* Footer */
.modal-footer {
    padding: var(--space-md) var(--space-xl);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
    background: var(--bg-secondary);
    flex-shrink: 0;
}

.btn-primary,
.btn-cancel {
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    cursor: pointer;
    border: 1px solid transparent;
    min-width: 100px;
}

.btn-primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-fg);
    font-weight: 500;
}

.btn-primary:hover {
    background: var(--button-primary-hover);
}

.btn-cancel {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--border-default);
}

.btn-cancel:hover {
    background: var(--bg-hover);
}
</style>
