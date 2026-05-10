---
name: Angular Aria Component Template
description: Template for creating accessible Angular components with ARIA support
tags: [angular, accessibility, aria, component]
---

# Angular Aria Component Template

When creating a new accessible Angular component, follow this structure:

## Component Structure

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-[component-name]',
  standalone: true,
  imports: [],
  templateUrl: './[component-name].html',
  styleUrl: './[component-name].css'
})
export class [ComponentName]Component {
  // State management
  
  // Keyboard event handlers
  onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard navigation
  }
  
  // Focus management
  setFocus(element: HTMLElement): void {
    element.focus();
  }
  
  // ARIA state updates
  updateAriaState(): void {
    // Update ARIA attributes dynamically
  }
}
```

## Template Pattern

```html
<div
  role="[appropriate-role]"
  [attr.aria-label]="accessibleLabel"
  [attr.aria-describedby]="descriptionId"
  [attr.tabindex]="isInteractive ? 0 : -1"
  (keydown)="onKeyDown($event)"
>
  <!-- Component content -->
</div>
```

## Accessibility Checklist

- [ ] Semantic HTML elements used where possible
- [ ] Appropriate ARIA role assigned
- [ ] aria-label or aria-labelledby provided
- [ ] Keyboard navigation implemented (Tab, Arrow keys, Enter, Space, Escape)
- [ ] Focus management handled correctly
- [ ] Visual focus indicator present
- [ ] Screen reader announcements tested
- [ ] tabindex used appropriately (0 for interactive, -1 for programmatic focus)
