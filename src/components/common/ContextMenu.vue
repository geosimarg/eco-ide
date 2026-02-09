<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    divider?: boolean;
}

const props = defineProps<{
    visible: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
}>();

const emit = defineEmits<{
    select: [id: string];
    close: [];
}>();

const menuRef = ref<HTMLElement | null>(null);

function handleClickOutside(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        emit('close');
    }
}

function handleSelect(item: ContextMenuItem) {
    if (item.disabled || item.divider) return;
    emit('select', item.id);
    emit('close');
}

watch(() => props.visible, async (visible) => {
    if (visible) {
        await nextTick();
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('contextmenu', handleClickOutside);
    } else {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
    }
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('contextmenu', handleClickOutside);
});
</script>

<template>
    <Teleport to="body">
        <div v-if="visible" ref="menuRef" class="context-menu" :style="{ left: x + 'px', top: y + 'px' }">
            <template v-for="item in items" :key="item.id">
                <div v-if="item.divider" class="menu-divider"></div>
                <button v-else class="menu-item" :class="{ disabled: item.disabled }" @click="handleSelect(item)">
                    <span class="menu-label">{{ item.label }}</span>
                </button>
            </template>
        </div>
    </Teleport>
</template>

<style scoped>
.context-menu {
    position: fixed;
    z-index: 9999;
    min-width: 220px;
    background: #252526;
    border: 1px solid #454545;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    padding: 4px 0;
    color: #cccccc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    user-select: none;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 4px 10px;
    background: none;
    border: none;
    color: inherit;
    font-size: inherit;
    text-align: left;
    cursor: default;
    outline: none;
    margin: 0;
}

.menu-item:hover:not(.disabled) {
    background: #094771;
    color: #ffffff;
}

.menu-item.disabled {
    color: #858585;
    pointer-events: none;
}

.menu-label {
    flex: 1;
}

.menu-divider {
    height: 1px;
    margin: 4px 10px;
    background: #454545;
}
</style>
