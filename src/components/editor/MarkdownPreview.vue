<script setup lang="ts">
import { watch, ref } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
    content: string;
}>();

const renderedHtml = ref('');

marked.setOptions({
    breaks: true,
    gfm: true
});

watch(() => props.content, async (newContent) => {
    renderedHtml.value = await marked.parse(newContent || '');
}, { immediate: true });
</script>

<template>
    <div class="markdown-preview">
        <div class="preview-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Preview</span>
        </div>
        <div class="preview-content" v-html="renderedHtml"></div>
    </div>
</template>

<style scoped>
.markdown-preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
    overflow: hidden;
}

.preview-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    height: var(--tab-height);
}

.preview-content {
    flex: 1;
    overflow: auto;
    padding: var(--space-lg);
    color: var(--text-primary);
    font-family: var(--font-sans);
    line-height: 1.6;
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
    color: var(--text-primary);
    font-weight: 600;
    margin: 1em 0 0.5em;
    line-height: 1.3;
}

.preview-content :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 0.3em;
}

.preview-content :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 0.3em;
}

.preview-content :deep(h3) {
    font-size: 1.25em;
}

.preview-content :deep(h4) {
    font-size: 1em;
}

.preview-content :deep(p) {
    margin: 0.8em 0;
}

.preview-content :deep(a) {
    color: var(--accent-secondary);
    text-decoration: none;
}

.preview-content :deep(a:hover) {
    text-decoration: underline;
}

.preview-content :deep(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--bg-tertiary);
    padding: 0.2em 0.4em;
    border-radius: var(--radius-sm);
    color: var(--syntax-string);
}

.preview-content :deep(pre) {
    background: var(--bg-secondary);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: 1em 0;
}

.preview-content :deep(pre code) {
    background: transparent;
    padding: 0;
}

.preview-content :deep(blockquote) {
    border-left: 4px solid var(--accent-primary);
    margin: 1em 0;
    padding-left: var(--space-md);
    color: var(--text-secondary);
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
    margin: 0.8em 0;
    padding-left: 1.5em;
}

.preview-content :deep(li) {
    margin: 0.3em 0;
}

.preview-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
    border: 1px solid var(--border-default);
    padding: var(--space-sm) var(--space-md);
    text-align: left;
}

.preview-content :deep(th) {
    background: var(--bg-secondary);
    font-weight: 600;
}

.preview-content :deep(img) {
    max-width: 100%;
    border-radius: var(--radius-md);
}

.preview-content :deep(hr) {
    border: none;
    border-top: 1px solid var(--border-default);
    margin: 1.5em 0;
}
</style>
