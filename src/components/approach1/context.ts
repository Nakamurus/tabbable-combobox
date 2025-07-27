import { createContext } from 'react';

export interface FocusableContextValue {
  getNextFocusable: (current: Element) => Element | null;
  getPreviousFocusable: (current: Element) => Element | null;
  getAllFocusables: () => Element[];
}

export const FocusableContext = createContext<FocusableContextValue | null>(null);