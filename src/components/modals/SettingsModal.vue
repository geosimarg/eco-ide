<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConfigStore } from '@/stores/config';
import { useGlobalConfigStore } from '@/stores/globalConfig';
import { useI18nStore } from '@/stores/i18n';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const configStore = useConfigStore();
const globalConfigStore = useGlobalConfigStore();
const i18n = useI18nStore();

type Tab = 'user' | 'workspace';
type SubTab = 'appearance' | 'editor' | 'files' | 'behavior' | 'session';
const activeTab = ref<Tab>('user');
const subTab = ref<SubTab>('appearance');

const form = ref({
    locale: 'pt-BR',
    theme: 'dark' as 'dark' | 'light',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    tabSize: 4,
    wordWrap: false,
    minimap: true,
    lineNumbers: true,
    autoSave: false,
    autoSaveInterval: 30,
    confirmExit: true,
    restoreSession: true,
    hiddenFiles: [] as string[],
    hiddenFolders: [] as string[],
});

watch(() => props.visible, (isVisible) => {
    if (isVisible) loadData();
});

function loadData() {
    const cfg = activeTab.value === 'user' 
        ? globalConfigStore.config as any
        : configStore.config as any;
    
    form.value = {
        locale: cfg.locale || 'pt-BR',
        theme: cfg.theme || 'dark',
        fontSize: cfg.fontSize || 14,
        fontFamily: cfg.fontFamily || 'JetBrains Mono, Fira Code, monospace',
        tabSize: cfg.tabSize || 4,
        wordWrap: cfg.wordWrap || false,
        minimap: cfg.minimap !== false,
        lineNumbers: cfg.lineNumbers !== false,
        autoSave: cfg.autoSave || false,
        autoSaveInterval: cfg.autoSaveInterval || 30,
        confirmExit: cfg.confirmExit !== false,
        restoreSession: cfg.restoreSession !== false,
        hiddenFiles: [...(cfg.hidden_files || [])],
        hiddenFolders: [...(cfg.hidden_folders || [])],
    };
}

const hiddenFileInput = ref('');
const hiddenFolderInput = ref('');

function addHiddenFile() {
    const val = hiddenFileInput.value.trim();
    if (val && !form.value.hiddenFiles.includes(val)) {
        form.value.hiddenFiles.push(val);
    }
    hiddenFileInput.value = '';
}

function removeHiddenFile(idx: number) {
    form.value.hiddenFiles.splice(idx, 1);
}

function addHiddenFolder() {
    const val = hiddenFolderInput.value.trim();
    if (val && !form.value.hiddenFolders.includes(val)) {
        form.value.hiddenFolders.push(val);
    }
    hiddenFolderInput.value = '';
}

function removeHiddenFolder(idx: number) {
    form.value.hiddenFolders.splice(idx, 1);
}

async function handleSave() {
    const cfg = globalConfigStore.config as any;
    
    if (activeTab.value === 'user') {
        globalConfigStore.config = {
            ...globalConfigStore.config,
            locale: form.value.locale,
            theme: form.value.theme,
            fontSize: form.value.fontSize,
            fontFamily: form.value.fontFamily,
            tabSize: form.value.tabSize,
            wordWrap: form.value.wordWrap,
            minimap: form.value.minimap,
            lineNumbers: form.value.lineNumbers,
            autoSave: form.value.autoSave,
            autoSaveInterval: form.value.autoSaveInterval,
            confirmExit: form.value.confirmExit,
            restoreSession: form.value.restoreSession,
            hidden_files: form.value.hiddenFiles,
            hidden_folders: form.value.hiddenFolders,
        } as any;
        await globalConfigStore.saveConfig();
        if (form.value.locale !== (cfg.locale || i18n.currentLocale)) {
            await i18n.loadLocale(form.value.locale, true);
        }
    } else {
        configStore.config = {
            ...configStore.config,
            hidden_files: form.value.hiddenFiles,
            hidden_folders: form.value.hiddenFolders,
            tabSize: form.value.tabSize,
            wordWrap: form.value.wordWrap,
            minimap: form.value.minimap,
            lineNumbers: form.value.lineNumbers,
        } as any;
        await configStore.saveConfig();
    }

    emit('close');
}

