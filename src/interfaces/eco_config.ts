export interface EcoConfig {
    // Hidden files
    hidden_files?: string[];
    hidden_folders?: string[];

    // Editor overrides
    tabSize?: number;
    wordWrap?: boolean;
    minimap?: boolean;
    lineNumbers?: number;
}