---
title: Angular Material Modular Imports
type: concept
tags: [angular, angular-material, tree-shaking, bundle-size, standalone, pattern]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Material Modular Imports

## Explanation

Angular Material exposes every component as its own entry point (e.g., `@angular/material/button`). The root barrel (`@angular/material`) exists but should be avoided in production because it pulls the entire library into the bundle analysis graph, defeating tree-shaking.

The library ships as ESM only (`fesm2022/*.mjs`) with `sideEffects: false`, which means bundlers can safely eliminate any module that is not explicitly imported.

## Applications

- Keeping production bundles small by importing only the components actually used
- Enabling standalone components to declare precise dependencies in `imports: []`
- Allowing lazy-loaded routes to include only the Material components they need

## Related Concepts

- [[Standalone Components]]
- [[angular-material-theming]]
- [[angular-material-testing-harnesses]]

## Examples

```ts
// Correct — per-component imports
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

// Avoid — root barrel defeats tree-shaking analysis
import { MatButtonModule } from '@angular/material';
```

Shared primitives (ripple, options, error state) come from `@angular/material/core`:

```ts
import { MatOption, MatRipple, provideNativeDateAdapter } from '@angular/material/core';
```

Note: `MatOption` and `MatOptgroup` are exported from `@angular/material/core`, not from `@angular/material/select` or `@angular/material/autocomplete`. Importing from the wrong path causes duplicate symbol errors.

## References

- [[angular-material-big-picture-2026-05-11]]
- [[Angular Material]]
