<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18nStore } from '@/stores/i18n';
import { useWorkspaceStore } from '@/stores/workspace';
import { logger } from '@/utils/logger';

const i18n = useI18nStore();
const workspaceStore = useWorkspaceStore();

const activeMenu = ref<string | null>(null);

type SubMenuItem = {
  id: string;
  label: () => string;
  action?: () => void;
  checked?: () => boolean;
  disabled?: boolean;
  type?: undefined;
  submenu?: undefined;
};

type MenuItemShape =
  | { type: 'separator'; id?: undefined; label?: undefined; action?: undefined; disabled?: undefined; submenu?: undefined; checked?: undefined }
  | {
    id: string;
    label: () => string;
    action?: () => void;
    disabled?: boolean;
    submenu?: SubMenuItem[];
    checked?: undefined; // Menu raiz não tem check
    type?: undefined;
  };

function isSeparator(item: MenuItemShape): item is { type: 'separator' } {
  return item.type === 'separator';
}

const menus: { id: string; label: () => string; items: MenuItemShape[] }[] = [
  {
    id: 'file',
    label: () => i18n.t('menu.file'),
    items: [
      { id: 'new_file', label: () => i18n.t('file.new_file'), action: () => workspaceStore.createNewFile() },
      { id: 'new_window', label: () => i18n.t('file.new_window'), action: () => openNewWindow() },
      { type: 'separator' },
      { id: 'open_file', label: () => i18n.t('file.open_file'), action: () => alert('TODO: Open File Dialog') }, // TODO: Implement
      { id: 'open_folder', label: () => i18n.t('file.open_folder'), action: () => document.getElementById('open-folder-btn')?.click() }, // Hack temporário para reusar botão existente
      { id: 'open_workspace', label: () => i18n.t('file.open_workspace'), action: () => workspaceStore.loadWorkspaceFromFile() },
      { id: 'open_recent', label: () => i18n.t('file.open_recent'), disabled: true },
      { type: 'separator' },
      { id: 'save', label: () => i18n.t('file.save'), action: () => saveCurrentFile() },
      { id: 'save_as', label: () => i18n.t('file.save_as'), disabled: true },
      { id: 'save_workspace', label: () => i18n.t('file.save_workspace'), action: () => workspaceStore.saveWorkspaceToFile() },
      { type: 'separator' },
      { id: 'close_folder', label: () => i18n.t('file.close_folder'), action: () => workspaceStore.closeProject() },
      { id: 'close_workspace', label: () => i18n.t('file.close_workspace'), action: () => workspaceStore.closeWorkspace() },
      {
        id: 'exit', label: () => i18n.t('file.exit'), action: async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().close();
        }
      }
    ]
  },
  {
    id: 'edit',
    label: () => i18n.t('menu.edit'),
    items: [
      { id: 'undo', label: () => i18n.t('edit.undo'), disabled: true },
      { id: 'redo', label: () => i18n.t('edit.redo'), disabled: true },
      // TODO: Implementar integração com CodeMirror para undo/redo
    ]
  },
  {
    id: 'view',
    label: () => i18n.t('menu.view'),
    items: [
      {
        id: 'language',
        label: () => i18n.t('view.language'),
        submenu: i18n.availableLocales.map(l => ({
          id: l.code,
          label: () => l.name,
          action: () => i18n.loadLocale(l.code),
          checked: () => i18n.currentLocale === l.code
        }))
      }
    ]
  },
  {
    id: 'help',
    label: () => i18n.t('menu.help'),
    items: [
      { id: 'documentation', label: () => i18n.t('help.documentation'), action: () => openDocs() },
      { id: 'about', label: () => i18n.t('help.about'), action: () => alert('Eco IDE v0.1.0') }
    ]
  }
];

function toggleMenu(menuId: string) {
  if (activeMenu.value === menuId) {
    activeMenu.value = null;
  } else {
    activeMenu.value = menuId;
  }
}

function closeMenu() {
  activeMenu.value = null;
}

function handleAction(item: any) {
  if (item.disabled) return;
  if (item.action) {
    item.action();
    closeMenu();
  }
}

// Fechar menu ao clicar fora
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.menubar')) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Ações auxiliares
async function openNewWindow() {
  logger.log('Tauri create window? Ou apenas informar que não implementado ainda');
  logger.log('Abrir nova janela - TODO');

  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const label = `eco-window-${Date.now()}`;
    new WebviewWindow(label, {
      url: '/',
      title: 'Eco IDE'
    });
  } catch (e) {
    logger.error('Erro ao abrir nova janela:', e);
  }
}

function saveCurrentFile() {
  const file = workspaceStore.activeFile;
  if (file && file.path) {
    workspaceStore.saveFile(file.id, file.path, true);
  }
}

async function openDocs() {
  const { open } = await import('@tauri-apps/plugin-shell');
  await open('https://github.com/eco-ide/docs');
}

</script>

<template>
  <div class="menubar">
    <div v-for="menu in menus" :key="menu.id" class="menu-item" :class="{ active: activeMenu === menu.id }">
      <div class="menu-label no-select" @click.stop="toggleMenu(menu.id)">
        {{ menu.label() }}
      </div>

      <div v-if="activeMenu === menu.id" class="dropdown">
        <template v-for="(item, index) in menu.items" :key="index">
          <div v-if="isSeparator(item)" class="separator"></div>

          <div v-else class="dropdown-item" :class="{ disabled: item.disabled, 'has-submenu': item.submenu }"
            @click.stop="!item.submenu && handleAction(item)">
            <span class="item-label no-select">{{ typeof item.label === 'function' ? item.label() : '' }}</span>
            <span v-if="item.checked && item.checked" class="check">✓</span>
            <span v-if="item.submenu" class="arrow">▶</span>

            <!-- Submenu Nível 1 (Simples) -->
            <div v-if="item.submenu" class="submenu">
              <div v-for="sub in item.submenu" :key="sub.id" class="dropdown-item" @click.stop="handleAction(sub)">
                <span class="item-label no-select">{{ sub.label() }}</span>
                <span v-if="sub.checked && sub.checked?.()" class="check">✓</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menubar {
  display: flex;
  height: 100%;
  align-items: center;
  font-size: var(--font-size-sm);
  user-select: none;
}

.menu-item {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.menu-label {
  padding: 0 var(--space-sm);
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.menu-label:hover,
.menu-item.active .menu-label {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  padding: var(--space-xs) 0;
  z-index: 1000;
}

.dropdown-item {
  padding: var(--space-xs) var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  color: var(--text-primary);
  position: relative;
}

.dropdown-item:hover:not(.disabled) {
  background: var(--accent-primary);
  color: white;
}

.dropdown-item.disabled {
  color: var(--text-muted);
  cursor: default;
}

.separator {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--space-xs) 0;
}

.check {
  margin-left: var(--space-sm);
  font-size: 10px;
}

.arrow {
  font-size: 8px;
  margin-left: auto;
}

/* Submenu */
.submenu {
  display: none;
  position: absolute;
  top: 0;
  left: 100%;
  min-width: 150px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  padding: var(--space-xs) 0;
}

.dropdown-item:hover .submenu {
  display: block;
}

/* Ajuste de cores no submenu quando pai está hover */
.dropdown-item:hover .submenu .dropdown-item {
  color: var(--text-primary);
  background: transparent;
}

.dropdown-item:hover .submenu .dropdown-item:hover {
  background: var(--accent-primary);
  color: white;
}
</style>
