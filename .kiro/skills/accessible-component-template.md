---
name: Accessible Component Template
description: Universal template for creating accessible components with any library (Angular Aria, Radix, Headless UI, etc.)
tags: [accessibility, aria, component, template, a11y]
---

# Accessible Component Template

Universal guide for creating accessible components with any accessibility library.

## Key Principles

1. **Choose the right library** - Select based on framework and requirements
2. **Provide semantic HTML** - Use proper HTML elements as foundation
3. **Add styling** - Most accessibility libraries are headless (unstyled)
4. **Implement business logic** - Data handling and custom behavior
5. **Test thoroughly** - Keyboard, screen reader, and visual testing

## Common Accessibility Libraries

### Angular
- **@angular/aria** - Headless directives (v21+)
- **Angular Material** - Pre-styled components with accessibility
- **PrimeNG** - Feature-rich with ARIA support

### React
- **Radix UI** - Headless primitives
- **Headless UI** - Unstyled, accessible components
- **React Aria** - Adobe's accessibility hooks
- **Chakra UI** - Styled with accessibility built-in

### Vue
- **Headless UI** - Tailwind's unstyled components
- **Radix Vue** - Radix primitives for Vue
- **PrimeVue** - Feature-rich with ARIA

### Framework-Agnostic
- **ARIA Authoring Practices Guide (APG)** - W3C patterns
- Custom implementation following WAI-ARIA specs

## Component Structure (Angular Example)

### Using Accessibility Library

```typescript
import { Component, input, model, signal, computed } from '@angular/core';
// Import from your chosen library
import { TreeDirective, TreeItemDirective } from '@angular/aria/tree';

@Component({
  selector: 'app-accessible-tree',
  standalone: true,
  imports: [TreeDirective, TreeItemDirective],
  templateUrl: './accessible-tree.html',
  styleUrl: './accessible-tree.scss'
})
export class AccessibleTreeComponent {
  // === PUBLIC API (Inputs/Outputs) ===
  public readonly label = input<string>('');
  public readonly disabled = input<boolean>(false);
  public readonly selectedValues = model<string[]>([]);
  
  // === PROTECTED (Template-accessible) ===
  protected readonly items = signal<TreeItem[]>([]);
  protected readonly isLoading = signal(false);
  
  protected onItemClick(itemId: string): void {
    this.handleSelection(itemId);
  }
  
  protected readonly filteredItems = computed(() => 
    this.items().filter(item => !item.hidden)
  );
  
  // === PRIVATE (Internal only) ===
  private handleSelection(itemId: string): void {
    // Internal logic
  }
}

interface TreeItem {
  id: string;
  name: string;
  hidden?: boolean;
}
```

### Manual ARIA Implementation (When No Library Available)

```typescript
import { Component, input, signal, HostListener } from '@angular/core';

@Component({
  selector: 'app-manual-tree',
  standalone: true,
  template: `
    <ul 
      role="tree"
      [attr.aria-label]="label()"
      [attr.aria-multiselectable]="multi()"
      tabindex="0"
    >
      @for (item of items(); track item.id) {
        <li 
          role="treeitem"
          [attr.aria-selected]="isSelected(item.id)"
          [attr.tabindex]="getTabIndex(item.id)"
          (click)="onItemClick(item.id)"
        >
          {{ item.name }}
        </li>
      }
    </ul>
  `
})
export class ManualTreeComponent {
  public readonly label = input<string>('Tree');
  public readonly multi = input<boolean>(false);
  
  protected readonly items = signal<TreeItem[]>([]);
  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly activeId = signal<string | null>(null);
  
  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }
  
  protected getTabIndex(id: string): number {
    // Roving tabindex pattern
    return this.activeId() === id ? 0 : -1;
  }
  
  protected onItemClick(id: string): void {
    this.activeId.set(id);
    this.toggleSelection(id);
  }
  
  @HostListener('keydown', ['$event'])
  protected handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.movePrevious();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.activeId()) {
          this.toggleSelection(this.activeId()!);
        }
        break;
    }
  }
  
  private moveNext(): void {
    // Navigate to next item
  }
  
  private movePrevious(): void {
    // Navigate to previous item
  }
  
  private toggleSelection(id: string): void {
    // Handle selection logic
  }
}
```

## Template Patterns

### Using Library Directives (Recommended)

```html
<!-- Example: Angular Aria Tree -->
<ul 
  ngTree 
  [(value)]="selectedValues"
  [multi]="true"
  [attr.aria-label]="label()"
>
  @for (item of items(); track item.id) {
    <li ngTreeItem [value]="item.id">
      {{ item.name }}
    </li>
  }
</ul>

<!-- Example: Radix UI (React) -->
<Accordion.Root type="multiple">
  {sections.map(section => (
    <Accordion.Item key={section.id} value={section.id}>
      <Accordion.Trigger>{section.title}</Accordion.Trigger>
      <Accordion.Content>{section.content}</Accordion.Content>
    </Accordion.Item>
  ))}
</Accordion.Root>
```

### Manual ARIA Implementation

