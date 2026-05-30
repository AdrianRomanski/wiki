# @angular/aria — Big Picture Analysis

**Library:** `@angular/aria`
**Version:** `21.2.13` (latest stable as of 2026-05-30)
**GitHub Repository:** https://github.com/angular/components
**Resolved Ref:** `v21.2.13`

> **Source note:** This analysis was sourced from the GitHub repository at the resolved ref `v21.2.13`, supplemented by `node_modules/@angular/aria/package.json` for the published exports map.

---

## Overview

`@angular/aria` is Angular's new first-party library for building **fully accessible UI components** that conform to [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/). It lives inside the `angular/components` monorepo alongside `@angular/cdk` and `@angular/material`, but is published as a separate package.

The library is built around a layered architecture:

```
Angular Directives (public API)
        ↓
  UI Pattern classes (private)
        ↓
  Behavior classes (private)
        ↓
  Signal primitives (SignalLike / WritableSignalLike)
```

Each public directive delegates all interaction logic to a corresponding **UI Pattern** class, which composes multiple **Behavior** classes. This separation means the Angular-specific layer is thin — the heavy lifting lives in framework-agnostic TypeScript classes.

---

## Entry Points & Exports Map

The published package exposes **10 named sub-package entry points** plus the root entry:

| Import path | Purpose |
|---|---|
| `@angular/aria` | Root — re-exports `VERSION` only |
| `@angular/aria/accordion` | Accordion / disclosure pattern |
| `@angular/aria/combobox` | Combobox (input + popup listbox) |
| `@angular/aria/grid` | ARIA grid (2D keyboard navigation) |
| `@angular/aria/listbox` | Listbox (single/multi-select list) |
| `@angular/aria/menu` | Menu and menu bar |
| `@angular/aria/tabs` | Tab list / tab panel |
| `@angular/aria/toolbar` | Toolbar with widget groups |
| `@angular/aria/tree` | Tree view (hierarchical list) |
| `@angular/aria/private` | Internal UI Pattern classes (not for direct use) |

> **Note:** The root `@angular/aria` entry only exports `VERSION`. All usable directives come from the sub-package paths above.

---

## Exported Symbols by Sub-Package

### `@angular/aria/accordion`

| Symbol | Type | Description |
|---|---|---|
| `AccordionGroup` | Directive | Container for a group of accordion panels. Manages expand/collapse state. |
| `AccordionPanel` | Directive | Individual panel. Wraps trigger + content. |
| `AccordionTrigger` | Directive | Button that toggles the panel open/closed. |
| `AccordionContent` | Directive | The collapsible content region of a panel. |
| `ɵɵDeferredContent` | Directive (re-export) | Internal — lazy content rendering helper. |
| `ɵɵDeferredContentAware` | Directive (re-export) | Internal — marks a host as deferred-content-aware. |

**ARIA role:** `region` / `button` (follows the [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/))

---

### `@angular/aria/combobox`

| Symbol | Type | Description |
|---|---|---|
| `Combobox` | Directive | The combobox input element. Manages `aria-expanded`, `aria-controls`, `aria-activedescendant`. |
| `ComboboxDialog` | Directive | Popup container rendered as a dialog. |
| `ComboboxInput` | Directive | The text input inside the combobox. |
| `ComboboxPopup` | Directive | The popup listbox container. |
| `ComboboxPopupContainer` | Directive | Wrapper that positions the popup. |
| `ɵɵDeferredContent` | Directive (re-export) | Internal. |
| `ɵɵDeferredContentAware` | Directive (re-export) | Internal. |

**ARIA role:** `combobox` on the input, `listbox` on the popup.

---

### `@angular/aria/grid`

| Symbol | Type | Description |
|---|---|---|
| `Grid` | Directive | The grid container. Manages 2D keyboard navigation (arrow keys, Home/End, Page Up/Down). |
| `GridRow` | Directive | A row within the grid (`role="row"`). |
| `GridCell` | Directive | A cell within a row (`role="gridcell"`). |
| `GridCellWidget` | Directive | Marks an interactive widget inside a cell (e.g. a button). Handles focus management within the cell. |

**ARIA role:** `grid` → `row` → `gridcell`. Supports both navigation mode and action mode (per APG grid pattern).

---

### `@angular/aria/listbox`

