export interface SharedInput {
    modelValue: string;
    label?: string;
    placeholder?: string;
    type?: 'text' | 'password' | 'email';
    disabled?: boolean;
}