export interface DiffLine {
    type: 'context' | 'added' | 'removed';
    content: string;
    oldNum: number | null;
    newNum: number | null;
}
