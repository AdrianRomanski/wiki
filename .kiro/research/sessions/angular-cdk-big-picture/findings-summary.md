# @angular/cdk — Big Picture Findings Summary

**Library:** `@angular/cdk`
**Installed version:** `21.2.10`
**Scope:** Big Picture
**Research date:** `2026-05-12`

---

## Key Strengths

**Headless, unstyled primitives.** Every entry point ships zero visual styles by default. You bring your own CSS. This makes the CDK the right foundation for design systems that need full visual control without fighting framework opinions.

**Comprehensive accessibility coverage.** The `a11y` package alone covers focus trapping, focus monitoring, live announcer (ARIA live regions), input modality detection, high contrast mode detection, aria describer, and four distinct key manager strategies (List, Focus, ActiveDescendant, Tree). This is the most complete accessibility toolkit available in the Angular ecosystem.

**Fully tree-shakeable.** `"sideEffects": false` in `package.json` means bundlers can eliminate any unused entry point. Importing only `@angular/cdk/keycodes` costs almost nothing.

**Layered architecture.** The CDK is internally self-consistent — `overlay` builds on `portal` and `scrolling`, `dialog` builds on `overlay`, `menu` builds on `overlay` and `a11y`. You can use any layer independently or compose them.

**Component harness testing framework.** `@angular/cdk/testing` provides a stable, environment-agnostic API for testing UI components. Works with both Angular TestBed and Selenium WebDriver. Angular Material uses this for all its own tests — it's production-proven.

**Virtual scrolling.** `@angular/cdk/scrolling` provides `CdkVirtualScrollViewport` with a pluggable `VirtualScrollStrategy` interface. The built-in `FixedSizeVirtualScrollStrategy` handles fixed-height rows; custom strategies handle variable heights.

**Flexible overlay positioning.** `FlexibleConnectedPositionStrategy` supports multiple fallback positions, viewport margin, push behavior, and scroll strategy composition. It's the same engine Angular Material uses for menus, tooltips, and selects.

---

## Known Limitations

**No built-in variable-height virtual scroll.** `CdkFixedSizeVirtualScroll` only handles uniform item heights. Variable-height virtual scrolling requires a custom `VirtualScrollStrategy` implementation — non-trivial to build correctly.

**Tree controls are partially legacy.** `FlatTreeControl` and `NestedTreeControl` are the older API. `TreeKeyManager` is the newer approach but the migration path between them is not obvious from the types alone.

**Overlay z-index management is manual.** `OverlayContainer` appends to the document body, but stacking order between multiple overlays requires careful configuration. There's no automatic z-index arbitration.

**Dialog is low-level.** `@angular/cdk/dialog` is intentionally minimal — no built-in title, actions, or content slots. You compose those yourself. This is a feature for design system authors but a burden for quick implementations.

**Menu requires careful ARIA wiring.** `@angular/cdk/menu` implements the ARIA menu pattern correctly but requires understanding of `MenuStack`, `MenuTrigger`, and `MenuAim` to compose correctly. The learning curve is steeper than it looks.

**Coercion utilities are narrow.** `coerceBooleanProperty` and `coerceNumberProperty` are useful for Angular input binding but have no runtime validation — they silently coerce invalid values.

---

## Recommended Patterns

**Use `ListKeyManager` for any keyboard-navigable list.** It handles `ArrowUp`/`ArrowDown`, `Home`/`End`, typeahead, and wrapping. Compose with `FocusKeyManager` when items are focusable, or `ActiveDescendantKeyManager` for composite widgets where focus stays on a container.

**Use `FocusTrap` / `CdkTrapFocus` for modals and drawers.** Wrap any overlay content that should trap focus. Prefer `ConfigurableFocusTrap` for fine-grained control over the inert strategy.

**Use `LiveAnnouncer` for dynamic content updates.** Inject it and call `.announce(message, politeness)` to push status updates to screen readers without moving focus.

**Use `Overlay` + `FlexibleConnectedPositionStrategy` for tooltips, dropdowns, and popovers.** Define a primary position and 2–3 fallbacks. Compose with `RepositionScrollStrategy` to keep the panel aligned on scroll.

**Use `ComponentPortal` / `TemplatePortal` for dynamic content injection.** Portals decouple where content is declared from where it renders — essential for overlays, dialogs, and toast notifications.

**Use `BreakpointObserver` for responsive logic in components.** Inject it and observe `Breakpoints.Handset` or custom media queries. Prefer this over manual `window.matchMedia` calls.

**Use `SelectionModel` for multi-select state.** It handles single/multi selection, toggle, clear, and emits `SelectionChange` events. Works well with table checkboxes and listboxes.

**Use `DragDropModule` with `moveItemInArray` / `transferArrayItem` for sortable lists.** These utilities handle the array mutation after a drop event — no manual index math needed.

**Use `@angular/cdk/testing` harnesses in component tests.** Write harnesses for your own components to decouple tests from DOM structure. Use `HarnessPredicate` for filtering.

---

## Gotchas to Avoid

**Don't import from `@angular/cdk` root barrel in production.** The root barrel re-exports everything. Import from specific entry points (`@angular/cdk/a11y`, `@angular/cdk/overlay`, etc.) to keep bundle sizes small.

**`FocusMonitor` must be unregistered.** Call `focusMonitor.stopMonitoring(element)` in `ngOnDestroy` or use `focusMonitor.monitor(element).pipe(takeUntilDestroyed())`. Forgetting this leaks event listeners.

**`LiveAnnouncer` messages are cleared after a timeout.** The default politeness is `'polite'`. For urgent messages use `'assertive'`, but use it sparingly — it interrupts the screen reader mid-sentence.

**`Overlay` panels are appended to `document.body` by default.** This means they escape any CSS `overflow: hidden` containers. If you need overlay content inside a scrollable container, use a custom `OverlayContainer` or `CdkScrollable`.

**`CdkVirtualScrollViewport` requires a fixed height on the host.** Without an explicit height, the viewport collapses and renders nothing. Set `height` via CSS on the component or its host element.

**`CdkDrag` inside a `CdkDropList` requires the drop list to be present at render time.** Dynamically adding drop lists after drag has started can cause registry desync. Initialize all drop lists before enabling drag.

**`coerceBooleanProperty` treats the string `"false"` as `true`.** Any non-empty string is truthy. Use explicit boolean bindings (`[disabled]="false"`) rather than attribute bindings (`disabled="false"`) to avoid this.

**`_` prefixed symbols are internal.** Symbols like `_ViewRepeater`, `_DisposeViewRepeaterStrategy`, and `_isTestEnvironment` are exported but considered private API — they can change without a semver bump.

---

## Session Artifacts

- Analysis: `.kiro/research/sessions/angular-cdk-big-picture/big-picture.md`
