import { SessionFile } from "./session_file";

export interface SessionGroup {
    id: string;
    files: SessionFile[];
    activeFilePath?: string;
}