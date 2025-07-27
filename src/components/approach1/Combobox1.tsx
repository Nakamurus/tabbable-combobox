import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ComboboxProps, ComboboxOption } from '../../types/combobox';
import { KEYS, shouldPreventDefault } from '../../utils/keyboard';
import { FocusableProvider } from './FocusableContext';
import { useFocusable } from './useFocusable';
import '../common/Combobox.css';

const ComboboxPopup: React.FC<{
  options: ComboboxOption[];
  highlightedIndex: number;
  onOptionSelect: (option: ComboboxOption) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listboxId: string;
}> = ({ options, highlightedIndex, onOptionSelect, inputRef, listboxId }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const popup = popupRef.current;
    const input = inputRef.current;
    
    if (!popup || !input) return;

    const inputRect = input.getBoundingClientRect();
    popup.style.position = 'absolute';
    popup.style.top = `${inputRect.bottom + window.scrollY}px`;
    popup.style.left = `${inputRect.left + window.scrollX}px`;
    popup.style.width = `${inputRect.width}px`;
  }, [inputRef]);

  return createPortal(
    <div 
      ref={popupRef} 
      className="combobox__popup" 
      role="listbox"
      id={listboxId}
      aria-multiselectable={false}
    >
      {options.length === 0 ? (
        <div className="combobox__no-options">No options available</div>
      ) : (
        options.map((option, index) => (
          <button
            key={option.id}
            className={`combobox__option ${
              index === highlightedIndex ? 'combobox__option--highlighted' : ''
            }`}
            role="option"
            aria-selected={index === highlightedIndex}
            onClick={() => onOptionSelect(option)}
          >
            {option.label}
          </button>
        ))
      )}
    </div>,
    document.body
  );
};

// Inner component that uses the TreeWalker context
const Combobox1Inner: React.FC<ComboboxProps> = ({
  options,
  value,
  placeholder,
  onSelectionChange,
  onInputChange,
  className,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const isTogglingRef = useRef(false);
  // Use TreeWalker context for focus management (Approach 1 requirement)
  const { getNextFocusable, getPreviousFocusable } = useFocusable();

  // Generate unique listbox ID for ARIA relationship
  const listboxId = `combobox-listbox-${React.useId()}`;

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = useCallback((value: string) => {
    if (disabled) return;
    setInputValue(value);
    if (!isTogglingRef.current) {
      setIsOpen(true);
      setHighlightedIndex(0);
    }
    onInputChange?.(value);
  }, [onInputChange, disabled]);

  const handleOptionSelect = useCallback((option: ComboboxOption) => {
    setInputValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(0);
    onSelectionChange?.(option);
  }, [onSelectionChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (shouldPreventDefault(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case KEYS.ARROW_DOWN:
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case KEYS.ARROW_UP:
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case KEYS.ENTER:
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case KEYS.ESCAPE:
        setIsOpen(false);
        setHighlightedIndex(0);
        break;
      case KEYS.TAB: {
        // Close popup and use TreeWalker for focus navigation (Approach 1)
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(0);
        }
        
        // Use TreeWalker for TAB navigation
        const currentElement = inputRef.current;
        if (currentElement) {
          const nextElement = e.shiftKey 
            ? getPreviousFocusable(currentElement)
            : getNextFocusable(currentElement);
          
          if (nextElement && nextElement instanceof HTMLElement) {
            e.preventDefault();
            nextElement.focus();
          }
        }
        break;
      }
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleOptionSelect, disabled, getNextFocusable, getPreviousFocusable]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    isTogglingRef.current = true;
    setIsOpen(prev => {
      if (prev) {
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(0);
      }
      return !prev;
    });
    Promise.resolve().then(() => {
      isTogglingRef.current = false;
    });
  }, [disabled]);

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const combobox = comboboxRef.current;
      if (isOpen && combobox && !combobox.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={comboboxRef} className={`combobox ${className || ''}`}>
      <input
        ref={inputRef}
        type="text"
        className="combobox__input"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-owns={isOpen ? listboxId : undefined}
        aria-controls={isOpen ? listboxId : undefined}
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled}
        onChange={disabled ? undefined : (e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={disabled ? undefined : handleToggle}
      />
      {isOpen && (
        <ComboboxPopup
          options={filteredOptions}
          highlightedIndex={highlightedIndex}
          onOptionSelect={handleOptionSelect}
          inputRef={inputRef}
          listboxId={listboxId}
        />
      )}
    </div>
  );
};

// Main component that provides the TreeWalker context
export const Combobox1: React.FC<ComboboxProps> = (props) => {
  return (
    <FocusableProvider>
      <Combobox1Inner {...props} />
    </FocusableProvider>
  );
};