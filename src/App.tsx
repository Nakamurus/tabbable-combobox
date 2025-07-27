import { useState } from 'react';
import type { ComboboxOption } from './types/combobox';
import { Combobox1 } from './components/approach1/Combobox1';
import { Combobox2 } from './components/approach2/Combobox2';
import { Combobox3 } from './components/approach3/Combobox3';
import './App.css';

const sampleOptions: ComboboxOption[] = [
  { id: '1', label: 'Apple', value: 'apple' },
  { id: '2', label: 'Banana', value: 'banana' },
  { id: '3', label: 'Cherry', value: 'cherry' },
  { id: '4', label: 'Date', value: 'date' },
  { id: '5', label: 'Elderberry', value: 'elderberry' },
  { id: '6', label: 'Fig', value: 'fig' },
  { id: '7', label: 'Grape', value: 'grape' },
  { id: '8', label: 'Honeydew', value: 'honeydew' },
];

function App() {
  const [selection1, setSelection1] = useState<ComboboxOption | null>(null);
  const [selection2, setSelection2] = useState<ComboboxOption | null>(null);
  const [selection3, setSelection3] = useState<ComboboxOption | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Accessible Combobox Implementations</h1>
        <p>Three different approaches to implementing accessible combobox components</p>
      </header>

      <main className="app-main">
        <form className="demo-form">
          <h2>Focus Management Test Form</h2>
          <p>Use TAB/Shift+TAB to navigate between elements and test focus management</p>
          
          <div className="form-group">
            <label htmlFor="before-input">Input Before Comboboxes:</label>
            <input id="before-input" type="text" placeholder="Tab to first combobox" />
          </div>

          <div className="form-group">
            <label htmlFor="approach1">
              Approach 1: React ARIA-like (Focusable Context + TreeWalker)
            </label>
            <Combobox1
              options={sampleOptions}
              placeholder="Type to filter fruits..."
              onSelectionChange={setSelection1}
              className="demo-combobox"
            />
            {selection1 && (
              <p className="selection-display">Selected: {selection1.label}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="middle-input">Input Between Comboboxes:</label>
            <input id="middle-input" type="text" placeholder="Middle input field" />
          </div>

          <div className="form-group">
            <label htmlFor="approach2">
              Approach 2: Custom Hook (querySelectorAll + Form Scoping)
            </label>
            <Combobox2
              options={sampleOptions}
              placeholder="Type to filter fruits..."
              onSelectionChange={setSelection2}
              className="demo-combobox"
            />
            {selection2 && (
              <p className="selection-display">Selected: {selection2.label}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="approach3">
              Approach 3: aria-activedescendant (Virtual Focus)
            </label>
            <Combobox3
              options={sampleOptions}
              placeholder="Type to filter fruits..."
              onSelectionChange={setSelection3}
              className="demo-combobox"
            />
            {selection3 && (
              <p className="selection-display">Selected: {selection3.label}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="after-input">Input After Comboboxes:</label>
            <input id="after-input" type="text" placeholder="Final input field" />
          </div>

          <div className="form-group">
            <button type="button">Submit Button</button>
            <button type="button">Cancel Button</button>
          </div>
        </form>

        <section className="instructions">
          <h2>Keyboard Navigation Instructions</h2>
          <ul>
            <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> - Navigate between form elements</li>
            <li><kbd>↑</kbd> / <kbd>↓</kbd> - Navigate options within combobox popup</li>
            <li><kbd>Enter</kbd> - Select highlighted option</li>
            <li><kbd>Escape</kbd> - Close popup</li>
            <li>Type to filter options</li>
          </ul>
          
          <h3>Approach Differences:</h3>
          <dl>
            <dt>Approach 1 (TreeWalker):</dt>
            <dd>Uses React context and TreeWalker API for focus management</dd>
            
            <dt>Approach 2 (Custom Hook):</dt>
            <dd>Uses querySelectorAll with form boundary detection</dd>
            
            <dt>Approach 3 (aria-activedescendant):</dt>
            <dd>Keeps focus on input, uses virtual focus for options</dd>
          </dl>
        </section>
      </main>
    </div>
  );
}

export default App;
