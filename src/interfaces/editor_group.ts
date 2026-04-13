import { OpenFile } from "./open_file";

export interface EditorGroup {
    id: string;
    files: OpenFile[];
    activeFileId: string | null;
    direction?: 'horizontal' | 'vertical';
}