import { defineStore } from 'pinia';
import { ref } from 'vue';
import { logger } from '@/utils/logger';

const GLOBAL_CONFIG_FILE = 'global.json';

export interface GlobalConfig {
    locale: string;
    lastWorkspacePath?: string;
    shouldRestoreSession?: boolean;
    hidden_files?: string[];
    hidden_folders?: string[];
    recentWorkspaces?: RecentWorkspace[];
}

export interface RecentWorkspace {
    path: string;
    name: string;
    lastOpened: string;
}

const MAX_RECENT_WORKSPACES = 10;

export const useGlobalConfigStore = defineStore('globalConfig', () => {
    const configDir = ref<string | null>(null);
    const config = ref<GlobalConfig>({
        locale: 'pt-BR',
        hidden_files: [],
        hidden_folders: []
    });

    async function loadConfig() {
        try {
            const { invoke } = await import('@tauri-apps/api/core');

            if (!configDir.value) {
                configDir.value = await invoke<string>('get_app_config_dir');
            }

            const configPath = `${configDir.value}/${GLOBAL_CONFIG_FILE}`;
            const content = await invoke<string>('read_file', { path: configPath });
            config.value = JSON.parse(content);
            logger.log('Configuração global carregada de:', configPath);
        } catch (e) {
            logger.log('Nenhuma configuração global encontrada ou erro ao ler:', e);

            config.value = { locale: 'pt-BR' };
            await saveConfig();
        }
    }

    async function saveConfig() {
        try {
            const { invoke } = await import('@tauri-apps/api/core');

            if (!configDir.value) {
                configDir.value = await invoke<string>('get_app_config_dir');
            }

            const configPath = `${configDir.value}/${GLOBAL_CONFIG_FILE}`;
            await invoke('write_file', {
                path: configPath,
                content: JSON.stringify(config.value, null, 2)
            });
            logger.log('Configuração global salva em:', configPath);
        } catch (error) {
            logger.error('Erro ao salvar config global:', error);
        }
    }

    function setLocale(locale: string) {
        config.value.locale = locale;
        saveConfig();
    }

    function setLastWorkspace(path: string) {
        config.value.lastWorkspacePath = path;
        config.value.shouldRestoreSession = true;
        saveConfig();
    }

    function clearSession() {
        config.value.shouldRestoreSession = false;
        config.value.lastWorkspacePath = undefined;
        saveConfig();
    }

    function addRecentWorkspace(path: string, name: string) {
        if (!config.value.recentWorkspaces) {
            config.value.recentWorkspaces = [];
        }
        
        const existing = config.value.recentWorkspaces.findIndex(w => w.path === path);
        if (existing !== -1) {
            config.value.recentWorkspaces.splice(existing, 1);
        }

        config.value.recentWorkspaces.unshift({
            path,
            name,
            lastOpened: new Date().toISOString()
        });

        if (config.value.recentWorkspaces.length > MAX_RECENT_WORKSPACES) {
            config.value.recentWorkspaces = config.value.recentWorkspaces.slice(0, MAX_RECENT_WORKSPACES);
        }

        saveConfig();
    }

    function getRecentWorkspaces() {
        return config.value.recentWorkspaces || [];
    }

    function removeRecentWorkspace(path: string) {
        if (!config.value.recentWorkspaces) return;
        
        config.value.recentWorkspaces = config.value.recentWorkspaces.filter(w => w.path !== path);
        saveConfig();
    }

    return {
        config,
        loadConfig,
        saveConfig,
        setLocale,
        setLastWorkspace,
        clearSession,
        addRecentWorkspace,
        getRecentWorkspaces,
        removeRecentWorkspace
    };
});
