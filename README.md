# Tabbable Combobox Implementations

This project demonstrates three different approaches to implementing accessible combobox components with proper keyboard navigation and focus management.

## Features

- **ARIA Compliant**: All implementations follow WAI-ARIA combobox patterns
- **Keyboard Navigation**: Support for Arrow keys, Tab/Shift+Tab, Enter, and Escape
- **Filtering**: Type-ahead filtering of options
- **Portal Rendering**: Popup menus rendered via React portals
- **TypeScript**: Full TypeScript support with strict type checking

## Three Approaches

### Approach 1: React ARIA-like (Focusable Context + TreeWalker)
- Uses React Context to manage focus state
- Implements TreeWalker API for efficient DOM traversal
- Provides focus management through context provider

### Approach 2: Custom Hook (querySelectorAll + Form Scoping)
- Custom hook for focus management
- Uses `querySelectorAll` with custom filtering logic
- Scopes focus management to the closest form element

### Approach 3: aria-activedescendant (Virtual Focus)
- Maintains real focus on input element throughout interaction
- Uses `aria-activedescendant` for virtual focus on options
- Screen reader accessible with proper ARIA announcements

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── approach1/       # TreeWalker + Context implementation
│   ├── approach2/       # Custom hook implementation  
│   ├── approach3/       # aria-activedescendant implementation
│   └── common/          # Shared CSS styles
├── types/               # TypeScript type definitions
├── utils/               # Keyboard and focus utilities
└── App.tsx             # Demo application
```

## Keyboard Navigation

- **↑/↓ Arrow Keys**: Navigate options within popup
- **Tab/Shift+Tab**: Move between form elements (respects focus management approach)
- **Enter**: Select highlighted option
- **Escape**: Close popup
- **Type**: Filter options by typing

## Implementation Notes

Each approach handles Tab navigation differently:

- **Approach 1**: Uses TreeWalker to find next/previous focusable elements
- **Approach 2**: Uses querySelectorAll within form boundaries  
- **Approach 3**: Relies on natural Tab behavior since focus stays on input

All approaches use React portals for popup positioning and maintain proper ARIA attributes for screen reader compatibility.

