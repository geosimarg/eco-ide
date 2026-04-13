export interface ContextMenuItem {
    id: string;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    divider?: boolean;
    children?: ContextMenuItem[];
}