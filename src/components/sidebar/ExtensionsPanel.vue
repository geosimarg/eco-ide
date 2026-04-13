<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useExtensionStore } from '@/stores/extensions';
  import { useI18nStore } from '@/stores/i18n';
  import type { Extension } from '@/interfaces/extension';

  const extStore = useExtensionStore();
  const i18n = useI18nStore();

  const activeTab = ref<'marketplace' | 'installed' | 'local'>('marketplace');

  onMounted(() => {
    extStore.init();
    extStore.loadMarketplaceExtensions();
    extStore.discoverLocalExtensions();
  });

  function getCategoryName(categoryId: string | undefined): string {
    if (!categoryId) return 'Other';
    const cat = extStore.categories.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  }

  function getCategoryIcon(categoryId: string | undefined): string {
    const icons: Record<string, string> = {
      languages: '🔤',
      formatters: '📝',
      themes: '🎨',
      snippets: '✂️',
      tools: '🔧',
      scm: '📚',
      remote: '🖥️',
    };
    return icons[categoryId || ''] || '📦';
  }

  async function handleInstall(ext: Extension) {
    await extStore.installExtension(ext);
  }

  async function handleUninstall(ext: Extension) {
    await extStore.uninstallExtension(ext);
  }

  async function handleToggle(ext: Extension) {
    await extStore.toggleExtension(ext);
  }

  async function handleRefresh() {
    await extStore.refreshMarketplace();
  }
</script>

