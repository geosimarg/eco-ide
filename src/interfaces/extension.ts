export interface Extension {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    version: string;
    author?: string;
    repository?: string;
    homepage?: string;
    license?: string;
    tags?: string[];
    languages?: string[];
    category?: string;
    icon?: string;
    screenshots?: string[];
    readme?: string;
    downloadUrl?: string;
    downloadCount?: number;
    rating?: number;
    installed: boolean;
    enabled: boolean;
    path?: string;
    downloadProgress?: number;
    source?: 'marketplace' | 'local';
}