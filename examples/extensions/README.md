# Extensões do Eco IDE

Este diretório contém exemplos de extensões que podem ser instaladas no Eco IDE.

## Como Criar uma Extensão

### 1. Estrutura de Arquivos

Cada extensão deve ter:
```
minha-extensao/
├── eco-ext.json     (manifesto)
└── extension.wasm   ( bytecode WebAssembly)
```

### 2. Manifesto (eco-ext.json)

```json
{
  "name": "Nome da Extensão",
  "version": "1.0.0",
  "author": "Seu Nome",
  "description": "Descrição da extensão",
  "languages": ["javascript", "typescript"]
}
```

### 3. Compilando (WASM)

#### Usando Rust:
```bash
# Instale wit-bindgen
cargo install wit-bindgen-cli

# Compile
cargo build --target wasm32-wasi --release
```

#### Usando TypeScript (jco):
```bash
# Instale jco
npm install -g @bytecodealliance/jco

# Compile
jco build --target wasm-wasi
```

## Como Instalar

### Opção 1: No Workspace
Coloque suas extensões em:
```
seu-projeto/.eco/extensions/
```

### Opção 2: Browse de Pasta
1. Abra o painel de Extensões
2. Clique em "Adicionar Pasta"
3. Selecione o diretório contendo suas extensões

## API da Extensão

As extensões podem usar as seguintes interfaces (definidas em `src-tauri/wit/extension.wit`):

- **editor**: Manipulação do editor de código
- **commands**: Registro de comandos na paleta
- **ui**: Elementos de interface (toasts, quickpick, etc)
- **workspace**: Acesso ao sistema de arquivos
- **logging**: Sistema de logs

## Exemplo: Hello World (Rust)

```rust
use eco_extension_sdk::prelude::*;

#[eco_extension]
fn activate() {
    commands::register("hello", "Say Hello", || {
        ui::show_message("Hello from Rust!", MessageLevel::Info);
    });
}
```

## Formato de Saída

O sistema de extensões currently suporta carregamento de módulos WASM que exportam:
- `activate()` - chamado ao ativar a extensão
- `deactivate()` - chamado ao desativar

---

**Nota**: O sistema de extensões ainda está em desenvolvimento. APIs podem mudar.