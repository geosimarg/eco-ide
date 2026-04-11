# Architecture

## Overview

Eco IDE follows a **component-based architecture** with Pinia for state management and Tauri for desktop integration. The architecture emphasizes separation of concerns and reactive data flow.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.vue                             │
│  (Root component - window close handling, layout)          │
└──────────────┬──────────────────────────┬─────────────────┘
               │                          │
        ┌──────▼──────┐          ┌────────▼────────┐
        │  Activity   │          │     Sidebar     │
        │    Bar      │          │  (FileExplorer) │
        └──────┬──────┘          └────────┬────────┘
               │                          │
        ┌──────▼──────────────────────────▼──────┐
        │              EditorArea                  │
        │  (Tab management, EditorGroup control)  │
        └──────────────────┬──────────────────────┘
                           │
        ┌──────────────────▼──────────────────────┐
        │           CodeEditor.vue                │
        │        (CodeMirror 6 integration)       │
        └─────────────────────────────────────────┘
```

## State Management

### Pinia Stores

| Store | Responsibility |
|-------|----------------|
| **workspace.ts** | Editor tabs, groups, files, sessions, workspace operations |
| **config.ts** | Per-project config (.eco/workspace.json) |
| **globalConfig.ts** | Global settings (locale, last workspace) |
| **editor.ts** | Cursor position, selection |
| **ui.ts** | UI state (modals, panels) |
| **i18n.ts** | Internationalization |
| **extensions.ts** | Extension discovery/loading |

### Key Architectural Decisions

1. **Multiple Editor Groups**: `workspace.ts` supports multiple editor groups (like VSCode split view)
2. **Lazy Store Imports**: Some stores import each other inside functions to avoid circular deps
3. **Computed openFiles**: `openFiles` is a computed property flattening all groups
4. **Two-layer config**: Global + Local config merging via `effectiveConfig` computed

## Data Flow

### File Opening Flow
```
User clicks file → FileExplorer
    ↓
workspaceStore.openFile() → Check existing in any group
    ↓ (if new)
Create OpenFile object → Add to activeGroup
    ↓
CodeEditor.vue (watch) → Create EditorView
```

### File Save Flow
```
User presses Ctrl+S → CodeEditor.saveFile()
    ↓
Tauri invoke('write_file') → Rust backend
    ↓
workspaceStore.saveFile() → Update state
```

## Component Hierarchy

```
App
├── TitleBar
├── ActivityBar
├── Sidebar
│   ├── FileExplorer
│   ├── SearchPanel
│   ├── ExtensionsPanel
│   └── GitPanel
├── EditorArea
│   ├── EditorGroup
│   │   ├── EditorTab (multiple)
│   │   └── CodeEditor
│   └── EditorTabs (if split view)
├── StatusBar
└── Modals
    ├── UnsavedChangesModal
    └── SettingsModal
```

## Extension Architecture (Implemented)

```
Extensions (.wasm files) → Wasmtime runtime
        ↓
load_extension command (Rust)
        ↓
ExtensionHost sandbox
        ↓
WASM guest code execution
```

**Implementado em:**
- `src-tauri/src/extensions/host.rs` - Wasmtime host
- `src-tauri/src/extensions/mod.rs` - Extension loading
- `src-tauri/wit/extension.wit` - Interface definition

## Summary

The architecture is well-structured with clear separation between UI components, state management, and native integration. The workspace store is the most complex component, handling multiple editor groups and file operations.