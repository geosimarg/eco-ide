import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useWorkspaceStore } from './workspace';

const MARKETPLACE_URL = 'https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/master/extensions.json';
const STORAGE_KEY = 'eco-ide-extensions';
const CACHE_KEY = 'eco-ide-extensions-cache';

export interface Extension {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    version: string;
    author?: string;
    repository?: string;
    homepage?: string;
    license?: string;
    tags?: string[];
    languages?: string[];
    category?: string;
    icon?: string;
    screenshots?: string[];
    readme?: string;
    downloadUrl?: string;
    downloadCount?: number;
    rating?: number;
    installed: boolean;
    enabled: boolean;
    path?: string;
    downloadProgress?: number;
    source?: 'marketplace' | 'local';
}

interface MarketplaceExtension {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    version: string;
    author?: string;
    repository?: string;
    homepage?: string;
    license?: string;
    tags?: string[];
    languages?: string[];
    category?: string;
    icon?: string;
    screenshots?: string[];
    readme?: string;
    downloadUrl?: string;
    downloadCount?: number;
    rating?: number;
    installed?: boolean;
}

interface MarketplaceCatalog {
    version: string;
    lastUpdated: string;
    extensions: MarketplaceExtension[];
    categories: { id: string; name: string; description: string }[];
}

export const useExtensionStore = defineStore('extensions', () => {
    const marketplaceExtensions = ref<Extension[]>([]);
    const localExtensions = ref<Extension[]>([]);
    const installedExtensions = ref<Extension[]>([]);
    const categories = ref<{ id: string; name: string; description: string }[]>([]);
    const workspaceStore = useWorkspaceStore();
    const isLoading = ref(false);
    const isLoadingMarketplace = ref(false);
    const searchQuery = ref('');
    const selectedCategory = ref<string | null>(null);
    const lastFetchTime = ref<number | null>(null);

    function loadInstalledExtensions() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                installedExtensions.value = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load installed extensions:', e);
        }
    }

    function saveInstalledExtensions() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(installedExtensions.value));
        } catch (e) {
            console.error('Failed to save installed extensions:', e);
        }
    }

    async function fetchFromCache(): Promise<MarketplaceCatalog | null> {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                lastFetchTime.value = parsed.timestamp;
                const cacheAge = Date.now() - parsed.timestamp;
                if (cacheAge < 24 * 60 * 60 * 1000) {
                    return parsed.data;
                }
            }
        } catch (e) {
            console.error('Error reading cache:', e);
        }
        return null;
    }

    function saveToCache(data: MarketplaceCatalog) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Error saving cache:', e);
        }
    }

    async function fetchMarketplaceCatalog(): Promise<MarketplaceCatalog | null> {
        isLoadingMarketplace.value = true;
        
        try {
            const cached = await fetchFromCache();
            if (cached) {
                applyInstalledState(cached.extensions);
                return cached;
            }

            const response = await fetch(MARKETPLACE_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            
            const data: MarketplaceCatalog = await response.json();
            saveToCache(data);
            applyInstalledState(data.extensions);
            
            return data;
        } catch (err) {
            console.error('Error fetching marketplace:', err);
            const cached = await fetchFromCache();
            if (cached) {
                applyInstalledState(cached.extensions);
                return cached;
            }
            return null;
        } finally {
            isLoadingMarketplace.value = false;
        }
    }

    function applyInstalledState(marketplaceExts: MarketplaceExtension[]) {
        marketplaceExtensions.value = marketplaceExts.map(ext => {
            const installed = installedExtensions.value.find(
                i => i.id === ext.id && i.source === 'marketplace'
            );
            
            return {
                ...ext,
                installed: !!installed,
                enabled: installed?.enabled ?? false,
                source: 'marketplace' as const,
            };
        });
    }

    async function loadMarketplaceExtensions() {
        isLoading.value = true;
        
        try {
            const catalog = await fetchMarketplaceCatalog();
            if (catalog) {
                marketplaceExtensions.value = catalog.extensions.map(ext => {
                    const installed = installedExtensions.value.find(
                        i => i.id === ext.id
                    );
                    
                    return {
                        ...ext,
                        installed: !!installed,
                        enabled: installed?.enabled ?? false,
                        source: 'marketplace' as const,
                    } as Extension;
                });
                
                categories.value = catalog.categories;
            }
        } catch (err) {
            console.error('Error loading marketplace extensions:', err);
        } finally {
            isLoading.value = false;
        }
    }

    async function refreshMarketplace() {
        localStorage.removeItem(CACHE_KEY);
        lastFetchTime.value = null;
        await loadMarketplaceExtensions();
    }

    async function discoverLocalExtensions() {
        if (!workspaceStore.workspacePath) {
            localExtensions.value = [];
            return;
        }

        isLoading.value = true;
        
        try {
            const extensionsPath = `${workspaceStore.workspacePath}/.eco/extensions`;
            const discovered = await invoke<any[]>('discover_extensions', {
                extensionsPath
            });
            
            localExtensions.value = discovered.map(ext => {
                const installed = installedExtensions.value.find(
                    i => i.path === ext.path
                );
                
                return {
                    id: ext.name.toLowerCase().replace(/\s+/g, '-'),
                    name: ext.name,
                    description: ext.description,
                    version: ext.version,
                    author: ext.author,
                    installed: !!installed,
                    enabled: installed?.enabled ?? false,
                    path: ext.path,
                    source: 'local' as const,
                };
            });
        } catch (err) {
            console.error('Error discovering local extensions:', err);
            localExtensions.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function browseExtensionsFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Selecionar pasta de extensões',
            });

            if (selected && typeof selected === 'string') {
                const discovered = await invoke<any[]>('discover_extensions', {
                    extensionsPath: selected
                });
                
                const newExts = discovered.map(ext => ({
                    id: ext.name.toLowerCase().replace(/\s+/g, '-'),
                    name: ext.name,
                    description: ext.description,
                    version: ext.version,
                    author: ext.author,
                    installed: false,
                    enabled: false,
                    path: ext.path,
                    source: 'local' as const,
                }));
                
                const existingPaths = new Set(localExtensions.value.map(e => e.path));
                for (const ext of newExts) {
                    if (!existingPaths.has(ext.path)) {
                        localExtensions.value.push(ext);
                    }
                }
            }
        } catch (err) {
            console.error('Error browsing extensions folder:', err);
        }
    }

    async function installExtension(ext: Extension) {
        if (ext.source === 'marketplace' && ext.downloadUrl) {
            return { success: false, error: 'Download not implemented yet' };
        }

        try {
            if (ext.path) {
                await invoke('load_extension', { path: ext.path });
            }
            
            const newExt = { 
                ...ext, 
                installed: true, 
                enabled: true,
                source: ext.source || 'local'
            };
            
            if (!installedExtensions.value.find(e => e.id === ext.id)) {
                installedExtensions.value.push(newExt);
            }
            
            if (ext.source === 'marketplace') {
                const idx = marketplaceExtensions.value.findIndex(e => e.id === ext.id);
                if (idx !== -1) {
                    marketplaceExtensions.value[idx].installed = true;
                    marketplaceExtensions.value[idx].enabled = true;
                }
            } else {
                const idx = localExtensions.value.findIndex(e => e.id === ext.id);
                if (idx !== -1) {
                    localExtensions.value[idx].installed = true;
                    localExtensions.value[idx].enabled = true;
                }
            }
            
            saveInstalledExtensions();
            
            return { success: true };
        } catch (err) {
            console.error('Failed to install extension:', err);
            return { success: false, error: String(err) };
        }
    }

    async function uninstallExtension(ext: Extension) {
        installedExtensions.value = installedExtensions.value.filter(
            e => e.id !== ext.id
        );
        
        if (ext.source === 'marketplace') {
            const idx = marketplaceExtensions.value.findIndex(e => e.id === ext.id);
            if (idx !== -1) {
                marketplaceExtensions.value[idx].installed = false;
                marketplaceExtensions.value[idx].enabled = false;
            }
        } else {
            const idx = localExtensions.value.findIndex(e => e.id === ext.id);
            if (idx !== -1) {
                localExtensions.value[idx].installed = false;
                localExtensions.value[idx].enabled = false;
            }
        }
        
        saveInstalledExtensions();
        
        return { success: true };
    }

    async function toggleExtension(ext: Extension) {
        const isCurrentlyEnabled = ext.enabled;
        
        if (isCurrentlyEnabled) {
            const idx = installedExtensions.value.findIndex(e => e.id === ext.id);
            if (idx !== -1) {
                installedExtensions.value[idx].enabled = false;
            }
        } else {
            const idx = installedExtensions.value.findIndex(e => e.id === ext.id);
            if (idx !== -1) {
                installedExtensions.value[idx].enabled = true;
                if (ext.path) {
                    try {
                        await invoke('load_extension', { path: ext.path });
                    } catch (err) {
                        console.error('Failed to load extension:', err);
                    }
                }
            }
        }
        
        if (ext.source === 'marketplace') {
            const idx = marketplaceExtensions.value.findIndex(e => e.id === ext.id);
            if (idx !== -1) {
                marketplaceExtensions.value[idx].enabled = !isCurrentlyEnabled;
            }
        } else {
            const idx = localExtensions.value.findIndex(e => e.id === ext.id);
            if (idx !== -1) {
                localExtensions.value[idx].enabled = !isCurrentlyEnabled;
            }
        }
        
        saveInstalledExtensions();
    }

    function init() {
        loadInstalledExtensions();
    }

    const filteredMarketplaceExtensions = computed(() => {
        let result = marketplaceExtensions.value;
        
        if (selectedCategory.value) {
            result = result.filter(e => e.category === selectedCategory.value);
        }
        
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(query) ||
                e.description?.toLowerCase().includes(query) ||
                e.tags?.some(t => t.toLowerCase().includes(query))
            );
        }
        
        return result;
    });

    const filteredLocalExtensions = computed(() => {
        let result = localExtensions.value;
        
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(query) ||
                e.description?.toLowerCase().includes(query)
            );
        }
        
        return result;
    });

    const enabledExtensions = computed(() => 
        installedExtensions.value.filter(e => e.enabled)
    );

    return {
        marketplaceExtensions,
        localExtensions,
        installedExtensions,
        categories,
        isLoading,
        isLoadingMarketplace,
        searchQuery,
        selectedCategory,
        lastFetchTime,
        filteredMarketplaceExtensions,
        filteredLocalExtensions,
        enabledExtensions,
        init,
        loadMarketplaceExtensions,
        refreshMarketplace,
        discoverLocalExtensions,
        browseExtensionsFolder,
        installExtension,
        uninstallExtension,
        toggleExtension,
    };
});