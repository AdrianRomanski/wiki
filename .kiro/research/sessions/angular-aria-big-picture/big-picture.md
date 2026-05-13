# @angular/aria — Big Picture

**Version:** 21.2.10  
**Research date:** 2026-05-12  
**Package:** `@angular/aria`  
**Repository:** https://github.com/angular/components

---

## Entry Points

| Import path | Module file | Types file | Purpose |
|---|---|---|---|
| `@angular/aria` | `fesm2022/aria.mjs` | `types/aria.d.ts` | Root — exports `VERSION` only |
| `@angular/aria/accordion` | `fesm2022/accordion.mjs` | `types/accordion.d.ts` | Accordion pattern |
| `@angular/aria/combobox` | `fesm2022/combobox.mjs` | `types/combobox.d.ts` | Combobox / autocomplete / select pattern |
| `@angular/aria/grid` | `fesm2022/grid.mjs` | `types/grid.d.ts` | Data grid with keyboard navigation |
| `@angular/aria/listbox` | `fesm2022/listbox.mjs` | `types/listbox.d.ts` | Listbox + option pattern |
| `@angular/aria/menu` | `fesm2022/menu.mjs` | `types/menu.d.ts` | Menu and menubar pattern |
| `@angular/aria/private` | `fesm2022/private.mjs` | `types/private.d.ts` | Internal pattern classes (not for app use) |
| `@angular/aria/tabs` | `fesm2022/tabs.mjs` | `types/tabs.d.ts` | Tabs pattern |
| `@angular/aria/toolbar` | `fesm2022/toolbar.mjs` | `types/toolbar.d.ts` | Toolbar pattern |
| `@angular/aria/tree` | `fesm2022/tree.mjs` | `types/tree.d.ts` | Tree / treeview pattern |

The package is fully tree-shakeable (`"sideEffects": false`) and ESM-only (`"type": "module"`).

---

## Exported Symbols by Entry Point

### `@angular/aria` (root)
| Symbol | Kind | Description |
|---|---|---|
| `VERSION` | const | Current package version |

### `@angular/aria/accordion`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `AccordionGroup` | Directive | `[ngAccordionGroup]` | Container; manages expansion mode and keyboard nav |
| `AccordionTrigger` | Directive | `[ngAccordionTrigger]` | Button that expands/collapses a panel |
| `AccordionPanel` | Directive | `[ngAccordionPanel]` | Content panel; uses `inert` to hide from AT when collapsed |
| `AccordionContent` | Directive | `ng-template[ngAccordionContent]` | Structural; enables lazy rendering of panel content |

### `@angular/aria/combobox`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `Combobox<V>` | Directive | `[ngCombobox]` | Root container; coordinates input + popup |
| `ComboboxInput` | Directive | `input[ngComboboxInput]` | Native input bound to the combobox |
| `ComboboxPopup<V>` | Directive | `[ngComboboxPopup]` | Bridge between combobox and its popup control |
| `ComboboxPopupContainer` | Directive | `ng-template[ngComboboxPopupContainer]` | Structural; wraps the popup template |
| `ComboboxDialog` | Directive | `dialog[ngComboboxDialog]` | Integrates a native `<dialog>` as the popup |

### `@angular/aria/grid`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `Grid` | Directive | `[ngGrid]` | Container; manages 2D keyboard navigation and selection |
| `GridRow` | Directive | `[ngGridRow]` | Row container |
| `GridCell` | Directive | `[ngGridCell]` | Focusable cell; supports selection, span, role override |
| `GridCellWidget` | Directive | `[ngGridCellWidget]` | Interactive widget inside a cell; suspends grid nav |

### `@angular/aria/listbox`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `Listbox<V>` | Directive | `[ngListbox]` | Selectable list container |
| `Option<V>` | Directive | `[ngOption]` | Individual selectable option |

### `@angular/aria/menu`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `MenuBar<V>` | Directive | `[ngMenuBar]` | Persistent top-level menu bar |
| `Menu<V>` | Directive | `[ngMenu]` | Popup menu list |
| `MenuItem<V>` | Directive | `[ngMenuItem]` | Item within a menu or menubar; can trigger submenus |
| `MenuTrigger<V>` | Directive | `[ngMenuTrigger]` | Opens/closes an associated `ngMenu` |
| `MenuContent` | Directive | `ng-template[ngMenuContent]` | Structural; lazy-renders menu items |

