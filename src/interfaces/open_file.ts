export interface OpenFile {
    id: string;
    name: string;
    path: string;
    content?: string;
    modified: boolean;
    language: string;
    pinned?: boolean;
    initialLine?: number;
    initialColumn?: number;
    isDiff?: boolean;
    originalContent?: string;
    diffLabel?: string;
    diffMode?: 'staged' | 'unstaged';
}