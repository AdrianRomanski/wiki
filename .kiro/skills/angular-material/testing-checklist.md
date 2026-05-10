---
name: Angular Material Testing Checklist
description: Testing checklist for Angular Material components
tags: [angular-material, accessibility, testing, angular]
---

# Angular Material Testing Checklist

> Testing checklist for components built with Angular Material

## Before Testing

### Installation & Setup
- [ ] Verify @angular/material is installed: `npm list @angular/material`
- [ ] Verify @angular/cdk is installed: `npm list @angular/cdk`
- [ ] Check Angular version compatibility
- [ ] Confirm Material theme is configured in styles.scss
- [ ] Review Material docs: [material.angular.io](https://material.angular.io)

### Component Configuration
- [ ] Material modules imported correctly
- [ ] Components used in template
- [ ] Theme colors applied (primary, accent, warn)
- [ ] Appearance set (outline, fill, standard)
- [ ] Required inputs configured

## What Material Handles Automatically

### Built-in Accessibility
- [ ] ARIA roles applied automatically
- [ ] ARIA attributes managed (aria-label, aria-describedby, etc.)
- [ ] Keyboard navigation works out of the box
- [ ] Focus management handled
- [ ] Screen reader support built-in
- [ ] High contrast mode support
- [ ] RTL (right-to-left) support
- [ ] Touch targets meet 44x44px minimum
- [ ] Color contrast meets WCAG AA

### Form Features
- [ ] Validation error messages display
- [ ] Required field indicators shown (*)
- [ ] Disabled state styled correctly
- [ ] Error announcements for screen readers
- [ ] Label associations automatic

## What You Must Verify

### Required Configuration
- [ ] All form fields have labels (mat-label)
- [ ] Error messages provided for validation
- [ ] Accessible names for icon-only buttons
- [ ] Loading states implemented for async operations
- [ ] Proper form validation rules

### Custom Features
- [ ] Business logic works correctly
- [ ] Data binding updates properly
- [ ] Event handlers fire as expected
- [ ] Custom validation logic works
- [ ] API integration functions

## Component-Specific Tests

### MatButton
- [ ] Button has accessible text or aria-label
- [ ] Icon-only buttons have aria-label
- [ ] Disabled state prevents interaction
- [ ] Focus indicator visible
- [ ] Color variants work (primary, accent, warn)
- [ ] Button types work (basic, raised, stroked, flat, icon, fab)

### MatFormField / MatInput
- [ ] mat-label provides accessible name
- [ ] Placeholder text (if used) is supplementary
- [ ] Error messages display on validation failure
- [ ] Required indicator (*) shows for required fields
- [ ] Hint text displays (mat-hint)
- [ ] Prefix/suffix work (matPrefix, matSuffix)
- [ ] Appearance styles work (outline, fill, standard)

### MatSelect
- [ ] mat-label provides accessible name
- [ ] Options announced by screen reader
- [ ] Arrow keys navigate options
- [ ] Enter/Space selects option
- [ ] Escape closes dropdown
- [ ] Multi-select works (if enabled)
- [ ] Search/filter works (if implemented)
- [ ] Selected value announced

### MatCheckbox / MatRadioButton
- [ ] Label text provided
- [ ] Checked state announced
- [ ] Space toggles checkbox
- [ ] Arrow keys navigate radio group
- [ ] Disabled state prevents interaction
- [ ] Indeterminate state works (checkbox)

### MatTabs
- [ ] Tab labels clear and descriptive
- [ ] Arrow keys navigate between tabs
- [ ] Tab panel content updates
- [ ] aria-selected on active tab
- [ ] Tab content lazy-loaded (if using matTabContent)
- [ ] Disabled tabs not selectable

### MatMenu
- [ ] Menu trigger has accessible label
- [ ] Enter/Space opens menu
- [ ] Arrow keys navigate menu items
- [ ] Escape closes menu
- [ ] Focus returns to trigger on close
- [ ] Submenus work (if applicable)
- [ ] Disabled items not selectable

### MatDialog
- [ ] Dialog has title (mat-dialog-title)
- [ ] Focus trapped within dialog
- [ ] Escape closes dialog (if configured)
- [ ] Focus returns to trigger on close
- [ ] aria-labelledby or aria-label present
- [ ] Close button accessible
- [ ] Backdrop click closes (if configured)

### MatTable
- [ ] Column headers have proper labels
- [ ] Sortable columns announced
- [ ] Pagination controls accessible
- [ ] Row selection announced (if applicable)
- [ ] Empty state message provided
- [ ] Loading state announced

### MatTree
- [ ] Tree has accessible label
- [ ] Arrow keys expand/collapse and navigate
- [ ] Expand/collapse state announced
- [ ] Nesting level announced
- [ ] Selection works (if applicable)

### MatSnackBar
- [ ] Message announced by screen reader
- [ ] Action button accessible (if present)
- [ ] Auto-dismiss timeout appropriate
- [ ] role="alert" or aria-live present

### MatTooltip
- [ ] Tooltip content descriptive
- [ ] Shows on hover and focus
- [ ] Escape dismisses tooltip
- [ ] Not used for critical information
- [ ] aria-describedby links element to tooltip

### MatDatepicker
- [ ] Input has accessible label
- [ ] Calendar button has aria-label
- [ ] Arrow keys navigate calendar
- [ ] Enter selects date
- [ ] Escape closes calendar
- [ ] Selected date announced
- [ ] Min/max dates enforced

### MatSlider
- [ ] Slider has accessible label
- [ ] Arrow keys adjust value
- [ ] Home/End jump to min/max
- [ ] Current value announced
- [ ] Step increments work
- [ ] Disabled state prevents interaction

## Keyboard Navigation Tests

### General Navigation
- [ ] Tab moves between interactive elements
- [ ] Shift+Tab moves backward
- [ ] Enter activates buttons/links
- [ ] Space activates buttons/checkboxes
- [ ] Escape closes dialogs/menus/overlays
- [ ] Arrow keys navigate within components

### Form Navigation
- [ ] Tab moves through form fields in order
- [ ] Error fields receive focus on submit
- [ ] Required fields indicated
- [ ] Validation triggers appropriately

## Screen Reader Tests

### Announcements
- [ ] Component type announced (button, menu, dialog, etc.)
- [ ] State changes announced (selected, expanded, checked)
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Success messages announced (snackbar)

### Labels and Descriptions
- [ ] All form fields have labels
- [ ] Icon-only buttons have aria-label
- [ ] Complex components have aria-describedby
- [ ] Error messages associated with fields

## Visual Tests

### Focus Indicators
- [ ] Focus indicator visible on all interactive elements
- [ ] Focus indicator has 3:1 contrast ratio
- [ ] Focus indicator not removed by custom CSS

### Color Contrast
- [ ] Text has 4.5:1 contrast (3:1 for large text)
- [ ] Material theme provides sufficient contrast
- [ ] Custom colors meet WCAG AA

### Touch Targets
- [ ] All interactive elements 44x44px minimum
- [ ] Material components meet this by default
- [ ] Custom buttons/links meet requirement

### Responsive Design
- [ ] Components work at 200% zoom
- [ ] Mobile layouts accessible
- [ ] Touch interactions work on mobile

## Theme & Styling Tests

### Material Theme
- [ ] Primary color applied correctly
- [ ] Accent color applied correctly
- [ ] Warn color applied correctly
- [ ] Typography configured
- [ ] Density settings work

### High Contrast Mode
- [ ] Components visible in high contrast mode
- [ ] Focus indicators visible
- [ ] Borders and outlines present

### RTL (Right-to-Left)
- [ ] Layout mirrors correctly in RTL
- [ ] Icons positioned correctly
- [ ] Text alignment correct
- [ ] Test with `dir="rtl"` on html element

## Form Validation Tests

### Validation Display
- [ ] Error messages display on blur
- [ ] Error messages display on submit
- [ ] Error messages clear when fixed
- [ ] Multiple errors handled correctly

### Validation Announcements
- [ ] Errors announced to screen readers
- [ ] Success messages announced
- [ ] Field-level errors associated with fields
- [ ] Form-level errors announced

### Required Fields
- [ ] Required indicator (*) displayed
- [ ] Required validation works
- [ ] Error message for required fields

## Common Issues & Debugging

### Styles Not Applied
- [ ] Material theme included in styles.scss
- [ ] Component modules imported
- [ ] Check for CSS conflicts

### Keyboard Navigation Not Working
- [ ] Material component used correctly
- [ ] No conflicting event handlers
- [ ] Component not disabled

### Screen Reader Not Announcing
- [ ] Labels provided for all inputs
- [ ] aria-label on icon-only buttons
- [ ] Error messages associated with fields
- [ ] Check with multiple screen readers

### Focus Indicator Not Visible
- [ ] Custom CSS not removing outline
- [ ] Theme provides sufficient contrast
- [ ] Check in high contrast mode

## Testing Commands

```bash
# Check Material version
npm list @angular/material

# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Build and check for errors
npm run build

# Serve and test manually
npm start

# Run accessibility audit
npx lighthouse http://localhost:4200 --only-categories=accessibility
```

## Testing Tools

### Browser DevTools
- **Accessibility Inspector** - View ARIA tree
- **Console** - Check for Material warnings
- **Elements Panel** - Inspect Material components

### Screen Readers
- **NVDA (Windows)** - Free, most commonly used
- **VoiceOver (Mac)** - Built-in, Cmd+F5 to enable
- **JAWS (Windows)** - Industry standard, paid

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Visual accessibility evaluation
- **Lighthouse** - Accessibility audit

### Angular-Specific
- **Angular DevTools** - Inspect component state
- **Material Component Dev App** - Test Material components in isolation

## Comparison with Angular Aria

### Angular Material Advantages
- ✅ Pre-styled components (faster development)
- ✅ Consistent Material Design look
- ✅ Built-in theming system
- ✅ More components available
- ✅ Better documentation and examples
- ✅ Larger community and ecosystem

### Angular Material Limitations
- ❌ Less customizable styling
- ❌ Larger bundle size
- ❌ Opinionated design (Material Design)
- ❌ May need overrides for custom designs

### When to Use Material vs Angular Aria
- **Use Material**: Quick development, Material Design, pre-styled components
- **Use Angular Aria**: Custom design system, full styling control, minimal bundle size

## Resources

- [Angular Material Documentation](https://material.angular.io)
- [Material Accessibility Guide](https://material.angular.io/guide/accessibility)
- [Material Design Guidelines](https://m3.material.io/)
- [Angular Material GitHub](https://github.com/angular/components)
- [CDK Documentation](https://material.angular.io/cdk/categories)
