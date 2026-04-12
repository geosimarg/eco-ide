<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment, EditorSelection } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';

// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { rust } from '@codemirror/lang-rust';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';

import type { OpenFile } from '@/stores/workspace';
import { useWorkspaceStore } from '@/stores/workspace';
import { useEditorStore } from '@/stores/editor';
import { logger } from '@/utils/logger';
import Minimap from './Minimap.vue';

const props = defineProps<{
  file: OpenFile;
}>();

const emit = defineEmits<{
  scroll: [scrollPercent: number];
}>();

const editorContainer = ref<HTMLElement | null>(null);
const minimapScrollPercent = ref(0);
const workspaceStore = useWorkspaceStore();
const editorStore = useEditorStore();

let editorView: EditorView | null = null;
const languageCompartment = new Compartment();
let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;

import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const darkTheme = EditorView.theme({
  '&': {
    color: 'var(--editor-fg)',
    backgroundColor: 'var(--editor-bg)',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--editor-font-size)',
    lineHeight: 'var(--editor-line-height)',
    caretColor: 'var(--editor-cursor-color)',
    padding: '8px 0',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--editor-cursor-color)',
    borderLeftWidth: 'var(--editor-cursor-width)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--editor-selection-bg) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--editor-selection-bg-focused) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--editor-active-line-bg)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--editor-active-line-bg)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--editor-gutter-bg)',
    color: 'var(--editor-gutter-fg)',
    border: 'none',
    paddingRight: '8px',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
    msUserSelect: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    paddingLeft: '16px',
    minWidth: '40px',
    userSelect: 'none',
  },
  '.cm-foldGutter': {
    width: 'var(--editor-fold-gutter-width)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--editor-bracket-match-bg)',
    outline: '1px solid var(--editor-bracket-match-outline)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--editor-tooltip-bg)',
    border: '1px solid var(--editor-tooltip-border)',
    borderRadius: '6px',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'var(--editor-autocomplete-selected-bg)',
    },
  },
}, { dark: true });

const oneDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--syntax-keyword)', fontWeight: 'bold' },
  { tag: tags.operator, color: 'var(--syntax-operator)' },
  { tag: tags.special(tags.variableName), color: 'var(--syntax-variable)' },
  { tag: tags.typeName, color: 'var(--syntax-type)' },
  { tag: tags.atom, color: 'var(--syntax-number)' },
  { tag: tags.number, color: 'var(--syntax-number)' },
  { tag: tags.bool, color: 'var(--syntax-number)' },
  { tag: tags.string, color: 'var(--syntax-string)' },
  { tag: tags.regexp, color: 'var(--syntax-string)' },
  { tag: tags.escape, color: 'var(--syntax-operator)' },
  { tag: tags.special(tags.string), color: 'var(--syntax-operator)' },
  { tag: tags.definition(tags.variableName), color: 'var(--syntax-variable)' },
  { tag: tags.local(tags.variableName), color: 'var(--syntax-variable)' },
  { tag: tags.variableName, color: 'var(--syntax-variable)' },
  { tag: tags.function(tags.variableName), color: 'var(--syntax-function)' },
  { tag: tags.function(tags.propertyName), color: 'var(--syntax-function)' },
  { tag: tags.propertyName, color: 'var(--syntax-property)' },
  { tag: tags.comment, color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: tags.lineComment, color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: tags.blockComment, color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: tags.meta, color: 'var(--syntax-meta)' },
  { tag: tags.link, color: 'var(--syntax-link)', textDecoration: 'underline' },
  { tag: tags.heading, color: 'var(--syntax-heading)', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.className, color: 'var(--syntax-type)' },
  { tag: tags.definition(tags.typeName), color: 'var(--syntax-type)' },
  { tag: tags.tagName, color: 'var(--syntax-tag)' },
  { tag: tags.attributeName, color: 'var(--syntax-attribute)' },
  { tag: tags.attributeValue, color: 'var(--syntax-string)' },
  { tag: tags.self, color: 'var(--syntax-variable)' },
  { tag: tags.null, color: 'var(--syntax-number)' },
]);


function getLanguageExtensionByName(langName: string) {
  // Mapeia nome de linguagem para extensão do CodeMirror
  const langLower = langName.toLowerCase();
  switch (langLower) {
    case 'javascript':
    case 'javascript react':
      return javascript({ jsx: true });
    case 'typescript':
    case 'typescript react':
      return javascript({ jsx: true, typescript: true });
    case 'vue':
      return javascript({ jsx: true, typescript: true });
    case 'rust':
      return rust();
    case 'python':
      return python();
    case 'json':
      return json();
    case 'html':
      return html();
    case 'css':
      return css();
    case 'markdown':
      return markdown();
    default:
      return [];
  }
}

function getLanguageExtension(filenameOrLang: string, languageOverride?: string) {
  // Se houver override de linguagem, usar
  if (languageOverride && languageOverride !== 'Plain Text') {
    return getLanguageExtensionByName(languageOverride);
  }

  // Caso contrário, detectar pela extensão do arquivo
  const ext = filenameOrLang.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return javascript({ jsx: true });
    case 'ts':
    case 'tsx':
      return javascript({ jsx: true, typescript: true });
    case 'vue':
      return javascript({ jsx: true, typescript: true });
    case 'rs':
      return rust();
    case 'py':
      return python();
    case 'json':
      return json();
    case 'html':
      return html();
    case 'css':
      return css();
    case 'md':
      return markdown();
    default:
      return [];
  }
}

