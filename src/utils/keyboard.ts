export const KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  SPACE: ' ',
} as const;

export const isNavigationKey = (key: string): boolean => {
  return Object.values(KEYS).includes(key as typeof KEYS[keyof typeof KEYS]);
};

export const shouldPreventDefault = (key: string): boolean => {
  const preventKeys = [KEYS.ARROW_UP, KEYS.ARROW_DOWN, KEYS.ENTER, KEYS.ESCAPE] as const;
  return preventKeys.includes(key as typeof preventKeys[number]);
};