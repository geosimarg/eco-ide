# Extensões do Eco IDE

O sistema de extensões permite adicionar funcionalidades extras à IDE.

## Marketplace

As extensões podem ser instaladas a partir do **Marketplace** (repositório GitHub):

🔗 **Repositório**: https://github.com/geosimarg/eco-ide-extensions

### Extensões Disponíveis

| Extensão | Categoria | Descrição |
|----------|-----------|-----------|
| HTTP Client | Tools | Cliente REST similar ao Postman |
| Prettier Formatter | Formatters | Formatador de código |
| GitLens | SCM | Visualização de histórico Git |
| Python LSP | Languages | Suporte Python via LSP |
| Rust Analyzer | Languages | Suporte Rust via LSP |
| Atom Dark Theme | Themes | Tema escuro estilo Atom |
| Dracula Theme | Themes | Tema Dracula |
| JavaScript Snippets | Snippets | Snippets JS/TS |
| Dockerfile Support | Languages | Suporte a Dockerfiles |
| Remote SSH | Remote | Edição remota via SSH |

## Como Instalar

1. Abra o painel de **Extensões** (ícone de peças na barra lateral)
2. Clique na aba **Marketplace**
3. Use a barra de busca para filtrar extensões
4. Clique no botão **Instalar** na extensão desejada

## Instalação Local

Também é possível instalar extensões manualmente:

1. Coloque arquivos de extensão na pasta `.eco/extensions/` do workspace
2. Cada extensão deve ter um arquivo `eco-ext.json` com o manifesto
3. Recarregue a IDE ou clique em "Atualizar" no painel de extensões

## Manifesto de Extensão

Cada extensão precisa de um arquivo `eco-ext.json`:

```json
{
  "name": "Minha Extensão",
  "version": "1.0.0",
  "author": "Seu Nome",
  "description": "Descrição da extensão",
  "category": "tools",
  "languages": [],
  "entry": "extension.wasm"
}
```

---

*Para desenvolvedores: veja `.planning/codebase/ARCHITECTURE.md` para detalhes técnicos.*