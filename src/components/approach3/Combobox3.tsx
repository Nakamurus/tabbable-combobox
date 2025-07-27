import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ComboboxProps, ComboboxOption } from '../../types/combobox';
import { KEYS, shouldPreventDefault } from '../../utils/keyboard';
import '../common/Combobox.css';

const ComboboxPopup: React.FC<{
  options: ComboboxOption[];
  highlightedIndex: number;
  onOptionSelect: (option: ComboboxOption) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  activeDescendantId: string | undefined;
  listboxId: string;
}> = ({ options, highlightedIndex, onOptionSelect, inputRef, activeDescendantId, listboxId }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const popup = popupRef.current;
    const input = inputRef.current;
    
    if (!popup || !input) {return;}

    const inputRect = input.getBoundingClientRect();
    popup.style.position = 'absolute';
    popup.style.top = `${inputRect.bottom + window.scrollY}px`;
    popup.style.left = `${inputRect.left + window.scrollX}px`;
    popup.style.width = `${inputRect.width}px`;
  }, [inputRef]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!activeDescendantId) {return;}
    
    const highlightedElement = document.getElementById(activeDescendantId);
    if (highlightedElement && typeof highlightedElement.scrollIntoView === 'function') {
      highlightedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [activeDescendantId]);

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
          <div
            key={option.id}
            id={`option-${option.id}`}
            className={`combobox__option ${
              index === highlightedIndex ? 'combobox__option--highlighted' : ''
            }`}
            role="option"
            aria-selected={index === highlightedIndex}
            onClick={() => onOptionSelect(option)}
            onMouseEnter={() => {
              // Virtual focus - no actual focus change needed
              // The aria-activedescendant will handle screen reader announcement
            }}
          >
            {option.label}
          </div>
        ))
      )}
    </div>,
    document.body
  );
};

export const Combobox3: React.FC<ComboboxProps> = ({
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

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Generate unique IDs for aria-activedescendant and listbox
  const listboxId = `combobox-listbox-${React.useId()}`;
  const activeDescendantId = filteredOptions.length > 0 && highlightedIndex >= 0 && filteredOptions[highlightedIndex]
    ? `option-${filteredOptions[highlightedIndex].id}` 
    : undefined;

  const handleInputChange = useCallback((value: string) => {
    if (disabled) {return;}
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
    if (disabled) {return;}
    
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
      case KEYS.TAB:
        // Close popup and let natural tab behavior handle focus movement
        // The input maintains real focus throughout
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(0);
        }
        // Don't prevent default - let browser handle tab navigation
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleOptionSelect, disabled]);

  const handleToggle = useCallback(() => {
    if (disabled) {return;}
    isTogglingRef.current = true;
    setIsOpen(prev => {
      if (prev) {
        // Currently open, closing it
        setHighlightedIndex(0);
      } else {
        // Currently closed, opening it
        setHighlightedIndex(0);
      }
      return !prev;
    });
    // Reset toggle flag after a microtask to allow event handling to complete
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
        aria-activedescendant={isOpen && activeDescendantId ? activeDescendantId : undefined}
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
          activeDescendantId={activeDescendantId}
          listboxId={listboxId}
        />
      )}
    </div>
  );
};

