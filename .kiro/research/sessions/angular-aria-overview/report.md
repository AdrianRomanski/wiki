# @angular/aria — Big Picture Research Report

> Version: 21.2.10 · Status: Developer Preview · Source: `node_modules/@angular/aria`

---

## 1. What Is It?

`@angular/aria` is Angular's official **headless accessibility library** — part of the Angular Components monorepo (same repo as Angular Material and CDK). It ships ARIA-compliant interaction patterns with **zero styling**. You own the markup and CSS; the library owns keyboard behavior and ARIA attribute management.

```
┌─────────────────────────────────────────────────────────────────┐
│                      @angular/aria                              │
│                                                                 │
│   You provide:          Library provides:                       │
│   ─────────────         ──────────────────                      │
│   HTML structure   →    Keyboard navigation                     │
│   CSS styling      →    ARIA attributes                         │
│   Business logic   →    Focus management                        │
│                    →    Screen reader support                   │
│                    →    RTL support                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Position in the Angular Ecosystem

```
┌──────────────────────────────────────────────────────────────────┐
│                    Angular Material                              │
│          (styled, opinionated, Material Design)                  │
│                         ↑ built on                               │
├──────────────────────────────────────────────────────────────────┤
│                     @angular/aria                                │
│        (headless interaction patterns — this library)            │
│                         ↑ uses primitives from                   │
├──────────────────────────────────────────────────────────────────┤
│                      Angular CDK                                 │
│     (overlay, drag-drop, a11y, portal, scrolling, etc.)          │
│                         ↑ built on                               │
├──────────────────────────────────────────────────────────────────┤
│                    @angular/core                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. The 8 Interaction Patterns

Each pattern is a **separate entry point** — fully tree-shakeable.

```
@angular/aria
├── /accordion   ← Expandable/collapsible sections
├── /listbox     ← Single or multi-select option list
├── /menu        ← Dropdown menus and menu bars
├── /tabs        ← Tabbed content panels
├── /tree        ← Hierarchical expandable data
├── /grid        ← 2D keyboard-navigable data grid
├── /toolbar     ← Grouped action widgets
└── /combobox    ← Input + popup (autocomplete, select)
```

### Pattern → Directive Map

```
┌─────────────┬──────────────────────────────────────────────────────────────┐
│ Pattern     │ Directives                                                   │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Accordion   │ ngAccordionGroup  ngAccordionTrigger                         │
│             │ ngAccordionPanel  ngAccordionContent                         │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Listbox     │ ngListbox  ngOption                                          │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Menu        │ ngMenu  ngMenuBar  ngMenuItem                                │
│             │ ngMenuTrigger  ngMenuContent                                 │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Tabs        │ ngTabs  ngTabList  ngTab                                     │
│             │ ngTabPanel  ngTabContent                                     │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Tree        │ ngTree  ngTreeItem  ngTreeItemGroup                          │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Grid        │ ngGrid  ngGridRow  ngGridCell  ngGridCellWidget              │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Toolbar     │ ngToolbar  ngToolbarWidget  ngToolbarWidgetGroup             │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Combobox    │ ngCombobox  ngComboboxInput  ngComboboxPopup                 │
│             │ ngComboboxDialog  ngComboboxPopupContainer                   │
└─────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 4. Internal Architecture

Every directive follows the same 3-layer structure:

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 1: Angular Directive                                      │
│  ─────────────────────────                                       │
│  • Connects to DOM via ElementRef                                │
│  • Exposes InputSignal / ModelSignal / OutputEmitterRef          │
│  • Queries child directives via contentChildren                  │
│  • Delegates all logic to the pattern                            │
│                          ↓                                       │
│  Layer 2: UIPattern (plain TypeScript class)                     │
│  ──────────────────────────────────────────                      │
│  • Framework-agnostic interaction logic                          │
│  • Stored as `_pattern` on the directive                         │
│  • e.g. ListboxPattern, TabListPattern, TreePattern              │
│                          ↓                                       │
│  Layer 3: Shared Behavior Chunks (internal)                      │
│  ────────────────────────────────────────                        │
│  • _keyboard-event-manager  ← key dispatch engine               │
│  • _pointer-event-manager   ← mouse/touch handling              │
│  • _list-navigation         ← roving / activedescendant         │
│  • _list-typeahead          ← jump-to-character search          │
│  • _deferred-content        ← lazy DOM rendering                │
│  • _expansion               ← expand/collapse state             │
│  • _signal-like             ← signal compatibility shim         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Cross-Cutting Features

These features appear consistently across all 8 patterns:

### Focus Management (2 strategies)

```
┌─────────────────────────────────────────────────────────────────┐
│  focusMode="roving"                                             │
│  ─────────────────                                              │
│  • tabindex moves to the active item                            │
│  • Only one item tabbable at a time                             │
│  • Best for: lists, trees, toolbars, tabs                       │
│                                                                 │
│  focusMode="activedescendant"                                   │
│  ────────────────────────────                                   │
│  • Focus stays on the container element                         │
│  • aria-activedescendant points to active item                  │
│  • Best for: combobox, complex composite widgets                │
└─────────────────────────────────────────────────────────────────┘
```

### Selection (2 strategies)

```
┌─────────────────────────────────────────────────────────────────┐
│  selectionMode="follow"                                         │
│  ──────────────────────                                         │
│  • Selection tracks focus automatically                         │
│  • Good for: navigation trees, simple lists                     │
│                                                                 │
│  selectionMode="explicit"                                       │
│  ────────────────────────                                       │
│  • User must press Space/Enter or click to select               │
│  • Good for: multi-select, action menus                         │
└─────────────────────────────────────────────────────────────────┘
```

### Disabled States (2 levels)

```
┌─────────────────────────────────────────────────────────────────┐
│  disabled                                                       │
│  ────────                                                       │
│  • Item is skipped during keyboard navigation                   │
│  • Not reachable by Tab or arrow keys                           │
│                                                                 │
│  softDisabled                                                   │
│  ────────────                                                   │
│  • Item is focusable but not interactive                        │
│  • Screen readers can still discover it                         │
│  • Sets aria-disabled="true" instead of disabled attr          │
└─────────────────────────────────────────────────────────────────┘
```

### Lazy Content Rendering

```
┌─────────────────────────────────────────────────────────────────┐
│  Pattern          │ Lazy Directive                              │
│  ─────────────────┼─────────────────────────────────────────── │
│  Accordion        │ ng-template[ngAccordionContent]             │
│  Tabs             │ ng-template[ngTabContent]                   │
│  Menu             │ ng-template[ngMenuContent]                  │
│  Tree children    │ ng-template[ngTreeItemGroup]                │
│  Combobox popup   │ ng-template[ngComboboxPopupContainer]       │
│                                                                 │
│  Content is NOT rendered until the panel/menu is first opened.  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Signal-First API

