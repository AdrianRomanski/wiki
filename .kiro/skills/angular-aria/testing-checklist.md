---
name: Angular Aria Testing Checklist
description: Specialized testing checklist for @angular/aria components
tags: [angular-aria, accessibility, testing, angular]
---

# Angular Aria Testing Checklist

> Specialized checklist for testing components built with @angular/aria directives

## Before Testing

### Installation & Setup
- [ ] Verify @angular/aria is installed: `npm list @angular/aria`
- [ ] Check Angular version compatibility (Angular Aria requires v21+)
- [ ] Review online docs: [angular.dev/guide/aria](https://angular.dev/guide/aria)
- [ ] Inspect `node_modules/@angular/aria` for actual implementation
- [ ] Confirm directive imports in component

### Directive Configuration
- [ ] Correct directive applied (ngTree, ngToolbar, ngMenu, ngTabs, etc.)
- [ ] Input signals configured properly:
  - `[multi]` for multi-selection
  - `[disabled]` for disabled state
  - `[orientation]` for horizontal/vertical layout
  - `[wrap]` for navigation wrapping
  - `[softDisabled]` for focus behavior on disabled items
- [ ] Model signals bound correctly: `[(value)]` for two-way binding
- [ ] Focus mode set appropriately:
  - `focusMode="roving"` - Focus moves to active item (default for most)
  - `focusMode="activedescendant"` - Container keeps focus
- [ ] Selection mode matches use case:
  - `selectionMode="explicit"` - User explicitly selects (click/space)
  - `selectionMode="follow"` - Selection follows focus

## What Angular Aria Handles (Verify These Work)

### Automatic Keyboard Navigation
- [ ] Arrow keys navigate items (↑↓ for vertical, ←→ for horizontal)
- [ ] Enter/Space activates/selects items
- [ ] Escape closes menus/dropdowns
- [ ] Home/End jump to first/last item
- [ ] Type-ahead search (if applicable)
- [ ] Tab moves into/out of component (single tab stop)

### Automatic ARIA Attributes
- [ ] `role` attribute applied correctly
- [ ] `aria-orientation` matches configured orientation
- [ ] `aria-multiselectable` present when `[multi]="true"`
- [ ] `aria-expanded` on expandable items
- [ ] `aria-selected` on selected items
- [ ] `aria-disabled` on disabled items
- [ ] `aria-activedescendant` (if using that focus mode)
- [ ] `aria-current` for navigation trees
- [ ] `tabindex` managed (0 for active, -1 for inactive)

### Automatic Focus Management
- [ ] Roving tabindex works (if configured)
- [ ] Activedescendant works (if configured)
- [ ] Focus wraps around (if `[wrap]="true"`)
- [ ] Disabled items handled per `[softDisabled]` setting

### Automatic Screen Reader Support
- [ ] Component type announced (tree, toolbar, menu, etc.)
- [ ] Number of items announced
- [ ] Current item announced when navigating
- [ ] State changes announced (expanded, selected)
- [ ] Multi-selection state announced
- [ ] Disabled items announced

## What You Must Provide (Verify These)

### Required Attributes
- [ ] `aria-label` or `aria-labelledby` for accessible name
- [ ] Semantic HTML structure (ul/li for trees, button for actions)

### Custom Features
- [ ] Custom `aria-live` regions for domain-specific announcements
- [ ] `aria-describedby` for additional help text
- [ ] Error handling and validation messages
- [ ] Loading states with `aria-busy` or announcements

### Styling (Angular Aria is Headless)
- [ ] Focus indicator visible (3:1 contrast minimum)
- [ ] Selected state styled
- [ ] Disabled state styled
- [ ] Hover state styled (only when not disabled)
- [ ] Expanded/collapsed indicators (for trees/accordions)
- [ ] Touch targets 44x44px minimum

## Component-Specific Tests

### Tree (ngTree)
- [ ] `ngTree` directive on container (ul)
- [ ] `ngTreeItem` directive on items (li)
- [ ] `ngTreeItemGroup` for nested groups
- [ ] Arrow keys expand/collapse and navigate
- [ ] Multi-selection with Ctrl/Cmd+click (if `[multi]="true"`)
- [ ] `aria-level` indicates nesting depth
- [ ] `role="group"` on child lists
- [ ] `[(value)]` binding updates on selection

### Toolbar (ngToolbar)
- [ ] `ngToolbar` directive on container
- [ ] `ngToolbarItem` directive on buttons
- [ ] Arrow keys navigate between items
- [ ] Orientation matches visual layout
- [ ] Tab moves into/out of toolbar (single tab stop)
- [ ] Grouped items handled correctly

### Menu (ngMenu)
- [ ] `ngMenu` directive on menu container
- [ ] `ngMenuItem` directive on menu items
- [ ] `ngMenuTrigger` directive on trigger button
- [ ] Enter/Space opens menu
- [ ] Arrow keys navigate menu items
- [ ] Escape closes menu
- [ ] Focus returns to trigger on close
- [ ] Submenus work (if applicable)

### Tabs (ngTabs)
- [ ] `ngTabs` directive on tab container
- [ ] `ngTab` directive on each tab
- [ ] `ngTabPanel` directive on panels
- [ ] Arrow keys switch between tabs
- [ ] Tab panel content updates
- [ ] `aria-selected` on active tab
- [ ] `aria-controls` links tab to panel
- [ ] Only one tab panel visible at a time

### Accordion (ngAccordion)
- [ ] `ngAccordion` directive on container
- [ ] `ngAccordionPanel` directive on each panel
- [ ] `ngAccordionTrigger` directive on trigger buttons
- [ ] `ngAccordionContent` directive on content areas
- [ ] Enter/Space toggles panel
- [ ] `aria-expanded` reflects state
- [ ] Multiple panels behavior correct (single vs `[multi]="true"`)

### Combobox (ngCombobox)
- [ ] `ngCombobox` directive on container
- [ ] `ngComboboxInput` directive on input
- [ ] `ngComboboxTrigger` directive on trigger
- [ ] `ngComboboxOption` directive on options
- [ ] Arrow keys navigate options
- [ ] Type-ahead filtering works
- [ ] `aria-expanded` reflects dropdown state
- [ ] Selected value announced
- [ ] `aria-autocomplete` attribute present

### Listbox (ngListbox)
- [ ] `ngListbox` directive on container
- [ ] `ngListboxOption` directive on options
- [ ] Arrow keys navigate options
- [ ] Multi-select works (if `[multi]="true"`)
- [ ] `aria-selected` on selected items
- [ ] `[(value)]` binding updates

### Disclosure (ngDisclosure)
- [ ] `ngDisclosure` directive on container
- [ ] `ngDisclosureTrigger` directive on trigger
- [ ] `ngDisclosurePanel` directive on content
- [ ] Enter/Space toggles visibility
- [ ] `aria-expanded` reflects state

## RTL (Right-to-Left) Testing

- [ ] Arrow key navigation reverses in RTL mode
- [ ] Visual layout correct in RTL
- [ ] Test with `dir="rtl"` on container or html element
- [ ] Angular Aria automatically handles RTL

## Common Issues & Debugging

### Keyboard Navigation Not Working
- [ ] Check directive is imported and applied
- [ ] Verify no conflicting event handlers
- [ ] Check browser console for Angular Aria errors
- [ ] Ensure component is focusable (tabindex set)

### ARIA Attributes Missing
- [ ] Verify directive version matches Angular version
- [ ] Check if directive is applied to correct element
- [ ] Inspect element in DevTools Accessibility tree

### Focus Not Visible
- [ ] Add CSS for `:focus` state
- [ ] Check if outline is being removed by CSS reset
- [ ] Verify focus indicator has 3:1 contrast

### Selection Not Working
- [ ] Check `[(value)]` binding is correct
- [ ] Verify `[multi]` setting matches expected behavior
- [ ] Check `selectionMode` configuration

## Testing Commands

```bash
# Check Angular Aria version
npm list @angular/aria

# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Build and check for errors
npm run build

# Serve and test manually
npm start
```

## Testing Tools

### Browser DevTools
- **Accessibility Inspector** - View ARIA tree and attributes
- **Console** - Check for Angular Aria warnings
- **Elements Panel** - Inspect applied directives and attributes

### Screen Readers
- **NVDA (Windows)** - Free, most commonly used
- **VoiceOver (Mac)** - Built-in, Cmd+F5 to enable
- **JAWS (Windows)** - Industry standard, paid

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Visual accessibility evaluation
- **Lighthouse** - Accessibility audit in Chrome DevTools

### Angular-Specific
- **Angular DevTools** - Inspect component state and signals
- **Source Maps** - Debug into Angular Aria source code

## Resources

- [Angular Aria Documentation](https://angular.dev/guide/aria)
- [Angular Aria API Reference](https://angular.dev/api/aria)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Angular Accessibility Guide](https://angular.dev/best-practices/a11y)
