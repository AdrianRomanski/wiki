# @angular/aria — Big Picture

**Library:** `@angular/aria`  
**Version:** 21.2.10  
**Scope:** Big Picture  
**Research date:** 2026-05-12

---

## Key Strengths

- **Complete ARIA APG coverage** — implements all major WAI-ARIA widget patterns (accordion, combobox, grid, listbox, menu/menubar, tabs, toolbar, tree) in one cohesive package
- **Directive-only, fully tree-shakeable** — `"sideEffects": false` and ESM-only; import only what you use, no dead code
- **Signal-first API** — every input is an `InputSignal` or `InputSignalWithTransform`; two-way bindings use `ModelSignal`; no `@Input()` decorators anywhere
- **Dual focus strategies** — every navigable widget supports both `roving` tabindex and `aria-activedescendant` via a single `focusMode` input, covering all ARIA focus management patterns
- **Dual selection strategies** — `selectionMode: "follow" | "explicit"` on listbox, grid, tree, and tabs gives fine-grained control over when selection tracks focus
- **Soft disabled** — `softDisabled` input keeps items focusable but non-interactive, matching ARIA best practice for disabled states
- **Lazy content rendering** — `DeferredContent` / `DeferredContentAware` host directives are used consistently across accordion, combobox, menu, tabs, and tree to avoid rendering hidden content
- **RTL support built-in** — all widgets expose a `textDirection` writable signal sourced from `@angular/cdk/bidi`
- **Composable with CDK Overlay** — `ComboboxPopupContainer` can be replaced by `cdkConnectedOverlay`, making overlay positioning opt-in
- **Consistent API shape** — every widget follows the same patterns for `disabled`, `wrap`, `orientation`, `focusMode`, `selectionMode`, making the learning curve additive

## Known Limitations

- **Developer Preview — API is unstable** — every directive is tagged `@developerPreview 21.0`; breaking changes can happen in any minor release
- **No components, only directives** — you bring your own HTML structure and styling; there is no pre-built UI, which is intentional but means more setup per widget
- **Exact CDK peer dependency** — `@angular/cdk` must be at exactly `21.2.10`; mismatched versions will break; the entire `ng-update` package group must be updated together
- **`private` entry point is not for apps** — `@angular/aria/private` exposes internal pattern classes; using them directly couples you to implementation details
- **No form control integration** — directives do not implement `ControlValueAccessor`; wiring to Angular forms is manual
- **Combobox popup requires explicit wiring** — the `ComboboxPopup` bridge directive must be applied to the popup control; it is not automatic
- **Tree structure is verbose** — `ngTreeItemGroup` requires a `ng-template` wrapper and an `ownedBy` input linking back to the parent item; recursive trees need `ngTemplateOutlet` boilerplate

## Recommended Patterns

- **Import per entry point** — always import from the specific sub-path (e.g. `@angular/aria/listbox`) rather than the root to keep bundles minimal
- **Use `ModelSignal` for two-way state** — `expanded`, `selected`, `values`, `selectedTab` are all `ModelSignal`; bind with `[(value)]` syntax
- **Lazy-render panel content** — always wrap panel/menu content in `ng-template` with the corresponding content directive (`ngAccordionContent`, `ngMenuContent`, `ngTabContent`) to avoid rendering hidden DOM
- **Prefer `roving` focusMode for simple lists** — `activedescendant` is better for combobox popups where focus must stay on the input; `roving` is simpler for standalone listboxes and trees
- **Use `softDisabled` instead of `disabled` when items should remain keyboard-reachable** — matches ARIA guidance and avoids focus traps
- **Combobox + Listbox composition** — use `ngCombobox` + `ngComboboxInput` + `ng-template[ngComboboxPopupContainer]` + `ngListbox` for a fully accessible select/autocomplete; swap `ngListbox` for `ngTree` for hierarchical options
- **Grid cell widgets** — apply `ngGridCellWidget` to interactive elements inside cells (inputs, buttons, menus) to suspend grid navigation while the widget is active; set `widgetType` to `"simple"`, `"complex"`, or `"editable"` to control activation behavior
- **Tab linking by value** — `ngTab` and `ngTabPanel` are linked by matching `value` inputs, not by DOM position; panels can live anywhere in the template

## Gotchas to Avoid

- **Do not use `@angular/aria/private`** in application code — it is an internal API surface with no stability guarantees
- **`ngTreeItemGroup` must use `ng-template`** — it is a structural directive; applying it to a regular element will not work
- **`ngTab` requires `value` (required input)** — omitting it causes a runtime error; `ngTabPanel` also requires `value`
- **`MenuItem.value` is required** — unlike most other `value` inputs in the library, `ngMenuItem`'s `value` is marked required
- **`ComboboxPopup` is a bridge, not a popup** — it does not create any DOM; it must be applied to the element that hosts the actual popup control (`ngListbox`, `ngTree`, or `ngComboboxDialog`)
- **`contentChildren` ordering in Menu** — the source code notes a known issue where `contentChildren` returns a progressively smaller list each time a menu opens/closes; the workaround is already baked in via a signal recomputation trick, but custom menu implementations that bypass `ngMenu` will hit this
- **`TreeItem` extends `DeferredContentAware`** — tree items are themselves deferred-content-aware, meaning they participate in lazy rendering; do not wrap them in an additional `DeferredContentAware` host
- **`Listbox.values` vs `Option.value`** — `Listbox` uses `values` (plural, `ModelSignal<V[]>`) for its selected state; `Option` uses `value` (singular, required `InputSignal<V>`); mixing them up is a common mistake
- **Grid range selection requires `enableRangeSelection` + `enableSelection`** — both inputs must be true; `enableRangeSelection` alone has no effect

---

## Session Artifacts

- `.kiro/research/sessions/angular-aria-big-picture/big-picture.md`
- `.kiro/research/sessions/angular-aria-big-picture/findings-summary.md`
