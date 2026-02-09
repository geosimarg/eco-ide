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
    initialLine?: number;
    initialColumn?: number;
}

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileEntry[];
    expanded?: boolean;
}

export interface EditorGroup {
    id: string;
    files: OpenFile[];
    activeFileId: string | null;
}

export const useWorkspaceStore = defineStore('workspace', () => {
    // Estado
    const workspacePath = ref<string | null>(null);
    const workspaceName = ref<string>('');
    const files = ref<FileEntry[]>([]);

    // Groups state
    const groups = ref<EditorGroup[]>([
        { id: 'group-1', files: [], activeFileId: null }
    ]);
    const activeGroupId = ref<string>('group-1');

    const activeFileId = ref<string | null>(null); // Manter por enquanto, mas sincronizar com activeGroup

    const openFiles = computed(() => {
        return groups.value.flatMap(g => g.files);
    });

    const activeGroup = computed(() => {
        return groups.value.find(g => g.id === activeGroupId.value) || groups.value[0];
    });

    // Getters
    const activeFile = computed(() => {
        const fileId = activeGroup.value.activeFileId;
        if (!fileId) return null;
        return activeGroup.value.files.find(f => f.id === fileId) || null;
    });

    const hasUnsavedChanges = computed(() => {
        return groups.value.some(g => g.files.some(f => f.modified));
    });

    // Actions
    function setWorkspace(path: string, name: string) {
        workspacePath.value = path;
        workspaceName.value = name;

        // Reset groups
        groups.value = [{ id: 'group-1', files: [], activeFileId: null }];
        activeGroupId.value = 'group-1';
        activeFileId.value = null; // Deprecated, keep sync maybe?
    }

    function setFiles(entries: FileEntry[]) {
        files.value = entries;
    }

    function openFile(entry: { name: string; path: string; content: string; initialLine?: number; initialColumn?: number }) {
        // Verificar se já está aberto em QUALQUER grupo
        for (const group of groups.value) {
            const existing = group.files.find(f => f.path === entry.path);
            if (existing) {
                if (entry.initialLine !== undefined) {
                    existing.initialLine = entry.initialLine;
                    existing.initialColumn = entry.initialColumn;
                }
                // Ativar grupo e arquivo
                activeGroupId.value = group.id;
                group.activeFileId = existing.id;
                activeFileId.value = existing.id; // Sync
                return existing.id;
            }
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
            initialLine: entry.initialLine,
            initialColumn: entry.initialColumn,
        };

        // Adicionar ao grupo ativo
        const targetGroup = activeGroup.value;
        targetGroup.files.push(newFile);
        targetGroup.activeFileId = newFile.id;

        // Sync deprecated state
        activeFileId.value = newFile.id;

        return newFile.id;
    }

    function closeFile(id: string) {
        for (const group of groups.value) {
            const index = group.files.findIndex(f => f.id === id);
            if (index !== -1) {
                group.files.splice(index, 1);

                // Se fechou o arquivo ativo deste grupo
                if (group.activeFileId === id) {
                    if (group.files.length > 0) {
                        const newIndex = Math.min(index, group.files.length - 1);
                        group.activeFileId = group.files[newIndex].id;
                    } else {
                        group.activeFileId = null;
                        // Auto-close group if empty and not the only one
                        if (groups.value.length > 1) {
                            closeGroup(group.id);
                        }
                    }
                }

                // Sync global activeFileId se necessário
                if (activeFileId.value === id) {
                    activeFileId.value = group.activeFileId;
                }
                return;
            }
        }
    }

    function setActiveFile(id: string) {
        for (const group of groups.value) {
            const exists = group.files.find(f => f.id === id);
            if (exists) {
                activeGroupId.value = group.id;
                group.activeFileId = id;
                activeFileId.value = id; // Sync
                return;
            }
        }
    }

    function updateFileContent(id: string, content: string) {
        for (const group of groups.value) {
            const file = group.files.find(f => f.id === id);
            if (file) {
                file.content = content;
                file.modified = true;
                return;
            }
        }
    }

    function markFileSaved(id: string) {
        for (const group of groups.value) {
            const file = group.files.find(f => f.id === id);
            if (file) {
                file.modified = false;
                return;
            }
        }
    }

    async function toggleDirectory(path: string) {
        async function findAndToggle(entries: FileEntry[]): Promise<boolean> {
            for (const entry of entries) {
                if (entry.path === path && entry.isDirectory) {
                    entry.expanded = !entry.expanded;

                    // Se expandiu e não tem filhos carregados, carregar
                    if (entry.expanded && (!entry.children || entry.children.length === 0)) {
                        try {
                            const { invoke } = await import('@tauri-apps/api/core');
                            const children = await invoke<FileEntry[]>('list_directory', { path: entry.path });
                            entry.children = children;
                        } catch (error) {
                            logger.error('Erro ao listar diretório na expansão:', error);
                            // Reverter expansão em caso de erro? Ou deixar vazio?
                            // Deixar expandido mas vazio mostra que tentou.
                        }
                    }
                    return true;
                }
                if (entry.children && await findAndToggle(entry.children)) {
                    return true;
                }
            }
            return false;
        }
        await findAndToggle(files.value);
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
        for (const group of groups.value) {
            const file = group.files.find(f => f.id === id);
            if (file) {
                file.path = newPath;
                file.name = newPath.split('/').pop() || newPath.split('\\').pop() || file.name;
                file.modified = false;
                if (!keepLanguage) {
                    file.language = getLanguageFromPath(newPath);
                }
                return;
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
        for (const group of groups.value) {
            const file = group.files.find(f => f.id === id);
            if (file) {
                file.language = language;
                return;
            }
        }
    }

    function clearInitialPosition(id: string) {
        for (const group of groups.value) {
            const file = group.files.find(f => f.id === id);
            if (file) {
                file.initialLine = undefined;
                file.initialColumn = undefined;
                return;
            }
        }
    }

    async function closeFileWithConfirmation(id: string) {
        // Encontrar arquivo
        let file: OpenFile | undefined;
        for (const group of groups.value) {
            file = group.files.find(f => f.id === id);
            if (file) break;
        }

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

    // New Group Management Actions
    function createGroup(file?: OpenFile, insertIndex?: number): string {
        const newGroupId = `group-${crypto.randomUUID()}`;
        const newGroup: EditorGroup = {
            id: newGroupId,
            files: [],
            activeFileId: null
        };

        if (file) {
            newGroup.files.push(file);
            newGroup.activeFileId = file.id;
        }

        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= groups.value.length) {
            groups.value.splice(insertIndex, 0, newGroup);
        } else {
            groups.value.push(newGroup);
        }

        activeGroupId.value = newGroupId;
        return newGroupId;
    }

    function closeGroup(groupId: string) {
        const index = groups.value.findIndex(g => g.id === groupId);
        if (index === -1) return;

        // Não fechar o último grupo se for o único
        if (groups.value.length === 1) {
            groups.value[0].files = [];
            groups.value[0].activeFileId = null;
            return;
        }

        groups.value.splice(index, 1);
        if (activeGroupId.value === groupId) {
            activeGroupId.value = groups.value[Math.max(0, index - 1)].id;
        }
    }

    function moveFileToGroup(fileId: string, targetGroupId: string) {
        let file: OpenFile | undefined;
        let sourceGroupIndex = -1;

        // Find file and remove from source
        for (let i = 0; i < groups.value.length; i++) {
            const group = groups.value[i];
            const idx = group.files.findIndex(f => f.id === fileId);
            if (idx !== -1) {
                file = group.files[idx];
                group.files.splice(idx, 1);
                sourceGroupIndex = i;

                // Update active file in source group
                if (group.activeFileId === fileId) {
                    group.activeFileId = group.files.length > 0
                        ? group.files[Math.min(idx, group.files.length - 1)].id
                        : null;
                }
                break;
            }
        }

        if (!file) return;

        // Add to target group
        const targetGroup = groups.value.find(g => g.id === targetGroupId);
        if (targetGroup) {
            targetGroup.files.push(file);
            targetGroup.activeFileId = file.id;
            activeGroupId.value = targetGroup.id;
            // Sync global
            activeFileId.value = file.id;
        }

        // Clean up empty source group if it wasn't the last one ?? 
        // For now, let's keep empty groups open until explicitly closed or logic refinement.
        // Actually, VS Code closes active group if empty (unless it's the last one).
        // Let's implement auto-close empty groups except the last one.
        if (sourceGroupIndex !== -1 && groups.value.length > 1) {
            if (groups.value[sourceGroupIndex].files.length === 0) {
                closeGroup(groups.value[sourceGroupIndex].id);
            }
        }
    }

    function reorderFile(groupId: string, fromIndex: number, toIndex: number) {
        const group = groups.value.find(g => g.id === groupId);
        if (!group) return;

        if (fromIndex < 0 || fromIndex >= group.files.length ||
            toIndex < 0 || toIndex >= group.files.length ||
            fromIndex === toIndex) {
            return;
        }

        const file = group.files[fromIndex];
        group.files.splice(fromIndex, 1);
        group.files.splice(toIndex, 0, file);
    }

    function updateFilePath(oldPath: string, newPath: string, newName: string) {
        for (const group of groups.value) {
            const file = group.files.find(f => f.path === oldPath);
            if (file) {
                file.path = newPath;
                file.name = newName;
                break;
            }
        }
    }

    function closeFileByPath(path: string) {
        for (const group of groups.value) {
            const file = group.files.find(f => f.path === path);
            if (file) {
                closeFile(file.id);
                break;
            }
        }
    }

    // Refatorado para usar openFiles computed (que já agrega tudo)
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

    function getExpandedFolders(entries: FileEntry[], result: string[] = []): string[] {
        for (const entry of entries) {
            if (entry.isDirectory && entry.expanded) {
                result.push(entry.path);
            }
            if (entry.children) {
                getExpandedFolders(entry.children, result);
            }
        }
        return result;
    }

    function setExpandedFolders(entries: FileEntry[], expandedPaths: string[]) {
        for (const entry of entries) {
            if (entry.isDirectory) {
                entry.expanded = expandedPaths.includes(entry.path);
            }
            if (entry.children) {
                setExpandedFolders(entry.children, expandedPaths);
            }
        }
    }

    async function saveSession() {
        const configStore = useConfigStore();
        if (!workspacePath.value) return;

        const sessionData = {
            groups: groups.value.map(g => ({
                id: g.id,
                files: g.files
                    .filter(f => f.path)
                    .map(f => ({ path: f.path, language: f.language })),
                activeFilePath: g.files.find(f => f.id === g.activeFileId)?.path
            })),
            activeGroupId: activeGroupId.value,
            expandedFolders: getExpandedFolders(files.value)
        };

        configStore.config.session = sessionData;
        await configStore.saveConfig();
        logger.log('Sessão salva:', sessionData);
    }

    async function restoreSession() {
        const configStore = useConfigStore();
        const session = configStore.config.session;
        if (!session) return;

        const { invoke } = await import('@tauri-apps/api/core');

        groups.value = [];

        for (const sessionGroup of session.groups) {
            const newGroup: EditorGroup = {
                id: sessionGroup.id,
                files: [],
                activeFileId: null
            };

            for (const sessionFile of sessionGroup.files) {
                try {
                    const content = await invoke<string>('read_file', { path: sessionFile.path });
                    const name = sessionFile.path.split('/').pop() || sessionFile.path.split('\\').pop() || 'Arquivo';

                    const newFile: OpenFile = {
                        id: crypto.randomUUID(),
                        name,
                        path: sessionFile.path,
                        content,
                        modified: false,
                        language: sessionFile.language || getLanguageFromPath(sessionFile.path)
                    };

                    newGroup.files.push(newFile);

                    if (sessionFile.path === sessionGroup.activeFilePath) {
                        newGroup.activeFileId = newFile.id;
                    }
                } catch (e) {
                    logger.error('Erro ao restaurar arquivo:', sessionFile.path, e);
                }
            }

            if (newGroup.files.length > 0) {
                if (!newGroup.activeFileId) {
                    newGroup.activeFileId = newGroup.files[0].id;
                }
                groups.value.push(newGroup);
            }
        }

        if (groups.value.length === 0) {
            groups.value = [{ id: 'group-1', files: [], activeFileId: null }];
            activeGroupId.value = 'group-1';
        } else {
            const targetGroup = groups.value.find(g => g.id === session.activeGroupId);
            activeGroupId.value = targetGroup?.id || groups.value[0].id;

            const ag = groups.value.find(g => g.id === activeGroupId.value);
            if (ag?.activeFileId) {
                activeFileId.value = ag.activeFileId;
            }
        }

        if (session.expandedFolders && session.expandedFolders.length > 0) {
            setExpandedFolders(files.value, session.expandedFolders);
        }

        logger.log('Sessão restaurada');
    }

    async function closeProject() {
        const { useGlobalConfigStore } = await import('./globalConfig');
        const globalConfigStore = useGlobalConfigStore();
        globalConfigStore.clearSession();

        workspacePath.value = null;
        workspaceName.value = '';
        files.value = [];
        groups.value = [{ id: 'group-1', files: [], activeFileId: null }];
        activeGroupId.value = 'group-1';
        activeFileId.value = null;
    }

    return {
        // Estado
        workspacePath,
        workspaceName,
        files,
        groups,
        activeGroupId,
        openFiles, // Agora é computed
        activeFileId, // Deprecated/Sync
        showUnsavedChangesModal,
        unsavedFilesForModal,
        // Getters
        activeFile,
        hasUnsavedChanges,
        activeGroup,
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
        clearInitialPosition,
        requestCloseConfirmation,
        handleModalChoice,
        closeFileWithConfirmation,
        closeWindowWithConfirmation,
        createGroup,
        closeGroup,
        moveFileToGroup,
        reorderFile,
        updateFilePath,
        closeFileByPath,
        saveSession,
        restoreSession,
        closeProject,
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
