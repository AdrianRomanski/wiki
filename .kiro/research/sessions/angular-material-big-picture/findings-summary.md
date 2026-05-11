# @angular/material — Big Picture

**Library:** @angular/material
**Version:** 21.2.10
**Scope:** Big Picture
**Research date:** 2026-05-11

---

## Key Strengths

- **Fully modular** — 28 independent component entry points, each tree-shakeable. `sideEffects: false` means unused components add zero bundle cost.
- **Standalone-first** — all components work directly in `imports: []` without NgModule wrappers.
- **OnPush throughout** — every component uses OnPush change detection, making it zoneless-migration-friendly.
- **Dual design system support** — M2 (legacy SCSS palettes) and M3 (token-based CSS custom properties) coexist in the same version. M3 is the current default.
- **Testing harnesses** — every component ships a `[component]/testing` entry point with a `MatXxxHarness` class, providing a stable test API that survives internal refactors.
- **Animations are opt-in** — no `BrowserAnimationsModule` required. Controlled via the `MATERIAL_ANIMATIONS` token introduced in v17.
- **Built on CDK** — overlays, focus management, portals, and accessibility primitives come from `@angular/cdk`, which is battle-tested and usable independently.
- **Prebuilt themes** — 8 ready-to-use CSS files for zero-config theming.

---

## Known Limitations

- **`@angular/cdk` exact version lock** — peer dep requires `@angular/cdk` at the exact same version (e.g., `21.2.10`). Version mismatches cause runtime errors.
- **No virtual scroll in Material** — `CdkVirtualScrollViewport` lives in `@angular/cdk/scrolling`, not in Material. Must be wired up manually with `MatTable` or `MatList`.
- **Date adapter required for datepicker** — `MatDatepicker` has no built-in date parsing beyond `NativeDateAdapter`. Real-world use needs Luxon or date-fns adapter from `@angular/material-luxon-adapter` / `@angular/material-date-fns-adapter`.
- **M2 → M3 migration is non-trivial** — theming APIs are different enough that switching design systems requires SCSS changes across the app, not just a config flag.
- **Grid list is limited** — `MatGridList` is a fixed-column tile layout, not a full CSS grid abstraction. Complex responsive layouts still need custom CSS.
- **No data grid** — `MatTable` is a display table with sorting/pagination helpers. It is not a feature-rich data grid (no inline editing, no column resizing, no row virtualization built in).

---

## Recommended Patterns

### Per-component imports (not the root barrel)
```ts
// Good
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

// Avoid — pulls everything into the bundle analysis graph
import { MatButtonModule } from '@angular/material';
```

### Standalone component setup
```ts
@Component({
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field>
      <mat-label>Name</mat-label>
      <input matInput />
    </mat-form-field>
    <button mat-raised-button>Submit</button>
  `
})
export class MyComponent {}
```

### Functional date adapter provider
```ts
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideNativeDateAdapter()]
};
```

### Opt-in animations
```ts
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

providers: [
  { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: false } }
]
```

### Prebuilt theme (zero SCSS setup)
```html
<!-- In angular.json styles array or index.html -->
<link rel="stylesheet" href="@angular/material/prebuilt-themes/azure-blue.css">
```

### Testing harness pattern
```ts
import { MatButtonHarness } from '@angular/material/button/testing';

it('clicks the button', async () => {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const btn = await loader.getHarness(MatButtonHarness);
  await btn.click();
});
```

---

## Gotchas to Avoid

- **Don't mix M2 and M3 theming** — applying both `mat.core()` (M2) and `mat.define-theme()` (M3) in the same stylesheet produces conflicting CSS custom properties.
- **`MatOption` / `MatOptgroup` come from `@angular/material/core`**, not from `autocomplete` or `select`. Importing from the wrong place causes duplicate symbol errors.
- **`MatSpinner` is just an alias** — `MatSpinner` is `MatProgressSpinner` with `mode="indeterminate"` preset. They share the same module.
- **`MatDrawer` vs `MatSidenav`** — `MatSidenav` extends `MatDrawer`. Use `MatSidenav` for app-level navigation shells; `MatDrawer` for embedded panel use cases.
- **Form field wrapping rules** — `MatFormField` requires exactly one control child that implements `MatFormFieldControl`. Wrapping a native `<select>` without `matNativeControl` breaks the label float behavior.
- **`@angular/cdk` version must match exactly** — do not let package managers install a different patch version of CDK than Material.

---

## Session Artifacts

- Analysis: `big-picture.md`
