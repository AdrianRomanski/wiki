# @angular/cdk — Big Picture Findings Summary

**Library:** @angular/cdk  
**Version:** 21.2.10  
**Scope:** Big Picture  
**Research date:** 2026-05-11

---

## Key Strengths

- **Headless by design** — zero opinions on styling; every module delivers behavior only, making it trivially composable with any design system
- **Tree-shakeable** — `"sideEffects": false` and 25 independent entry points mean you pay only for what you import
- **Dual API surface** — almost every feature ships both a declarative directive API and an imperative service/ref API, so you can use whichever fits the context
- **Injection token overrides** — defaults for scroll strategies, dialog config, focus trap strategy, and more are all overridable via DI without subclassing
- **Accessibility-first** — `a11y` is the most comprehensive module: focus trapping, key managers (list, tree, active-descendant), live announcements, focus origin detection, ARIA describers, and high-contrast mode detection all in one place
- **Testing infrastructure** — `@angular/cdk/testing` provides a harness abstraction that works identically in TestBed and real browsers (Selenium), so component tests are environment-agnostic
- **Overlay is a full floating-UI engine** — connected position strategies with ordered fallback positions, four scroll strategies, keyboard and outside-click dispatchers, and viewport-aware repositioning

## Known Limitations

- **No styling included** — you must supply all CSS; the prebuilt CSS files (`a11y-prebuilt.css`, `overlay-prebuilt.css`) cover only the bare minimum structural styles
- **Overlay complexity** — `FlexibleConnectedPositionStrategy` has a large configuration surface; getting fallback positions right requires understanding `OriginConnectionPosition` / `OverlayConnectionPosition` pairs
- **Virtual scroll is fixed-size only out of the box** — `CdkFixedSizeVirtualScroll` requires uniform item heights; variable-height virtual scrolling requires implementing the `VirtualScrollStrategy` interface yourself
- **Tree module is low-level** — `CdkTree` requires you to manage `FlatTreeControl` or `NestedTreeControl` manually; there is no automatic data flattening
- **Menu module has significant setup** — full ARIA menubar requires composing `CdkMenuBar`, `CdkMenu`, `CdkMenuItem`, `CdkMenuTrigger`, and `MenuStack` correctly; the learning curve is steeper than it looks
- **`ɵɵ` prefixed re-exports in some modules** — `dialog` and `drag-drop` re-export symbols with the `ɵɵ` prefix (internal Angular convention), signaling those re-exports are incidental and not part of the stable public API of those modules

## Recommended Patterns

- **Import from sub-entry points, never from `@angular/cdk` root** — keeps bundles minimal and makes dependencies explicit
- **Use `ScrollStrategyOptions` service** to get scroll strategies rather than constructing them directly — it handles injection and configuration correctly
- **Prefer `OverlayPositionBuilder` over constructing `FlexibleConnectedPositionStrategy` manually** — the builder handles `ViewportRuler` injection and provides a cleaner API
- **Use `SelectionModel` from `@angular/cdk/collections`** for any multi-select or single-select UI state — it handles edge cases (deselect-on-reselect, change events) that manual arrays miss
- **Use `coerceBooleanProperty` for `@Input()` boolean bindings** — handles the `""` (attribute present, no value) case that `!!value` misses
- **Use `FocusKeyManager` for custom list components** — wire it to `keydown` events and call `setActiveItem` to get correct ARIA keyboard navigation without reimplementing arrow-key logic
- **Use `ComponentHarness` for all CDK-based component tests** — harnesses survive template refactors and work in both unit and e2e contexts

## Gotchas to Avoid

- **`CdkTrapFocus` does not auto-focus on init by default** — set `cdkTrapFocusAutoCapture="true"` or call `focusTrap.focusInitialElement()` manually, otherwise focus stays outside the trap
- **`LiveAnnouncer` messages are cleared after a timeout** — do not rely on them being present in the DOM for assertions; use the harness or spy on the service instead
- **`DragDropRegistry` is a singleton** — registering the same `DragRef` twice throws; always call `dragRef.dispose()` on destroy
- **`OverlayRef.dispose()` vs `detach()`** — `detach()` removes content but keeps the overlay host in the DOM; `dispose()` removes everything. Calling `dispose()` on an already-disposed ref throws
- **`CdkVirtualScrollViewport` requires an explicit height on the host** — without a fixed height the viewport collapses and renders nothing
- **`Portal` outlets can only have one portal attached at a time** — attaching a second portal without detaching the first throws `PortalAlreadyAttachedError`
- **`hasModifierKey` from `@angular/cdk/keycodes` checks the event, not the key** — pass the `KeyboardEvent`, not the key code

---

## Session Artifacts

- Analysis: `.kiro/research/sessions/angular-cdk-big-picture/big-picture.md`

*(No prototypes were created in this session)*
