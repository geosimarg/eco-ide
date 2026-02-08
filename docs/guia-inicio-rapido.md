# Guia de início rápido

Este guia ajuda você a colocar o Eco IDE em execução e a fazer as primeiras ações.

## Instalação e execução

1. **Clone o repositório** (se ainda não tiver) e entre na pasta do projeto.

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute a IDE em modo desenvolvimento:**
   ```bash
   npm run tauri:dev
   ```
   A janela do Eco IDE será aberta; o frontend é servido em `http://localhost:1420` durante o desenvolvimento.

4. **Build para produção** (opcional):
   ```bash
   npm run tauri:build
   ```
   O executável será gerado em `src-tauri/target/release/` (ou em `target/debug` conforme a configuração).

## Primeira vez na IDE

Ao abrir a IDE, você verá a **tela de boas-vindas** com:

- **Abrir Pasta** — abre um diálogo para escolher uma pasta no disco. A pasta passa a ser o “workspace” e seus arquivos aparecem no explorador.
- **Abrir Arquivo** — abre um único arquivo (sem workspace). Útil para editar um arquivo solto.
- **Novo Arquivo** — cria uma nova aba “Sem título” para editar e depois salvar onde quiser.
- **Documentação** — abre no navegador a URL da documentação (configurada no projeto).

## Próximos passos

1. **Abra uma pasta** com o botão “Abrir Pasta” na tela inicial ou no ícone de pasta na **barra de status** (rodapé).
2. No **Explorador** (ícone de pasta na barra lateral esquerda), clique em um arquivo para abri-lo no editor.
3. Edite o conteúdo e use **Ctrl+S** (ou **Cmd+S** no macOS) para salvar.
4. Use a **barra de status** para abrir outra pasta ou para alterar a **linguagem** do arquivo atual.

Para mais detalhes, consulte:

- [Interface da IDE](interface.md)
- [Workspace e arquivos](workspace-e-arquivos.md)
- [Editor de código](editor.md)
