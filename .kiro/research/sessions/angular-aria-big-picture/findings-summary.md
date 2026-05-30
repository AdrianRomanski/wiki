# @angular/aria — Big Picture Findings Summary

**Library:** `@angular/aria`
**Version:** `21.2.13`
**Scope:** Big Picture
**Research date:** 2026-05-30

---

## Key Strengths

**1. Headless by design**
The library ships zero CSS. Every directive is purely behavioral — it manages ARIA attributes, keyboard interactions, and focus, but leaves all visual styling to the consumer. This makes it composable with any design system without fighting specificity wars.

**2. Signal-native architecture**
Built from the ground up with Angular signals. All inputs to UI Pattern classes use `SignalLike<T>` / `WritableSignalLike<T>` — a thin abstraction over Angular's `Signal<T>` that keeps the behavior layer framework-agnostic. No `@Input()` / `@Output()` anywhere in the interaction logic.

**3. Layered, reusable behavior system**
The same `ListNavigationBehavior` powers listbox, combobox, menu, tree, and toolbar. The same `ExpansionBehavior` powers accordion and tree. Changes to a behavior propagate to every pattern that uses it — a single fix improves five components at once.

**4. Comprehensive ARIA pattern coverage**
Eight sub-packages covering the most common WAI-ARIA Authoring Practices patterns: accordion, combobox, grid, listbox, menu, tabs, toolbar, and tree. Each follows the APG specification closely, including correct roles, states, and keyboard interactions.

**5. Standalone-only, no NgModules**
All 31 directives are standalone. Import exactly what you need — no barrel modules, no side-effect imports.

**6. Deferred content for performance**
`DeferredContent` / `DeferredContentAware` provide lazy rendering for hidden panels and popups (accordion panels, menu content, tab panels, tree nodes). Content is not rendered until first shown, keeping initial DOM lean.

**7. Declarative event routing via EventManager**
`KeyboardEventManager` and `PointerEventManager` provide a fluent, composable API for mapping keys and modifier combinations to handlers. Supports strings, signals, and regex as key matchers — making dynamic keybindings (e.g. RTL-aware arrow keys) straightforward.

---

## Known Limitations

**1. No visual layer**
Headless is a strength, but it also means you must implement all styling, animations, and layout yourself. There are no pre-built themes or Material Design variants in this package (those live in `@angular/material`).

**2. `@angular/aria/private` is unstable**
The `private` entry point is used by `@angular/material` internally but carries no public API stability guarantee. Breaking changes can occur without a major version bump. Avoid importing from it in application code.

**3. `ɵɵ`-prefixed re-exports are a workaround, not a feature**
Several sub-packages re-export sibling directives with `ɵɵ` prefixes (e.g. `ɵɵCombobox` in `@angular/aria/listbox`). This is a tree-shaking workaround for [angular/components#30663](https://github.com/angular/components/issues/30663) — not an intentional API. Do not use these symbols directly.

**4. Hard peer dependency on `@angular/cdk`**
`@angular/cdk` is pinned to the exact same patch version. Upgrading one without the other will break. This is intentional but worth noting for monorepo setups with version constraints.

**5. Root entry point exports nothing useful**
`import { ... } from '@angular/aria'` only gives you `VERSION`. All real symbols require sub-package imports. This is easy to miss when first exploring the library.

**6. No radio-group or ui-patterns entry in v21**
The npm registry shows `radio-group`, `ui-patterns`, and `deferred-content` as named exports in the upcoming v22 release. These are not available in v21.2.x — plan accordingly if you need them.

---

## Recommended Patterns

**Import from sub-packages, not the root:**
```ts
// ✅ Correct
import { Listbox, Option } from '@angular/aria/listbox';
import { Tabs, TabList, Tab, TabPanel } from '@angular/aria/tabs';

// ❌ Wrong — root only exports VERSION
import { Listbox } from '@angular/aria';
```

**Compose directives in standalone components:**
```ts
@Component({
  standalone: true,
  imports: [Tabs, TabList, Tab, TabPanel, TabContent],
  template: `
    <div cdkTabs>
      <div cdkTabList>
        <button cdkTab>Tab 1</button>
        <button cdkTab>Tab 2</button>
      </div>
      <div cdkTabPanel>Content 1</div>
      <div cdkTabPanel>Content 2</div>
    </div>
  `
})
export class MyTabsComponent {}
```

**Use `DeferredContent` for lazy panel rendering:**
Apply `cdkDeferredContent` to `<ng-template>` inside accordion panels, menu content, and tab panels to avoid rendering hidden content on initial load.

**Pair with `@angular/cdk` for overlay and focus utilities:**
`@angular/aria` handles ARIA semantics and keyboard patterns; `@angular/cdk/overlay` handles positioning for combobox and menu popups; `@angular/cdk/a11y` handles focus trapping and live announcements. They are designed to work together.

**Keep `@angular/cdk` version in sync:**
Always upgrade `@angular/aria` and `@angular/cdk` together. They are pinned to the same patch version in the peer dependency declaration.

---

## Gotchas to Avoid

**1. Don't import from `@angular/aria/private`**
Even though it's a valid import path, it has no stability guarantees. If you need the UI Pattern classes for advanced customization, be prepared for breaking changes on any release.

**2. Don't use `ɵɵ`-prefixed symbols**
`ɵɵCombobox`, `ɵɵDeferredContent`, etc. are internal re-exports for the Angular compiler's tree-shaking. They are not part of the public API and will change without notice.

**3. The root `@angular/aria` entry is nearly empty**
`public-api.ts` at the root only re-exports `version.ts`. If your IDE auto-imports from `@angular/aria` instead of `@angular/aria/listbox`, you'll get a confusing "not exported" error.

**4. All inputs must be signals**
If you're building on top of the private UI Pattern classes, every input must be a `SignalLike`. Passing plain values will not work — the patterns use `computed()` internally and expect reactive inputs.

**5. `validate()` is not called automatically**
UI Pattern classes expose a `validate()` method that checks internal state consistency. It is not called by the Angular directive layer in production — it's a development-time tool. Call it manually in tests or dev mode to catch misconfigured patterns early.

**6. Keyboard navigation is pattern-specific**
Each pattern implements its own keyboard spec per the WAI-ARIA APG. For example, `Grid` uses a 2D navigation model (arrow keys move between cells), while `Listbox` uses a 1D model (arrow keys move between options). Don't assume keyboard behavior is consistent across patterns without checking the APG spec for each.

---

## Session Artifacts

- Analysis: `.kiro/research/sessions/angular-aria-big-picture/big-picture.md`
