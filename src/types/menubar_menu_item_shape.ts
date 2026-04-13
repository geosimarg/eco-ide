import { MenubarSubMenuItem } from "./menubar_submenu_item";

export type MenubarMenuItemShape =
    | { type: 'separator'; id?: undefined; label?: undefined; action?: undefined; disabled?: undefined; submenu?: undefined; checked?: undefined }
    | {
        id: string;
        label: () => string;
        action?: () => void;
        disabled?: boolean | (() => boolean);
        submenu?: MenubarSubMenuItem[];
        checked?: undefined;
        type?: undefined;
    };