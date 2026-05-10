---
name: Accessibility Testing Checklist
description: Generic checklist for testing accessible components across different libraries
tags: [accessibility, testing, aria, keyboard, a11y]
---

# Accessibility Testing Checklist

> Universal checklist for testing accessible components regardless of library (Angular Aria, Angular Material, Radix, Headless UI, etc.)

## Library/Framework Verification

### Before Testing
- [ ] Verify accessibility library is installed (check package.json)
- [ ] Check node_modules for actual implementation details
- [ ] Review official documentation for the library
- [ ] Confirm correct imports in component
- [ ] Check library version for known accessibility issues

### Component Configuration
- [ ] Correct component/directive applied for the pattern
- [ ] Props/inputs configured properly (multi-select, disabled, orientation, etc.)
- [ ] Data binding working correctly (one-way or two-way)
- [ ] Focus management strategy appropriate for use case
- [ ] Selection/interaction mode matches requirements

## Keyboard Navigation Testing

### Basic Navigation
- [ ] Tab key moves focus to component (ideally single tab stop for composite widgets)
- [ ] Shift+Tab moves focus backward
- [ ] Enter/Space activates items
- [ ] Escape closes menus/dialogs/dismissible elements
- [ ] Arrow keys navigate within component (↑↓←→)
- [ ] Home/End jump to first/last item (if applicable)
- [ ] Type-ahead/search works (if applicable)
- [ ] Page Up/Page Down for long lists (if applicable)

