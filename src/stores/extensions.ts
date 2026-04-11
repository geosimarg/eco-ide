import { defineStore } from 'pinia';
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from './workspace';

export interface Extension {
    id: string;
    name: string;
    description: string;
    version: string;
    installed: boolean;
    language: 'rust' | 'typescript' | 'python' | 'go' | 'wasm';
    path?: string;
}

export const useExtensionStore = defineStore('extensions', () => {
    const loadedExtensions = ref<Extension[]>([]);
    const workspaceStore = useWorkspaceStore();

    async function discoverExtensions() {
        try {
            if (!workspaceStore.workspacePath) return;

            const extDir = `${workspaceStore.workspacePath}/.eco/extensions`;

            // Checa se dir existe, se não, cria silenciamente
            await invoke('create_directory', { path: extDir }).catch(() => { });

            const entries = await invoke<any[]>('list_directory', { path: extDir });

            const wasmFiles = entries.filter((e) => e.name.endsWith('.wasm'));

            loadedExtensions.value = wasmFiles.map((file) => ({
                id: file.name,
                name: file.name.replace('.wasm', ''),
                description: 'Extensão WebAssembly local',
                version: '1.0.0',
                installed: true,
                language: 'wasm',
                path: file.path
            }));
        } catch (err) {
            console.error('Erro ao descobrir extensões wasm', err);
        }
    }

    async function activateExtension(ext: Extension) {
        if (!ext.path) return;
        try {
            await invoke('load_extension', { path: ext.path });
            console.log(`Extensão ${ext.name} ativada via Wasmtime`);
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
