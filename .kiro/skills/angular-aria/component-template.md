---
name: Angular Aria Component Template
description: Template for creating accessible Angular components using @angular/aria directives
tags: [angular, accessibility, aria, component, angular-aria]
---

# Angular Aria Component Template

When creating a new accessible Angular component with @angular/aria, follow this structure:

## Key Principles

1. **Import Angular Aria directives** - Use pre-built accessible patterns
2. **Provide HTML structure** - Semantic markup for the component
3. **Add CSS styling** - Visual design (Angular Aria is headless)
4. **Implement business logic** - Data handling and custom behavior
5. **Use proper access modifiers**:
   - `public readonly` for inputs/outputs
   - `protected` for template-accessible members
   - `private` for internal-only logic

## Component Structure

### Basic Pattern (Using Angular Aria Directive)

```typescript
import { Component, input, model, signal } from '@angular/core';
import { TreeDirective, TreeItemDirective } from '@angular/aria/tree';

@Component({
  selector: 'app-[component-name]',
  standalone: true,
  imports: [TreeDirective, TreeItemDirective], // Import Angular Aria directives
  templateUrl: './[component-name].html',
  styleUrl: './[component-name].scss'
})
export class [ComponentName]Component {
  // === PUBLIC INPUTS/OUTPUTS (readonly) ===
  // Use input() for one-way binding
  public readonly label = input<string>('');
  public readonly disabled = input<boolean>(false);
  
  // Use model() for two-way binding
  public readonly selectedValues = model<string[]>([]);
  
  // === PROTECTED (Template-accessible) ===
  // Data for template
  protected readonly items = signal([
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ]);
  
  // Methods called from template
  protected onItemClick(itemId: string): void {
    // Custom business logic
    this.handleSelection(itemId);
  }
  
  // === PRIVATE (Internal only) ===
  // Internal state
  private loadingState = signal(false);
  
  // Internal helper methods
  private handleSelection(itemId: string): void {
    // Internal logic not exposed to template
  }
}
```

### Advanced Pattern (Custom Logic with Angular Aria)

```typescript
import { Component, input, model, signal, computed, effect } from '@angular/core';
import { ToolbarDirective, ToolbarItemDirective } from '@angular/aria/toolbar';

@Component({
  selector: 'app-custom-toolbar',
  standalone: true,
  imports: [ToolbarDirective, ToolbarItemDirective],
  templateUrl: './custom-toolbar.html',
  styleUrl: './custom-toolbar.scss'
})
export class CustomToolbarComponent {
  // === PUBLIC INPUTS ===
  public readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  public readonly actions = input.required<ToolbarAction[]>();
  
  // === PUBLIC OUTPUTS (model signals) ===
  public readonly activeAction = model<string | null>(null);
  
  // === PROTECTED (Template) ===
  protected readonly enabledActions = computed(() => 
    this.actions().filter(a => !a.disabled)
  );
  
  protected onActionTrigger(actionId: string): void {
    this.executeAction(actionId);
  }
  
  // === PRIVATE (Internal) ===
  private readonly actionHistory = signal<string[]>([]);
  
  private executeAction(actionId: string): void {
    const action = this.actions().find(a => a.id === actionId);
    if (action?.handler) {
      action.handler();
      this.trackAction(actionId);
    }
  }
  
  private trackAction(actionId: string): void {
    this.actionHistory.update(history => [...history, actionId]);
  }
}

interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  handler?: () => void;
}
```

## Template Patterns

### Tree Component Example

```html
<!-- Angular Aria handles: keyboard nav, ARIA attributes, focus management -->
<ul 
  ngTree 
  [(value)]="selectedValues"
  [multi]="true"
  [disabled]="disabled()"
  [attr.aria-label]="label()"
>
  @for (item of items(); track item.id) {
    <li 
      ngTreeItem 
      [value]="item.id"
      [label]="item.name"
      (click)="onItemClick(item.id)"
    >
      {{ item.name }}
    </li>
  }
</ul>
```

### Toolbar Component Example

```html
<!-- Angular Aria handles: arrow key navigation, roving tabindex -->
<div 
  ngToolbar 
  [orientation]="orientation()"
  [attr.aria-label]="label()"
>
  @for (action of enabledActions(); track action.id) {
    <button 
      ngToolbarItem
      [disabled]="action.disabled"
      (click)="onActionTrigger(action.id)"
    >
      @if (action.icon) {
        <span class="icon">{{ action.icon }}</span>
      }
      {{ action.label }}
    </button>
  }
</div>
```

