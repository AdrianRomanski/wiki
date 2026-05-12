---
title: Per-Module Imports
type: concept
tags: [angular, angular-material, bundle-size, tree-shaking, best-practice]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Per-Module Imports

## Explanation

Angular Material ships a root barrel entry (`@angular/material`) that re-exports every component module. Importing from the barrel is convenient but pulls the entire library into the bundle, defeating tree-shaking. The correct pattern is to import only the specific module(s) needed for each feature.

Each component has its own entry point:

```
@angular/material/button
@angular/material/input
@angular/material/form-field
@angular/material/table
// etc.
```

## Applications

- **Standalone components** — list only the needed modules in the `imports` array
- **NgModule-based apps** — import per-module in the feature module's `imports` array
- **Lazy-loaded routes** — keep Material imports scoped to the route's component to avoid bloating the initial bundle

## Related Concepts

- [[Injection Token Configuration]]
- [[Material Testing Harnesses]]

## Examples

### Correct — per-module imports
```ts
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field>
      <input matInput placeholder="Name" />
    </mat-form-field>
    <button mat-raised-button>Submit</button>
  `
})
export class MyFormComponent {}
```

### Incorrect — barrel import (avoid)
```ts
// Pulls the entire library into the bundle
import { MatButtonModule, MatInputModule } from '@angular/material';
```

### Common pairing — MatInput always needs MatFormField
```ts
// MatInput is a directive that requires <mat-form-field> as host
imports: [MatFormFieldModule, MatInputModule]
```

## References

- [[Angular Material]]
- [[angular-material-big-picture-2026-05-11]]
