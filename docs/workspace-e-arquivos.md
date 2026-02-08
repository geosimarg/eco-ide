# Workspace e arquivos

Este guia explica como trabalhar com pastas (workspace), listar arquivos, abrir e fechar abas e salvar arquivos no Eco IDE.

## O que é o workspace

O **workspace** é a pasta que você escolhe como “projeto” na IDE. Ao abrir uma pasta:

- O nome da pasta aparece na barra de título (centro) e no cabeçalho do Explorador.
- O conteúdo da pasta (arquivos e subpastas do **primeiro nível**) é listado no painel **Explorador**.
- A configuração do workspace (por exemplo, override de linguagem por arquivo) pode ser salva em uma pasta `.editor` dentro do workspace, no arquivo `config.json`.

Você **não é obrigado** a abrir uma pasta: pode abrir um arquivo avulso ou criar um novo arquivo sem workspace.

---

## Abrindo uma pasta

Você pode abrir uma pasta de três formas:

1. **Tela de boas-vindas** — botão **Abrir Pasta**.
2. **Barra de status** — clique em **Abrir Pasta** (ícone de pasta + texto) no canto esquerdo do rodapé.
3. **Explorador** — com o painel Explorador visível, se não houver pasta aberta, use o botão **Abrir Pasta**; se já houver, use o ícone “+” no cabeçalho do Explorador para abrir **outra** pasta.

Ao selecionar a pasta no diálogo do sistema:

- A pasta passa a ser o workspace atual.
- A lista de arquivos e pastas do primeiro nível é carregada no Explorador.
- As abas que estavam abertas são fechadas e o workspace anterior é substituído (a IDE “esquece” a pasta anterior).

---

## Explorador de arquivos

O painel **Explorador** (ícone de pasta na barra de atividades) mostra:

- **Sem pasta aberta:** mensagem e botão **Abrir Pasta**.
- **Com pasta aberta:** nome da pasta no topo, ícone para abrir outra pasta e a lista de itens do **primeiro nível** (arquivos e pastas).

### Ações no Explorador

- **Clicar em um arquivo:** o conteúdo é lido do disco e o arquivo é aberto em uma nova aba (ou ativa a aba se já estiver aberta).
- **Clicar em uma pasta:** a pasta é expandida/recolhida na árvore. *Nota: na versão atual, apenas o primeiro nível é carregado; subpastas podem não listar filhos ao expandir.*
- **Ícone no cabeçalho:** abre o diálogo para selecionar outra pasta como workspace.

Cada tipo de arquivo pode ter um ícone diferente (por exemplo TypeScript, Vue, Rust, Python, JSON, Markdown, etc.); os demais aparecem como arquivo genérico.

---

## Abas do editor

Cada arquivo aberto (ou “Sem título”) aparece como uma **aba** acima do editor.

- **Clicar na aba:** ativa esse arquivo no editor.
- **Fechar (X):** fecha a aba. Se o arquivo tiver **alterações não salvas**, a IDE pergunta se você deseja fechar mesmo assim ou cancelar.
- **Indicador de não salvo:** um ponto (bolinha) na aba indica que há alterações não salvas.

Ao fechar a aba do arquivo que está ativo, a IDE ativa automaticamente outra aba (anterior ou próxima). Se não houver mais abas, a tela de boas-vindas é exibida.

---

## Abrindo arquivos

- **Pelo Explorador:** clique no arquivo na lista (com workspace aberto).
- **Pela tela de boas-vindas:** use **Abrir Arquivo** para escolher um arquivo em qualquer lugar do disco. O arquivo é aberto em uma aba; não é necessário ter uma pasta aberta.
- **Novo arquivo:** na tela de boas-vindas, **Novo Arquivo** cria uma aba “Sem título” sem caminho. Ao salvar, você escolhe o nome e o local (Salvar como).

Não há limite prático documentado para o número de abas; você pode abrir vários arquivos ao mesmo tempo.

---

## Salvando arquivos

### Arquivo que já tem caminho

- Use o atalho **Ctrl+S** (ou **Cmd+S** no macOS) com o foco no editor.
- O conteúdo da aba atual é escrito no disco e o indicador de “não salvo” desaparece.

### Arquivo “Sem título” (novo)

- **Ctrl+S** (ou **Cmd+S**) abre o diálogo **Salvar como**.
- Escolha o local e o nome do arquivo. Há filtros por tipo (TypeScript, JavaScript, Vue, Rust, Python, etc.).
- Após salvar, a aba passa a mostrar o novo nome e caminho e deixa de ser “Sem título”.

### Sobrescrever

Salvar com **Ctrl+S** em um arquivo que já tem caminho **sobrescreve** o arquivo no disco. Não há “Salvar como” separado na documentação atual; para “Salvar como” em um arquivo já existente, use Novo Arquivo, cole o conteúdo e salve no novo local, se necessário.

---

## Linguagem do arquivo

A IDE detecta a linguagem pela **extensão** do arquivo (`.ts`, `.vue`, `.py`, etc.). Se quiser forçar outra linguagem (por exemplo, tratar um `.txt` como Markdown):

- Clique no **nome da linguagem** na barra de status (canto direito).
- No seletor, escolha a linguagem desejada.
- Se o arquivo pertencer a um workspace, essa preferência pode ser guardada em `.editor/config.json` e reaplicada na próxima vez que você abrir o arquivo.

Detalhes do editor e atalhos estão em [Editor de código](editor.md).
