import { SessionGroup } from "./session_group";

export interface SessionData {
    groups: SessionGroup[];
    activeGroupId: string;
    expandedFolders: string[];
}