const sidebarItems = [
    { id: 'appearance', icon: '🎨', label: 'Appearance' },
    { id: 'editor', icon: '📝', label: 'Editor' },
    { id: 'files', icon: '📁', label: 'Files' },
    { id: 'behavior', icon: '⚡', label: 'Behavior' },
];

if (activeTab.value === 'workspace') {
    sidebarItems.push({ id: 'session', icon: '📂', label: 'Session' });
}
</script>

<template>
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="settings-modal">
            <div class="settings-header">
                <h2>Settings</h2>
                <div class="header-tabs">
                    <button :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">User</button>
                    <button :class="{ active: activeTab === 'workspace' }" @click="activeTab = 'workspace'" :disabled="!configStore.workspacePath">Workspace</button>
                </div>
            </div>

            <div class="settings-body">
                <div class="settings-nav">
                    <button v-for="item in sidebarItems" :key="item.id" :class="{ active: subTab === item.id }" @click="subTab = item.id as SubTab">
                        <span class="nav-icon">{{ item.icon }}</span>
                        <span>{{ item.label }}</span>
                    </button>
                </div>

                <div class="settings-content">
                    <!-- Appearance -->
                    <div v-if="subTab === 'appearance'" class="settings-section">
                        <h3>Appearance</h3>
                        
                        <div class="form-group">
                            <label>Theme</label>
                            <select v-model="form.theme">
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Font Size</label>
                            <input type="number" v-model="form.fontSize" min="10" max="32" />
                        </div>

                        <div class="form-group">
                            <label>Font Family</label>
                            <input type="text" v-model="form.fontFamily" placeholder="JetBrains Mono, Fira Code, monospace" />
                        </div>

                        <div class="form-group">
                            <label>Language</label>
                            <select v-model="form.locale">
                                <option value="pt-BR">Português (Brasil)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                    </div>

                    <!-- Editor -->
                    <div v-if="subTab === 'editor'" class="settings-section">
                        <h3>Editor</h3>
                        
                        <div class="form-group">
                            <label>Tab Size</label>
                            <select v-model.number="form.tabSize">
                                <option :value="2">2 spaces</option>
                                <option :value="4">4 spaces</option>
                                <option :value="8">8 spaces</option>
                            </select>
                        </div>

                        <div class="form-group checkbox">
                            <input type="checkbox" id="wordWrap" v-model="form.wordWrap" />
                            <label for="wordWrap">Word Wrap</label>
                        </div>

                        <div class="form-group checkbox">
                            <input type="checkbox" id="minimap" v-model="form.minimap" />
                            <label for="minimap">Minimap</label>
                        </div>

                        <div class="form-group checkbox">
                            <input type="checkbox" id="lineNumbers" v-model="form.lineNumbers" />
                            <label for="lineNumbers">Line Numbers</label>
                        </div>
                    </div>

                    <!-- Files -->
                    <div v-if="subTab === 'files'" class="settings-section">
                        <h3>Files</h3>
                        
                        <div class="form-group">
                            <label>Hidden Files (glob patterns)</label>
                            <div class="list-input">
                                <input v-model="hiddenFileInput" placeholder="*.log, *.tmp" @keyup.enter="addHiddenFile" />
                                <button @click="addHiddenFile">+</button>
                            </div>
                            <ul class="tag-list">
                                <li v-for="(item, idx) in form.hiddenFiles" :key="idx">
                                    <span>{{ item }}</span>
                                    <button @click="removeHiddenFile(idx)">×</button>
                                </li>
                            </ul>
                        </div>

                        <div class="form-group">
                            <label>Hidden Folders</label>
                            <div class="list-input">
                                <input v-model="hiddenFolderInput" placeholder="node_modules, .git" @keyup.enter="addHiddenFolder" />
                                <button @click="addHiddenFolder">+</button>
                            </div>
                            <ul class="tag-list">
                                <li v-for="(item, idx) in form.hiddenFolders" :key="idx">
                                    <span>{{ item }}</span>
                                    <button @click="removeHiddenFolder(idx)">×</button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Behavior -->
                    <div v-if="subTab === 'behavior'" class="settings-section">
                        <h3>Behavior</h3>
                        
                        <div class="form-group checkbox">
                            <input type="checkbox" id="autoSave" v-model="form.autoSave" />
                            <label for="autoSave">Auto Save</label>
                        </div>

                        <div v-if="form.autoSave" class="form-group">
                            <label>Auto Save Interval (seconds)</label>
                            <input type="number" v-model.number="form.autoSaveInterval" min="5" max="300" />
                        </div>

                        <div class="form-group checkbox">
                            <input type="checkbox" id="confirmExit" v-model="form.confirmExit" />
                            <label for="confirmExit">Confirm Before Exit</label>
                        </div>

                        <div class="form-group checkbox">
                            <input type="checkbox" id="restoreSession" v-model="form.restoreSession" />
                            <label for="restoreSession">Restore Session on Start</label>
                        </div>
                    </div>

                    <!-- Session (Workspace only) -->
                    <div v-if="activeTab === 'workspace' && subTab === 'session'" class="settings-section">
                        <h3>Session</h3>
                        <p class="help-text">Arquivos abertos serão restaurados ao iniciar.</p>
                    </div>
                </div>
            </div>

            <div class="settings-footer">
                <button class="btn-cancel" @click="emit('close')">Cancel</button>
                <button class="btn-save" @click="handleSave">Save</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.settings-modal {
    width: 800px;
    height: 600px;
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-default);
    overflow: hidden;
}

