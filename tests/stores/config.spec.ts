import { describe, it, expect } from 'vitest';

describe('Config Store Logic', () => {
  describe('getRelativePath', () => {
    const getRelativePath = (fullPath: string, workspacePath: string | null): string => {
      if (!workspacePath) return fullPath;
      if (fullPath.startsWith(workspacePath)) {
        let rel = fullPath.slice(workspacePath.length);
        if (rel.startsWith('/') || rel.startsWith('\\')) {
          rel = rel.slice(1);
        }
        return rel;
      }
      return fullPath;
    };

    it('should return relative path when file is in workspace', () => {
      const result = getRelativePath('/project/my-app/src/index.ts', '/project/my-app');
      expect(result).toBe('src/index.ts');
    });

    it('should handle windows paths', () => {
      const result = getRelativePath('C:\\project\\my-app\\src\\index.ts', 'C:\\project\\my-app');
      expect(result).toBe('src\\index.ts');
    });

    it('should return full path when outside workspace', () => {
      const result = getRelativePath('/other/project/file.ts', '/project/my-app');
      expect(result).toBe('/other/project/file.ts');
    });

    it('should handle null workspace path', () => {
      const result = getRelativePath('/some/file.ts', null);
      expect(result).toBe('/some/file.ts');
    });
  });

  describe('Language Override Logic', () => {
    const getLanguageOverride = (
      filePath: string,
      languageOverrides: Record<string, string>,
      workspacePath: string
    ): string | null => {
      const relPath = filePath.slice(workspacePath.length).replace(/^[\\/]/, '');
      return languageOverrides[relPath] || null;
    };

    it('should return override from local config', () => {
      const overrides = { 'app.ts': 'Vue' };
      const result = getLanguageOverride('/project/test/app.ts', overrides, '/project/test');
      expect(result).toBe('Vue');
    });

    it('should return null when no override exists', () => {
      const overrides: Record<string, string> = {};
      const result = getLanguageOverride('/project/test/new.ts', overrides, '/project/test');
      expect(result).toBeNull();
    });
  });

  describe('Effective Config Merge', () => {
    const mergeConfigs = (
      local: { hidden_files?: string[]; hidden_folders?: string[] },
      workspace: { hidden_files?: string[]; hidden_folders?: string[] },
      global: { hidden_files?: string[]; hidden_folders?: string[] }
    ) => {
      const merged = {
        hidden_files: [
          ...(global.hidden_files || []),
          ...(local.hidden_files || []),
          ...(workspace.hidden_files || [])
        ],
        hidden_folders: [
          ...(global.hidden_folders || []),
          ...(local.hidden_folders || []),
          ...(workspace.hidden_folders || [])
        ]
      };
      merged.hidden_files = [...new Set(merged.hidden_files)];
      merged.hidden_folders = [...new Set(merged.hidden_folders)];
      return merged;
    };

    it('should merge and deduplicate hidden files', () => {
      const result = mergeConfigs(
        { hidden_files: ['a.txt', 'b.txt'] },
        { hidden_files: ['b.txt', 'c.txt'] },
        { hidden_files: [] }
      );

      expect(result.hidden_files).toContain('a.txt');
      expect(result.hidden_files).toContain('b.txt');
      expect(result.hidden_files).toContain('c.txt');
      expect(new Set(result.hidden_files).size).toBe(result.hidden_files.length);
    });

    it('should merge and deduplicate hidden folders', () => {
      const result = mergeConfigs(
        { hidden_folders: ['node_modules', '.git'] },
        { hidden_folders: ['dist', '.git'] },
        { hidden_folders: [] }
      );

      expect(result.hidden_folders).toContain('node_modules');
      expect(result.hidden_folders).toContain('.git');
      expect(result.hidden_folders).toContain('dist');
    });
  });

  describe('Language Detection from Extension', () => {
    const getLanguageFromExtension = (ext: string): string => {
      const languages: Record<string, string> = {
        ts: 'TypeScript',
        tsx: 'TypeScript React',
        js: 'JavaScript',
        jsx: 'JavaScript React',
        vue: 'Vue',
        rs: 'Rust',
        py: 'Python',
        json: 'JSON',
        html: 'HTML',
        css: 'CSS',
        md: 'Markdown',
        toml: 'TOML',
        yaml: 'YAML',
        yml: 'YAML'
      };
      return languages[ext.toLowerCase()] || 'Plain Text';
    };

    const testCases = [
      { ext: 'ts', expected: 'TypeScript' },
      { ext: 'tsx', expected: 'TypeScript React' },
      { ext: 'js', expected: 'JavaScript' },
      { ext: 'jsx', expected: 'JavaScript React' },
      { ext: 'vue', expected: 'Vue' },
      { ext: 'rs', expected: 'Rust' },
      { ext: 'py', expected: 'Python' },
      { ext: 'json', expected: 'JSON' },
      { ext: 'html', expected: 'HTML' },
      { ext: 'css', expected: 'CSS' },
      { ext: 'md', expected: 'Markdown' },
      { ext: 'toml', expected: 'TOML' },
      { ext: 'yaml', expected: 'YAML' },
      { ext: 'unknown', expected: 'Plain Text' }
    ];

    testCases.forEach(({ ext, expected }) => {
      it(`should return ${expected} for .${ext} files`, () => {
        expect(getLanguageFromExtension(ext)).toBe(expected);
      });
    });
  });
});