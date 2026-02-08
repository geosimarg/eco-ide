import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { logger } from '@/utils/logger';
import { useConfigStore } from './config';

export interface OpenFile {
    id: string;
    name: string;
    path: string;
    content: string;
    modified: boolean;
    language: string;
}

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileEntry[];
    expanded?: boolean;
}

export const useWorkspaceStore = defineStore('workspace', () => {
    // Estado
    const workspacePath = ref<string | null>(null);
    const workspaceName = ref<string>('');
    const files = ref<FileEntry[]>([]);
    const openFiles = ref<OpenFile[]>([]);
    const activeFileId = ref<string | null>(null);

    // Getters
    const activeFile = computed(() => {
        if (!activeFileId.value) return null;
        return openFiles.value.find(f => f.id === activeFileId.value) || null;
    });

    const hasUnsavedChanges = computed(() => {
        return openFiles.value.some(f => f.modified);
    });

    // Actions
    function setWorkspace(path: string, name: string) {
        workspacePath.value = path;
        workspaceName.value = name;
        // Limpar arquivos abertos ao mudar de workspace
        openFiles.value = [];
        activeFileId.value = null;
    }

    function setFiles(entries: FileEntry[]) {
        files.value = entries;
    }

    function openFile(entry: { name: string; path: string; content: string }) {
        // Verificar se já está aberto
        const existing = openFiles.value.find(f => f.path === entry.path);
        if (existing) {
            activeFileId.value = existing.id;
            return existing.id;
        }

        const configStore = useConfigStore();
        const languageOverride = configStore.getLanguageForFile(entry.path);

        // Criar novo arquivo aberto
        const newFile: OpenFile = {
            id: crypto.randomUUID(),
            name: entry.name,
            path: entry.path,
            content: entry.content,
            modified: false,
            language: languageOverride || getLanguageFromPath(entry.path),
        };

        openFiles.value.push(newFile);
        activeFileId.value = newFile.id;
        return newFile.id;
    }

    function closeFile(id: string) {
        const index = openFiles.value.findIndex(f => f.id === id);
        if (index === -1) return;

        openFiles.value.splice(index, 1);

        // Se fechou o arquivo ativo, ativar o próximo ou anterior
        if (activeFileId.value === id) {
            if (openFiles.value.length > 0) {
                const newIndex = Math.min(index, openFiles.value.length - 1);
                activeFileId.value = openFiles.value[newIndex].id;
            } else {
                activeFileId.value = null;
            }
        }
    }

    function setActiveFile(id: string) {
        const exists = openFiles.value.find(f => f.id === id);
        if (exists) {
            activeFileId.value = id;
        }
    }

    function updateFileContent(id: string, content: string) {
        const file = openFiles.value.find(f => f.id === id);
        if (file) {
            file.content = content;
            file.modified = true;
        }
    }

    function markFileSaved(id: string) {
        const file = openFiles.value.find(f => f.id === id);
        if (file) {
            file.modified = false;
        }
    }

    function toggleDirectory(path: string) {
        function findAndToggle(entries: FileEntry[]): boolean {
            for (const entry of entries) {
                if (entry.path === path && entry.isDirectory) {
                    entry.expanded = !entry.expanded;
                    return true;
                }
                if (entry.children && findAndToggle(entry.children)) {
                    return true;
                }
            }
            return false;
        }
        findAndToggle(files.value);
    }

    async function openFolder(path: string) {
        const { invoke } = await import('@tauri-apps/api/core');
        try {
            const entries = await invoke<FileEntry[]>('list_directory', { path });
            const folderName = path.split('/').pop() || path.split('\\').pop() || 'Workspace';
            setWorkspace(path, folderName);
            setFiles(entries);
        } catch (error) {
            logger.error('Erro ao abrir pasta:', error);
        }
    }

    function createNewFile() {
        const newFile: OpenFile = {
            id: crypto.randomUUID(),
            name: 'Sem título',
            path: '',
            content: '',
            modified: true,
            language: 'Plain Text',
        };
        openFiles.value.push(newFile);
        activeFileId.value = newFile.id;
    }

    function saveFile(id: string, newPath: string, keepLanguage?: boolean) {
        const file = openFiles.value.find(f => f.id === id);
        if (file) {
            file.path = newPath;
            file.name = newPath.split('/').pop() || newPath.split('\\').pop() || file.name;
            file.modified = false;
            // Só atualiza linguagem se não houver override do usuário
            if (!keepLanguage) {
                file.language = getLanguageFromPath(newPath);
            }
        }
    }

    // Modal de confirmação
    const showUnsavedChangesModal = ref(false);
    const unsavedFilesForModal = ref<OpenFile[]>([]);
    let resolveModalPromise: ((choice: 'save' | 'discard' | 'cancel') => void) | null = null;

    function requestCloseConfirmation(files: OpenFile[]): Promise<'save' | 'discard' | 'cancel'> {
        unsavedFilesForModal.value = files;
        showUnsavedChangesModal.value = true;
        return new Promise((resolve) => {
            resolveModalPromise = resolve;
        });
    }

    function handleModalChoice(choice: 'save' | 'discard' | 'cancel') {
        showUnsavedChangesModal.value = false;
        if (resolveModalPromise) {
            resolveModalPromise(choice);
            resolveModalPromise = null;
        }
    }

    function setFileLanguage(id: string, language: string) {
        const file = openFiles.value.find(f => f.id === id);
        if (file) {
            file.language = language;
        }
    }

    async function closeFileWithConfirmation(id: string) {
        const file = openFiles.value.find(f => f.id === id);
        if (!file) return;

        if (file.modified) {
            const choice = await requestCloseConfirmation([file]);
            if (choice === 'cancel') return;
            if (choice === 'save') {
                if (file.path) {
                    await saveFile(file.id, file.path, true);
                    const { invoke } = await import('@tauri-apps/api/core');
                    await invoke('write_file', { path: file.path, content: file.content });
                }
            }
            if (choice === 'discard' || (choice === 'save' && file.path)) {
                closeFile(id);
            }
            return choice;
        } else {
            closeFile(id);
            return 'discard';
        }
    }

    async function closeWindowWithConfirmation(): Promise<boolean> {
        const modifiedFiles = openFiles.value.filter(f => f.modified);
        if (modifiedFiles.length === 0) return true;

        const choice = await requestCloseConfirmation(modifiedFiles);
        if (choice === 'cancel') return false;

        if (choice === 'save') {
            const { invoke } = await import('@tauri-apps/api/core');
            for (const file of modifiedFiles) {
                if (file.path) {
                    await saveFile(file.id, file.path, true);
                    await invoke('write_file', { path: file.path, content: file.content });
                }
            }
            const stillModified = openFiles.value.some(f => f.modified);
            if (stillModified) return false;
        }

        return true;
    }

    return {
        // Estado
        workspacePath,
        workspaceName,
        files,
        openFiles,
        activeFileId,
        showUnsavedChangesModal,
        unsavedFilesForModal,
        // Getters
        activeFile,
        hasUnsavedChanges,
        // Actions
        setWorkspace,
        setFiles,
        openFile,
        closeFile,
        setActiveFile,
        updateFileContent,
        markFileSaved,
        toggleDirectory,
        openFolder,
        createNewFile,
        saveFile,
        setFileLanguage,
        requestCloseConfirmation,
        handleModalChoice,
        closeFileWithConfirmation,
        closeWindowWithConfirmation,
    };
});

// Helpers
function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languages: Record<string, string> = {
        ts: 'TypeScript',
        tsx: 'TypeScript React',
        js: 'JavaScript',
        jsx: 'JavaScript React',
        vue: 'Vue',
        rs: 'Rust',
        py: 'Python',
        json: 'JSON',
        html: 'HTML',
        css: 'CSS',
        md: 'Markdown',
        toml: 'TOML',
        yaml: 'YAML',
        yml: 'YAML',
    };
    return languages[ext] || 'Plain Text';
}
