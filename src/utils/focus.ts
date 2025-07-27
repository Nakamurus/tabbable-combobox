export const TABBABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(',');

export const isTabbable = (element: Element): boolean => {
  if (element.hasAttribute('disabled')) {return false;}
  
  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex === '-1') {return false;}
  
  return element.matches(TABBABLE_SELECTOR);
};

export const getTabbableElements = (container: Element): HTMLElement[] => {
  return Array.from(container.querySelectorAll(TABBABLE_SELECTOR))
    .filter(isTabbable) as HTMLElement[];
};

export const getClosestForm = (element: Element): HTMLFormElement | null => {
  return element.closest('form');
};

export const createTreeWalker = (root: Element): TreeWalker => {
  return document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node: Element) => {
        return isTabbable(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    }
  );
};