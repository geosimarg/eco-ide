import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEditorStore = defineStore('editor', () => {
    const cursorLine = ref(1);
    const cursorColumn = ref(1);
    const selectionLength = ref(0);

    function setCursorPosition(line: number, column: number) {
        cursorLine.value = line;
        cursorColumn.value = column;
    }

    function setSelection(length: number) {
        selectionLength.value = length;
    }

    return {
        cursorLine,
        cursorColumn,
        selectionLength,
        setCursorPosition,
        setSelection,
    };
});
