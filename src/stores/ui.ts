import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
    const showSettingsModal = ref(false);
    const showDiffViewer = ref(false);
    const diffOriginalContent = ref('');
    const diffModifiedContent = ref('');
    const diffOriginalLabel = ref('');
    const diffModifiedLabel = ref('');

    function openSettings() {
        showSettingsModal.value = true;
    }

    function closeSettings() {
        showSettingsModal.value = false;
    }

    function openDiffViewer(original: string, modified: string, originalLabel?: string, modifiedLabel?: string) {
        diffOriginalContent.value = original;
        diffModifiedContent.value = modified;
        diffOriginalLabel.value = originalLabel || '';
        diffModifiedLabel.value = modifiedLabel || '';
        showDiffViewer.value = true;
    }

    function closeDiffViewer() {
        showDiffViewer.value = false;
        diffOriginalContent.value = '';
        diffModifiedContent.value = '';
    }

    return {
        showSettingsModal,
        showDiffViewer,
        diffOriginalContent,
        diffModifiedContent,
        diffOriginalLabel,
        diffModifiedLabel,
        openSettings,
        closeSettings,
        openDiffViewer,
        closeDiffViewer,
    };
});
