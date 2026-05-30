---
title: UI Pattern Behavior Composition
type: concept
tags: [accessibility, aria, angular, architecture, pattern, signals, composition]
sources: [angular-aria-big-picture-2026-05-30]
created: 2026-05-30
updated: 2026-05-30
---

# UI Pattern Behavior Composition

## Explanation

UI Pattern Behavior Composition is the internal architecture used by `@angular/aria` to build accessible UI components. It organizes code into three distinct layers:

```
Angular Directives  (public API — thin Angular wrappers)
        ↓
  UI Pattern classes  (compose behaviors into complete ARIA patterns)
        ↓
  Behavior classes  (single-concern, framework-agnostic interaction logic)
        ↓
  Signal primitives  (SignalLike / WritableSignalLike)
```

### Behavior Layer

**Behaviors** are plain TypeScript classes with no Angular dependency. Each encapsulates a single reusable interaction concern:

| Behavior | Responsibility |
|---|---|
| `ListNavigationBehavior` | Arrow key navigation through a list |
| `ListSelectionBehavior` | Single/multi-select with keyboard and pointer |
| `ListFocusBehavior` | Roving tabindex management |
| `ListTypeaheadBehavior` | Jump-to-item by typing characters |
| `ExpansionBehavior` | Expand/collapse state for panels and tree nodes |
| `PopupBehavior` | Open/close state for menus and combobox dropdowns |
| `LabelBehavior` | `aria-label` / `aria-labelledby` management |
| `GridBehavior` | 2D navigation for grids |

The same `ListNavigationBehavior` powers listbox, combobox, menu, tree, and toolbar. A fix or improvement to navigation logic propagates to all five patterns automatically.

### UI Pattern Layer

**UI Patterns** compose multiple behaviors to implement a complete ARIA pattern. Each pattern:

1. Accepts a typed `Inputs` object where **all inputs are signals** (`SignalLike` / `WritableSignalLike`)
2. Instantiates behaviors in its constructor
3. Exposes `computed()` event managers for `keydown` and `pointerdown`
4. Implements `validate()`, `setDefaultState()`, `onKeydown()`, `onPointerdown()` core methods

```ts
export class ListboxPattern {
  navigation: ListNavigationBehavior;
  selection: ListSelectionBehavior;
  focus: ListFocusBehavior;
  typeahead: ListTypeaheadBehavior;

  keydown = computed(() =>
    new KeyboardEventManager()
      .on('ArrowDown', () => this.navigation.navigateNext())
      .on('ArrowUp', () => this.navigation.navigatePrev())
      .on(' ', () => this.selection.toggleActive())
  );

  constructor(inputs: ListboxInputs) {
    this.navigation = new ListNavigationBehavior(inputs);
    this.selection = new ListSelectionBehavior(inputs);
    this.focus = new ListFocusBehavior(inputs);
    this.typeahead = new ListTypeaheadBehavior(inputs);
  }

  onKeydown(event: KeyboardEvent) { this.keydown().handle(event); }
}
```

### Angular Directive Layer

Public directives are thin Angular wrappers that:
- Inject the host element and Angular signals
- Instantiate the corresponding UI Pattern with signal inputs
- Wire DOM events to the pattern's handlers
- Set ARIA attributes reactively via `effect()` or host bindings

### EventManager System

The `KeyboardEventManager` and `PointerEventManager` provide a fluent API for declarative event routing:

```ts
// Supports strings, signals, regex, and modifier keys
keydown = computed(() =>
  new KeyboardEventManager()
    .on('ArrowDown', () => { /* ... */ })
    .on(Modifier.Shift, 'Tab', () => { /* ... */ })
    .on([Modifier.Ctrl, Modifier.Meta], 'a', () => { /* select all */ })
    .on(Modifier.Ctrl | Modifier.Shift, 'ArrowUp', () => { /* ... */ })
);
```

## Applications

- **Building custom accessible components** — compose behaviors to create new ARIA patterns not yet in `@angular/aria`
- **Extending existing patterns** — subclass a UI Pattern to add custom keyboard shortcuts
- **Testing accessibility logic in isolation** — behaviors are plain TypeScript, testable without Angular TestBed
- **Framework-agnostic accessibility logic** — the behavior layer can theoretically be used outside Angular

## Related Concepts

- [[Headless ARIA Directives]] — the public-facing pattern that this architecture enables
- [[Signal-Native Component Inputs]] — how all inputs flow through the behavior stack
- [[Deferred Content Lazy Rendering]] — a complementary pattern for performance

## Examples

Accessing the private layer (advanced — no stability guarantee):

```ts
// ⚠️ @angular/aria/private has no public API stability guarantee
import { ListboxPattern } from '@angular/aria/private';

// All inputs must be signals
const pattern = new ListboxPattern({
  items: signal(myItems),
  activeIndex: signal(0),
  selectedValues: signal([]),
  // ...
});
```

## References

- [[Angular Aria]]
- [[Angular Aria Big Picture Research — 2026-05-30]]
