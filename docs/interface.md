# Interface da IDE

A janela do Eco IDE é dividida em áreas fixas. Conhecer cada uma ajuda a navegar e usar as funções disponíveis.

## Barra de título (topo)

- **Lado esquerdo:** logo e nome “Eco IDE”.
- **Centro:** nome do workspace (pasta aberta). Se nenhuma pasta estiver aberta, pode aparecer “Sem pasta aberta”.
- **Lado direito:** botões de janela:
  - **Minimizar** — minimiza a janela.
  - **Maximizar / Restaurar** — alterna entre janela maximizada e tamanho normal.
  - **Fechar** — fecha a aplicação.

A área central da barra é “arrastável”: você pode arrastar a janela pelo título (em sistemas em que a decoração nativa está desativada).

---

## Barra de atividades (lateral esquerda)

É a faixa vertical estreita com ícones. Cada ícone troca o painel exibido na **sidebar**:

| Ícone | Painel | Descrição |
|-------|--------|-----------|
| Pasta | **Explorador** | Árvore de arquivos da pasta aberta. |
| Lupa | **Buscar** | Campo para buscar texto nos arquivos (funcionalidade em desenvolvimento). |
| Três círculos | **Controle de Código** | Painel Git (em desenvolvimento). |
| Quadrados | **Extensões** | Painel de extensões (em desenvolvimento). |

Clicar de novo no ícone do painel já visível **oculta ou exibe** a sidebar.

Na parte inferior da barra de atividades há um ícone de **configurações** (engrenagem); a ação ainda pode estar em desenvolvimento.

---

## Sidebar (painel lateral)

Aparece ao lado da barra de atividades quando um dos ícones (Explorador, Buscar, etc.) está ativo.

- **Cabeçalho:** título do painel atual (EXPLORADOR, BUSCAR, EXTENSÕES, CONTROLE DE CÓDIGO).
- **Conteúdo:** depende do painel selecionado:
  - **Explorador:** lista de arquivos e pastas do workspace; botão para “Abrir Pasta” quando não há pasta aberta.
  - **Buscar:** campo de busca e lista de resultados (em desenvolvimento).
  - **Extensões / Controle de Código:** painéis preparados para uso futuro.

A largura da sidebar é fixa (definida no layout). Você pode ocultá-la clicando novamente no ícone correspondente na barra de atividades.

---

## Área do editor (centro)

- **Abas:** cada arquivo aberto aparece como uma aba. Clique na aba para ativar o arquivo; o “X” fecha a aba (com confirmação se houver alterações não salvas).
- **Conteúdo:** o editor de código (CodeMirror) ocupa o restante do espaço — números de linha, realce de sintaxe, indentação e atalhos de teclado.

Quando não há abas abertas, a **tela de boas-vindas** é exibida (Abrir Pasta, Abrir Arquivo, Novo Arquivo, Documentação).

---

## Barra de status (rodapé)

Barra roxa no pé da janela com informações e ações:

- **Esquerda:**
  - **Abrir Pasta** — abre o diálogo para selecionar uma pasta como workspace (igual à tela de boas-vindas).

- **Direita** (quando há um arquivo aberto e ativo):
  - **Ln X, Col Y** — linha e coluna do cursor; se houver seleção, mostra “(N selecionados)”.
  - **Indentação** — ex.: “Espaços: 2” (informativo).
  - **Codificação** — ex.: “UTF-8”.
  - **Fim de linha** — ex.: “LF”.
  - **Linguagem** — modo de linguagem do arquivo (ex.: TypeScript, Python). **Clicar** abre o **seletor de linguagem** para trocar o modo do arquivo atual (útil para override quando a extensão não basta).

O **seletor de linguagem** é um modal com lista de linguagens e campo de busca; a escolha é aplicada ao arquivo atual e pode ser persistida no workspace (`.editor/config.json`).

---

## Resumo visual

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Eco IDE     Nome do workspace    [ − ] [ □ ] [ × ]   │  ← Barra de título
├──┬──────────────────────────────────────────────────────────┤
│  │ EXPLORADOR                                                │
│📁│  📁 pasta                                                  │  ← Sidebar (Explorador)
│  │    📄 arquivo.ts                                          │
│🔍│                                                            │
│  ├───────────────────────────────────────────────────────────┤
│  │ [aba1] [aba2] [aba3] ×                                    │  ← Abas
│  │ 1  │ código do arquivo...                                 │
│  │ 2  │ ...                                                  │  ← Editor
│  │    │                                                      │
├──┴────┴───────────────────────────────────────────────────────┤
│ [Abrir Pasta]     Ln 2, Col 5  Esp: 2  UTF-8  LF  TypeScript  │  ← Barra de status
└─────────────────────────────────────────────────────────────┘
   ↑
   Barra de atividades
```

Para abrir arquivos, salvar e usar o editor no dia a dia, veja [Workspace e arquivos](workspace-e-arquivos.md) e [Editor de código](editor.md).
