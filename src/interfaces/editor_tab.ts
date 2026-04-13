import { OpenFile } from "./open_file";

export interface EditorTab {
    file: OpenFile;
    active: boolean;
}