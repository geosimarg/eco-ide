import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkspaceStore, type OpenFile } from '@/stores/workspace';

setActivePinia(createPinia());

describe('Workspace Store', () => {
  let store: ReturnType<typeof useWorkspaceStore>;

  beforeEach(() => {
    store = useWorkspaceStore();
    store.setWorkspace('/test', 'test');
    store.groups[0].files = [];
    store.groups[0].activeFileId = null;
  });

  describe('setWorkspace', () => {
    it('should set workspace path and name', () => {
      store.setWorkspace('/project/my-app', 'my-app');

      expect(store.workspacePath).toBe('/project/my-app');
      expect(store.workspaceName).toBe('my-app');
    });

    it('should reset groups when setting workspace', () => {
      store.setWorkspace('/project/test', 'test');

      expect(store.groups).toHaveLength(1);
      expect(store.groups[0].id).toBe('group-1');
      expect(store.groups[0].files).toHaveLength(0);
      expect(store.activeGroupId).toBe('group-1');
      expect(store.activeFileId).toBeNull();
    });

    it('should clear active file id on workspace change', () => {
      store.setWorkspace('/project/old', 'old');
      store.setWorkspace('/project/new', 'new');

      expect(store.activeFileId).toBeNull();
    });
  });

  describe('setFiles', () => {
    it('should set files in workspace', () => {
      const mockFiles = [
        { name: 'src', path: '/project/src', isDirectory: true, children: [] }
      ];
      store.setFiles(mockFiles);

      expect(store.files).toEqual(mockFiles);
    });
  });

  describe('openFile', () => {
    it('should add new file to active group', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'index.ts',
        path: '/project/test/index.ts',
        content: 'console.log("hello")'
      });

      expect(fileId).toBeDefined();
      expect(store.groups[0].files).toHaveLength(1);
      expect(store.groups[0].files[0].name).toBe('index.ts');
      expect(store.groups[0].activeFileId).toBe(fileId);
    });

    it('should detect language from file extension', () => {
      store.setWorkspace('/project/test', 'test');

      store.openFile({
        name: 'script.ts',
        path: '/project/test/script.ts',
        content: ''
      });

      expect(store.groups[0].files[0].language).toBe('TypeScript');
    });

    it('should not duplicate already open files', () => {
      store.setWorkspace('/project/test', 'test');

      const id1 = store.openFile({
        name: 'App.vue',
        path: '/project/test/App.vue',
        content: '<template></template>'
      });

      const id2 = store.openFile({
        name: 'App.vue',
        path: '/project/test/App.vue',
        content: '<template></template>'
      });

      expect(id1).toBe(id2);
      expect(store.groups[0].files).toHaveLength(1);
    });

    it('should switch to group containing existing file', () => {
      store.setWorkspace('/project/test', 'test');

      store.openFile({ name: 'a.ts', path: '/a.ts', content: '' });
      store.openFile({ name: 'b.ts', path: '/b.ts', content: '' });

      store.openFile({ name: 'a.ts', path: '/a.ts', content: '' });

      expect(store.activeGroupId).toBe('group-1');
    });

    it('should respect initialLine and initialColumn', () => {
      store.setWorkspace('/project/test', 'test');

      store.openFile({
        name: 'main.py',
        path: '/project/test/main.py',
        content: 'print("hi")',
        initialLine: 10,
        initialColumn: 5
      });

      const file = store.groups[0].files[0];
      expect(file.initialLine).toBe(10);
      expect(file.initialColumn).toBe(5);
    });
  });

  describe('closeFile', () => {
    it('should remove file from group', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'test.ts',
        path: '/project/test/test.ts',
        content: ''
      });

      store.closeFile(fileId);

      expect(store.groups[0].files).toHaveLength(0);
    });

    it('should set new active file when closing active', () => {
      store.setWorkspace('/project/test', 'test');

      const id1 = store.openFile({ name: 'a.ts', path: '/a.ts', content: '' });
      store.openFile({ name: 'b.ts', path: '/b.ts', content: '' });

      store.closeFile(id1);

      expect(store.groups[0].activeFileId).not.toBe(id1);
    });

    it('should clear activeFileId when group becomes empty', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'test.ts',
        path: '/project/test/test.ts',
        content: ''
      });

      store.closeFile(fileId);

      expect(store.groups[0].activeFileId).toBeNull();
      expect(store.activeFileId).toBeNull();
    });
  });

  describe('setActiveFile', () => {
    it('should change active file in group', () => {
      store.setWorkspace('/project/test', 'test');

      const id1 = store.openFile({ name: 'a.ts', path: '/a.ts', content: '' });
      store.openFile({ name: 'b.ts', path: '/b.ts', content: '' });

      store.setActiveFile(id1);

      expect(store.groups[0].activeFileId).toBe(id1);
      expect(store.activeFileId).toBe(id1);
    });

    it('should do nothing if file not found', () => {
      store.setWorkspace('/project/test', 'test');

      const initialActiveId = store.groups[0].activeFileId;

      store.setActiveFile('non-existent-id');

      expect(store.groups[0].activeFileId).toBe(initialActiveId);
    });
  });

  describe('updateFileContent', () => {
    it('should update content and mark as modified', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'test.ts',
        path: '/project/test/test.ts',
        content: 'original'
      });

      store.updateFileContent(fileId, 'updated');

      const file = store.groups[0].files.find(f => f.id === fileId);
      expect(file?.content).toBe('updated');
      expect(file?.modified).toBe(true);
    });

    it('should do nothing if file not found', () => {
      store.setWorkspace('/project/test', 'test');

      store.updateFileContent('non-existent', 'content');

      expect(store.groups[0].files.some(f => f.modified)).toBe(false);
    });
  });

  describe('markFileSaved', () => {
    it('should mark file as not modified', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'test.ts',
        path: '/project/test/test.ts',
        content: 'content'
      });

      store.updateFileContent(fileId, 'new content');
      store.markFileSaved(fileId);

      const file = store.groups[0].files.find(f => f.id === fileId);
      expect(file?.modified).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('openFiles should flatten all group files', () => {
      store.setWorkspace('/project/test', 'test');

      store.openFile({ name: 'a.ts', path: '/a.ts', content: '' });
      store.openFile({ name: 'b.ts', path: '/b.ts', content: '' });

      expect(store.openFiles).toHaveLength(2);
    });

    it('activeFile should return current active file', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'test.ts',
        path: '/project/test/test.ts',
        content: ''
      });

      expect(store.activeFile?.id).toBe(fileId);
    });

    it('hasUnsavedChanges should detect modified files', () => {
      store.setWorkspace('/project/test', 'test');

      const fileId = store.openFile({
        name: 'test.ts',
        path: '/project/test/test.ts',
        content: ''
      });

      expect(store.hasUnsavedChanges).toBe(false);

      store.updateFileContent(fileId, 'modified');

      expect(store.hasUnsavedChanges).toBe(true);
    });

    it('activeGroup should return current group', () => {
      store.setWorkspace('/project/test', 'test');

      expect(store.activeGroup.id).toBe('group-1');
    });
  });
});

