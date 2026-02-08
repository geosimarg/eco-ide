# Editor de código

O editor do Eco IDE é baseado no **CodeMirror 6** e oferece realce de sintaxe, múltiplas linguagens, abas e integração com a barra de status.

## Linguagens suportadas

O editor reconhece e aplica realce de sintaxe para as seguintes linguagens (por extensão ou pelo seletor de linguagem na barra de status):

| Linguagem        | Extensões típicas |
|------------------|-------------------|
| Plain Text       | (sem extensão / outras) |
| JavaScript       | `.js`, `.jsx`     |
| TypeScript       | `.ts`, `.tsx`     |
| Vue              | `.vue`            |
| Rust             | `.rs`             |
| Python           | `.py`             |
| JSON             | `.json`           |
| HTML             | `.html`           |
| CSS              | `.css`            |
| Markdown         | `.md`             |

A detecção é feita pela extensão do arquivo. Se quiser usar outra linguagem para um arquivo (por exemplo, um `.txt` como Markdown), use o **seletor de linguagem** na barra de status (clique no nome da linguagem).

---

## Recursos do editor

- **Números de linha** — à esquerda do código.
- **Realce da linha ativa** — a linha onde está o cursor fica levemente destacada.
- **Dobramento de código (fold)** — gutter para expandir/recolher blocos (conforme suporte do CodeMirror para a linguagem).
- **Correspondência de chaves** — chaves/parênteses correspondentes são destacados.
- **Fechamento automático de chaves** — ao digitar `{`, `(`, `[`, etc., o editor insere o fechamento.
- **Indentação** — indentação automática ao digitar (e Tab para indentar).
- **Autocomplete** — sugestões de conclusão no editor (baseado no CodeMirror).
- **Busca no documento** — atalhos de busca do CodeMirror (por exemplo, Ctrl+F).
- **Destacar ocorrências** — seleção de texto destaca outras ocorrências no arquivo.
- **Histórico** — Desfazer/Refazer (Ctrl+Z / Ctrl+Shift+Z ou Cmd no macOS).
- **Tema** — tema escuro com cores no estilo “One Dark”.

---

## Atalhos de teclado (editor)

Estes atalhos estão implementados no editor atual:

| Atalho (Windows/Linux) | Atalho (macOS) | Ação        |
|------------------------|----------------|------------|
| **Ctrl+S**             | **Cmd+S**      | Salvar arquivo |
| **Ctrl+Z**             | **Cmd+Z**      | Desfazer   |
| **Ctrl+Shift+Z**       | **Cmd+Shift+Z**| Refazer    |
| **Tab**                | **Tab**        | Indentar   |
| **Ctrl+F**             | **Cmd+F**      | Buscar no documento (CodeMirror) |

Outros atalhos padrão do CodeMirror (navegação, seleção, múltiplos cursores, etc.) podem estar disponíveis; a lista acima refere-se às ações já integradas explicitamente ao fluxo da IDE (por exemplo, salvar).

---

## Barra de status e editor

Com um arquivo aberto e foco no editor, a **barra de status** (rodapé) mostra:

- **Ln X, Col Y** — linha e coluna do cursor. Se houver texto selecionado, aparece “(N selecionados)”.
- **Indentação** — ex.: “Espaços: 2” (informativo).
- **Codificação** — ex.: “UTF-8”.
- **Fim de linha** — ex.: “LF”.
- **Linguagem** — modo atual do arquivo. **Clicar** abre o seletor de linguagem para trocar o modo (e, em workspace, gravar em `.editor/config.json`).

---

## Seletor de linguagem

Ao clicar no nome da linguagem na barra de status:

1. Abre um modal com lista de linguagens suportadas.
2. Há um campo de busca para filtrar por nome ou id da linguagem.
3. A linguagem atual aparece marcada (e com indicador “✓”).
4. Ao escolher outra linguagem, o editor passa a usar o modo correspondente para o arquivo atual.
5. Se o arquivo tiver caminho e existir um workspace aberto, a preferência pode ser salva em `.editor/config.json` no workspace, para persistir na próxima abertura.

Use **Escape** para fechar o modal sem alterar.

---

## Configuração por workspace

A pasta **`.editor`** no workspace (criada automaticamente quando necessário) contém:

- **`config.json`** — entre outros, armazena `languageOverrides`: mapeamento de caminho de arquivo → nome da linguagem. Assim, a IDE “lembra” o modo de linguagem que você escolheu para cada arquivo.

Não é necessário editar esse arquivo manualmente; usar o seletor de linguagem na barra de status já atualiza a configuração.

---

## Dicas rápidas

1. **Salvar sempre que fizer mudanças importantes** — use **Ctrl+S** (ou **Cmd+S**).
2. **Fechar aba com alterações não salvas** — a IDE pergunta se deseja fechar mesmo assim; você pode cancelar e salvar antes.
3. **Arquivo sem extensão ou com extensão estranha** — use o seletor de linguagem na barra de status para escolher o modo correto.
4. **Vários arquivos abertos** — troque de aba clicando na aba desejada; a barra de status reflete sempre o arquivo ativo.

Para a interface geral (barra de título, atividades, sidebar), veja [Interface da IDE](interface.md). Para workspace, explorador e abas, veja [Workspace e arquivos](workspace-e-arquivos.md).
