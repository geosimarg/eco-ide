<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWorkspaceStore, type EditorGroup } from '@/stores/workspace';
import EditorTab from '@/components/editor/EditorTab.vue';
import CodeEditor from '@/components/editor/CodeEditor.vue';
import WelcomeScreen from '@/components/editor/WelcomeScreen.vue';

const props = defineProps<{
    group: EditorGroup;
}>();

const emit = defineEmits<{
    split: [payload: { direction: 'left' | 'right', fileId: string, sourceGroupId: string }];
}>();

const workspaceStore = useWorkspaceStore();
const draggedIndex = ref<number | null>(null);
const dropZone = ref<'left' | 'right' | null>(null);
const editorGroupRef = ref<HTMLElement | null>(null);

const activeFileId = computed(() => props.group.activeFileId);
const activeFile = computed(() => {
    return props.group.files.find(f => f.id === activeFileId.value);
});

function selectTab(id: string) {
    // Set active file in this group AND set this group as active
    workspaceStore.setActiveFile(id);
}

function closeTab(id: string) {
    workspaceStore.closeFile(id); // Store handles finding the file
}

function handleDragStart(e: DragEvent, index: number) {
    draggedIndex.value = index;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.dropEffect = 'move';
        // Set data for cross-group drag
        e.dataTransfer.setData('application/json', JSON.stringify({
            fileId: props.group.files[index].id,
            sourceGroupId: props.group.id
        }));
    }
}

function handleTabDrop(targetIndex: number) {
    // Drop logic WITHIN the same group (reorder)
    if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
        workspaceStore.reorderFile(props.group.id, draggedIndex.value, targetIndex);
    }
    draggedIndex.value = null;
}

// Group Drag Handlers (for Split View)
function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!editorGroupRef.value) return;

    // Se estiver arrastando sobre a área de abas, não mostre o indicador de split
    // Isso evita conflito visual com a reordenação de abas
    const target = e.target as HTMLElement;
    if (target.closest('.tabs-container')) {
        dropZone.value = null;
        return;
    }

    const rect = editorGroupRef.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const threshold = width * 0.3; // 30% area for split

    if (x < threshold) {
        dropZone.value = 'left';
    } else if (x > width - threshold) {
        dropZone.value = 'right';
    } else {
        dropZone.value = null;
    }
}

function onDragLeave(e: DragEvent) {
    // Check if leaving the component rect
    if (e.relatedTarget && editorGroupRef.value?.contains(e.relatedTarget as Node)) {
        return;
    }
    dropZone.value = null;
}

function onDrop(e: DragEvent) {
    const zone = dropZone.value;
    dropZone.value = null;

    if (!zone) return;

    // Se o drop foi tratado por uma aba (propagação permitida para limpar zone),
    // devemos ignorar o split se o alvo for uma aba
    const target = e.target as HTMLElement;
    if (target.closest('.tab')) {
        return;
    }

    if (e.dataTransfer) {
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.fileId && data.sourceGroupId) {
                // Prevent split if dragging to same group logic if needed?
                // For now allow split even from same group (moves file to new group)
                emit('split', { direction: zone, fileId: data.fileId, sourceGroupId: data.sourceGroupId });
            }
        } catch (err) {
            console.error('Failed to parse drag data', err);
        }
    }
}

// Ensure cleanup even if drop happens on child (handled by stop propagation)
// We can use a window listener or just be smarter about dragover
</script>

<template>
    <div class="editor-group" :class="{ 'active-group': workspaceStore.activeGroupId === group.id }"
        @click="workspaceStore.activeGroupId = group.id" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
        ref="editorGroupRef">
        <!-- Drop Indicators -->
        <div class="drop-indicator left" v-if="dropZone === 'left'"></div>
        <div class="drop-indicator right" v-if="dropZone === 'right'"></div>

        <!-- Tabs -->
        <div class="tabs-container" v-if="group.files.length > 0">
            <EditorTab v-for="(tab, index) in group.files" :key="tab.id" :file="tab" :active="tab.id === activeFileId"
                @select="selectTab(tab.id)" @close="closeTab(tab.id)" @dragStart="handleDragStart($event, index)"
                @drop="handleTabDrop(index)" />
        </div>

        <!-- Editor Content -->
        <div class="editor-content">
            <!-- Render WelcomeScreen only if this is the ONLY group and empty, OR if we want empty groups to show something else? -->
            <!-- For now, empty group shows nothing but empty state if files ran out -->
            <div v-if="group.files.length === 0" class="empty-group">
                <span v-if="workspaceStore.groups.length > 1">Grupo Vazio</span>
                <WelcomeScreen v-else />
            </div>
            <CodeEditor v-else-if="activeFile" :file="activeFile" />
        </div>
    </div>
</template>

<style scoped>
.editor-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: var(--bg-primary);
    overflow: hidden;
    border-right: 1px solid var(--border-subtle);
    min-width: 0;
    /* Important for flex children */
}

.editor-group:last-child {
    border-right: none;
}

.editor-group.active-group .tabs-container {
    background: var(--bg-secondary);
}

/* Tabs styles from EditorArea */
.tabs-container {
    display: flex;
    align-items: center;
    height: var(--tab-height);
    background: var(--bg-tertiary);
    /* Inactive groups have darker header */
    border-bottom: 1px solid var(--border-subtle);
    overflow-x: auto;
}

.tabs-container::-webkit-scrollbar {
    height: 3px;
}

.editor-content {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.empty-group {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
}

.editor-group {
    position: relative;
    /* For absolute positioning of indicators */
}

.drop-indicator {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    pointer-events: none;
    background: var(--bg-hover);
    /* Fallback */
    background: rgba(100, 100, 255, 0.1);
    /* Blue tint */
    z-index: 10;
}

.drop-indicator.left {
    left: 0;
    border-right: 2px solid var(--accent-primary);
}

.drop-indicator.right {
    right: 0;
    border-left: 2px solid var(--accent-primary);
}
</style>
