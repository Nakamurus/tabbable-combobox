import { useCallback, useRef } from 'react';
import { getTabbableElements, getClosestForm } from '../../utils/focus';

interface FocusManagementHook {
  getNextTabbable: (current: HTMLElement) => HTMLElement | null;
  getPreviousTabbable: (current: HTMLElement) => HTMLElement | null;
  getAllTabbables: (current: HTMLElement) => HTMLElement[];
}

export const useFocusManagement = (): FocusManagementHook => {
  const lastFormRef = useRef<HTMLFormElement | null>(null);
  const lastTabbablesRef = useRef<HTMLElement[]>([]);

  const getAllTabbables = useCallback((current: HTMLElement): HTMLElement[] => {
    const form = getClosestForm(current);
    const root = form || document.body;
    
    // Cache tabbables if we're in the same form
    if (form === lastFormRef.current && lastTabbablesRef.current.length > 0) {
      return lastTabbablesRef.current;
    }
    
    const tabbables = getTabbableElements(root);
    
    // Update cache
    lastFormRef.current = form;
    lastTabbablesRef.current = tabbables;
    
    return tabbables;
  }, []);

  const getNextTabbable = useCallback((current: HTMLElement): HTMLElement | null => {
    const tabbables = getAllTabbables(current);
    const currentIndex = tabbables.findIndex(el => el === current);
    
    if (currentIndex === -1) {return null;}
    
    // Return next element or null if at end (don't wrap across form boundaries)
    const nextIndex = currentIndex + 1;
    return nextIndex < tabbables.length ? tabbables[nextIndex] : null;
  }, [getAllTabbables]);

  const getPreviousTabbable = useCallback((current: HTMLElement): HTMLElement | null => {
    const tabbables = getAllTabbables(current);
    const currentIndex = tabbables.findIndex(el => el === current);
    
    if (currentIndex === -1) {return null;}
    
    // Return previous element or null if at beginning (don't wrap across form boundaries)
    const prevIndex = currentIndex - 1;
    return prevIndex >= 0 ? tabbables[prevIndex] : null;
  }, [getAllTabbables]);

  return {
    getNextTabbable,
    getPreviousTabbable,
    getAllTabbables,
  };
};