### Accordion Component Example

```html
<div ngAccordion [multi]="true">
  @for (section of sections(); track section.id) {
    <div ngAccordionPanel>
      <button ngAccordionTrigger>
        {{ section.title }}
      </button>
      <div ngAccordionContent>
        {{ section.content }}
      </div>
    </div>
  }
</div>
```

### Custom ARIA (When Needed)

```html
<!-- Add custom ARIA for features Angular Aria doesn't handle -->
<div 
  ngTree
  [(value)]="selectedValues"
  [attr.aria-label]="label()"
  [attr.aria-describedby]="descriptionId"
>
  <!-- aria-live for custom announcements -->
  <div 
    role="status" 
    aria-live="polite" 
    class="sr-only"
  >
    {{ statusMessage() }}
  </div>
  
  <!-- Tree items -->
  @for (item of items(); track item.id) {
    <li ngTreeItem [value]="item.id">
      {{ item.name }}
    </li>
  }
</div>
```

## Styling Pattern (SCSS)

```scss
// Angular Aria is headless - you provide all styling

.my-tree {
  list-style: none;
  padding: 0;
  
  li {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    
    // Focus indicator (required for accessibility)
    &:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }
    
    // Selected state
    &[aria-selected="true"] {
      background-color: #e3f2fd;
      font-weight: 600;
    }
    
    // Disabled state
    &[aria-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    // Hover (only when not disabled)
    &:not([aria-disabled="true"]):hover {
      background-color: #f5f5f5;
    }
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
```

## Access Modifier Rules

### Public Readonly (Inputs/Outputs)
```typescript
// ✅ Inputs - always public readonly
public readonly label = input<string>('');
public readonly disabled = input<boolean>(false);

// ✅ Outputs/Models - always public readonly
public readonly selectedValue = model<string | null>(null);
public readonly valueChange = output<string>();
```

### Protected (Template-Accessible)
```typescript
// ✅ Data used in template
protected readonly items = signal([...]);
protected readonly isLoading = signal(false);

// ✅ Methods called from template
protected onItemClick(id: string): void { }
protected handleKeyDown(event: KeyboardEvent): void { }

// ✅ Computed values for template
protected readonly filteredItems = computed(() => ...);
```

### Private (Internal Only)
```typescript
// ✅ Internal state
private readonly cache = new Map<string, any>();
private loadingState = signal(false);

// ✅ Helper methods not used in template
private fetchData(): void { }
private validateInput(value: string): boolean { }
private logAnalytics(event: string): void { }
```

## Component Checklist

### Before Starting
- [ ] Check @angular/aria documentation online (angular.dev)
- [ ] Inspect node_modules/@angular/aria for actual implementation
- [ ] Choose appropriate Angular Aria directive (Tree, Toolbar, Menu, etc.)
- [ ] Verify directive is available in your Angular version

### Implementation
- [ ] Import Angular Aria directive(s)
- [ ] Use semantic HTML structure (ul/li for trees, button for actions)
- [ ] Apply directive to container element
- [ ] Configure directive inputs (multi, disabled, orientation, etc.)
- [ ] Bind to model signals for two-way data flow
- [ ] Add aria-label or aria-labelledby for accessible name
- [ ] Implement custom business logic (click handlers, data fetching)
- [ ] Add CSS styling (focus indicators, selected state, hover)

### What Angular Aria Handles (Don't Implement)
- [ ] ~~Keyboard navigation~~ (auto-handled)
- [ ] ~~ARIA roles and attributes~~ (auto-applied)
- [ ] ~~Focus management~~ (roving tabindex or activedescendant)
- [ ] ~~Screen reader announcements~~ (for component state)
- [ ] ~~RTL support~~ (automatic)

### What You Must Provide
- [ ] HTML structure and semantic markup
- [ ] CSS styling (colors, spacing, icons, focus indicators)
- [ ] Business logic (data fetching, validation, side effects)
- [ ] Custom ARIA for domain-specific features (aria-live, aria-describedby)
- [ ] Error handling and loading states

### Testing
- [ ] Keyboard-only navigation works (unplug mouse)
- [ ] Screen reader announces component correctly
- [ ] Focus indicator visible and meets 3:1 contrast
- [ ] All interactive elements have 44x44px touch target
- [ ] Component works in RTL mode (test with dir="rtl")
- [ ] Disabled state prevents interaction
- [ ] Multi-selection works (if applicable)
