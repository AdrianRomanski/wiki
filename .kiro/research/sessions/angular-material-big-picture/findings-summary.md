# @angular/material — Big Picture Findings Summary

**Library:** @angular/material
**Version:** 21.2.10
**Scope:** Big Picture
**Research date:** 2026-05-11

---

## Key Strengths

- **Comprehensive component coverage** — 35 modules covering virtually every UI pattern: form controls, navigation, layout, data display, overlays, and dialogs. Rarely need to reach for a second library.
- **Material Design 3 by default** — v21 is fully M3-aligned out of the box, with a modern theming system based on SCSS `@use` and design tokens.
- **Testing harnesses included** — every component ships a `/testing` entry with `ComponentHarness` subclasses. Tests are resilient to DOM changes and don't rely on CSS selectors.
- **Injection token-based configuration** — every configurable default (scroll strategy, animations, date formats, component defaults) is overridable via `InjectionToken` without subclassing.
- **Standalone-compatible** — all components work as standalone in v21; no NgModule wrappers required.
- **Pluggable date system** — `NativeDateAdapter` built in; third-party adapters (Luxon, date-fns, Moment) available via separate packages. Datepicker and timepicker share the same adapter.
- **i18n-ready** — `MatDatepickerIntl`, `MatPaginatorIntl`, `MatSortHeaderIntl`, `MatStepperIntl` are injectable services — override any string without touching component code.
- **Prebuilt themes** — 8 drop-in CSS themes (4 M2, 4 M3) for zero-config styling.
- **New timepicker in v21** — `MatTimepicker` fills a long-standing gap; pairs naturally with `MatDatepicker` via the same date adapter.

---

## Known Limitations

- **`@angular/cdk` exact version coupling** — peer dep requires `@angular/cdk` at the exact same patch version (`21.2.10`). Any version mismatch causes runtime errors. Must update both together.
- **SCSS-only theming** — the M3 theming system requires SCSS (`@use '@angular/material' as mat`). No CSS custom property API at the application level (tokens are internal). Projects using plain CSS need a prebuilt theme.
- **No data grid** — `MatTable` is a layout primitive, not a full data grid. Sorting, pagination, and filtering must be wired manually via `MatTableDataSource`, `MatSort`, and `MatPaginator`. No virtual scrolling built in (use CDK `ScrollingModule`).
- **Bundle size** — importing the root barrel (`@angular/material`) pulls in everything. Always import per-module (e.g. `MatButtonModule`) or use standalone component imports to keep bundles lean.
- **M2 deprecation trajectory** — M2 theming mixins still work but are on a deprecation path. New projects should use M3 from the start.
- **Limited chart/visualization support** — no built-in chart components. Pair with D3 or a dedicated charting library.
- **Overlay z-index management** — dialogs, menus, tooltips, and snack bars all use CDK overlay; z-index stacking in complex layouts can require manual tuning via `CDK_OVERLAY_CONTAINER`.

---

## Recommended Patterns

### Import per module (not the barrel)
```ts
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
```

### Standalone component usage
```ts
@Component({
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `<button mat-raised-button><mat-icon>add</mat-icon> Add</button>`
})
export class MyComponent {}
```

### Override defaults via injection tokens
```ts
// In app.config.ts
providers: [
  { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  { provide: MAT_BUTTON_CONFIG, useValue: { defaultColor: 'primary' } }
]
```

### Table with DataSource, Sort, and Paginator
```ts
dataSource = new MatTableDataSource(this.data);
@ViewChild(MatSort) sort!: MatSort;
@ViewChild(MatPaginator) paginator!: MatPaginator;

ngAfterViewInit() {
  this.dataSource.sort = this.sort;
  this.dataSource.paginator = this.paginator;
}
```

### Custom form field control
Implement `MatFormFieldControl<T>` to integrate any custom input into `<mat-form-field>` with full label, hint, error, and prefix/suffix support.

### Disable animations globally
```ts
providers: [
  { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }
]
```

### Use testing harnesses in specs
```ts
const button = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
await button.click();
```

---

## Gotchas to Avoid

- **Always import `MatFormFieldModule` alongside `MatInputModule`** — `MatInput` is a directive that requires `<mat-form-field>` as a host; importing only `MatInputModule` will render nothing useful.
- **`MatTable` needs explicit column definitions** — forgetting `matColumnDef` on a `<ng-container>` causes a runtime error with no clear message.
- **Date adapter must be provided** — `MatDatepicker` and `MatTimepicker` throw at runtime if no date adapter is provided. Always add `provideNativeDateAdapter()` (or a third-party equivalent) to your providers.
- **`@angular/cdk` version must match exactly** — do not let package managers install mismatched versions. Pin both in `package.json`.
- **`MatDialog` and `MatSnackBar` are tree-shaken services** — they are not in any NgModule's `providers`; they self-register via `providedIn: 'root'`. No manual provider needed.
- **Prebuilt theme vs custom theme** — including both a prebuilt CSS theme and a custom SCSS theme causes style conflicts. Use one or the other.
- **`MatSort` directive must be on the `<mat-table>` element** — placing it on a wrapper div silently does nothing.
- **Chip variants are not interchangeable** — `MatChipListbox` (selection), `MatChipGrid` (input), and `MatChipSet` (display-only) have different accessibility roles and APIs. Choose based on use case.

---

## Session Artifacts

- Analysis: `.kiro/research/sessions/angular-material-big-picture/big-picture.md`
- Findings summary: `.kiro/research/sessions/angular-material-big-picture/findings-summary.md`
