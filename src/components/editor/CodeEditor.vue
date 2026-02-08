<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
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

const props = defineProps<{
  file: OpenFile;
}>();

const editorContainer = ref<HTMLElement | null>(null);
const workspaceStore = useWorkspaceStore();
const editorStore = useEditorStore();

let editorView: EditorView | null = null;
const languageCompartment = new Compartment();

// Tema dark customizado com cores vibrantes (One Dark inspired)
const darkTheme = EditorView.theme({
  '&': {
    color: '#abb2bf',
    backgroundColor: '#222224ff',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    lineHeight: '1.6',
    caretColor: '#528bff',
    padding: '8px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#528bff',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(99, 102, 241, 0.3) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(99, 102, 241, 0.4) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-gutters': {
    backgroundColor: '#16161e',
    color: '#6b7280',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    paddingLeft: '16px',
    minWidth: '40px',
  },
  '.cm-foldGutter': {
    width: '16px',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    outline: '1px solid #528bff',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-tooltip': {
    backgroundColor: '#1e1e2e',
    border: '1px solid #3b3b4f',
    borderRadius: '6px',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#2d2d3d',
    },
  },
}, { dark: true });

// Highlight style com cores vibrantes (One Dark)
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const oneDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c678dd', fontWeight: 'bold' },
  { tag: tags.operator, color: '#56b6c2' },
  { tag: tags.special(tags.variableName), color: '#e06c75' },
  { tag: tags.typeName, color: '#e5c07b' },
  { tag: tags.atom, color: '#d19a66' },
  { tag: tags.number, color: '#d19a66' },
  { tag: tags.bool, color: '#d19a66' },
  { tag: tags.string, color: '#98c379' },
  { tag: tags.regexp, color: '#98c379' },
  { tag: tags.escape, color: '#56b6c2' },
  { tag: tags.special(tags.string), color: '#56b6c2' },
  { tag: tags.definition(tags.variableName), color: '#e06c75' },
  { tag: tags.local(tags.variableName), color: '#e06c75' },
  { tag: tags.variableName, color: '#e06c75' },
  { tag: tags.function(tags.variableName), color: '#61afef' },
  { tag: tags.function(tags.propertyName), color: '#61afef' },
  { tag: tags.propertyName, color: '#e06c75' },
  { tag: tags.comment, color: '#5c6370', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#5c6370', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#5c6370', fontStyle: 'italic' },
  { tag: tags.meta, color: '#abb2bf' },
  { tag: tags.link, color: '#61afef', textDecoration: 'underline' },
  { tag: tags.heading, color: '#e06c75', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.className, color: '#e5c07b' },
  { tag: tags.definition(tags.typeName), color: '#e5c07b' },
  { tag: tags.tagName, color: '#e06c75' },
  { tag: tags.attributeName, color: '#d19a66' },
  { tag: tags.attributeValue, color: '#98c379' },
  { tag: tags.self, color: '#e06c75' },
  { tag: tags.null, color: '#d19a66' },
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
    
    // Salvar o arquivo usando o comando Tauri
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_file', { path: filePath, content: props.file.content });
    
    // Atualizar o store - manter linguagem se usuário fez override
    workspaceStore.saveFile(props.file.id, filePath, true);
    
    console.log('Arquivo salvo:', filePath);
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
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
}

function destroyEditor() {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
}

// Quando o arquivo muda, atualizar editor
watch(() => props.file.id, () => {
  destroyEditor();
  createEditor();
});

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
</script>

<template>
  <div class="code-editor" ref="editorContainer"></div>
</template>

<style scoped>
.code-editor {
  height: 100%;
  overflow: hidden;
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
