# Eco IDE

IDE extensível e moderna construída com Tauri, Vue 3 e WebAssembly.

![Eco IDE Screenshot](docs/screenshot.png)

## ✨ Características

- **Performance Superior**: Construída com Tauri + Rust (não Electron)
  - Bundle ~5MB (vs ~150MB do Electron)
  - Uso de RAM ~30-50MB (vs ~150-300MB)
  
- **Editor Avançado**: Powered by CodeMirror 6
  - Syntax highlighting para 10+ linguagens
  - Autocomplete inteligente
  - Suporte a múltiplas abas
  
- **Extensões Multi-Linguagem**: Via WebAssembly
  - Rust, TypeScript, Python, Go
  - Sandbox de segurança por padrão
  - Performance near-native

## 🚀 Quick Start

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) 1.75+
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/eco-ide.git
cd eco-ide

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run tauri:dev

# Ou compile para produção
npm run tauri:build
```

## 🏗️ Arquitetura

```
eco-ide/
├── src/                    # Frontend Vue 3
│   ├── components/         # Componentes UI
│   ├── stores/             # Estado Pinia
│   └── styles/             # Design system
├── src-tauri/              # Backend Rust
│   ├── src/                # Código fonte
│   └── wit/                # WebAssembly Interface Types
└── sdks/                   # SDKs para extensões
```

## 📦 Sistema de Extensões

As extensões são executadas em sandbox WebAssembly, oferecendo:
- **Segurança**: Acesso controlado a APIs
- **Performance**: Execução near-native
- **Portabilidade**: Uma build, todas as plataformas

### Exemplo de Extensão (Rust)

```rust
use eco_extension_sdk::prelude::*;

#[eco_extension]
fn activate() {
    commands::register("hello", "Dizer Olá", || {
        ui::show_message("Olá do Rust! 🦀", MessageLevel::Info);
    });
}
```

### Exemplo de Extensão (TypeScript)

```typescript
import { commands, ui, MessageLevel } from 'eco-extension-sdk';

export function activate(): void {
    commands.register("hello", "Dizer Olá", () => {
        ui.showMessage("Olá do TypeScript! 🟦", MessageLevel.Info);
    });
}
```

## 🛠️ Desenvolvimento

### Estrutura de Comandos

```bash
npm run dev          # Inicia frontend em modo dev
npm run tauri:dev    # Inicia app Tauri em modo dev
npm run build        # Build frontend
npm run tauri:build  # Build app completo
npm run test         # Executa testes
npm run lint         # Lint do código
```

### Adicionando uma Nova Linguagem

1. Instale o pacote CodeMirror correspondente
2. Importe e registre em `CodeEditor.vue`
3. Adicione a detecção de extensão em `getLanguageExtension()`

## 📄 Licença

MIT © EcoIDE Team
