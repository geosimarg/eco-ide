<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed } from 'vue';

export interface ContextMenuItem {
    id: string;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    divider?: boolean;
    children?: ContextMenuItem[];
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
const hoveredItem = ref<string | null>(null);

// Adjust position to keep menu on screen
const adjustedPosition = computed(() => {
    const padding = 4;
    const menuWidth = 220;
    const menuHeight = 300; // estimated
    
    let newX = props.x;
    let newY = props.y;
    
    // Adjust horizontal
    if (props.x + menuWidth > window.innerWidth) {
        newX = window.innerWidth - menuWidth - padding;
    }
    
    // Adjust vertical  
    if (props.y + menuHeight > window.innerHeight) {
        newY = window.innerHeight - menuHeight - padding;
    }
    
    return { x: newX, y: newY };
});

function handleClickOutside(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        emit('close');
    }
}

function handleSelect(item: ContextMenuItem) {
    if (item.disabled || item.divider || item.children?.length) {
        return;
    }
    emit('select', item.id);
    emit('close');
}

function handleMouseEnter(item: ContextMenuItem) {
    if (item.children?.length) {
        hoveredItem.value = item.id;
    } else {
        hoveredItem.value = null;
    }
}

function handleMouseLeave() {
    hoveredItem.value = null;
}

watch(() => props.visible, async (visible) => {
    if (visible) {
        await nextTick();
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('contextmenu', handleClickOutside);
    } else {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
        hoveredItem.value = null;
    }
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('contextmenu', handleClickOutside);
});
</script>

<template>
    <Teleport to="body">
        <div v-if="visible" ref="menuRef" class="context-menu" :style="{ left: adjustedPosition.x + 'px', top: adjustedPosition.y + 'px' }">
            <template v-for="item in items" :key="item.id">
                <div v-if="item.divider" class="menu-divider"></div>
                <div v-else class="menu-item-wrapper" @mouseenter="handleMouseEnter(item)" @mouseleave="handleMouseLeave">
                    <div 
                        class="menu-item" 
                        :class="{ disabled: item.disabled, 'has-children': item.children?.length }"
                        @click.stop="handleSelect(item)"
                    >
                        <span class="menu-label">{{ item.label }}</span>
                        <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
                        <span v-if="item.children?.length" class="menu-arrow">▶</span>
                    </div>
                    <!-- Submenu -->
                    <div v-if="item.children?.length && hoveredItem === item.id" class="submenu">
                        <template v-for="child in item.children" :key="child.id">
                            <div v-if="child.divider" class="menu-divider"></div>
                            <div 
                                v-else
                                class="menu-item" 
                                :class="{ disabled: child.disabled }"
                                @click.stop="handleSelect(child)"
                            >
                                <span class="menu-label">{{ child.label }}</span>
                                <span v-if="child.shortcut" class="menu-shortcut">{{ child.shortcut }}</span>
                            </div>
                        </template>
                    </div>
                </div>
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

.menu-item-wrapper {
    position: relative;
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

.menu-item.has-children {
    padding-right: 6px;
}

.menu-label {
    flex: 1;
}

.menu-shortcut {
    color: #858585;
    font-size: 12px;
    margin-left: 16px;
}

.menu-arrow {
    font-size: 10px;
    margin-left: 8px;
    opacity: 0.7;
}

.menu-divider {
    height: 1px;
    margin: 4px 10px;
    background: #454545;
}

/* Submenu styles */
.submenu {
    position: absolute;
    left: 100%;
    top: -4px;
    min-width: 200px;
    background: #252526;
    border: 1px solid #454545;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    padding: 4px 0;
    margin-left: -2px;
}

.submenu .menu-item {
    padding-left: 16px;
}

.submenu .menu-shortcut {
    margin-left: 8px;
}
</style>
