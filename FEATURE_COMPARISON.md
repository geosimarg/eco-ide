# Eco IDE - Feature Comparison

**Date:** 2026-04-12  
**Version:** 0.1.0 (Alpha)  
**Status:** Ready for daily use

---

## Features

### Core Editor
| Feature | Status |
|---------|--------|
| Multi-file editing | ✅ |
| Syntax highlighting | ✅ 10+ languages |
| File explorer | ✅ |
| Save / Save As | ✅ |
| Undo / Redo | ✅ |
| Find and Replace | ✅ |
| Search in files | ✅ |
| Code folding | ✅ |
| Minimap | ✅ |

### Git Integration
| Feature | Status |
|---------|--------|
| Git panel | ✅ |
| Changes, stage, commit | ✅ |
| Push/Pull | ✅ |
| Branches | ✅ |

### File Management
| Feature | Status |
|---------|--------|
| Create/delete/rename | ✅ |
| Drag and drop | ✅ |
| File watcher | ✅ |
| Recent files | ✅ |

### IDE Features
| Feature | Status |
|---------|--------|
| Custom titlebar | ✅ |
| System tray | ✅ |
| Command palette | ✅ Ctrl+Shift+P |
| Settings | Basic |
| Extensions | ✅ |

### i18n
| Feature | Status |
|---------|--------|
| Portuguese | ✅ |
| English | ✅ |
| Spanish | ✅ |

---

## Performance

- **Bundle:** ~5MB + ~300KB gzipped
- **Memory:** ~30-50MB (vs VSCode ~150-300MB)
- **Code splitting:** Lazy-loaded modals

---

## Quick Start

```bash
git clone https://github.com/geosimarg/eco-ide.git
cd eco-ide
npm install
npm run tauri:dev
```

---

*Project complete: 2026-04-12*