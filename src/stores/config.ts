import { defineStore } from 'pinia';
import { ref } from 'vue';

const editorFolder = '.editor';
const configFile = 'config.json';

export interface WorkspaceConfig {
    languageOverrides: Record<string, string>; // path -> language
}

export const useConfigStore = defineStore('config', () => {
    const workspacePath = ref<string | null>(null);
    const config = ref<WorkspaceConfig>({
        languageOverrides: {}
    });

    async function loadConfig(wsPath: string) {
        workspacePath.value = wsPath;
        const configPath = `${wsPath}/${editorFolder}/${configFile}`;

        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const content = await invoke<string>('read_file', { path: configPath });
            config.value = JSON.parse(content);
        } catch {
            config.value = { languageOverrides: {} };
        }
    }

    async function saveConfig() {
        if (!workspacePath.value) return;

        const configDir = `${workspacePath.value}/.editor`;
        const configPath = `${configDir}/config.json`;

        try {
            const { invoke } = await import('@tauri-apps/api/core');
            try {
                await invoke('create_directory', { path: configDir });
            } catch {
            }
            await invoke('write_file', {
                path: configPath,
                content: JSON.stringify(config.value, null, 2)
            });
        } catch (error) {
            console.error('Erro ao salvar config:', error);
        }
    }

    function setLanguageOverride(filePath: string, language: string) {
        config.value.languageOverrides[filePath] = language;
        saveConfig();
    }

    function getLanguageForFile(filePath: string): string | null {
        return config.value.languageOverrides[filePath] || null;
    }

    function clearLanguageOverride(filePath: string) {
        delete config.value.languageOverrides[filePath];
        saveConfig();
    }

    return {
        workspacePath,
        config,
        loadConfig,
        saveConfig,
        setLanguageOverride,
        getLanguageForFile,
        clearLanguageOverride,
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
