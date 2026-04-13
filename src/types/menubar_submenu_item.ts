export type MenubarSubMenuItem = {
    id: string;
    label: () => string;
    action?: () => void;
    checked?: () => boolean;
    disabled?: boolean | (() => boolean);
    type?: undefined;
    submenu?: undefined;
};