---
title: Injection Token Configuration
type: concept
tags: [angular, angular-material, dependency-injection, configuration, best-practice]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Injection Token Configuration

## Explanation

Angular Material exposes an `InjectionToken` for every configurable default across its components. Rather than subclassing or patching components, you override behavior by providing a value for the relevant token in your `providers` array — typically in `app.config.ts` for app-wide defaults, or in a component/route provider for scoped overrides.

This pattern keeps components decoupled from configuration and makes defaults easy to change without touching component code.

## Applications

- Setting a global form field appearance (`outline` vs `fill`)
- Disabling animations across the entire app
- Providing a date adapter and date formats for datepicker/timepicker
- Configuring default button color, FAB options, paginator page sizes, tooltip delays, etc.
- Overriding scroll strategies for overlays (autocomplete, select, menu)

## Related Concepts

- [[Per-Module Imports]]
- [[Custom Form Field Control]]

## Examples

### App-wide form field appearance
```ts
// app.config.ts
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

providers: [
  { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
]
```

### Provide native date adapter (required for datepicker/timepicker)
```ts
import { provideNativeDateAdapter } from '@angular/material/core';

providers: [provideNativeDateAdapter()]
```

### Disable animations globally
```ts
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

providers: [
  { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }
]
```

### Scoped override in a component
```ts
@Component({
  // ...
  providers: [
    { provide: MAT_BUTTON_CONFIG, useValue: { defaultColor: 'accent' } }
  ]
})
export class MyFeatureComponent {}
```

### Common tokens reference

| Token | Module | Controls |
|---|---|---|
| `MAT_FORM_FIELD_DEFAULT_OPTIONS` | `form-field` | Default appearance, float label |
| `MAT_BUTTON_CONFIG` | `button` | Default color |
| `MAT_FAB_DEFAULT_OPTIONS` | `button` | FAB color |
| `MAT_CHECKBOX_DEFAULT_OPTIONS` | `checkbox` | Color, click action |
| `MAT_RADIO_DEFAULT_OPTIONS` | `radio` | Color |
| `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS` | `slide-toggle` | Color |
| `MAT_TOOLTIP_DEFAULT_OPTIONS` | `tooltip` | Show/hide delay, position |
| `MAT_SNACK_BAR_DEFAULT_OPTIONS` | `snack-bar` | Duration, position |
| `MAT_DIALOG_DEFAULT_OPTIONS` | `dialog` | Width, height, has backdrop |
| `MAT_PAGINATOR_DEFAULT_OPTIONS` | `paginator` | Page size options |
| `MAT_DATE_FORMATS` | `core` | Date display/parse formats |
| `MATERIAL_ANIMATIONS` | `core` | Enable/disable animations |

## References

- [[Angular Material]]
- [[Angular Material Big Picture Research — 2026-05-11]]
