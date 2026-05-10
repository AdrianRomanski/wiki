---
name: Accessibility Testing Checklist
description: Quick checklist for testing accessibility features in Angular components
tags: [accessibility, testing, aria, keyboard]
---

# Accessibility Testing Checklist

## Keyboard Navigation Testing

### Basic Navigation
- [ ] Tab key moves focus to all interactive elements in logical order
- [ ] Shift+Tab moves focus backward
- [ ] Enter/Space activates buttons and controls
- [ ] Escape closes modals, menus, and dismissible elements
- [ ] Arrow keys navigate within composite widgets (lists, grids, menus)

### Focus Management
- [ ] Focus visible indicator present on all interactive elements
- [ ] Focus trapped in modals/dialogs when open
- [ ] Focus restored to trigger element when closing modals
- [ ] Skip links available for main content
- [ ] No keyboard traps (can always navigate away)

## ARIA Implementation

### Required Attributes
- [ ] role attribute matches component purpose
- [ ] aria-label or aria-labelledby provides accessible name
- [ ] aria-describedby links to descriptions when needed
- [ ] aria-live regions for dynamic content updates
- [ ] aria-expanded for expandable elements
- [ ] aria-selected for selectable items
- [ ] aria-checked for checkboxes/toggles
- [ ] aria-disabled for disabled elements

### State Management
- [ ] ARIA states update dynamically with component state
- [ ] aria-hidden used correctly (not on focusable elements)
- [ ] aria-current indicates current item in navigation

## Screen Reader Testing

### Announcements
- [ ] Component purpose announced correctly
- [ ] State changes announced (expanded/collapsed, selected, etc.)
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Loading states announced

### Structure
- [ ] Heading hierarchy logical (h1, h2, h3...)
- [ ] Landmarks used (main, nav, aside, footer)
- [ ] Lists marked up as lists
- [ ] Tables have proper headers

## Visual Testing

- [ ] Focus indicator has 3:1 contrast ratio
- [ ] Text has 4.5:1 contrast ratio (3:1 for large text)
- [ ] Interactive elements have 44x44px minimum touch target
- [ ] No information conveyed by color alone
- [ ] Content readable at 200% zoom

## Testing Commands

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Lint accessibility (if configured)
npm run lint:a11y
```

## Manual Testing Tools

- Browser DevTools Accessibility Inspector
- Keyboard only (unplug mouse!)
- Screen reader (NVDA on Windows, VoiceOver on Mac)
- Browser extensions (axe DevTools, WAVE)