describe('getLanguageFromPath', () => {
  let store: ReturnType<typeof useWorkspaceStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useWorkspaceStore();
  });

  const languageTests = [
    { path: 'file.ts', expected: 'TypeScript' },
    { path: 'file.tsx', expected: 'TypeScript React' },
    { path: 'file.js', expected: 'JavaScript' },
    { path: 'file.jsx', expected: 'JavaScript React' },
    { path: 'file.vue', expected: 'Vue' },
    { path: 'file.rs', expected: 'Rust' },
    { path: 'file.py', expected: 'Python' },
    { path: 'file.json', expected: 'JSON' },
    { path: 'file.html', expected: 'HTML' },
    { path: 'file.css', expected: 'CSS' },
    { path: 'file.md', expected: 'Markdown' },
    { path: 'file.toml', expected: 'TOML' },
    { path: 'file.yaml', expected: 'YAML' },
    { path: 'file.yml', expected: 'YAML' },
    { path: 'file.unknown', expected: 'Plain Text' },
    { path: 'noextension', expected: 'Plain Text' },
  ];

  languageTests.forEach(({ path, expected }) => {
    it(`should return ${expected} for ${path}`, () => {
      store.setWorkspace('/test', 'test');
      store.openFile({ name: path, path: `/test/${path}`, content: '' });
      
      expect(store.groups[0].files[0].language).toBe(expected);
    });
  });
});