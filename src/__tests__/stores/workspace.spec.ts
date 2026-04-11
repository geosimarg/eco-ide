import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkspaceStore } from '@/stores/workspace';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Setup Pinia for tests
beforeEach(() => {
  setActivePinia(createPinia());
});

describe('workspace store', () => {
  describe('setWorkspace', () => {
    it('should set workspace path and name', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test/path', 'TestWorkspace');
      
      expect(store.workspacePath).toBe('/test/path');
      expect(store.workspaceName).toBe('TestWorkspace');
    });

    it('should reset groups when setting workspace', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test/path', 'TestWorkspace');
      
      expect(store.groups).toHaveLength(1);
      expect(store.groups[0].id).toBe('group-1');
      expect(store.groups[0].files).toHaveLength(0);
      expect(store.activeGroupId).toBe('group-1');
    });
  });

  describe('setFiles', () => {
    it('should set files in the store', () => {
      const store = useWorkspaceStore();
      const mockFiles = [
        { name: 'file1.ts', path: '/test/file1.ts', isDirectory: false },
        { name: 'src', path: '/test/src', isDirectory: true, children: [] }
      ];
      
      store.setFiles(mockFiles as any);
      
      expect(store.files).toEqual(mockFiles);
    });
  });

  describe('openFile', () => {
    it('should add new file to active group', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileEntry = {
        name: 'test.ts',
        path: '/test/test.ts',
        content: 'console.log("test")'
      };
      
      const fileId = store.openFile(fileEntry);
      
      expect(store.activeGroup.files).toHaveLength(1);
      expect(store.activeGroup.files[0].name).toBe('test.ts');
      expect(store.activeGroup.files[0].path).toBe('/test/test.ts');
      expect(store.activeGroup.activeFileId).toBe(fileId);
    });

    it('should detect existing file and switch to its group', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileEntry = {
        name: 'test.ts',
        path: '/test/test.ts',
        content: 'console.log("test")'
      };
      
      // Open first time
      const fileId1 = store.openFile(fileEntry);
      
      // Open again - should find existing
      const fileId2 = store.openFile(fileEntry);
      
      expect(fileId1).toBe(fileId2);
      expect(store.activeGroup.files).toHaveLength(1);
    });

    it('should use language override from config', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileEntry = {
        name: 'test.ts',
        path: '/test/test.ts',
        content: 'console.log("test")'
      };
      
      store.openFile(fileEntry);
      
      // TypeScript should be detected for .ts files
      expect(store.activeGroup.files[0].language).toBe('TypeScript');
    });
  });

  describe('closeFile', () => {
    it('should remove file from group', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileId = store.openFile({
        name: 'test.ts',
        path: '/test/test.ts',
        content: ''
      });
      
      store.closeFile(fileId);
      
      expect(store.activeGroup.files).toHaveLength(0);
      expect(store.activeGroup.activeFileId).toBeNull();
    });

    it('should activate next file when closing active', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileId1 = store.openFile({ name: 'a.ts', path: '/test/a.ts', content: '' });
      store.openFile({ name: 'b.ts', path: '/test/b.ts', content: '' });
      
      store.closeFile(fileId1);
      
      expect(store.activeGroup.files).toHaveLength(1);
      expect(store.activeGroup.files[0].name).toBe('b.ts');
    });
  });

  describe('setActiveFile', () => {
    it('should set active file and switch to its group', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileId1 = store.openFile({ name: 'a.ts', path: '/test/a.ts', content: '' });
      store.openFile({ name: 'b.ts', path: '/test/b.ts', content: '' });
      
      store.setActiveFile(fileId1);
      
      expect(store.activeGroupId).toBe('group-1');
      expect(store.activeGroup.activeFileId).toBe(fileId1);
    });
  });

  describe('updateFileContent', () => {
    it('should update file content and mark as modified', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileId = store.openFile({
        name: 'test.ts',
        path: '/test/test.ts',
        content: 'original'
      });
      
      store.updateFileContent(fileId, 'updated content');
      
      const file = store.activeGroup.files.find(f => f.id === fileId);
      expect(file?.content).toBe('updated content');
      expect(file?.modified).toBe(true);
    });
  });

  describe('markFileSaved', () => {
    it('should mark file as not modified', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const fileId = store.openFile({
        name: 'test.ts',
        path: '/test/test.ts',
        content: 'content'
      });
      
      store.updateFileContent(fileId, 'new content');
      store.markFileSaved(fileId);
      
      const file = store.activeGroup.files.find(f => f.id === fileId);
      expect(file?.modified).toBe(false);
    });
  });

  describe('computed properties', () => {
    describe('activeFile', () => {
      it('should return null when no file is active', () => {
        const store = useWorkspaceStore();
        store.setWorkspace('/test', 'Test');
        
        expect(store.activeFile).toBeNull();
      });

      it('should return active file', () => {
        const store = useWorkspaceStore();
        store.setWorkspace('/test', 'Test');
        
        const fileId = store.openFile({
          name: 'test.ts',
          path: '/test/test.ts',
          content: ''
        });
        
        expect(store.activeFile).not.toBeNull();
        expect(store.activeFile?.id).toBe(fileId);
      });
    });

    describe('hasUnsavedChanges', () => {
      it('should return false when no files are modified', () => {
        const store = useWorkspaceStore();
        store.setWorkspace('/test', 'Test');
        
        expect(store.hasUnsavedChanges).toBe(false);
      });

      it('should return true when files are modified', () => {
        const store = useWorkspaceStore();
        store.setWorkspace('/test', 'Test');
        
        const fileId = store.openFile({
          name: 'test.ts',
          path: '/test/test.ts',
          content: ''
        });
        
        store.updateFileContent(fileId, 'changed');
        
        expect(store.hasUnsavedChanges).toBe(true);
      });
    });

    describe('openFiles', () => {
      it('should return all open files across groups', () => {
        const store = useWorkspaceStore();
        store.setWorkspace('/test', 'Test');
        
        store.openFile({ name: 'a.ts', path: '/test/a.ts', content: '' });
        
        expect(store.openFiles).toHaveLength(1);
      });
    });
  });

  describe('createGroup', () => {
    it('should create a new editor group', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      const groupId = store.createGroup();
      
      expect(store.groups).toHaveLength(2);
      expect(groupId).toBeDefined();
    });
  });

  describe('closeGroup', () => {
    it('should close a group and remove it', () => {
      const store = useWorkspaceStore();
      store.setWorkspace('/test', 'Test');
      
      store.openFile({ name: 'test.ts', path: '/test/test.ts', content: '' });
      const newGroupId = store.createGroup();
      
      store.closeGroup(newGroupId);
      
      expect(store.groups).toHaveLength(1);
    });
  });
});