| Symbol | Type | Description |
|---|---|---|
| `Listbox` | Directive | The listbox container. Supports single and multi-select, typeahead, keyboard navigation. |
| `Option` | Directive | An individual option (`role="option"`). |
| `ɵɵCombobox` | Directive (re-export) | Internal — re-exported for tree-shaking reasons (see [#30663](https://github.com/angular/components/issues/30663)). |
| `ɵɵComboboxDialog` | Directive (re-export) | Internal. |
| `ɵɵComboboxInput` | Directive (re-export) | Internal. |
| `ɵɵComboboxPopup` | Directive (re-export) | Internal. |
| `ɵɵComboboxPopupContainer` | Directive (re-export) | Internal. |

**ARIA role:** `listbox` → `option`.

---

### `@angular/aria/menu`

| Symbol | Type | Description |
|---|---|---|
| `Menu` | Directive | A popup menu container (`role="menu"`). |
| `MenuBar` | Directive | A horizontal menu bar (`role="menubar"`). |
| `MenuItem` | Directive | An item within a menu (`role="menuitem"`). |
| `MenuTrigger` | Directive | The button/element that opens a menu. Manages `aria-haspopup`, `aria-expanded`. |
| `MenuContent` | Directive | The content region of a menu (lazy-rendered). |
| `ɵɵDeferredContent` | Directive (re-export) | Internal. |
| `ɵɵDeferredContentAware` | Directive (re-export) | Internal. |

**ARIA role:** `menu` / `menubar` → `menuitem`.

---

### `@angular/aria/tabs`

| Symbol | Type | Description |
|---|---|---|
| `Tabs` | Directive | Root container for the tabs widget. Manages active tab state. |
| `TabList` | Directive | The tab list container (`role="tablist"`). |
| `Tab` | Directive | An individual tab (`role="tab"`). |
| `TabPanel` | Directive | The panel associated with a tab (`role="tabpanel"`). |
| `TabContent` | Directive | Lazy content inside a tab panel. |
| `ɵɵDeferredContent` | Directive (re-export) | Internal. |
| `ɵɵDeferredContentAware` | Directive (re-export) | Internal. |

**ARIA role:** `tablist` → `tab` + `tabpanel`.

---

### `@angular/aria/toolbar`

| Symbol | Type | Description |
|---|---|---|
| `Toolbar` | Directive | The toolbar container (`role="toolbar"`). Manages roving tabindex across widgets. |
| `ToolbarWidget` | Directive | An interactive widget inside the toolbar (button, input, etc.). |
| `ToolbarWidgetGroup` | Directive | A logical group of widgets within the toolbar. |

**ARIA role:** `toolbar`.

---

### `@angular/aria/tree`

| Symbol | Type | Description |
|---|---|---|
| `Tree` | Directive | The tree container (`role="tree"`). Manages keyboard navigation, expand/collapse. |
| `TreeItem` | Directive | A tree node (`role="treeitem"`). |
| `TreeItemGroup` | Directive | A group of child tree items (`role="group"`). |
| `ɵɵDeferredContent` | Directive (re-export) | Internal. |
| `ɵɵCombobox` / `ɵɵComboboxDialog` / etc. | Directive (re-export) | Internal — re-exported for tree-shaking. |

**ARIA role:** `tree` → `treeitem` → `group`.

---

### `@angular/aria/private`

This entry point exposes the internal **UI Pattern** and **Behavior** classes. It is **not intended for direct application use** — it exists to support the public directives and to allow `@angular/material` to build on top of the same patterns.

Key internal exports include:

| Category | Symbols |
|---|---|
| UI Patterns | `ListboxPattern`, `ComboboxPattern`, `MenuPattern`, `TabsPattern`, `ToolbarPattern`, `AccordionPattern`, `TreePattern`, `GridPattern` |
| Behaviors | `ListNavigationBehavior`, `ListSelectionBehavior`, `ListFocusBehavior`, `ListTypeaheadBehavior`, `ExpansionBehavior`, `PopupBehavior`, `LabelBehavior`, `GridBehavior` |
| Event Managers | `KeyboardEventManager`, `PointerEventManager`, `Modifier` |
| Signal utilities | `SignalLike`, `WritableSignalLike` |
| Deferred content | `DeferredContent`, `DeferredContentAware` |

---

## Architecture: UI Patterns & Behaviors

### The Behavior Layer

Behaviors are plain TypeScript classes (no Angular dependency) that encapsulate a single reusable interaction concern:

- **`ListNavigationBehavior`** — arrow key navigation through a list of items
- **`ListSelectionBehavior`** — single/multi-select with keyboard and pointer
- **`ListFocusBehavior`** — roving tabindex management
- **`ListTypeaheadBehavior`** — jump-to-item by typing characters
- **`ExpansionBehavior`** — expand/collapse state for panels and tree nodes
- **`PopupBehavior`** — open/close state for popups (menus, combobox dropdowns)
- **`LabelBehavior`** — `aria-label` / `aria-labelledby` management
- **`GridBehavior`** — 2D navigation for grids
- **`EventManager`** — `KeyboardEventManager` and `PointerEventManager` for declarative event routing

### The UI Pattern Layer

UI Patterns compose multiple Behaviors to implement a complete ARIA pattern. Each pattern:

1. Accepts a typed `Inputs` object where **all inputs are signals** (`SignalLike` / `WritableSignalLike`)
2. Instantiates behaviors in its constructor
3. Exposes `computed()` event managers for `keydown` and `pointerdown`
4. Implements `validate()`, `setDefaultState()`, `onKeydown()`, `onPointerdown()` core methods

Example pattern structure (from `ui-pattern-rules.md`):
```ts
export class ExamplePattern {
  behavior1: Behavior1;
  behavior2: Behavior2;

  keydown = computed(() =>
    new KeyboardEventManager()
      .on('ArrowUp', () => { /* ... */ })
      .on('ArrowDown', () => { /* ... */ })
  );

  constructor(inputs: ExampleInputs) {
    this.behavior1 = new Behavior1(inputs);
    this.behavior2 = new Behavior2(inputs);
  }

  onKeydown(event: KeyboardEvent) { this.keydown().handle(event); }
  onPointerdown(event: PointerEvent) { this.pointerdown().handle(event); }
}
```

### The Angular Directive Layer

Public directives are thin Angular wrappers that:
- Inject the host element and Angular signals
- Instantiate the corresponding UI Pattern with signal inputs
- Wire DOM events (`(keydown)`, `(pointerdown)`) to the pattern's handlers
- Set ARIA attributes reactively via `effect()` or `hostBindings`

---

## Signal-First Design

All inputs to UI Patterns use `SignalLike<T>` and `WritableSignalLike<T>` — custom types that wrap Angular's `Signal<T>` and `WritableSignal<T>` but avoid importing from `@angular/core` in the behavior layer. This keeps behaviors framework-agnostic and testable in isolation.

The `signal-like.ts` utility re-exports Angular's `signal`, `computed`, and `effect` under these types, acting as the single bridge between the behavior layer and Angular's reactivity system.

---

## Deferred Content Pattern

Several sub-packages (`accordion`, `combobox`, `menu`, `tabs`, `tree`) use a **deferred content** mechanism for lazy rendering:

- `DeferredContent` — a directive applied to a `<ng-template>` that marks content as lazily renderable
- `DeferredContentAware` — applied to a host component/directive that controls when the template is rendered

This avoids rendering hidden panel/popup content until it's first needed, improving initial render performance.

---

## Peer Dependencies

| Package | Required version |
|---|---|
| `@angular/cdk` | `21.2.10` (exact, pinned to same release) |
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |
| `tslib` | `^2.3.0` |

`@angular/cdk` is a hard peer dependency — `@angular/aria` uses CDK utilities internally (e.g. overlay, a11y utilities).

---

## Public API Surface Summary

| Sub-package | Public directives | Notes |
|---|---|---|
| `accordion` | 4 | Full disclosure/accordion pattern |
| `combobox` | 5 | Combobox with popup listbox |
| `grid` | 4 | 2D keyboard navigation grid |
| `listbox` | 2 | Single/multi-select list |
| `menu` | 5 | Menu, menu bar, menu items |
| `tabs` | 5 | Tab list + panels with lazy content |
| `toolbar` | 3 | Toolbar with roving tabindex |
| `tree` | 3 | Hierarchical tree view |
| **Total** | **31** | All standalone Angular directives |

---

## Notable Design Decisions

1. **No NgModules** — all directives are standalone. Import them directly in component `imports` arrays.
2. **Headless / unstyled** — the library provides zero CSS. Consumers own all visual styling.
3. **Signal-native** — built from the ground up with Angular signals, not `@Input()` / `@Output()`.
4. **Behavior reuse** — the same `ListNavigationBehavior` powers listbox, combobox, menu, tree, and toolbar. Changes to navigation logic propagate everywhere.
5. **`ɵɵ`-prefixed re-exports** — several sub-packages re-export symbols from sibling packages with the `ɵɵ` prefix. This is a workaround for Angular's tree-shaking requiring all used directives to be declared in the same compilation unit (see [#30663](https://github.com/angular/components/issues/30663)).
6. **`@angular/aria/private` is not stable** — the `private` entry point is used by `@angular/material` but is not part of the public API contract. Breaking changes can occur without a major version bump.

---

## Sources

| File | GitHub Permalink |
|---|---|
| `src/aria/package.json` | https://github.com/angular/components/blob/v21.2.13/src/aria/package.json |
| `src/aria/index.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/index.ts |
| `src/aria/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/public-api.ts |
| `src/aria/accordion/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/accordion/public-api.ts |
| `src/aria/combobox/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/combobox/public-api.ts |
| `src/aria/grid/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/grid/public-api.ts |
| `src/aria/listbox/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/listbox/public-api.ts |
| `src/aria/menu/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/menu/public-api.ts |
| `src/aria/tabs/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/tabs/public-api.ts |
| `src/aria/toolbar/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/toolbar/public-api.ts |
| `src/aria/tree/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/tree/public-api.ts |
| `src/aria/private/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/private/public-api.ts |
| `src/aria/private/ui-pattern-rules.md` | https://github.com/angular/components/blob/v21.2.13/src/aria/private/ui-pattern-rules.md |
| `node_modules/@angular/aria/package.json` | *(local fallback — published exports map)* |