### Focus Management
- [ ] **Roving tabindex**: Only one item tabbable, focus moves to active item
- [ ] **Activedescendant**: Container keeps focus, aria-activedescendant updates
- [ ] Focus visible indicator present on all interactive elements
- [ ] Focus indicator meets 3:1 contrast ratio
- [ ] Focus wraps around (or doesn't) as expected
- [ ] Disabled items handled correctly (focusable or skipped)
- [ ] No keyboard traps (can always Tab out of component)
- [ ] Focus restored correctly after dialogs/menus close

## ARIA Implementation

### Verify Required Attributes
Check that these ARIA attributes are present and correct:

- [ ] **role** attribute correct (tree, toolbar, menu, tablist, combobox, etc.)
- [ ] **aria-label** or **aria-labelledby** provides accessible name
- [ ] **aria-expanded** on expandable items (tree nodes, accordion panels, dropdowns)
- [ ] **aria-selected** on selectable items (tree items, tabs, listbox options)
- [ ] **aria-disabled** on disabled elements (or disabled attribute)
- [ ] **aria-orientation** matches component orientation (horizontal/vertical)
- [ ] **aria-multiselectable** present when multi-select enabled
- [ ] **aria-activedescendant** points to active item (if using that focus strategy)
- [ ] **aria-current** indicates current page/location (navigation)
- [ ] **aria-haspopup** on elements that trigger popups/menus
- [ ] **tabindex** managed correctly (0 for active, -1 for inactive)

### Additional ARIA (Context-Specific)
- [ ] **aria-describedby** for additional descriptions/help text
- [ ] **aria-live** regions for dynamic content announcements
- [ ] **aria-invalid** for form validation errors
- [ ] **aria-required** for required form fields
- [ ] **aria-checked** for checkboxes/radio buttons/toggles
- [ ] **aria-pressed** for toggle buttons
- [ ] **aria-controls** linking controls to controlled elements

### State Management
- [ ] ARIA states update dynamically when component state changes
- [ ] Selection updates reflected in aria-selected
- [ ] Expansion updates reflected in aria-expanded
- [ ] Disabled state reflected in aria-disabled
- [ ] Loading states announced via aria-busy or aria-live

## Screen Reader Testing

### Component Announcements
- [ ] Component type announced correctly (tree, toolbar, menu, dialog, etc.)
- [ ] Number of items announced (e.g., "list with 5 items")
- [ ] Current item announced when navigating
- [ ] State changes announced (expanded/collapsed, selected, checked)
- [ ] Multi-selection state announced
- [ ] Disabled items announced as disabled or unavailable
- [ ] Position in set announced (e.g., "3 of 10")

### Dynamic Content Announcements
- [ ] Error messages announced via aria-live="assertive" or role="alert"
- [ ] Success messages announced via aria-live="polite"
- [ ] Loading states announced (aria-busy or aria-live)
- [ ] Form validation errors announced
- [ ] Content updates announced appropriately

### Document Structure
- [ ] Heading hierarchy logical (h1, h2, h3... no skipping levels)
- [ ] Landmarks used (main, nav, aside, footer, search, form)
- [ ] Semantic HTML used where possible (button, nav, header, etc.)
- [ ] Component has accessible name (aria-label or aria-labelledby)
- [ ] Lists marked up as lists (ul/ol/li)
- [ ] Tables have proper headers (th with scope)

## Visual Testing

- [ ] Focus indicator has 3:1 contrast ratio
- [ ] Text has 4.5:1 contrast ratio (3:1 for large text)
- [ ] Interactive elements have 44x44px minimum touch target
- [ ] No information conveyed by color alone
- [ ] Content readable at 200% zoom

## Component Pattern Tests

### Tree/TreeView
- [ ] Arrow keys expand/collapse and navigate
- [ ] Multi-selection works (Ctrl/Cmd+click, Shift+click)
- [ ] aria-level indicates nesting depth
- [ ] role="group" on child lists
- [ ] aria-expanded on expandable nodes

### Toolbar
- [ ] Arrow keys navigate between items
- [ ] Orientation matches visual layout (horizontal/vertical)
- [ ] Tab moves into/out of toolbar (single tab stop)
- [ ] Grouped items handled correctly

### Menu/Dropdown
- [ ] Enter/Space opens menu
- [ ] Arrow keys navigate menu items
- [ ] Escape closes menu
- [ ] Focus returns to trigger on close
- [ ] Submenus open with arrow keys
- [ ] role="menu" and role="menuitem" present

### Tabs
- [ ] Arrow keys switch between tabs
- [ ] Tab panel content updates when tab changes
- [ ] aria-selected on active tab
- [ ] Tab panel has role="tabpanel"
- [ ] aria-controls links tab to panel

### Accordion
- [ ] Enter/Space toggles panel
- [ ] aria-expanded reflects state
- [ ] Multiple panels behavior correct (single vs multi-expand)
- [ ] Focus management on expand/collapse

### Combobox/Autocomplete
- [ ] Arrow keys navigate options
- [ ] Type-ahead/filtering works
- [ ] aria-expanded reflects dropdown state
- [ ] Selected value announced
- [ ] aria-autocomplete attribute present
- [ ] role="combobox" on input

### Dialog/Modal
- [ ] Focus trapped within dialog
- [ ] Escape closes dialog
- [ ] Focus returns to trigger on close
- [ ] aria-modal="true" present
- [ ] aria-labelledby or aria-label present

### Listbox
- [ ] Arrow keys navigate options
- [ ] Multi-select works (if enabled)
- [ ] aria-selected on selected items
- [ ] role="listbox" and role="option" present

### RTL (Right-to-Left) Testing
- [ ] Arrow key navigation reverses in RTL mode
- [ ] Visual layout correct in RTL
- [ ] Test with `dir="rtl"` on container or html element

## Testing Commands

```bash
# Run unit tests
npm test

# Run e2e tests  
npm run e2e

# Check library version
npm list [library-name]

# Lint accessibility (if configured)
npm run lint:a11y

# Build and check for errors
npm run build

# Run accessibility audit
npx lighthouse [url] --only-categories=accessibility
```

## Manual Testing Tools

### Essential Tools
- **Browser DevTools Accessibility Inspector** - Check ARIA attributes and tree
- **Keyboard only** - Unplug mouse and navigate with keyboard
- **Screen reader** - NVDA (Windows), VoiceOver (Mac), JAWS, ORCA (Linux)
- **Browser extensions** - axe DevTools, WAVE, Lighthouse, IBM Equal Access

### Library-Specific Debugging
- **Inspect node_modules** - Check actual implementation of the library
- **Framework DevTools** - Inspect component state (React DevTools, Angular DevTools, Vue DevTools)
- **Console logs** - Check for library warnings/errors
- **Network tab** - Verify no accessibility resources blocked

### Screen Reader Testing
- **NVDA (Windows)** - Free, most commonly used
- **JAWS (Windows)** - Industry standard, paid
- **VoiceOver (Mac/iOS)** - Built-in, Cmd+F5 to enable
- **TalkBack (Android)** - Built-in mobile screen reader
- **ORCA (Linux)** - Built-in for GNOME desktop
