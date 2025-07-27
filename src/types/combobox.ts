export interface ComboboxOption {
  id: string;
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  placeholder?: string;
  onSelectionChange?: (option: ComboboxOption | null) => void;
  onInputChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export interface KeyboardEvent {
  key: string;
  preventDefault: () => void;
  stopPropagation: () => void;
  shiftKey: boolean;
}