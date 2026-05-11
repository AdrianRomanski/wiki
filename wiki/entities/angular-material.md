---
title: Angular Material
type: entity
tags: [angular, component-library, material-design, ui, typescript, standalone]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Material

## Definition

`@angular/material` is the official Angular component library implementing Google's Material Design specification. It provides 28 production-ready UI components built on top of [[Angular CDK]], all tree-shakeable, standalone-compatible, and OnPush by default.

Current version: **21.2.10**

## Properties

- **28 component modules** — each independently importable via its own entry point (e.g., `@angular/material/button`)
- **ESM only** — ships as `fesm2022/*.mjs`, `sideEffects: false`, fully tree-shakeable
- **Standalone-first** — all components work directly in `imports: []`, no NgModule required
- **OnPush throughout** — compatible with zoneless Angular applications
- **Dual theming** — supports Material Design 2 (SCSS palettes) and Material Design 3 (CSS custom property tokens) simultaneously
- **Testing harnesses** — every component ships a `[component]/testing` entry point with a `MatXxxHarness` class
- **Opt-in animations** — controlled via `MATERIAL_ANIMATIONS` token; no `BrowserAnimationsModule` required
- **Schematics** — `ng add`, `ng generate`, `ng update` support

### Component Categories

| Category | Components |
|---|---|
| Form controls | autocomplete, checkbox, chips, datepicker, form-field, input, radio, select, slide-toggle, slider, timepicker |
| Navigation | menu, sidenav, tabs, toolbar, stepper |
| Layout | card, divider, expansion, grid-list, list, tree |
| Feedback / overlays | bottom-sheet, dialog, snack-bar, tooltip |
| Data display | badge, paginator, progress-bar, progress-spinner, sort, table |
| Buttons / indicators | button, button-toggle, icon |

### Core Module (`@angular/material/core`)

Shared primitives used across components:
- `MatOption`, `MatOptgroup` — shared option/group for select, autocomplete
- `MatRipple`, `RippleRef` — ink ripple effect
- `ErrorStateMatcher` — form error display strategy
- `DateAdapter`, `MAT_DATE_FORMATS` — date abstraction for datepicker
- `provideNativeDateAdapter()` — functional provider for built-in date adapter
- `MATERIAL_ANIMATIONS` — animation configuration token
- `VERSION` — library version string

### Theming

- **M3 (default):** token-based via `mat.define-theme()` with CSS custom properties
- **M2 (legacy):** SCSS palettes via `mat.define-light-theme()` / `mat.define-dark-theme()`
- **Prebuilt themes:** 8 ready-to-use CSS files (`azure-blue`, `indigo-pink`, `rose-red`, `cyan-orange`, `magenta-violet`, `deeppurple-amber`, `pink-bluegrey`, `purple-green`)

## Relationships

- Built on [[Angular CDK]] (exact version peer dep — `@angular/cdk@21.2.10`)
- Implements [[Material Design Theming]] via SCSS and CSS custom properties
- Uses [[Standalone Components]] pattern throughout
- Integrates with [[Progressive Enhancement]] via opt-in animations

## Examples

### Standalone component setup
```ts
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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

### App config with date adapter
```ts
// app.config.ts
import { provideNativeDateAdapter } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [provideNativeDateAdapter()]
};
```

### Testing harness
```ts
import { MatButtonHarness } from '@angular/material/button/testing';

const loader = TestbedHarnessEnvironment.loader(fixture);
const btn = await loader.getHarness(MatButtonHarness);
await btn.click();
```

## References

- [[angular-material-big-picture-2026-05-11]]
- [[Angular CDK]]
- [[angular-material-modular-imports]]
- [[angular-material-theming]]
- [[angular-material-testing-harnesses]]
