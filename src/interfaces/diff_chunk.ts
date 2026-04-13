export interface DiffChunk {
    id: string;
    originalStart: number;
    modifiedStart: number;
    originalLines: string[];
    modifiedLines: string[];
    status: 'unchanged' | 'added' | 'removed' | 'modified';
}