```html
<!-- Tree with manual ARIA -->
<ul 
  role="tree"
  [attr.aria-label]="label()"
  [attr.aria-multiselectable]="multi()"
  tabindex="0"
  (keydown)="handleKeyDown($event)"
>
  @for (item of items(); track item.id) {
    <li 
      role="treeitem"
      [attr.aria-selected]="isSelected(item.id)"
      [attr.aria-level]="item.level"
      [attr.tabindex]="getTabIndex(item.id)"
      (click)="onItemClick(item.id)"
    >
      {{ item.name }}
    </li>
  }
</ul>

<!-- Accordion with manual ARIA -->
<div class="accordion">
  @for (section of sections(); track section.id) {
    <div class="accordion-item">
      <button
        [attr.id]="'trigger-' + section.id"
        [attr.aria-expanded]="isExpanded(section.id)"
        [attr.aria-controls]="'panel-' + section.id"
        (click)="toggle(section.id)"
      >
        {{ section.title }}
      </button>
      <div
        [attr.id]="'panel-' + section.id"
        role="region"
        [attr.aria-labelledby]="'trigger-' + section.id"
        [hidden]="!isExpanded(section.id)"
      >
        {{ section.content }}
      </div>
    </div>
  }
</div>
```

## Styling Pattern

```scss
// Universal styling for accessible components

.accessible-component {
  // Focus indicator (REQUIRED)
  &:focus,
  &:focus-within {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }
  
  // High contrast mode support
  @media (prefers-contrast: high) {
    &:focus {
      outline-width: 3px;
    }
  }
  
  // Selected state
  [aria-selected="true"] {
    background-color: #e3f2fd;
    font-weight: 600;
  }
  
  // Disabled state
  [aria-disabled="true"],
  :disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  // Expanded/collapsed indicators
  [aria-expanded="true"]::before {
    content: '▼';
  }
  
  [aria-expanded="false"]::before {
    content: '▶';
  }
  
  // Hover (only when not disabled)
  &:not([aria-disabled="true"]):not(:disabled):hover {
    background-color: #f5f5f5;
  }
  
  // Minimum touch target size
  button,
  [role="button"],
  [role="tab"],
  [role="menuitem"] {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
  }
}

// Screen reader only content
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// Skip link
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
  
  &:focus {
    top: 0;
  }
}
```

## Access Modifier Guidelines (TypeScript/Angular)

### Public (API Surface)
```typescript
// Inputs/Outputs - always public readonly
public readonly label = input<string>('');
public readonly disabled = input<boolean>(false);
public readonly selectedValue = model<string | null>(null);
```

### Protected (Template-Accessible)
```typescript
// Data and methods used in template
protected readonly items = signal([...]);
protected onItemClick(id: string): void { }
protected readonly filteredItems = computed(() => ...);
```

### Private (Internal Only)
```typescript
// Internal state and helpers
private readonly cache = new Map<string, any>();
private fetchData(): void { }
private validateInput(value: string): boolean { }
```

## Implementation Checklist

### Research Phase
- [ ] Check online documentation for the library
- [ ] Inspect node_modules for actual implementation
- [ ] Review WAI-ARIA Authoring Practices for the pattern
- [ ] Verify library version and browser support

### Implementation
- [ ] Choose appropriate component pattern (tree, menu, tabs, etc.)
- [ ] Use semantic HTML as foundation
- [ ] Apply library directives/components OR implement manual ARIA
- [ ] Configure all required props/inputs
- [ ] Add accessible name (aria-label or aria-labelledby)
- [ ] Implement business logic
- [ ] Style focus indicators (3:1 contrast minimum)
- [ ] Style all states (selected, disabled, expanded, etc.)

### What Libraries Typically Handle
- [ ] Keyboard navigation (arrows, Enter, Space, Escape, etc.)
- [ ] ARIA roles and attributes
- [ ] Focus management (roving tabindex or activedescendant)
- [ ] Screen reader announcements for state changes
- [ ] RTL (right-to-left) support

### What You Must Provide
- [ ] HTML structure
- [ ] CSS styling (if using headless library)
- [ ] Business logic and data handling
- [ ] Custom ARIA for domain-specific features
- [ ] Error handling and loading states
- [ ] Form validation (if applicable)

### Testing
- [ ] Keyboard-only navigation (unplug mouse)
- [ ] Screen reader testing (NVDA, VoiceOver, JAWS)
- [ ] Focus indicator visible (3:1 contrast)
- [ ] Touch targets 44x44px minimum
- [ ] Works in RTL mode (dir="rtl")
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Zoom to 200% without breaking layout
- [ ] Test with browser accessibility inspector

## Common Patterns Reference

### Roving Tabindex
```typescript
// Only one item is tabbable (tabindex="0")
// Others have tabindex="-1"
// Focus moves with arrow keys
getTabIndex(itemId: string): number {
  return this.activeId() === itemId ? 0 : -1;
}
```

### Activedescendant
```html
<!-- Container keeps focus, aria-activedescendant points to active item -->
<div 
  role="listbox"
  tabindex="0"
  [attr.aria-activedescendant]="activeId()"
>
  <div role="option" [id]="item.id">...</div>
</div>
```

### Live Regions
```html
<!-- Polite: announces when user is idle -->
<div role="status" aria-live="polite">
  {{ statusMessage() }}
</div>

<!-- Assertive: announces immediately -->
<div role="alert" aria-live="assertive">
  {{ errorMessage() }}
</div>
```

## Resources

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN ARIA Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM Resources](https://webaim.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