// Tests for Approach 3: aria-activedescendant with Virtual Focus
if (import.meta.vitest) {
  const { describe, it, expect, beforeEach, vi } = import.meta.vitest;
  const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
  const userEvent = (await import('@testing-library/user-event')).default;

  const mockOptions = [
    { id: '1', label: 'Apple', value: 'apple' },
    { id: '2', label: 'Banana', value: 'banana' },
    { id: '3', label: 'Cherry', value: 'cherry' },
    { id: '4', label: 'Date', value: 'date' },
  ];

  describe('Combobox3 (aria-activedescendant + Virtual Focus)', () => {
    beforeEach(() => {
      cleanup();
    });

    describe('Basic Rendering & Props', () => {
      it('renders with default state (closed popup)', () => {
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('accepts and displays placeholder text', () => {
        const placeholder = 'Search fruits...';
        render(<Combobox3 options={mockOptions} placeholder={placeholder} />);
        
        expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
      });

      it('handles disabled state correctly', () => {
        render(<Combobox3 options={mockOptions} disabled />);
        
        const input = screen.getByRole('combobox');
        expect(input).toBeDisabled();
      });

      it('applies custom className', () => {
        const className = 'custom-combobox';
        render(<Combobox3 options={mockOptions} className={className} />);
        
        const container = screen.getByRole('combobox').parentElement;
        expect(container).toHaveClass('combobox', className);
      });
    });

    describe('Option Display & Filtering', () => {
      it('shows all options when opened without filter', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        mockOptions.forEach(option => {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        });
      });

      it('filters options based on input text (case-insensitive)', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.type(input, 'app');
        
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
      });

      it('shows "No options available" when filter yields no results', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.type(input, 'xyz');
        
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });
    });

    describe('Keyboard Navigation', () => {
      it('opens popup on Arrow Down when closed', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        input.focus();
        await user.keyboard('[ArrowDown]');
        
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      it('moves to next option on Arrow Down when open', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.keyboard('[ArrowDown]');
        
        const options = screen.getAllByRole('option');
        expect(options[1]).toHaveClass('combobox__option--highlighted');
      });

      it('moves to previous option on Arrow Up', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.keyboard('[ArrowDown]'); // Move to second option
        await user.keyboard('[ArrowUp]'); // Move back to first
        
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveClass('combobox__option--highlighted');
      });

      it('selects highlighted option on Enter', async () => {
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} onSelectionChange={onSelectionChange} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.keyboard('[ArrowDown]'); // Highlight second option
        await user.keyboard('[Enter]');
        
        expect(onSelectionChange).toHaveBeenCalledWith(mockOptions[1]);
        expect(input).toHaveValue(mockOptions[1].label);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('closes popup on Escape', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.keyboard('[Escape]');
        
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });

      it('closes popup on Tab but maintains natural focus behavior', async () => {
        const user = userEvent.setup();
        render(
          <form>
            <Combobox3 options={mockOptions} />
            <input data-testid="next-input" />
          </form>
        );
        
        const input = screen.getByRole('combobox');
        const nextInput = screen.getByTestId('next-input');
        
        await user.click(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        
        await user.keyboard('[Tab]');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(nextInput).toHaveFocus();
      });
    });

    describe('Mouse Interaction', () => {
      it('toggles popup on input click', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        
        // Open popup
        await user.click(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        
        // Close popup
        await user.click(input);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('closes popup when clicking outside', async () => {
        const user = userEvent.setup();
        render(
          <div>
            <Combobox3 options={mockOptions} />
            <button>Outside</button>
          </div>
        );
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        
        const outsideButton = screen.getByText('Outside');
        await user.click(outsideButton);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    describe('Selection & Callbacks', () => {
      it('calls onInputChange when typing', async () => {
        const onInputChange = vi.fn();
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} onInputChange={onInputChange} />);
        
        const input = screen.getByRole('combobox');
        await user.type(input, 'test');
        
        expect(onInputChange).toHaveBeenCalledWith('test');
      });

      it('maintains selected state correctly', () => {
        render(<Combobox3 options={mockOptions} value="Cherry" />);
        
        const input = screen.getByRole('combobox');
        expect(input).toHaveValue('Cherry');
      });
    });

    describe('ARIA Attributes', () => {
      it('has correct combobox ARIA attributes', () => {
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        expect(input).toHaveAttribute('aria-haspopup', 'listbox');
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });

      it('updates aria-expanded when popup opens/closes', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        
        await user.click(input);
        expect(input).toHaveAttribute('aria-expanded', 'true');
        
        await user.keyboard('[Escape]');
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });

      it('popup has correct listbox role', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      it('options are divs with role="option" (not focusable)', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        const options = screen.getAllByRole('option');
        options.forEach(option => {
          expect(option.tagName).toBe('DIV');
          expect(option).not.toHaveAttribute('tabindex');
        });
      });
    });

    describe('aria-activedescendant Specific Features', () => {
      it('sets aria-activedescendant when option is highlighted', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        // Initially points to first option
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        
        // Navigate to second option
        await user.keyboard('[ArrowDown]');
        expect(input).toHaveAttribute('aria-activedescendant', 'option-2');
      });

      it('clears aria-activedescendant when popup is closed', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        
        await user.keyboard('[Escape]');
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });

      it('maintains real focus on input throughout interaction', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        expect(input).toHaveFocus();
        
        // Navigate through options
        await user.keyboard('[ArrowDown][ArrowDown][ArrowUp]');
        expect(input).toHaveFocus(); // Focus never leaves input
        
        // Select option
        await user.keyboard('[Enter]');
        expect(input).toHaveFocus(); // Focus still on input after selection
      });

      it('options have unique IDs for aria-activedescendant', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        const options = screen.getAllByRole('option');
        const optionIds = options.map(option => option.id);
        
        // Check all IDs are unique and follow expected pattern
        expect(optionIds).toEqual(['option-1', 'option-2', 'option-3', 'option-4']);
        expect(new Set(optionIds).size).toBe(optionIds.length); // All unique
      });
    });

    describe('Virtual Focus Behavior', () => {
      it('maintains real focus on input during navigation', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        const originalActiveElement = document.activeElement;
        expect(originalActiveElement).toBe(input);
        
        // Navigate options
        await user.keyboard('[ArrowDown][ArrowDown]');
        
        // Real focus hasn't changed
        expect(document.activeElement).toBe(originalActiveElement);
        
        // But virtual focus has updated
        expect(input).toHaveAttribute('aria-activedescendant', 'option-3');
        const highlightedOption = screen.getAllByRole('option')[2];
        expect(highlightedOption).toHaveClass('combobox__option--highlighted');
      });
    });

    describe('Edge Cases', () => {
      it('handles empty options array', () => {
        render(<Combobox3 options={[]} />);
        
        const input = screen.getByRole('combobox');
        fireEvent.click(input);
        
        expect(screen.getByText('No options available')).toBeInTheDocument();
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });

      it('handles filtered results with aria-activedescendant', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.type(input, 'a'); // Should filter to "Apple", "Banana", "Date"
        
        // First filtered option should be highlighted
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1'); // Apple
        
        await user.keyboard('[ArrowDown]');
        expect(input).toHaveAttribute('aria-activedescendant', 'option-2'); // Banana
      });

      it('handles rapid keyboard navigation with virtual focus', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        // Rapid navigation
        await user.keyboard('[ArrowDown][ArrowDown][ArrowUp][ArrowDown]');
        
        expect(input).toHaveAttribute('aria-activedescendant', 'option-3');
        const highlightedOption = screen.getAllByRole('option')[2];
        expect(highlightedOption).toHaveClass('combobox__option--highlighted');
        expect(input).toHaveFocus(); // Real focus never moved
      });
    });

    describe('Accessibility - Inert & Display States (aria-activedescendant)', () => {
      it('popup should not be visible when closed (display:none behavior)', () => {
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        
        // Popup should not exist in DOM when closed
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        
        // Options should not be accessible to screen readers when popup is closed
        mockOptions.forEach(option => {
          expect(screen.queryByText(option.label)).not.toBeInTheDocument();
        });
      });

      it('popup becomes visible when opened with proper aria-activedescendant', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        
        // Popup should exist in DOM when open
        const popup = screen.getByRole('listbox');
        expect(popup).toBeInTheDocument();
        expect(popup).toBeVisible();
        
        // Options should be accessible to screen readers when popup is open
        mockOptions.forEach(option => {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        });
      });

      it('options are not focusable when popup is closed (virtual focus approach)', () => {
        render(<Combobox3 options={mockOptions} />);
        
        // When popup is closed, options should not exist in DOM at all
        const options = screen.queryAllByRole('option');
        expect(options).toHaveLength(0);
        
        // aria-activedescendant should not be set when closed
        const input = screen.getByRole('combobox');
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });

      it('options use virtual focus (divs, not buttons) when popup is open', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(mockOptions.length);
        
        // Options should be divs (not focusable) with virtual focus via aria-activedescendant
        options.forEach(option => {
          expect(option.tagName).toBe('DIV'); // Not focusable element
          expect(option).not.toHaveAttribute('tabindex');
          expect(option).not.toHaveAttribute('disabled');
          expect(option).not.toHaveAttribute('inert');
        });
        
        // Real focus should remain on input
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
      });

      it('maintains proper tab order with virtual focus (focus stays on input)', async () => {
        const user = userEvent.setup();
        render(
          <div>
            <button data-testid="before">Before</button>
            <Combobox3 options={mockOptions} />
            <button data-testid="after">After</button>
          </div>
        );
        
        const beforeButton = screen.getByTestId('before');
        const input = screen.getByRole('combobox');
        const afterButton = screen.getByTestId('after');
        
        beforeButton.focus();
        await user.keyboard('[Tab]');
        expect(input).toHaveFocus();
        
        // Open popup - focus should stay on input
        await user.click(input);
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        
        // Tab should go directly to next element (natural tab order)
        await user.keyboard('[Tab]');
        expect(afterButton).toHaveFocus();
        
        // Popup should close on tab
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('virtual focus navigation updates aria-activedescendant correctly', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        // Initial state
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        expect(input).toHaveFocus();
        
        // Navigate down
        await user.keyboard('[ArrowDown]');
        expect(input).toHaveAttribute('aria-activedescendant', 'option-2');
        expect(input).toHaveFocus(); // Real focus never moves
        
        // Navigate up
        await user.keyboard('[ArrowUp]');
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        expect(input).toHaveFocus();
        
        // Verify highlighted option styling follows aria-activedescendant
        const highlightedOption = document.getElementById('option-1');
        expect(highlightedOption).toHaveClass('combobox__option--highlighted');
      });

      it('clears aria-activedescendant when popup closes', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1');
        
        // Close popup
        await user.keyboard('[Escape]');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('handles aria-activedescendant with filtered options', async () => {
        const user = userEvent.setup();
        render(<Combobox3 options={mockOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.type(input, 'ap'); // Should show "Apple"
        
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1'); // Apple
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
        
        // Clear filter
        await user.clear(input);
        await user.click(input);
        
        // Should reset to first option of full list
        expect(input).toHaveAttribute('aria-activedescendant', 'option-1'); // Apple again
        expect(screen.getByText('Banana')).toBeInTheDocument(); // All options visible
      });

      it('scroll behavior works with virtual focus', async () => {
        // Create a long list to test scrolling
        const longOptions = Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 1),
          label: `Option ${i + 1}`,
          value: `option${i + 1}`,
        }));
        
        const user = userEvent.setup();
        render(<Combobox3 options={longOptions} />);
        
        const input = screen.getByRole('combobox');
        await user.click(input);
        
        // Navigate to later option
        for (let i = 0; i < 5; i++) {
          await user.keyboard('[ArrowDown]');
        }
        
        expect(input).toHaveAttribute('aria-activedescendant', 'option-6');
        
        // The highlighted option should exist and be properly identified
        const highlightedElement = document.getElementById('option-6');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement).toHaveClass('combobox__option--highlighted');
        
        // Real focus should never move from input
        expect(input).toHaveFocus();
      });

      it('disabled combobox has no aria-activedescendant behavior', () => {
        render(<Combobox3 options={mockOptions} disabled />);
        
        const input = screen.getByRole('combobox');
        expect(input).toBeDisabled();
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        
        // Disabled combobox should not open popup or set aria-activedescendant
        fireEvent.click(input);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(input).not.toHaveAttribute('aria-activedescendant');
        
        // Arrow keys should not affect aria-activedescendant when disabled
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });
    });
  });
}