<script setup lang="ts">
import { watch, ref, nextTick } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
    content: string;
    scrollPercent?: number;
}>();

const renderedHtml = ref('');
const previewContentRef = ref<HTMLElement | null>(null);

marked.setOptions({
    breaks: true,
    gfm: true
});

watch(() => props.content, async (newContent) => {
    renderedHtml.value = await marked.parse(newContent || '');
}, { immediate: true });

watch(() => props.scrollPercent, (percent) => {
    if (percent === undefined || !previewContentRef.value) return;

    nextTick(() => {
        const el = previewContentRef.value;
        if (!el) return;

        const scrollHeight = el.scrollHeight - el.clientHeight;
        if (scrollHeight > 0) {
            el.scrollTop = percent * scrollHeight;
        }
    });
});
</script>

<template>
    <div class="markdown-preview">
        <div class="preview-content" ref="previewContentRef" v-html="renderedHtml"></div>
    </div>
</template>

<style scoped>
.markdown-preview {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: var(--bg-primary);
    overflow: hidden;
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
