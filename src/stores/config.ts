import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { logger } from '@/utils/logger';
import { useGlobalConfigStore } from './globalConfig';
import { WorkspaceConfig } from '@/interfaces/workspace_config';

const editorFolder = '.eco';
const configFile = 'workspace.json';

export const useConfigStore = defineStore('config', () => {
    const workspacePath = ref<string | null>(null);

    // Configurações Locais (.eco/workspace.json)
    const localConfig = ref<WorkspaceConfig>({
        languageOverrides: {},
        hidden_files: [],
        hidden_folders: []
    });

    // Configurações do Arquivo de Workspace (.eco-workspace) - Carregadas externamente pelo WorkspaceStore
    const workspaceFileConfig = ref<WorkspaceConfig>({
        languageOverrides: {}
    });

    // Computed que mescla: Global (via GlobalConfigStore) < Local < WorkspaceFile
    const effectiveConfig = computed(() => {
        const globalConfigStore = useGlobalConfigStore();

        // Merge logic
        const merged: WorkspaceConfig = {
            languageOverrides: {
                ...localConfig.value.languageOverrides,
                ...workspaceFileConfig.value.languageOverrides
            },
            hidden_files: [
                ...(globalConfigStore.config.hidden_files || []),
                ...(localConfig.value.hidden_files || []),
                ...(workspaceFileConfig.value.hidden_files || [])
            ],
            hidden_folders: [
                ...(globalConfigStore.config.hidden_folders || []),
                ...(localConfig.value.hidden_folders || []),
                ...(workspaceFileConfig.value.hidden_folders || [])
            ]
        };

        // Remove duplicates in arrays
        merged.hidden_files = [...new Set(merged.hidden_files)];
        merged.hidden_folders = [...new Set(merged.hidden_folders)];

        return merged;
    });

    // Acesso direto para compatibilidade (mas deveria usar effectiveConfig para leitura)
    // O 'config' exportado é o localConfig para escrita, mas leitura deve ser cuidadosa.
    // Para manter compatibilidade com código existente que usa config.value = ..., mantemos localConfig como 'config'
    // Mas códigos que leem devem preferir effectiveConfig se quiserem o valor final.
    // Atualizar estado com deep merge ou sobresscrever

    async function loadConfig(wsPath: string) {
        workspacePath.value = wsPath;
        const configPath = `${wsPath}/${editorFolder}/${configFile}`;

        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const content = await invoke<string>('read_file', { path: configPath });
            localConfig.value = {
                languageOverrides: {},
                hidden_files: [],
                hidden_folders: [],
                ...JSON.parse(content)
            };
            logger.log('Configuração local carregada de:', configPath);
        } catch (e) {
            logger.log('Nenhuma configuração local encontrada ou erro ao ler:', e);
            localConfig.value = { languageOverrides: {}, hidden_files: [], hidden_folders: [] };
            await saveConfig(); // Cria o arquivo padrão
        }
    }

    async function saveConfig() {
        if (!workspacePath.value) return;

        const configDir = `${workspacePath.value}/${editorFolder}`;
        const configPath = `${configDir}/${configFile}`;

        try {
            const { invoke } = await import('@tauri-apps/api/core');
            try {
                await invoke('create_directory', { path: configDir });
            } catch (e) {
                logger.error('Erro ao criar diretório de config:', e);
            }

            await invoke('write_file', {
                path: configPath,
                content: JSON.stringify(localConfig.value, null, 2)
            });
            logger.log('Configuração local salva em:', configPath);
        } catch (error) {
            logger.error('Erro ao salvar config:', error);
        }
    }

    function getRelativePath(fullPath: string): string {
        if (!workspacePath.value) return fullPath;
        if (fullPath.startsWith(workspacePath.value)) {
            let rel = fullPath.slice(workspacePath.value.length);
            // Remove barra inicial se houver
            if (rel.startsWith('/') || rel.startsWith('\\')) {
                rel = rel.slice(1);
            }
            return rel;
        }
        return fullPath;
    }

    function setLanguageOverride(filePath: string, language: string) {
        const relativePath = getRelativePath(filePath);
        localConfig.value.languageOverrides[relativePath] = language;
        saveConfig();
    }

    function getLanguageForFile(filePath: string): string | null {
        const relativePath = getRelativePath(filePath);
        // Verificar effectiveConfig para prioridade correta
        return effectiveConfig.value.languageOverrides[relativePath] || null;
    }

    function clearLanguageOverride(filePath: string) {
        const relativePath = getRelativePath(filePath);
        delete localConfig.value.languageOverrides[relativePath];
        saveConfig();
    }

    // Função para atualizar config vindo do arquivo de workspace
    function setWorkspaceFileConfig(cfg: WorkspaceConfig) {
        workspaceFileConfig.value = cfg;
    }

    // Verifica se arquivo deve ser oculto
    function shouldHideFile(filename: string): boolean {
        const patterns = effectiveConfig.value.hidden_files || [];
        return patterns.some((pattern: string) => isMatch(filename, pattern));
    }

    function shouldHideFolder(foldername: string): boolean {
        const patterns = effectiveConfig.value.hidden_folders || [];
        return patterns.some((pattern: string) => isMatch(foldername, pattern));
    }

    // Helper simples para glob (*.ext)
    function isMatch(name: string, pattern: string): boolean {
        if (pattern === '*') return true;
        if (pattern.startsWith('*.')) {
            return name.endsWith(pattern.slice(1));
        }
        if (pattern.endsWith('*')) {
            return name.startsWith(pattern.slice(0, -1));
        }
        return name === pattern;
        // Para suporte completo a glob, precisaria de lib externa ou regex mais complexo
        // Mas para MVP isso cobre "*.pdf", "node_modules", "temp*"
    }

    return {
        workspacePath,
        config: localConfig, // Mantendo compatibilidade de nome
        effectiveConfig,
        workspaceFileConfig,
        loadConfig,
        saveConfig,
        setLanguageOverride,
        getLanguageForFile,
        clearLanguageOverride,
        setWorkspaceFileConfig,
        shouldHideFile,
        shouldHideFolder
    };
});

export const SUPPORTED_LANGUAGES = [
    { id: 'plaintext', name: 'Plain Text' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'vue', name: 'Vue' },
    { id: 'rust', name: 'Rust' },
    { id: 'python', name: 'Python' },
    { id: 'json', name: 'JSON' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'markdown', name: 'Markdown' },
];