<template>
  <div class="extensions-panel">
    <div class="panel-header">
      <h2>{{ i18n.t('extensions.title') }}</h2>
      <div class="header-actions">
        <button class="btn-icon" @click="handleRefresh" :title="i18n.t('extensions.refresh')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v4M8 14v-4M2 8h4M14 8h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M14 2a7 7 0 01-7 7 7 7 0 01-4.5-1.9" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" />
            <path d="M2 14a7 7 0 017-7 7 7 0 014.5 1.9" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" />
          </svg>
        </button>
        <button class="btn-add-folder" @click="extStore.browseExtensionsFolder">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 4v7a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H7l-2-2H2a1 1 0 00-1 1z" stroke="currentColor"
              stroke-width="1.2" />
            <path d="M7 5v4M5 7h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <div class="search-filter-row">
      <div class="search-wrapper">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5" />
          <path d="M9 9l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input v-model="extStore.searchQuery" type="text" class="search-input"
          :placeholder="i18n.t('extensions.search')" />
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'marketplace' }" @click="activeTab = 'marketplace'">
        <span class="tab-icon">🏪</span>
        {{ i18n.t('extensions.marketplace') }}
        <span class="badge">{{ extStore.marketplaceExtensions.length }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'installed' }" @click="activeTab = 'installed'">
        <span class="tab-icon">✓</span>
        {{ i18n.t('extensions.installed') }}
        <span class="badge">{{ extStore.installedExtensions.length }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'local' }" @click="activeTab = 'local'">
        <span class="tab-icon">📁</span>
        {{ i18n.t('extensions.local') }}
        <span class="badge">{{ extStore.localExtensions.length }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'marketplace'" class="category-filters">
      <button class="category-chip" :class="{ active: !extStore.selectedCategory }"
        @click="extStore.selectedCategory = null">
        All
      </button>
      <button v-for="cat in extStore.categories" :key="cat.id" class="category-chip"
        :class="{ active: extStore.selectedCategory === cat.id }" @click="extStore.selectedCategory = cat.id">
        <span class="cat-icon">{{ getCategoryIcon(cat.id) }}</span>
        {{ cat.name }}
      </button>
    </div>

    <div v-if="extStore.isLoading || extStore.isLoadingMarketplace" class="loading">
      <div class="spinner"></div>
      <span>{{ i18n.t('extensions.loading') }}</span>
    </div>

    <template v-else>
      <!-- Marketplace Tab -->
      <div v-if="activeTab === 'marketplace'" class="extension-list">
        <div v-for="ext in extStore.filteredMarketplaceExtensions" :key="ext.id" class="extension-card">
          <div class="ext-icon">
            <img v-if="ext.icon" :src="ext.icon" :alt="ext.name" />
            <span v-else>📦</span>
          </div>

          <div class="ext-content">
            <div class="ext-header">
              <span class="ext-name">{{ ext.name }}</span>
              <span class="ext-version">v{{ ext.version }}</span>
            </div>
            <p class="ext-desc">{{ ext.shortDescription || ext.description }}</p>
            <div class="ext-meta">
              <span class="ext-author">{{ ext.author }}</span>
              <span class="ext-category">{{ getCategoryIcon(ext.category) }} {{ getCategoryName(ext.category) }}</span>
            </div>
          </div>

          <div class="ext-actions">
            <template v-if="ext.installed">
              <button class="btn-toggle" :class="{ enabled: ext.enabled }" @click="handleToggle(ext)"
                :title="ext.enabled ? i18n.t('extensions.disable') : i18n.t('extensions.enable')">
                <span class="toggle-indicator"></span>
              </button>
              <button class="btn-uninstall" @click="handleUninstall(ext)" :title="i18n.t('extensions.uninstall')">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </button>
            </template>
            <button v-else class="btn-install" @click="handleInstall(ext)" :title="i18n.t('extensions.install')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M3 5l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M2 11v2h10v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="extStore.filteredMarketplaceExtensions.length === 0" class="empty-state">
          <p>{{ i18n.t('extensions.no_results') }}</p>
        </div>
      </div>

      <!-- Installed Tab -->
      <div v-else-if="activeTab === 'installed'" class="extension-list">
        <div v-for="ext in extStore.installedExtensions" :key="ext.id" class="extension-card">
          <div class="ext-icon">
            <img v-if="ext.icon" :src="ext.icon" :alt="ext.name" />
            <span v-else>📦</span>
          </div>

          <div class="ext-content">
            <div class="ext-header">
              <span class="ext-name">{{ ext.name }}</span>
              <span class="ext-version">v{{ ext.version }}</span>
            </div>
            <p class="ext-desc">{{ ext.description }}</p>
          </div>

          <div class="ext-actions">
            <button class="btn-toggle" :class="{ enabled: ext.enabled }" @click="handleToggle(ext)">
              <span class="toggle-indicator"></span>
            </button>
            <button class="btn-uninstall" @click="handleUninstall(ext)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="extStore.installedExtensions.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 12h32M8 24h20M8 36h28" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <p>{{ i18n.t('extensions.no_installed') }}</p>
        </div>
      </div>

      <!-- Local Tab -->
      <div v-else-if="activeTab === 'local'" class="extension-list">
        <div v-for="ext in extStore.filteredLocalExtensions" :key="ext.id" class="extension-card">
          <div class="ext-icon">📁</div>

          <div class="ext-content">
            <div class="ext-header">
              <span class="ext-name">{{ ext.name }}</span>
              <span class="ext-version">v{{ ext.version }}</span>
            </div>
            <p class="ext-desc">{{ ext.description }}</p>
            <div class="ext-meta">
              <span class="ext-path">{{ ext.path }}</span>
            </div>
          </div>

          <div class="ext-actions">
            <template v-if="ext.installed">
              <button class="btn-toggle" :class="{ enabled: ext.enabled }" @click="handleToggle(ext)">
                <span class="toggle-indicator"></span>
              </button>
              <button class="btn-uninstall" @click="handleUninstall(ext)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </button>
            </template>
            <button v-else class="btn-install" @click="handleInstall(ext)" :title="i18n.t('extensions.install')">
            </button>
          </div>
        </div>

        <div v-if="extStore.filteredLocalExtensions.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 12h32M8 24h20M8 36h28" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <p>{{ i18n.t('extensions.no_local') }}</p>
          <button class="btn-primary" @click="extStore.browseExtensionsFolder">
            {{ i18n.t('extensions.add_folder') }}
          </button>
        </div>
      </div>
    </template>

    <div class="info-footer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>{{ i18n.t('extensions.wasm_note') }}</span>
    </div>
  </div>
</template>

<style scoped>
  .extensions-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    gap: 12px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: var(--bg-hover);
    color: var(--accent-primary);
  }

  .btn-add-folder {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-folder:hover {
    background: var(--bg-hover);
    color: var(--accent-primary);
  }

  .search-filter-row {
    flex-shrink: 0;
  }

  .search-wrapper {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }

  .search-input {
    width: 100%;
    padding: 10px 14px 10px 36px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .tabs {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 8px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: var(--bg-tertiary);
    color: var(--accent-primary);
  }

  .tab-icon {
    font-size: 14px;
  }

  .tab-btn .badge {
    padding: 2px 6px;
    background: var(--bg-secondary);
    border-radius: 10px;
    font-size: 10px;
  }

  .tab-btn.active .badge {
    background: var(--accent-primary);
    color: white;
  }

  .category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex-shrink: 0;
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    color: var(--text-secondary);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-chip:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
  }

  .category-chip.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: white;
  }

  .cat-icon {
    font-size: 12px;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-muted);
    gap: 12px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-muted);
    gap: 12px;
    text-align: center;
  }

  .empty-state svg {
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 13px;
  }

  .btn-primary {
    padding: 10px 20px;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
  }

  .extension-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    min-height: 0;
  }

  .extension-card {
    display: flex;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.2s;
    min-height: 80px;
  }

  .extension-card:hover {
    border-color: var(--accent-primary);
  }

  .ext-icon {
    width: 48px;
    height: 48px;
    min-width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    border-radius: 8px;
    font-size: 24px;
    overflow: hidden;
    align-self: flex-start;
  }

  .ext-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ext-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .ext-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .ext-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .ext-version {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ext-desc {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .ext-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: auto;
  }

  .ext-path {
    font-family: var(--font-mono);
    font-size: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ext-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    align-self: center;
  }

  .btn-toggle {
    width: 36px;
    height: 20px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    padding: 0;
  }

  .btn-toggle.enabled {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .toggle-indicator {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .btn-toggle.enabled .toggle-indicator {
    transform: translateX(16px);
  }

  .btn-uninstall {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-uninstall:hover {
    background: var(--error);
    border-color: var(--error);
    color: white;
  }

  .btn-install {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-primary);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-install:hover {
    opacity: 0.9;
  }

  .info-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--bg-tertiary);
    border-radius: 6px;
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
</style>
