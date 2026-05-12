---
title: List Key Manager
type: concept
tags: [angular, cdk, accessibility, keyboard-navigation, aria, a11y]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# List Key Manager

## Explanation

A List Key Manager is an abstraction from `@angular/cdk/a11y` that manages keyboard navigation across a list of items. It handles `ArrowUp`/`ArrowDown`, `Home`/`End`, typeahead search, and optional wrapping — without coupling the navigation logic to any specific DOM structure.

The CDK provides three specializations:

| Class | Use Case |
|---|---|
| `ListKeyManager` | Base class; tracks active item index |
| `FocusKeyManager` | Items are focusable; moves DOM focus to the active item |
| `ActiveDescendantKeyManager` | Composite widget; focus stays on container, `aria-activedescendant` is updated |
| `TreeKeyManager` | Hierarchical items; handles expand/collapse in addition to navigation |

## Applications

- Dropdown menus and select components
- Autocomplete option lists
- Toolbar button groups
- Listboxes and comboboxes
- Tree views (via `TreeKeyManager`)
- Any custom keyboard-navigable list

## Related Concepts

- [[focus-trap]] — traps focus within a region; key managers navigate within it
- [[live-announcer]] — announces active item changes to screen readers
- [[overlay-positioning]] — overlays often contain key-manager-driven lists

## Examples

```typescript
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { QueryList } from '@angular/core';

// Each item must implement FocusableOption
class MyItem implements FocusableOption {
  focus() { this.el.nativeElement.focus(); }
  getLabel() { return this.label; }
}

// In the parent component
manager = new FocusKeyManager(this.items)
  .withWrap()          // ArrowDown on last item goes to first
  .withTypeAhead();    // Typing jumps to matching item

onKeydown(event: KeyboardEvent) {
  this.manager.onKeydown(event);
}
```

For composite widgets (e.g., a listbox where focus stays on the container):

```typescript
import { ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';

class MyOption implements Highlightable {
  setActiveStyles()   { this.active = true; }
  setInactiveStyles() { this.active = false; }
}

manager = new ActiveDescendantKeyManager(this.options).withWrap();
// manager.activeItem?.id is the value for aria-activedescendant
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
