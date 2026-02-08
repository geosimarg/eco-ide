<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '@/stores/workspace';
import { useConfigStore } from '@/stores/config';
import { logger } from '@/utils/logger';

const workspaceStore = useWorkspaceStore();
const configStore = useConfigStore();

async function handleOpenFolder() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Selecione uma pasta'
    });
    
    if (selected && typeof selected === 'string') {
      await workspaceStore.openFolder(selected);
      await configStore.loadConfig(selected);
    }
  } catch (error) {
    logger.error('Erro ao abrir pasta:', error);
  }
}

async function handleOpenFile() {
  try {
    const selected = await open({
      directory: false,
      multiple: false,
      title: 'Abrir arquivo',
      filters: [
        { name: 'Todos os arquivos', extensions: ['*'] },
        { name: 'TypeScript', extensions: ['ts', 'tsx'] },
        { name: 'JavaScript', extensions: ['js', 'jsx'] },
        { name: 'Vue', extensions: ['vue'] },
        { name: 'Rust', extensions: ['rs'] },
        { name: 'Python', extensions: ['py'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'CSS', extensions: ['css', 'scss', 'less'] },
        { name: 'Markdown', extensions: ['md'] },
      ]
    });
    
    if (selected && typeof selected === 'string') {
      // Ler conteúdo do arquivo
      const content = await invoke<string>('read_file', { path: selected });
      // Abrir no editor
      workspaceStore.openFile({
        id: crypto.randomUUID(),
        name: selected.split('/').pop() || selected.split('\\').pop() || 'arquivo',
        path: selected,
        content: content,
        modified: false,
        language: getLanguageFromPath(selected),
      });
    }
  } catch (error) {
    logger.error('Erro ao abrir arquivo:', error);
  }
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const languages: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript React',
    js: 'JavaScript', jsx: 'JavaScript React',
    vue: 'Vue', rs: 'Rust', py: 'Python',
    json: 'JSON', html: 'HTML', htm: 'HTML',
    css: 'CSS', scss: 'SCSS', less: 'Less',
    md: 'Markdown', txt: 'Plain Text',
  };
  return languages[ext] || 'Plain Text';
}

async function handleNewFile() {
  workspaceStore.createNewFile();
}

async function handleDocumentation() {
  try {
    await shellOpen('https://github.com/eco-ide/docs');
  } catch (error) {
    logger.error('Erro ao abrir documentação:', error);
  }
}
</script>

<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <img src="/favicon.svg" alt="Eco IDE" class="logo" />
      <h1 class="title">Eco IDE</h1>
      <p class="subtitle">IDE extensível com WebAssembly</p>

      <div class="actions">
        <button class="action-btn primary" @click="handleOpenFolder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" />
          </svg>
          <span>Abrir Pasta</span>
        </button>
        
        <button class="action-btn" @click="handleOpenFile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>Abrir Arquivo</span>
        </button>
        
        <button class="action-btn" @click="handleNewFile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>Novo Arquivo</span>
        </button>
        
        <button class="action-btn" @click="handleDocumentation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Documentação</span>
        </button>
      </div>

      <div class="shortcuts">
        <h3>Atalhos Rápidos</h3>
        <div class="shortcut-grid">
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>P</kbd>
            <span>Ir para arquivo</span>
          </div>
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
            <span>Paleta de comandos</span>
          </div>
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>
            <span>Buscar em arquivos</span>
          </div>
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>`</kbd>
            <span>Terminal integrado</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--bg-primary);
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  padding: var(--space-xl);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-lg);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
  margin-bottom: var(--space-xl);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  font-size: var(--font-size-md);
  color: var(--text-primary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-primary);
}

.action-btn.primary {
  background: var(--accent-gradient);
  border-color: transparent;
  color: white;
}

.action-btn.primary:hover {
  filter: brightness(1.1);
}

.shortcuts {
  width: 100%;
}

.shortcuts h3 {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.shortcut {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

kbd {
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 3px;
  color: var(--text-secondary);
}
</style>
