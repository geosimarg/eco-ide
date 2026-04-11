import { defineStore } from 'pinia';
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from './workspace';

export interface Extension {
    id: string;
    name: string;
    description?: string;
    version: string;
    author?: string;
    languages?: string[];
    installed: boolean;
    path: string;
}

interface LoadedExtension {
    name: string;
    version: string;
    author?: string;
    description?: string;
    path: string;
}

export const useExtensionStore = defineStore('extensions', () => {
    const loadedExtensions = ref<Extension[]>([]);
    const workspaceStore = useWorkspaceStore();

    async function discoverExtensions() {
        try {
            if (!workspaceStore.workspacePath) return;
            
            // Chamar o backend para descobrir extensões
            const extensions = await invoke<LoadedExtension[]>('discover_extensions', { 
                workspacePath: workspaceStore.workspacePath 
            });
            
            loadedExtensions.value = extensions.map((ext) => ({
                id: ext.name,
                name: ext.name,
                description: ext.description,
                version: ext.version,
                author: ext.author,
                installed: true,
                path: ext.path
            }));
        } catch (err) {
            console.error('Erro ao descobrir extensões:', err);
        }
    }

    async function activateExtension(ext: Extension) {
        try {
            await invoke('load_extension', { path: ext.path });
            console.log(`Extensão ${ext.name} ativada`);
        } catch (e) {
            console.error(`Falha ao ativar extensão ${ext.name}:`, e);
        }
    }

    return {
        loadedExtensions,
        discoverExtensions,
        activateExtension,
    };
});
