/**
 * Shared type definitions for Eco IDE
 * Extracted from stores for reuse across the codebase
 */

// ============================================
// Editor Types
// ============================================

export interface OpenFile {
    id: string;
    name: string;
    path: string;
    content: string;
    modified: boolean;
    language: string;
    pinned?: boolean;
    initialLine?: number;
    initialColumn?: number;
}

export interface EditorGroup {
    id: string;
    files: OpenFile[];
    activeFileId: string | null;
    direction?: 'horizontal' | 'vertical';
}

// ============================================
// File Explorer Types
// ============================================

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileEntry[];
    expanded?: boolean;
}

// ============================================
// Git Types
// ============================================

export interface GitChange {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed' | 'copied';
    staged: boolean;
}

export interface GitBranch {
    name: string;
    current: boolean;
}

export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
}

// ============================================
// Config Types
// ============================================

export interface EditorConfig {
    languageOverrides: Record<string, string>;
    tabSize: number;
    insertSpaces: boolean;
    fontSize: number;
    fontFamily: string;
    theme: string;
}

export interface WorkspaceConfig {
    editor: EditorConfig;
    extensions: Record<string, unknown>;
}

// ============================================
// Extension Types
// ============================================

export interface ExtensionManifest {
    name: string;
    version: string;
    author: string;
    description: string;
    category: string;
    languages: string[];
    entry: string;
}

export interface Extension {
    id: string;
    manifest: ExtensionManifest;
    installed: boolean;
    enabled: boolean;
    path?: string;
}

// ============================================
// UI Types
// ============================================

export type ActivityView = 'files' | 'search' | 'extensions' | 'git' | 'http';

export interface ModalState {
    type: 'unsaved' | 'settings' | 'newFile' | 'language' | null;
    data?: unknown;
}