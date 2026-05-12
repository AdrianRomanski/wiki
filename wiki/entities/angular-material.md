---
title: Angular Material
type: entity
tags: [angular, component-library, material-design, ui, typescript]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Material

## Definition

Angular Material is the official Material Design component library for Angular. It provides 35 UI component modules — form controls, navigation, layout, data display, overlays, and shared primitives — built on top of [[Angular CDK]] and aligned with Material Design 3 (M3) by default as of v21.

**npm package:** `@angular/material`
**Current version:** 21.2.10
**Module format:** ESM only (`fesm2022/`)

## Properties

### Component Modules

| Category | Modules |
|---|---|
| Form controls | `checkbox`, `chips`, `datepicker`, `form-field`, `input`, `radio`, `select`, `slide-toggle`, `slider`, `timepicker` |
| Navigation | `menu`, `sidenav`, `tabs`, `toolbar`, `tree` |
| Layout | `card`, `divider`, `expansion`, `grid-list`, `list`, `stepper` |
| Buttons & indicators | `badge`, `button`, `button-toggle`, `icon`, `progress-bar`, `progress-spinner`, `snack-bar`, `tooltip` |
| Data display | `paginator`, `sort`, `table` |
| Overlays & dialogs | `autocomplete`, `bottom-sheet`, `dialog`, `snack-bar` |
| Shared primitives | `core` |

### Peer Dependencies

| Package | Required Version |
|---|---|
| `@angular/cdk` | `21.2.10` (exact) |
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/common` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/forms` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/platform-browser` | `^21.0.0 \|\| ^22.0.0` |
| `rxjs` | `^6.5.3 \|\| ^7.4.0` |

> `@angular/cdk` must match at the exact patch version. Always update both together.

### Theming

- **M3 by default** — v21 uses Material Design 3 tokens via SCSS `@use`
- **8 prebuilt CSS themes** — 4 M2 classics + 4 M3 themes (azure-blue, rose-red, cyan-orange, magenta-violet)
- **Custom theming** — SCSS-based via `@angular/material/theming`; M2 still supported but on a deprecation path

### Key API Patterns

- **[[Per-Module Imports]]** — import only what you need; root barrel pulls everything
- **Standalone-compatible** — all components work without NgModule wrappers
- **[[Injection Token Configuration]]** — every configurable default is overridable via `InjectionToken`
- **[[Material Testing Harnesses]]** — every component ships a `/testing` entry with `ComponentHarness` subclasses
- **Pluggable date adapters** — `NativeDateAdapter` built in; Luxon, date-fns, Moment available separately
- **i18n services** — `MatDatepickerIntl`, `MatPaginatorIntl`, `MatSortHeaderIntl`, `MatStepperIntl`
- **Animation control** — `MATERIAL_ANIMATIONS` token; can be disabled globally

### Notable v21 Addition

`MatTimepicker` — fills a long-standing gap; pairs with `MatDatepicker` via the same date adapter.

## Relationships

- Built on [[Angular CDK]]
- Uses [[Angular Forms]] for form control integration
- Implements [[Material Design]] specification
- Related to [[Per-Module Imports]]
- Related to [[Injection Token Configuration]]
- Related to [[Material Testing Harnesses]]
- Related to [[Mat Table DataSource]]
- Related to [[Custom Form Field Control]]

## Examples

### Standalone component with Material button and icon
```ts
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `<button mat-raised-button><mat-icon>add</mat-icon> Add</button>`
})
export class MyComponent {}
```

### Override defaults globally
```ts
// app.config.ts
providers: [
  { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  provideNativeDateAdapter()
]
```

### Disable animations
```ts
providers: [
  { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }
]
```

## References

- [[angular-material-big-picture-2026-05-11]]
