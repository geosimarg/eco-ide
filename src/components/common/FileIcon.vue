<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    name: string;
    isDirectory?: boolean;
    expanded?: boolean;
}>();

// Mapeamento de extensões/nomes para tipos de ícone
const iconType = computed(() => {
    if (props.isDirectory) {
        return props.expanded ? 'folder-open' : 'folder';
    }

    const lowerName = props.name.toLowerCase();

    // Arquivos específicos
    if (lowerName === 'package.json') return 'npm';
    if (lowerName === 'tsconfig.json') return 'ts-config';
    if (lowerName === '.gitignore') return 'git';
    if (lowerName === '.env') return 'settings';
    if (lowerName.startsWith('.env.')) return 'settings';
    if (lowerName === 'readme.md') return 'readme';

    // Extensões
    const ext = lowerName.split('.').pop();
    switch (ext) {
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript-react';
        case 'js': return 'javascript';
        case 'jsx': return 'javascript-react';
        case 'vue': return 'vue';
        case 'json': return 'json';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'scss':
        case 'sass': return 'sass';
        case 'less': return 'less';
        case 'md': return 'markdown';
        case 'rs': return 'rust';
        case 'py': return 'python';
        case 'go': return 'go';
        case 'java': return 'java';
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'h': return 'h';
        case 'hpp': return 'hpp';
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'ico': return 'image';
        case 'txt': return 'text';
        case 'pdf': return 'pdf';
        case 'zip':
        case 'tar':
        case 'gz':
        case '7z':
        case 'rar': return 'zip';
        case 'lock': return 'lock';
        case 'xml': return 'xml';
        case 'yaml':
        case 'yml': return 'yaml';
        case 'toml': return 'settings';
        default: return 'file';
    }
});

// Cores para cada tipo
const iconColor = computed(() => {
    switch (iconType.value) {
        case 'folder':
        case 'folder-open': return '#dcb67a'; // Folder color
        case 'typescript':
        case 'typescript-react': return '#3178c6';
        case 'javascript':
        case 'javascript-react': return '#f7df1e';
        case 'vue': return '#42b883';
        case 'json': return '#f9e64f'; // Brighter yellow for JSON
        case 'html': return '#e34c26';
        case 'css': return '#563d7c';
        case 'sass': return '#cc6699';
        case 'less': return '#1d365d';
        case 'markdown': return '#083fa1';
        case 'readme': return '#083fa1';
        case 'rust': return '#dea584';
        case 'python': return '#3776ab';
        case 'go': return '#00add8';
        case 'java': return '#b07219';
        case 'c': return '#555555';
        case 'cpp': return '#f34b7d';
        case 'image': return '#b07219';
        case 'text': return '#999999';
        case 'pdf': return '#b30b00';
        case 'zip': return '#4caf50';
        case 'npm': return '#cb3837';
        case 'git': return '#f14e32';
        case 'settings': return '#666666';
        case 'lock': return '#fbbc04';
        case 'xml': return '#555555';
        case 'yaml': return '#cb171e';
        default: return '#9da5b4'; // Default file color
    }
});
</script>

<template>
    <svg class="file-icon" :style="{ color: iconColor }" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <!-- Folder -->
        <path v-if="iconType === 'folder'"
            d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z"
            fill="currentColor" opacity="0.9" />

        <!-- Folder Open -->
        <g v-else-if="iconType === 'folder-open'">
            <path
                d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z"
                fill="currentColor" opacity="0.9" />
            <path d="M22 10L20 18H4L2 10H22Z" fill="white" fill-opacity="0.2" />
        </g>

        <!-- TypeScript / TS Config -->
        <g v-else-if="iconType === 'typescript' || iconType === 'typescript-react' || iconType === 'ts-config'">
            <path
                d="M4 2H20C21.1046 2 22 2.89543 22 4V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4C2 2.89543 2.89543 2 4 2Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path
                d="M9 16V12H7M9 12H11M16 16C15.5 16.5 14.5 16.5 14.5 16.5C13.5 16.5 13.5 15.5 13.5 15.5V14.5C13.5 13.5 14.5 13.5 15 13.5C16.5 13.5 16.5 12.5 16.5 12.5V12C16.5 11.5 16 11.5 15.5 11.5C15 11.5 14.5 11.5 14 12"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- JavaScript -->
        <g v-else-if="iconType === 'javascript' || iconType === 'javascript-react'">
            <path
                d="M4 2H20C21.1046 2 22 2.89543 22 4V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4C2 2.89543 2.89543 2 4 2Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path
                d="M8 16V14C8 14 8 16 8 16C8 16 9 16 9 16M15 16C14.5 16.5 13.5 16.5 13.5 16.5C12.5 16.5 12.5 15.5 12.5 15.5V14.5C12.5 13.5 13.5 13.5 14 13.5C15.5 13.5 15.5 12.5 15.5 12.5V12C15.5 11.5 15 11.5 14.5 11.5C14 11.5 13.5 11.5 13 12"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- Python -->
        <path v-else-if="iconType === 'python'"
            d="M12 2C8 2 8 4 8 4H10M12 2C16 2 16 4 16 4V8H18C20 8 20 10 20 10V18C20 20 18 20 18 20H15M12 22C16 22 16 20 16 20H14M12 22C8 22 8 20 8 20V16H6C4 16 4 14 4 14V6C4 4 6 4 6 4H9"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Rust -->
        <g v-else-if="iconType === 'rust'">
            <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path d="M8 12H16M12 8V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
        </g>

        <!-- Vue -->
        <g v-else-if="iconType === 'vue'">
            <path d="M12 22L3 7H7L12 15L17 7H21L12 22Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor"
                stroke-width="1.5" stroke-linejoin="round" />
            <path d="M12 15L8 9H16L12 15Z" fill="currentColor" />
        </g>

        <!-- HTML -->
        <g v-else-if="iconType === 'html'">
            <path d="M4 2L5 19L12 22L19 19L20 2H4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
            <path d="M8 8H16L15.5 13H8.5L9 17L12 18L15 17V17" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- JSON -->
        <g v-else-if="iconType === 'json'">
            <path
                d="M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path d="M8 8H8.5M15.5 8H16M8 12H8.5M15.5 12H16M8 16H8.5M15.5 16H16" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" />
        </g>

        <!-- CSS -->
        <g v-else-if="iconType === 'css'">
            <path
                d="M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path d="M6 8L10 16L14 8M8 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
        </g>

        <!-- Markdown / Readme -->
        <g v-else-if="iconType === 'markdown' || iconType === 'readme'">
            <path
                d="M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path d="M6 16V8L9 12L12 8V16M14 16V8H16L18 11L20 8H22V16H20V11L18 14L16 11V16" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- Default File -->
        <g v-else>
            <path
                d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
                fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5" />
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
        </g>
    </svg>
</template>

<style scoped>
.file-icon {
    width: 1em;
    height: 1em;
    display: inline-block;
    vertical-align: middle;
}
</style>
