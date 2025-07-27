import { useContext } from 'react';
import { FocusableContext, type FocusableContextValue } from './context';

export const useFocusable = (): FocusableContextValue => {
  const context = useContext(FocusableContext);
  if (!context) {
    throw new Error('useFocusable must be used within a FocusableProvider');
  }
  return context;
};