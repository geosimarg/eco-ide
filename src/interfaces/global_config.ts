import { RecentWorkspace } from "./recent_workspace";

export interface GlobalConfig {
    locale: string;
    lastWorkspacePath?: string;
    shouldRestoreSession?: boolean;
    hidden_files?: string[];
    hidden_folders?: string[];
    recentWorkspaces?: RecentWorkspace[];

    // Appearance
    theme?: 'dark' | 'light';
    fontSize?: number;
    fontFamily?: string;

    // Editor
    tabSize?: number;
    wordWrap?: boolean;
    minimap?: boolean;
    lineNumbers?: boolean;

    // Auto-save
    autoSave?: boolean;
    autoSaveInterval?: number; // seconds

    // Behavior
    confirmExit?: boolean;
    restoreSession?: boolean;
}