<script setup lang="ts">
import { watch, ref, onUnmounted, onMounted } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
    content: string;
    scrollPercent?: number;
}>();

const renderedHtml = ref('');
const previewContentRef = ref<HTMLElement | null>(null);

let currentScrollPercent = 0;
let targetScrollPercent = 0;
let animationFrameId: number | null = null;
const actionCollapseExpand = ref('Ocultar');

const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }) {
    const language = lang || 'text';
    const escapedCode = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `
    <div class="code-block">
        <div class="code-block-header">
            <span class="code-lang">${language}</span>
            <div class="code-actions">
                <button class="code-toggle-btn">${actionCollapseExpand.value}</button>
            </div>
        </div>
        <div class="code-content">
            <pre><code class="language-${language}">${escapedCode}</code></pre>
        </div>
    </div>`;
};

marked.setOptions({
    breaks: true,
    gfm: true,
    renderer
});

watch(() => props.content, async (newContent) => {
    renderedHtml.value = await marked.parse(newContent || '');
}, { immediate: true });

function smoothScroll() {
    const el = previewContentRef.value;
    if (!el) return;

    const diff = targetScrollPercent - currentScrollPercent;
    if (Math.abs(diff) < 0.001) {
        currentScrollPercent = targetScrollPercent;
        animationFrameId = null;
        return;
    }

    currentScrollPercent += diff * 0.15;

    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight > 0) {
        el.scrollTop = currentScrollPercent * scrollHeight;
    }

    animationFrameId = requestAnimationFrame(smoothScroll);
}

function handleCodeBlockClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.classList.contains('code-toggle-btn')) {
        const block = target.closest('.code-block') as HTMLElement;
        const content = block.querySelector('.code-content') as HTMLElement;

        const isCollapsed = block.getAttribute('data-collapsed') === 'true';

        if (isCollapsed) {
            block.setAttribute('data-collapsed', 'false');
            content.style.height = content.scrollHeight + 'px';

            requestAnimationFrame(() => {
                content.style.height = content.scrollHeight + 'px';
            });

            target.textContent = 'Ocultar';

            setTimeout(() => {
                content.style.height = 'auto';
            }, 250);
        } else {
            content.style.height = content.scrollHeight + 'px';

            requestAnimationFrame(() => {
                content.style.height = '0px';
            });

            block.setAttribute('data-collapsed', 'true');
            target.textContent = 'Expandir';
        }
    }
}

watch(() => props.scrollPercent, (percent) => {
    if (percent === undefined) return;

    targetScrollPercent = percent;

    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(smoothScroll);
    }
});

onMounted(() => {
    previewContentRef.value?.addEventListener('click', handleCodeBlockClick);
});

onUnmounted(() => {
    previewContentRef.value?.removeEventListener('click', handleCodeBlockClick);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
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

.preview-content :deep(.code-block) {
    margin: 1.2em 0;
    border-radius: 14px;
    overflow: hidden;
    background: #050505;
    border: 1px solid #000;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.preview-content :deep(.code-block-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #000;
    border-bottom: 1px solid #000;
    font-family: var(--font-mono);
}

.preview-content :deep(.code-lang) {
    font-size: 0.5rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #9e9e99;
    font-weight: 500;
}

.preview-content :deep(.code-block pre) {
    margin: 0;
    padding: 18px;
    overflow-x: auto;
    background: transparent;
}

.preview-content :deep(.code-block code) {
    background: transparent;
    padding: 0;
    color: #E5E7EB;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    line-height: 1.6;
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

.preview-content :deep(.code-content) {
    overflow: hidden;
    transition: height 0.25s ease, opacity 0.2s ease;
}

.preview-content :deep(.code-block[data-collapsed="true"] .code-content) {
    height: 0 !important;
    opacity: 0;
}

.preview-content :deep(.code-toggle-btn) {
    font-size: 0.75rem;
    background: transparent;
    border: 1px solid #243041;
    color: #94A3B8;
    padding: 4px 8px;
    border-radius: 8px;
    cursor: pointer;
    margin-right: 6px;
    transition: all 0.15s ease;
}

.preview-content :deep(.code-toggle-btn:hover) {
    background: #111827;
    color: #E5E7EB;
}

.preview-content :deep(.code-actions) {
    display: flex;
    align-items: center;
}
</style>
