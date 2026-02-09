import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
    const showSettingsModal = ref(false);

    function openSettings() {
        showSettingsModal.value = true;
    }

    function closeSettings() {
        showSettingsModal.value = false;
    }

    return {
        showSettingsModal,
        openSettings,
        closeSettings,
    };
});
