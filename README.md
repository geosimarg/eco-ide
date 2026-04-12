# Eco IDE

Modern, extensible desktop IDE built with Tauri, Vue 3, and WebAssembly.

![Eco IDE](docs/screenshot.png)

## Features

- **Lightweight Performance**: Built with Tauri + Rust (~5MB bundle, 30-50MB RAM)
- **Advanced Editor**: CodeMirror 6 with syntax highlighting for 10+ languages
- **Autocomplete & Linting**: Built-in code completion and error detection
- **Extension Marketplace**: Load extensions from GitHub repository
- **WebAssembly Extensions**: Safe, sandboxed plugins in Rust/TypeScript
- **Multi-Tab Support**: Split view and multiple editor groups
- **i18n**: Portuguese (pt-BR), English (en-US), Spanish (es)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) 1.75+
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

```bash
git clone https://github.com/geosimarg/eco-ide.git
cd eco-ide
npm install
npm run tauri:dev
```

### Build

```bash
npm run tauri:build
```

## Commands

```bash
npm run dev          # Frontend development
npm run tauri:dev    # Full app in dev mode
npm run build        # Frontend build
npm run tauri:build # Full app build
npm test             # Run tests
npm run lint         # Lint code
```

## Project Status

| Phase | Status |
|-------|--------|
| UI/UX Desktop | ✅ Complete |
| Extension System | ✅ Complete |
| Testing Infrastructure | ✅ Complete |
| Editor Improvements | ✅ Complete |
| Refactoring | Pending |
| Polish | Pending |

**Test Suite**: 338 tests passing

## Architecture

```
eco-ide/
├── src/                    # Vue 3 frontend
│   ├── components/         # UI components
│   ├── stores/            # Pinia state management
│   ├── utils/             # Utilities (LSP, logger)
│   └── locales/           # i18n translations
├── src-tauri/             # Rust backend
│   ├── src/               # Tauri commands
│   └── wit/              # WASM interface
├── tests/                 # Test suites
└── .github/workflows/    # CI configuration
```

## Extension System

Extensions are loaded from:
- **Marketplace**: `https://github.com/geosimarg/eco-ide-extensions`
- **Local**: `.eco/extensions/` folder

Available extensions:
- HTTP Client
- Prettier Formatter
- GitLens
- Python LSP
- Rust Analyzer
- Themes (Atom Dark, Dracula)
- JavaScript Snippets
- Dockerfile Support
- Remote SSH

## Editor Features

- Syntax highlighting: TypeScript, JavaScript, Python, Rust, JSON, HTML, CSS, Markdown
- Autocomplete: CodeMirror 6 built-in
- Linting: CodeMirror 6 built-in
- Multi-cursor editing
- Search and replace
- Code folding

## License

MIT © EcoIDE Team