async function saveFile() {
  if (!props.file) return;

  try {
    let filePath = props.file.path;

    // Se não tem caminho, abrir diálogo "Salvar Como"
    if (!filePath) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const selected = await save({
        title: 'Salvar arquivo',
        defaultPath: props.file.name === 'Sem título' ? 'novo_arquivo.txt' : props.file.name,
        filters: [
          { name: 'Todos os arquivos', extensions: ['*'] },
          { name: 'TypeScript', extensions: ['ts', 'tsx'] },
          { name: 'JavaScript', extensions: ['js', 'jsx'] },
          { name: 'Vue', extensions: ['vue'] },
          { name: 'Rust', extensions: ['rs'] },
          { name: 'Python', extensions: ['py'] },
        ]
      });

      if (!selected) return; // Usuário cancelou
      filePath = selected;
    }

    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_file', { path: filePath, content: props.file.content });

    workspaceStore.saveFile(props.file.id, filePath, true);

    logger.log('Arquivo salvo:', filePath);
  } catch (error) {
    logger.error('Erro ao salvar arquivo:', error);
  }
}

function createEditor() {
  if (!editorContainer.value) return;

  const extensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    foldGutter(),
    history(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    autocompletion(),
    highlightSelectionMatches(),
    syntaxHighlighting(oneDarkHighlight),
    languageCompartment.of(getLanguageExtension(props.file.name, props.file.language)),
    darkTheme,
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...completionKeymap,
      ...searchKeymap,
      ...lintKeymap,
      indentWithTab,
      { key: 'Mod-s', run: () => { saveFile(); return true; } },
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        workspaceStore.updateFileContent(props.file.id, content);
      }
      // Atualizar posição do cursor
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        editorStore.setCursorPosition(line.number, pos - line.from + 1);
        editorStore.setSelection(Math.abs(update.state.selection.main.to - update.state.selection.main.from));
      }
    }),
  ];

  const state = EditorState.create({
    doc: props.file.content,
    extensions,
  });

  editorView = new EditorView({
    state,
    parent: editorContainer.value,
  });

  const scroller = editorView.scrollDOM;
  scroller.addEventListener('scroll', handleEditorScroll);

  if (props.file.initialLine) {
    scheduleApplyInitialPosition();
  }
}

function handleEditorScroll() {
  if (!editorView) return;

  if (scrollDebounceTimer) {
    clearTimeout(scrollDebounceTimer);
  }

  scrollDebounceTimer = setTimeout(() => {
    if (!editorView) return;
    const scroller = editorView.scrollDOM;
    const scrollTop = scroller.scrollTop;
    const scrollHeight = scroller.scrollHeight - scroller.clientHeight;

    if (scrollHeight > 0) {
      const percent = scrollTop / scrollHeight;
      minimapScrollPercent.value = percent;
      emit('scroll', percent);
    }
  }, 16);
}

function applyInitialPosition() {
  if (!editorView || !props.file.initialLine) return;

  const line = props.file.initialLine;
  const col = props.file.initialColumn || 1;
  const doc = editorView.state.doc;

  if (line > doc.lines) return;

  const lineInfo = doc.line(line);
  const pos = Math.min(lineInfo.from + col - 1, lineInfo.to);
  const selection = EditorSelection.cursor(pos);

  editorView.dispatch({
    selection,
    effects: EditorView.scrollIntoView(pos, { y: 'center' }),
  });
  editorView.focus();

  workspaceStore.clearInitialPosition(props.file.id);
}

function scheduleApplyInitialPosition() {
  setTimeout(() => {
    applyInitialPosition();
  }, 50);
}

function destroyEditor() {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
}

watch(() => props.file.id, () => {
  destroyEditor();
  createEditor();
});

// Quando o arquivo já está aberto e recebe nova posição (ex.: outro resultado da busca)
watch(
  () => [props.file.initialLine, props.file.initialColumn],
  ([line, _col]) => {
    if (line !== undefined && editorView) {
      scheduleApplyInitialPosition();
    }
  },
);

// Quando a linguagem muda (override do usuário), reconfigura o compartment
watch(() => props.file.language, (newLang) => {
  if (editorView && newLang) {
    editorView.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtensionByName(newLang))
    });
  }
});

onMounted(() => {
  createEditor();
});

onUnmounted(() => {
  destroyEditor();
});

function handleMinimapScroll(percent: number) {
  if (!editorView) return;
  const scroller = editorView.scrollDOM;
  const scrollHeight = scroller.scrollHeight - scroller.clientHeight;
  scroller.scrollTop = percent * scrollHeight;
}
</script>

<template>
  <div class="code-editor-wrapper">
    <div class="code-editor" ref="editorContainer"></div>
    <Minimap 
      :content="file.content" 
      :scrollPercent="minimapScrollPercent"
      @scrollChange="handleMinimapScroll"
    />
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.code-editor {
  height: 100%;
  overflow: hidden;
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
