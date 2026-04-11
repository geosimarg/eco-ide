import { describe, it, expect } from 'vitest';

const mockManifest = {
  name: "HTTP Client",
  version: "1.0.0",
  author: "Eco IDE Team",
  description: "REST API client similar to Postman/Insomnia",
  license: "MIT",
  languages: [],
  category: "tools"
};

const requiredManifestFields = ['name', 'version', 'author', 'description', 'license', 'category'];
const validCategories = ['languages', 'formatters', 'themes', 'snippets', 'tools', 'scm', 'remote'];

describe('Extension Manifest Schema', () => {
  describe('Required Fields', () => {
    it.each(requiredManifestFields)('should have %s field', (field) => {
      expect(mockManifest[field as keyof typeof mockManifest]).toBeDefined();
    });
  });

  describe('Field Validation', () => {
    it('should have valid name', () => {
      expect(typeof mockManifest.name).toBe('string');
      expect(mockManifest.name.length).toBeGreaterThan(0);
    });

    it('should have valid version format', () => {
      expect(mockManifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have non-empty author', () => {
      expect(mockManifest.author.length).toBeGreaterThan(0);
    });

    it('should have non-empty description', () => {
      expect(mockManifest.description.length).toBeGreaterThan(0);
    });

    it('should have valid license', () => {
      expect(typeof mockManifest.license).toBe('string');
    });

    it('should have valid category', () => {
      expect(validCategories).toContain(mockManifest.category);
    });
  });

  describe('Optional Fields', () => {
    it('should have array for languages', () => {
      expect(Array.isArray(mockManifest.languages)).toBe(true);
    });
  });
});

describe.each([
  { name: 'HTTP Client', category: 'tools', languages: [] },
  { name: 'Prettier Formatter', category: 'formatters', languages: ['javascript', 'typescript'] },
  { name: 'Python LSP', category: 'languages', languages: ['python'] },
  { name: 'Rust Analyzer', category: 'languages', languages: ['rust'] },
  { name: 'Atom Dark Theme', category: 'themes', languages: [] },
  { name: 'Dracula Theme', category: 'themes', languages: [] },
  { name: 'JavaScript Snippets', category: 'snippets', languages: ['javascript', 'typescript'] },
  { name: 'Dockerfile Support', category: 'languages', languages: ['dockerfile'] },
  { name: 'GitLens', category: 'scm', languages: [] },
  { name: 'Remote SSH', category: 'remote', languages: [] }
])('Extension Manifest: $name', (manifest) => {
  it('should have valid category', () => {
    expect(validCategories).toContain(manifest.category);
  });

  it('should have languages array', () => {
    expect(Array.isArray(manifest.languages)).toBe(true);
  });

  if (manifest.category === 'languages') {
    it('should specify at least one language', () => {
      expect(manifest.languages.length).toBeGreaterThan(0);
    });
  }

  if (manifest.category === 'themes') {
    it('should not require languages', () => {
      expect(Array.isArray(manifest.languages)).toBe(true);
    });
  }
});