.settings-header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.settings-header h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
}

.header-tabs {
    display: flex;
    gap: var(--space-sm);
}

.header-tabs button {
    padding: var(--space-sm) var(--space-md);
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
}

.header-tabs button.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: white;
}

.settings-body {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.settings-nav {
    width: 180px;
    background: var(--bg-secondary);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.settings-nav button {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    text-align: left;
    font-size: var(--font-size-sm);
}

.settings-nav button:hover {
    background: var(--bg-hover);
}

.settings-nav button.active {
    background: var(--bg-hover);
    color: var(--text-primary);
}

.nav-icon {
    width: 20px;
}

.settings-content {
    flex: 1;
    padding: var(--space-xl);
    overflow-y: auto;
}

.settings-section h3 {
    margin: 0 0 var(--space-lg) 0;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
}

.form-group {
    margin-bottom: var(--space-lg);
}

.form-group label {
    display: block;
    margin-bottom: var(--space-xs);
    color: var(--text-primary);
    font-weight: 500;
}

.form-group.checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.form-group.checkbox label {
    margin: 0;
    font-weight: 400;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
    width: 100%;
    padding: var(--space-sm);
    background: var(--bg-input);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
}

.list-input {
    display: flex;
    gap: var(--space-sm);
}

.list-input input {
    flex: 1;
}

.list-input button {
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    cursor: pointer;
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    list-style: none;
    padding: 0;
    margin: var(--space-sm) 0 0 0;
}

.tag-list li {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
}

.tag-list li button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    font-size: var(--font-size-md);
}

.tag-list li button:hover {
    color: var(--error-fg);
}

.help-text {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.settings-footer {
    padding: var(--space-lg);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
}

.btn-cancel {
    padding: var(--space-sm) var(--space-lg);
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    cursor: pointer;
}

.btn-save {
    padding: var(--space-sm) var(--space-lg);
    background: var(--accent-primary);
    border: none;
    border-radius: var(--radius-sm);
    color: white;
    cursor: pointer;
    font-weight: 500;
}
</style>