### `@angular/aria/tabs`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `Tabs` | Directive | `[ngTabs]` | Root container coordinating tablist and panels |
| `TabList` | Directive | `[ngTabList]` | Container for `ngTab` elements |
| `Tab` | Directive | `[ngTab]` | Individual tab control |
| `TabPanel` | Directive | `[ngTabPanel]` | Content panel linked to a tab by `value` |
| `TabContent` | Directive | `ng-template[ngTabContent]` | Structural; lazy-renders panel content |

### `@angular/aria/toolbar`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `Toolbar<V>` | Directive | `[ngToolbar]` | Container for toolbar widgets |
| `ToolbarWidget<V>` | Directive | `[ngToolbarWidget]` | Individual interactive widget |
| `ToolbarWidgetGroup<V>` | Directive | `[ngToolbarWidgetGroup]` | Groups widgets with their own internal navigation (e.g. radio group) |

### `@angular/aria/tree`
| Symbol | Kind | Selector | Description |
|---|---|---|---|
| `Tree<V>` | Directive | `[ngTree]` | Root tree container |
| `TreeItem<V>` | Directive | `[ngTreeItem]` | Individual node; supports expand/collapse and selection |
| `TreeItemGroup<V>` | Directive | `ng-template[ngTreeItemGroup]` | Structural; wraps child items for a parent node |

### `@angular/aria/private`
Internal pattern classes exposed for library authors and CDK integration. Not intended for direct application use. Includes:
- `ComboboxListboxPattern`, `ComboboxTreePattern`, `ComboboxPattern`, `ComboboxListboxControls`, `ComboboxTreeControls`
- `ListboxPattern`, `OptionPattern`, `ListboxInputs`
- `TreePattern`, `TreeItemPattern`, `TreeInputs`
- `SignalLike`, `WritableSignalLike`, `computed`, `signal`, `linkedSignal`, `convertGetterSetterToWritableSignalLike`
- All `*Inputs` and `*Pattern` types for every widget (menu, tabs, toolbar, accordion, grid)
- `DeferredContent`, `DeferredContentAware`

---

## Public API Surface Summary

`@angular/aria` is a **directive-only library** — it exports no components, pipes, or services. Every symbol is a standalone Angular directive. The library implements the [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) widget patterns as composable Angular directives.

### Design patterns across all widgets

- **Signal-based inputs** — every input uses `InputSignal` or `InputSignalWithTransform`; two-way bindings use `ModelSignal`
- **Lazy content rendering** — `DeferredContent` / `DeferredContentAware` host directives enable lazy rendering for panels, menus, and popups
- **Dual focus strategies** — all navigable widgets support both `roving` tabindex and `aria-activedescendant` via `focusMode` input
- **Dual selection strategies** — `selectionMode: "follow" | "explicit"` available on listbox, grid, tree, tabs
- **Soft disabled** — `softDisabled` input allows disabled items to remain focusable (ARIA best practice)
- **RTL support** — all widgets expose `textDirection` writable signal, sourced from `@angular/cdk/bidi`
- **Developer Preview** — every directive is tagged `@developerPreview 21.0`; API is not yet stable

### Widget capability matrix

| Widget | Keyboard nav | Selection | Multi-select | Lazy content | Typeahead | Submenu/nesting |
|---|---|---|---|---|---|---|
| Accordion | ✓ | expand/collapse | ✓ (multiExpandable) | ✓ | — | — |
| Combobox | ✓ | via popup | depends on popup | ✓ | — | — |
| Grid | ✓ (2D) | ✓ | ✓ | — | — | — |
| Listbox | ✓ | ✓ | ✓ | — | ✓ | — |
| Menu | ✓ | ✓ | ✓ (menubar) | ✓ | ✓ | ✓ |
| Tabs | ✓ | ✓ | — | ✓ | — | — |
| Toolbar | ✓ | ✓ | ✓ (group) | — | — | — |
| Tree | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (nested) |

---

## Peer Dependencies

| Package | Required version |
|---|---|
| `@angular/cdk` | `21.2.10` (exact) |
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |

Direct dependency: `tslib ^2.3.0`

The `@angular/cdk` peer is required at the exact same patch version. The package belongs to the Angular Material / CDK release group (`ng-update.packageGroup`), so all packages in that group should be updated together.
