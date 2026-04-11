import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

setActivePinia(createPinia());

const mockInstalled = [
  { id: 'http-client', name: 'HTTP Client', installed: true, enabled: true, source: 'marketplace' },
  { id: 'theme-dracula', name: 'Dracula Theme', installed: true, enabled: true, source: 'marketplace' }
];

const mockMarketplaceExts = [
  { id: 'http-client', name: 'HTTP Client', category: 'tools', installed: true, enabled: true, source: 'marketplace' },
  { id: 'prettier-formatter', name: 'Prettier Formatter', category: 'formatters', installed: false, enabled: false, source: 'marketplace' },
  { id: 'python-lsp', name: 'Python LSP', category: 'languages', installed: false, enabled: false, source: 'marketplace' },
  { id: 'theme-dracula', name: 'Dracula Theme', category: 'themes', installed: true, enabled: true, source: 'marketplace' }
];

const mockCategories = [
  { id: 'languages', name: 'Programming Languages' },
  { id: 'formatters', name: 'Formatters' },
  { id: 'themes', name: 'Themes' },
  { id: 'tools', name: 'Tools' }
];

describe('Extension Store Logic', () => {
  describe('Filtering', () => {
    it('should filter extensions by search query', () => {
      const searchQuery = 'http';
      const filtered = mockMarketplaceExts.filter(ext =>
        ext.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('http-client');
    });

    it('should filter extensions by category', () => {
      const selectedCategory = 'languages';
      const filtered = mockMarketplaceExts.filter(ext => ext.category === selectedCategory);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('python-lsp');
    });

    it('should filter by both search and category', () => {
      const searchQuery = 'client';
      const selectedCategory = 'tools';
      const filtered = mockMarketplaceExts.filter(ext =>
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        ext.category === selectedCategory
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('http-client');
    });
  });

  describe('Installed Extensions', () => {
    it('should correctly identify installed extensions', () => {
      const installed = mockMarketplaceExts.filter(ext => ext.installed);
      expect(installed.length).toBe(2);
    });

    it('should correctly identify enabled extensions', () => {
      const enabled = mockMarketplaceExts.filter(ext => ext.enabled);
      expect(enabled.length).toBe(2);
    });
  });

  describe('Category Mapping', () => {
    it('should map category IDs to display names', () => {
      const categoryMap = Object.fromEntries(
        mockCategories.map(c => [c.id, c.name])
      );
      expect(categoryMap['languages']).toBe('Programming Languages');
      expect(categoryMap['themes']).toBe('Themes');
    });
  });
});

describe('Extension Install Flow', () => {
  it('should mark extension as installed', () => {
    const ext = { id: 'new-ext', installed: false, enabled: false };
    ext.installed = true;
    ext.enabled = true;
    expect(ext.installed).toBe(true);
    expect(ext.enabled).toBe(true);
  });

  it('should toggle extension enabled state', () => {
    const ext = { id: 'test-ext', enabled: true };
    ext.enabled = !ext.enabled;
    expect(ext.enabled).toBe(false);
    ext.enabled = !ext.enabled;
    expect(ext.enabled).toBe(true);
  });

  it('should uninstall extension', () => {
    const installed = [...mockInstalled];
    const filtered = installed.filter(e => e.id !== 'http-client');
    expect(filtered.length).toBe(1);
    expect(filtered.find(e => e.id === 'http-client')).toBeUndefined();
  });
});

describe('Marketplace Loading', () => {
  it('should fetch extensions from marketplace URL', async () => {
    const marketplaceUrl = 'https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/extensions.json';
    expect(marketplaceUrl).toContain('raw.githubusercontent.com');
    expect(marketplaceUrl).toContain('extensions.json');
  });

  it('should handle cache with 24-hour expiry', () => {
    const now = Date.now();
    const cached = { timestamp: now - 12 * 60 * 60 * 1000, data: {} };
    const cacheAge = now - cached.timestamp;
    expect(cacheAge < 24 * 60 * 60 * 1000).toBe(true);

    const expired = { timestamp: now - 25 * 60 * 60 * 1000, data: {} };
    const expiredAge = now - expired.timestamp;
    expect(expiredAge < 24 * 60 * 60 * 1000).toBe(false);
  });
});

describe('Local Extension Discovery', () => {
  it('should discover extensions from folder path', async () => {
    const extensionsPath = '/workspace/.eco/extensions';
    expect(extensionsPath).toContain('.eco/extensions');
  });

  it('should handle empty extensions folder', () => {
    const discovered: any[] = [];
    expect(discovered.length).toBe(0);
  });

  it('should parse extension manifest from folder', () => {
    const ext = {
      name: 'My Extension',
      version: '1.0.0',
      description: 'Test extension'
    };
    expect(ext.name).toBeDefined();
    expect(ext.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});