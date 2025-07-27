import React, { useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createTreeWalker } from '../../utils/focus';
import { FocusableContext, type FocusableContextValue } from './context';

interface FocusableProviderProps {
  children: ReactNode;
  rootElement?: Element;
}

export const FocusableProvider: React.FC<FocusableProviderProps> = ({ 
  children, 
  rootElement 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getRoot = useCallback(() => {
    // For form-scoped navigation, find the closest form, otherwise use document.body
    if (rootElement) {return rootElement;}
    
    const container = containerRef.current;
    if (container) {
      const form = container.closest('form');
      return form || document.body;
    }
    
    return document.body;
  }, [rootElement]);

  const getAllFocusables = useCallback((): Element[] => {
    const root = getRoot();
    const walker = createTreeWalker(root);
    const focusables: Element[] = [];
    
    let node = walker.nextNode();
    while (node) {
      focusables.push(node as Element);
      node = walker.nextNode();
    }
    
    return focusables;
  }, [getRoot]);

  const getNextFocusable = useCallback((current: Element): Element | null => {
    const root = getRoot();
    const walker = createTreeWalker(root);
    
    walker.currentNode = current;
    const next = walker.nextNode();
    
    if (next) {
      return next as Element;
    }
    
    // Wrap to first focusable element
    walker.currentNode = root;
    return walker.nextNode() as Element | null;
  }, [getRoot]);

  const getPreviousFocusable = useCallback((current: Element): Element | null => {
    const root = getRoot();
    const walker = createTreeWalker(root);
    
    walker.currentNode = current;
    const previous = walker.previousNode();
    
    if (previous) {
      return previous as Element;
    }
    
    // Wrap to last focusable element
    walker.currentNode = root;
    let lastNode: Node | null = null;
    let node = walker.nextNode();
    while (node) {
      lastNode = node;
      node = walker.nextNode();
    }
    
    return lastNode as Element | null;
  }, [getRoot]);

  const value: FocusableContextValue = {
    getNextFocusable,
    getPreviousFocusable,
    getAllFocusables,
  };

  return (
    <FocusableContext.Provider value={value}>
      <div ref={containerRef}>
        {children}
      </div>
    </FocusableContext.Provider>
  );
};

