import { describe, it, expect } from 'vitest';

const mockExtensionsCatalog = {
  version: "1.0.0",
  lastUpdated: "2025-04-11T00:00:00Z",
  extensions: [
    {
      id: "http-client",
      name: "HTTP Client",
      description: "REST API client similar to Postman/Insomnia",
      shortDescription: "REST API client",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/http-client",
      license: "MIT",
      tags: ["api", "http", "rest", "testing"],
      languages: [],
      category: "tools",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/http-client/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/http-client/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/http-client-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "prettier-formatter",
      name: "Prettier Formatter",
      description: "Code formatter supporting JavaScript, TypeScript, CSS, JSON, HTML, Markdown",
      shortDescription: "Code formatter",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/prettier-formatter",
      license: "MIT",
      tags: ["formatter", "javascript", "typescript"],
      languages: ["javascript", "typescript", "json", "css", "html", "markdown"],
      category: "formatters",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/prettier-formatter/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/prettier-formatter/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/prettier-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "gitlens",
      name: "GitLens",
      description: "Visualize git history, blame, branches, commits",
      shortDescription: "Git visualization",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/gitlens",
      license: "MIT",
      tags: ["git", "version-control", "scm"],
      languages: [],
      category: "scm",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/gitlens/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/gitlens/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/gitlens-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "python-lsp",
      name: "Python LSP",
      description: "Language Server Protocol support for Python",
      shortDescription: "Python language support",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/python-lsp",
      license: "MIT",
      tags: ["python", "lsp", "intellisense"],
      languages: ["python"],
      category: "languages",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/python-lsp/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/python-lsp/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/python-lsp-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "rust-analyzer",
      name: "Rust Analyzer",
      description: "Advanced Rust support with real-time analysis",
      shortDescription: "Rust language support",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/rust-analyzer",
      license: "MIT",
      tags: ["rust", "lsp", "cargo"],
      languages: ["rust"],
      category: "languages",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/rust-analyzer/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/rust-analyzer/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/rust-analyzer-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "theme-atom-dark",
      name: "Atom Dark Theme",
      description: "Classic Atom dark theme ported to Eco IDE",
      shortDescription: "Dark theme",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/theme-atom-dark",
      license: "MIT",
      tags: ["theme", "dark"],
      languages: [],
      category: "themes",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/theme-atom-dark/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/theme-atom-dark/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/theme-atom-dark-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "theme-dracula",
      name: "Dracula Theme",
      description: "The famous Dracula theme with vibrant purple accents",
      shortDescription: "Dracula dark theme",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/theme-dracula",
      license: "MIT",
      tags: ["theme", "dark"],
      languages: [],
      category: "themes",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/theme-dracula/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/theme-dracula/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/theme-dracula-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "snippets-javascript",
      name: "JavaScript Snippets",
      description: "Collection of useful JavaScript and TypeScript code snippets",
      shortDescription: "JS/TS code snippets",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/snippets-javascript",
      license: "MIT",
      tags: ["snippets", "javascript", "typescript"],
      languages: ["javascript", "typescript"],
      category: "snippets",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/snippets-javascript/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/snippets-javascript/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/snippets-js-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "dockerfile-support",
      name: "Dockerfile Support",
      description: "Syntax highlighting and IntelliSense for Dockerfiles",
      shortDescription: "Dockerfile language support",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/dockerfile-support",
      license: "MIT",
      tags: ["docker", "devops"],
      languages: ["dockerfile"],
      category: "languages",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/dockerfile-support/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/dockerfile-support/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/dockerfile-v1.0.0/extension.wasm",
      installed: false
    },
    {
      id: "remote-ssh",
      name: "Remote SSH",
      description: "Connect to remote servers via SSH and edit files directly",
      shortDescription: "SSH remote editing",
      version: "1.0.0",
      author: "Eco IDE Team",
      repository: "https://github.com/geosimarg/eco-ide-extensions/tree/main/remote-ssh",
      license: "MIT",
      tags: ["remote", "ssh", "devops"],
      languages: [],
      category: "remote",
      icon: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/remote-ssh/icon.svg",
      readme: "https://raw.githubusercontent.com/geosimarg/eco-ide-extensions/main/remote-ssh/README.md",
      downloadUrl: "https://github.com/geosimarg/eco-ide-extensions/releases/download/remote-ssh-v1.0.0/extension.wasm",
      installed: false
    }
  ],
  categories: [
    { id: "languages", name: "Programming Languages", description: "Language support" },
    { id: "formatters", name: "Formatters", description: "Code formatting" },
    { id: "themes", name: "Themes", description: "Color themes" },
    { id: "snippets", name: "Snippets", description: "Code snippets" },
    { id: "tools", name: "Tools", description: "Developer tools" },
    { id: "scm", name: "Version Control", description: "Git and source control" },
    { id: "remote", name: "Remote", description: "Remote development" }
  ]
};

const REQUIRED_EXTENSION_FIELDS = ['id', 'name', 'description', 'version', 'author', 'license', 'category'];
const VALID_CATEGORIES = ['languages', 'formatters', 'themes', 'snippets', 'tools', 'scm', 'remote'];