All state is signal-based — fully compatible with zoneless Angular.

```typescript
// Inputs are InputSignal
readonly multi = input<boolean>(false);
readonly disabled = input.required<boolean>();

// Two-way bindings are ModelSignal
readonly values = model<V[]>([]);
readonly expanded = model<boolean>(false);

// Derived state is Signal / computed
readonly active: Signal<boolean>;
readonly selected: Signal<boolean | undefined>;
readonly visible: Signal<boolean>;
```

---

## 7. Combobox — The Meta-Pattern

Combobox is special: it's a **composition pattern** that wraps other patterns.

```
┌──────────────────────────────────────────────────────────────────┐
│  ngCombobox (orchestrator)                                       │
│  ├── ngComboboxInput  ← the <input> element                      │
│  └── ngComboboxPopupContainer  ← the popup template             │
│       └── one of:                                                │
│            ├── ngListbox + ngOption  (select / autocomplete)     │
│            ├── ngTree + ngTreeItem   (tree select)               │
│            └── dialog[ngComboboxDialog]  (modal picker)          │
└──────────────────────────────────────────────────────────────────┘
```

Filter modes:
- `manual` — you filter the options list yourself
- `auto-select` — first matching option is auto-selected
- `highlight` — matching text is highlighted, no auto-selection

---

## 8. Keyboard Navigation Reference

```
┌──────────────────┬──────────────────────────────────────────────┐
│ Key              │ Behavior                                     │
├──────────────────┼──────────────────────────────────────────────┤
│ ↑ / ↓            │ Navigate items (vertical lists/trees)        │
│ ← / →            │ Navigate items (horizontal) or expand/close  │
│ Enter / Space    │ Select or activate item                      │
│ Escape           │ Close menu/popup, cancel                     │
│ Home / End       │ Jump to first / last item                    │
│ Tab              │ Move focus in/out of widget                  │
│ Printable chars  │ Typeahead — jump to matching item            │
│ Ctrl+A           │ Select all (multi-select patterns)           │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## 9. ARIA Attributes — Auto-Managed

The library sets and updates these automatically:

```
role="listbox" / "tree" / "grid" / "menu" / "tablist" / "toolbar"
aria-expanded="true|false"
aria-selected="true|false"
aria-disabled="true|false"
aria-activedescendant="[item-id]"
aria-controls="[panel-id]"
aria-current="page|step|location|date|time"
aria-level="[number]"          ← tree depth
aria-multiselectable="true"
tabindex="0" / tabindex="-1"
inert                          ← hides collapsed panels from a11y tree
```

---

## 10. Decision Guide

```
┌──────────────────────────────────────────────────────────────────┐
│  Use @angular/aria when...                                       │
│  ─────────────────────────                                       │
│  ✓ Building a custom design system                               │
│  ✓ Need WCAG compliance with full visual control                 │
│  ✓ Enterprise component library                                  │
│  ✓ Brand requires specific look & feel                           │
│                                                                  │
│  Use Angular Material instead when...                            │
│  ────────────────────────────────────                            │
│  ✓ Need pre-styled, ready-to-use components                      │
│  ✓ Material Design aesthetic is acceptable                       │
│  ✓ Rapid prototyping / internal tools                            │
│                                                                  │
│  Use native HTML instead when...                                 │
│  ────────────────────────────────                                │
│  ✓ Simple forms: <select>, <input>, <button>                     │
│  ✓ Native semantics are sufficient                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. Status & Roadmap

- All 8 patterns are `@developerPreview` since Angular v21
- Angular roadmap: promote to **stable** + add new patterns
- Lives in the `angular/components` repo alongside Material and CDK
- Versioned together with Material (`ng-update` package group)
- Peer deps: `@angular/cdk@21.2.10`, `@angular/core ^21 || ^22`

---

## Sources

- `node_modules/@angular/aria/types/*.d.ts` — actual installed API
- `node_modules/@angular/aria/package.json` — entry points, version, deps
- `node_modules/@angular/aria/fesm2022/` — compiled implementation chunks
- [angular.dev/roadmap](https://angular.dev/roadmap) — official roadmap (Angular v20 docs)
