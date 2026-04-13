export interface GitChange {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed' | 'copied';
    staged: boolean;
}