describe('Extensions Catalog Validation', () => {
  describe('Catalog Structure', () => {
    it('should have valid version string', () => {
      expect(mockExtensionsCatalog.version).toBeDefined();
      expect(typeof mockExtensionsCatalog.version).toBe('string');
      expect(mockExtensionsCatalog.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have lastUpdated date', () => {
      expect(mockExtensionsCatalog.lastUpdated).toBeDefined();
      expect(new Date(mockExtensionsCatalog.lastUpdated).toISOString()).toBeDefined();
    });

    it('should have extensions array', () => {
      expect(mockExtensionsCatalog.extensions).toBeDefined();
      expect(Array.isArray(mockExtensionsCatalog.extensions)).toBe(true);
      expect(mockExtensionsCatalog.extensions.length).toBeGreaterThan(0);
    });

    it('should have categories array', () => {
      expect(mockExtensionsCatalog.categories).toBeDefined();
      expect(Array.isArray(mockExtensionsCatalog.categories)).toBe(true);
      expect(mockExtensionsCatalog.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Category Validation', () => {
    it('should have valid category IDs', () => {
      mockExtensionsCatalog.categories.forEach(cat => {
        expect(cat.id).toBeDefined();
        expect(cat.name).toBeDefined();
        expect(cat.description).toBeDefined();
      });
    });

    it('should have expected categories', () => {
      const categoryIds = mockExtensionsCatalog.categories.map(c => c.id);
      VALID_CATEGORIES.forEach(cat => {
        expect(categoryIds).toContain(cat);
      });
    });
  });
});

describe.each(mockExtensionsCatalog.extensions)('Extension: $name', (extension) => {
  describe('Required Fields', () => {
    it.each(REQUIRED_EXTENSION_FIELDS)('should have %s field', (field) => {
      expect(extension[field as keyof typeof extension]).toBeDefined();
    });
  });

  describe('Field Validation', () => {
    it('should have valid id (kebab-case)', () => {
      expect(extension.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });

    it('should have valid version format', () => {
      expect(extension.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have non-empty name', () => {
      expect(extension.name.length).toBeGreaterThan(0);
    });

    it('should have non-empty description', () => {
      expect(extension.description.length).toBeGreaterThan(0);
    });

    it('should have valid category', () => {
      expect(VALID_CATEGORIES).toContain(extension.category);
    });
  });

  describe('URL Fields', () => {
    it('should have valid repository URL', () => {
      if (extension.repository) {
        expect(extension.repository).toMatch(/^https?:\/\/.+/);
      }
    });

    it('should have valid icon URL', () => {
      if (extension.icon) {
        expect(extension.icon).toMatch(/^https?:\/\/.+/);
      }
    });

    it('should have valid readme URL', () => {
      if (extension.readme) {
        expect(extension.readme).toMatch(/^https?:\/\/.+/);
      }
    });

    it('should have valid download URL', () => {
      if (extension.downloadUrl) {
        expect(extension.downloadUrl).toMatch(/^https?:\/\/.+/);
      }
    });
  });

  describe('Tags and Languages', () => {
    it('should have array of tags', () => {
      expect(Array.isArray(extension.tags)).toBe(true);
    });

    it('should have array of languages', () => {
      expect(Array.isArray(extension.languages)).toBe(true);
    });

    if (extension.category === 'languages') {
      it('should have at least one language for language extensions', () => {
        expect(extension.languages.length).toBeGreaterThan(0);
      });
    }

    if (extension.category === 'themes') {
      it('should not require languages for themes', () => {
        expect(Array.isArray(extension.languages)).toBe(true);
      });
    }
  });
});

describe('Extension Uniqueness', () => {
  it('should have unique IDs', () => {
    const ids = mockExtensionsCatalog.extensions.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique names', () => {
    const names = mockExtensionsCatalog.extensions.map(e => e.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('Category Distribution', () => {
  it('should have extensions in all major categories', () => {
    const categoryCounts: Record<string, number> = {};
    mockExtensionsCatalog.extensions.forEach(ext => {
      categoryCounts[ext.category] = (categoryCounts[ext.category] || 0) + 1;
    });

    expect(categoryCounts['languages']).toBeGreaterThanOrEqual(3);
    expect(categoryCounts['themes']).toBeGreaterThanOrEqual(2);
    expect(categoryCounts['tools']).toBeGreaterThanOrEqual(1);
    expect(categoryCounts['scm']).toBeGreaterThanOrEqual(1);
  });

  it('should categorize correctly by ID prefix', () => {
    const languageExts = ['python-lsp', 'rust-analyzer', 'dockerfile-support'];
    const formatterExts = ['prettier-formatter'];
    const themeExts = ['theme-atom-dark', 'theme-dracula'];
    const toolExts = ['http-client'];
    const scmExts = ['gitlens'];
    const snippetExts = ['snippets-javascript'];
    const remoteExts = ['remote-ssh'];

    languageExts.forEach(id => {
      const ext = mockExtensionsCatalog.extensions.find(e => e.id === id);
      expect(ext?.category).toBe('languages');
    });

    themeExts.forEach(id => {
      const ext = mockExtensionsCatalog.extensions.find(e => e.id === id);
      expect(ext?.category).toBe('themes');
    });

    toolExts.forEach(id => {
      const ext = mockExtensionsCatalog.extensions.find(e => e.id === id);
      expect(ext?.category).toBe('tools');
    });
  });
});